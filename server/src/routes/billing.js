import { Router } from 'express';
import crypto from 'crypto';
import CreatorProfile from '../models/CreatorProfile.js';
import CreatorReferral from '../models/CreatorReferral.js';
import Subscription from '../models/Subscription.js';

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const MP_PLAN_IDS = {
  pro: process.env.MP_PREAPPROVAL_PLAN_PRO_ID,
  premium: process.env.MP_PREAPPROVAL_PLAN_PREMIUM_ID
};

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
const PAYPAL_PLAN_IDS = {
  pro: process.env.PAYPAL_PLAN_PRO_ID,
  premium: process.env.PAYPAL_PLAN_PREMIUM_ID
};
const PAYPAL_BASE_URL = process.env.PAYPAL_ENV === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

const PLAN_PRICES_CENTS = {
  pro: 750000, // $7500 ARS (≈ $5.17 USD)
  premium: 1500000 // $15000 ARS (≈ $10.34 USD)
};

const sanitizeCode = (value) =>
  String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 16);

const buildExternalRef = ({ userId, planTier, creatorCode }) => {
  const safeCode = creatorCode ? sanitizeCode(creatorCode) : '';
  return [userId, planTier, safeCode].filter(Boolean).join('|');
};

const parseExternalRef = (value) => {
  const [userId, planTier, creatorCode] = String(value || '').split('|');
  return {
    userId: userId || null,
    planTier: planTier || null,
    creatorCode: creatorCode || null
  };
};

const getPayPalAccessToken = async () => {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error_description || 'Error obteniendo token PayPal');
  }

  const data = await response.json();
  return data.access_token;
};

const ensureCreatorCode = async (creatorCode, userId) => {
  if (!creatorCode) return null;
  const normalized = sanitizeCode(creatorCode);
  const creator = await CreatorProfile.findOne({ code: normalized, isActive: true });
  if (!creator || creator.userId === userId) return null;
  return normalized;
};

const updateSubscriptionAndReferral = async ({
  userId,
  planTier,
  providerCustomerId,
  providerSubscriptionId,
  status,
  creatorCode
}) => {
  if (!userId || !planTier) return;

  await Subscription.findOneAndUpdate(
    { userId },
    {
      userId,
      tier: planTier,
      status,
      stripeCustomerId: providerCustomerId?.toString() || null,
      stripeSubscriptionId: providerSubscriptionId?.toString() || null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    },
    { upsert: true, new: true }
  );

  if (status !== 'active') {
    await CreatorReferral.findOneAndUpdate(
      { referredUserId: userId },
      { status: 'canceled' }
    );
    return;
  }

  if (creatorCode) {
    const creator = await CreatorProfile.findOne({ code: creatorCode, isActive: true });
    const existingReferral = await CreatorReferral.findOne({ referredUserId: userId, status: 'active' });

    if (creator && !existingReferral) {
      const priceCents = PLAN_PRICES_CENTS[planTier] || 0;
      const estimatedEarningsCents = Math.round(priceCents * (creator.commissionRate || 0.2));

      await CreatorReferral.create({
        creatorUserId: creator.userId,
        referredUserId: userId,
        code: creatorCode,
        planTier,
        priceCents,
        discountRate: creator.discountRate || 0.1,
        commissionRate: creator.commissionRate || 0.2,
        estimatedEarningsCents,
        status: 'active'
      });

      creator.totalEstimatedEarningsCents += estimatedEarningsCents;
      creator.totalReferred += 1;
      await creator.save();
    }
  }
};

router.post('/checkout', async (req, res) => {
  try {
    const { userId, planTier, creatorCode, provider } = req.body || {};

    if (!userId || !planTier || !provider) {
      return res.status(400).json({ error: 'userId, planTier y provider requeridos' });
    }

    const normalizedCode = await ensureCreatorCode(creatorCode, userId);
    const externalRef = buildExternalRef({ userId, planTier, creatorCode: normalizedCode });

    if (provider === 'mercadopago') {
      if (!MP_ACCESS_TOKEN) {
        return res.status(500).json({ error: 'Mercado Pago no configurado' });
      }

      const planId = MP_PLAN_IDS[planTier];
      if (!planId) {
        return res.status(400).json({ error: 'planTier inválido' });
      }

      const response = await fetch('https://api.mercadopago.com/preapproval', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          preapproval_plan_id: planId,
          reason: `TriggerApp ${planTier.toUpperCase()}`,
          external_reference: externalRef,
          back_url: `${FRONTEND_URL}/pricing?success=1`
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Mercado Pago error:', data);
        return res.status(500).json({ error: 'No se pudo crear el checkout' });
      }

      return res.json({ url: data.init_point });
    }

    if (provider === 'paypal') {
      if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        return res.status(500).json({ error: 'PayPal no configurado' });
      }

      const planId = PAYPAL_PLAN_IDS[planTier];
      if (!planId) {
        return res.status(400).json({ error: 'planTier inválido' });
      }

      const token = await getPayPalAccessToken();
      const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan_id: planId,
          custom_id: externalRef,
          application_context: {
            brand_name: 'TriggerApp',
            locale: 'es-AR',
            user_action: 'SUBSCRIBE_NOW',
            return_url: `${FRONTEND_URL}/pricing?success=1`,
            cancel_url: `${FRONTEND_URL}/pricing?canceled=1`
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('PayPal error:', data);
        return res.status(500).json({ error: 'No se pudo crear el checkout' });
      }

      const approval = data.links?.find((link) => link.rel === 'approve');
      if (!approval?.href) {
        return res.status(500).json({ error: 'No se pudo obtener URL de checkout' });
      }

      return res.json({ url: approval.href });
    }

    return res.status(400).json({ error: 'Proveedor inválido' });
  } catch (error) {
    console.error('Error en /billing/checkout:', error);
    return res.status(500).json({ error: 'No se pudo crear el checkout' });
  }
});

router.post('/webhook/mercadopago', async (req, res) => {
  try {
    const queryId = req.query.id || req.body?.data?.id || req.body?.id;
    if (!queryId) return res.status(200).json({ received: true });
    if (!MP_ACCESS_TOKEN) return res.status(500).json({ error: 'Mercado Pago no configurado' });

    const response = await fetch(`https://api.mercadopago.com/preapproval/${queryId}`, {
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Mercado Pago fetch error:', data);
      return res.status(500).json({ error: 'Error consultando preapproval' });
    }

    const status = data.status === 'authorized' || data.status === 'active' ? 'active' : 'canceled';
    const externalRef = data.external_reference;
    const { userId, planTier, creatorCode } = parseExternalRef(externalRef);

    await updateSubscriptionAndReferral({
      userId,
      planTier,
      providerCustomerId: data.payer_id,
      providerSubscriptionId: data.id,
      status,
      creatorCode
    });

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error en webhook Mercado Pago:', error);
    return res.status(500).json({ error: 'Webhook error' });
  }
});

router.post('/webhook/paypal', async (req, res) => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET || !PAYPAL_WEBHOOK_ID) {
      return res.status(500).json({ error: 'PayPal no configurado' });
    }

    const rawBody = req.body;
    const event = JSON.parse(rawBody.toString());

    const token = await getPayPalAccessToken();
    const verifyResponse = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transmission_id: req.headers['paypal-transmission-id'],
        transmission_time: req.headers['paypal-transmission-time'],
        cert_url: req.headers['paypal-cert-url'],
        auth_algo: req.headers['paypal-auth-algo'],
        transmission_sig: req.headers['paypal-transmission-sig'],
        webhook_id: PAYPAL_WEBHOOK_ID,
        webhook_event: event
      })
    });

    const verifyData = await verifyResponse.json();
    if (verifyData?.verification_status !== 'SUCCESS') {
      console.error('PayPal webhook verification failed', verifyData);
      return res.status(400).json({ error: 'Firma inválida' });
    }

    const eventType = event.event_type;
    const resource = event.resource || {};
    const externalRef = resource.custom_id || '';
    const { userId, planTier, creatorCode } = parseExternalRef(externalRef);
    const status = resource.status === 'ACTIVE' ? 'active' : 'canceled';

    if (eventType?.startsWith('BILLING.SUBSCRIPTION')) {
      await updateSubscriptionAndReferral({
        userId,
        planTier: planTier || (resource.plan_id === PAYPAL_PLAN_IDS.premium ? 'premium' : 'pro'),
        providerCustomerId: resource.subscriber?.payer_id,
        providerSubscriptionId: resource.id,
        status,
        creatorCode
      });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error en webhook PayPal:', error);
    return res.status(500).json({ error: 'Webhook error' });
  }
});

export default router;
