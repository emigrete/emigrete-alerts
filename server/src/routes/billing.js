import { Router } from 'express';
import crypto from 'crypto';
import CreatorProfile from '../models/CreatorProfile.js';
import CreatorReferral from '../models/CreatorReferral.js';
import Subscription from '../models/Subscription.js';

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

// Planes en Mercado Pago: 4 opciones (con y sin descuento de creador)
const MP_PLAN_IDS = {
  pro: {
    regular: process.env.MP_PREAPPROVAL_PLAN_PRO_ID,
    withDiscount: process.env.MP_PREAPPROVAL_PLAN_PRO_DISCOUNT_ID
  },
  premium: {
    regular: process.env.MP_PREAPPROVAL_PLAN_PREMIUM_ID,
    withDiscount: process.env.MP_PREAPPROVAL_PLAN_PREMIUM_DISCOUNT_ID
  }
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
  if (!creatorCode) {
    console.log('[CREATOR CODE] No code provided');
    return { valid: false, code: null };
  }
  
  const normalized = sanitizeCode(creatorCode);
  console.log(`[CREATOR CODE] Input: "${creatorCode}" → Normalized: "${normalized}"`);
  
  const creator = await CreatorProfile.findOne({ code: normalized, isActive: true });
  
  if (!creator) {
    console.log(`[CREATOR CODE] ❌ No creator found with code: "${normalized}"`);
    return { valid: false, code: null };
  }
  
  if (creator.userId === userId) {
    console.log(`[CREATOR CODE] ❌ User ${userId} tried to use their own code`);
    return { valid: false, code: null };
  }
  
  console.log(`[CREATOR CODE] ✅ Valid code: "${normalized}" from creator ${creator.userId}`);
  return { valid: true, code: normalized };
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
    const { userId, planTier, creatorCode, provider, payerEmail } = req.body || {};

    if (!userId || !planTier || !provider) {
      return res.status(400).json({ error: 'userId, planTier y provider requeridos' });
    }

    // Validar código de creador
    const creatorCodeResult = await ensureCreatorCode(creatorCode, userId);
    const externalRef = buildExternalRef({ userId, planTier, creatorCode: creatorCodeResult.code });

    if (provider === 'mercadopago') {
      if (!MP_ACCESS_TOKEN) {
        console.error('MP_ACCESS_TOKEN no está configurado en variables de entorno');
        return res.status(500).json({ error: 'Mercado Pago no está configurado. Por favor configura MP_ACCESS_TOKEN en el servidor.' });
      }

      if (!payerEmail || !String(payerEmail).includes('@')) {
        return res.status(400).json({ error: 'Email de pago requerido para Mercado Pago' });
      }

      // Seleccionar plan: con descuento si tiene código válido, sin descuento si no
      const planVariant = creatorCodeResult.valid ? 'withDiscount' : 'regular';
      const planConfig = MP_PLAN_IDS[planTier];
      
      if (!planConfig) {
        console.error(`Configuración de plane no encontrada para tier: ${planTier}. MP_PLAN_IDS:`, MP_PLAN_IDS);
        return res.status(400).json({ error: `Plan ${planTier} no está configurado en Mercado Pago` });
      }

      const planId = planConfig[planVariant];
      if (!planId) {
        console.error(`Plan ID no encontrado para tier: ${planTier}, variant: ${planVariant}. Config:`, planConfig);
        return res.status(500).json({ 
          error: `❌ CONFIGURACIÓN INCOMPLETA: Plan ${planTier} (${planVariant}) sin ID. Por favor configura en Railway:
          - MP_PREAPPROVAL_PLAN_PRO_ID
          - MP_PREAPPROVAL_PLAN_PRO_DISCOUNT_ID
          - MP_PREAPPROVAL_PLAN_PREMIUM_ID
          - MP_PREAPPROVAL_PLAN_PREMIUM_DISCOUNT_ID`,
          tierRequested: planTier,
          variantRequested: planVariant
        });
      }

      console.log(`MP checkout - Plan: ${planTier} | Variant: ${planVariant} | ID: ${planId} | CreatorCode: ${creatorCodeResult.code || 'ninguno'}`);
      
      if (!planId || planId.length < 10) {
        console.error(`Plan ID sospechosamente corto para ${planTier} (${planVariant}): "${planId}"`);
        return res.status(400).json({ error: `El ID del plan ${planTier} no parece ser válido. Por favor verifica la configuración de Mercado Pago.` });
      }

      try {
        // Construir URL de checkout con back_url que incluye userId y código
        const backUrl = `${FRONTEND_URL}/pricing?mp=1&userId=${userId}&planTier=${planTier}&creatorCode=${creatorCodeResult.code || ''}`;
        const initPoint = `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=${planId}&back_url=${encodeURIComponent(backUrl)}`;

        console.log(`MP checkout - Plan: ${planTier} | Variant: ${planVariant} | ID: ${planId}`);
        console.log('Redirigiendo a:', initPoint);
        
        return res.json({ url: initPoint });
      } catch (fetchError) {
        console.error('Error fetching Mercado Pago:', fetchError);
        return res.status(500).json({ error: 'Error conectando con Mercado Pago: ' + fetchError.message });
      }
    }

    if (provider === 'paypal') {
      if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        console.error('PayPal credentials no están configurados');
        return res.status(500).json({ error: 'PayPal no está configurado. Por favor configura PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET en el servidor.' });
      }

      const planId = PAYPAL_PLAN_IDS[planTier];
      if (!planId) {
        console.error(`Plan ID no encontrado para tier: ${planTier}. PAYPAL_PLAN_IDS:`, PAYPAL_PLAN_IDS);
        return res.status(400).json({ error: `Plan ${planTier} no está configurado en PayPal` });
      }

      try {
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
          return res.status(500).json({ error: 'Error en PayPal: ' + (data.message || data.error || 'Error desconocido') });
        }

        const approval = data.links?.find((link) => link.rel === 'approve');
        if (!approval?.href) {
          console.error('No approval link encontrado en PayPal response:', data);
          return res.status(500).json({ error: 'No se pudo obtener URL de checkout de PayPal' });
        }

        console.log('PayPal checkout creado:', approval.href);
        return res.json({ url: approval.href });
      } catch (fetchError) {
        console.error('Error fetching PayPal:', fetchError);
        return res.status(500).json({ error: 'Error conectando con PayPal: ' + fetchError.message });
      }
    }

    return res.status(400).json({ error: 'Proveedor inválido' });
  } catch (error) {
    console.error('Error en /billing/checkout:', error);
    return res.status(500).json({ error: 'No se pudo crear el checkout: ' + error.message });
  }
});

router.post('/webhook/mercadopago', async (req, res) => {
  try {
    const type = req.query.type || req.body?.type;
    const id = req.query.id || req.body?.data?.id || req.body?.id;
    
    if (!id) return res.status(200).json({ received: true });
    if (!MP_ACCESS_TOKEN) {
      console.error('MP_ACCESS_TOKEN no configurado en webhook');
      return res.status(500).json({ error: 'Mercado Pago no configurado' });
    }

    console.log(`[MP WEBHOOK] Recibido: type=${type}, id=${id}`);

    // Determinar qué endpoint consultar
    let endpoint;
    let resourceType;
    
    if (type === 'preapproval' || (!type && id.length > 10)) {
      endpoint = `https://api.mercadopago.com/preapproval/${id}`;
      resourceType = 'preapproval';
    } else {
      endpoint = `https://api.mercadopago.com/v1/payments/${id}`;
      resourceType = 'payment';
    }

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`Error consultando ${resourceType}:`, data);
      return res.status(200).json({ received: true }); // Retornar 200 para que MP no reintente
    }

    // Extraer información según el tipo de recurso
    let externalRef, status, subscriberId, subscriptionId;
    
    if (resourceType === 'preapproval') {
      externalRef = data.external_reference;
      status = data.status === 'authorized' || data.status === 'active' ? 'active' : 'canceled';
      subscriberId = data.payer_id;
      subscriptionId = data.id;
      console.log(`[MP WEBHOOK] Preapproval: ${status}`, { externalRef, subscriberId, subscriptionId });
    } else {
      // Payment
      externalRef = data.external_reference;
      // Los payments que son parte de preapproval tendrán status 'approved'
      status = (data.status === 'approved' || data.status === 'authorized') ? 'active' : 'canceled';
      subscriberId = data.payer?.id;
      subscriptionId = data.id;
      console.log(`[MP WEBHOOK] Payment: ${status}`, { externalRef, subscriberId, subscriptionId });
    }

    const { userId, planTier, creatorCode } = parseExternalRef(externalRef);

    if (userId && planTier) {
      await updateSubscriptionAndReferral({
        userId,
        planTier,
        providerCustomerId: subscriberId,
        providerSubscriptionId: subscriptionId,
        status,
        creatorCode
      });
      console.log(`[MP WEBHOOK] Suscripción actualizada: ${userId} -> ${planTier} (${status})`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error en webhook Mercado Pago:', error.message);
    return res.status(200).json({ received: true }); // Siempre retornar 200 para que MP no reintente
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

// 🔍 Endpoint de diagnóstico para verificar configuración
router.get('/diagnostics', (req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    status: 'CHECKING CONFIGURATION...',
    mercadoPago: {
      hasAccessToken: !!MP_ACCESS_TOKEN ? '✅ YES' : '❌ MISSING: MP_ACCESS_TOKEN',
      planIds: {
        pro: {
          regular: MP_PLAN_IDS.pro.regular ? `✅ ${MP_PLAN_IDS.pro.regular.substring(0, 15)}...` : '❌ MISSING: MP_PREAPPROVAL_PLAN_PRO_ID',
          withDiscount: MP_PLAN_IDS.pro.withDiscount ? `✅ ${MP_PLAN_IDS.pro.withDiscount.substring(0, 15)}...` : '❌ MISSING: MP_PREAPPROVAL_PLAN_PRO_DISCOUNT_ID'
        },
        premium: {
          regular: MP_PLAN_IDS.premium.regular ? `✅ ${MP_PLAN_IDS.premium.regular.substring(0, 15)}...` : '❌ MISSING: MP_PREAPPROVAL_PLAN_PREMIUM_ID',
          withDiscount: MP_PLAN_IDS.premium.withDiscount ? `✅ ${MP_PLAN_IDS.premium.withDiscount.substring(0, 15)}...` : '❌ MISSING: MP_PREAPPROVAL_PLAN_PREMIUM_DISCOUNT_ID'
        }
      }
    },
    paypal: {
      hasClientId: !!PAYPAL_CLIENT_ID ? '✅ YES' : '❌ NO',
      hasClientSecret: !!PAYPAL_CLIENT_SECRET ? '✅ YES' : '❌ NO',
      planIds: {
        pro: PAYPAL_PLAN_IDS.pro ? `✅ ${PAYPAL_PLAN_IDS.pro.substring(0, 10)}...` : '❌ NO',
        premium: PAYPAL_PLAN_IDS.premium ? `✅ ${PAYPAL_PLAN_IDS.premium.substring(0, 10)}...` : '❌ NO'
      }
    },
    frontend: {
      url: FRONTEND_URL
    },
    action: 'If you see ❌, add the missing variables to Railway'
  };

  // Log para debugging
  if (!MP_ACCESS_TOKEN || !MP_PLAN_IDS.pro.regular || !MP_PLAN_IDS.pro.withDiscount || 
      !MP_PLAN_IDS.premium.regular || !MP_PLAN_IDS.premium.withDiscount) {
    console.error('🔴 MERCADO PAGO NOT FULLY CONFIGURED:', diagnostics);
  }

  console.log('📊 Diagnósticos de configuración:', diagnostics);
  res.json(diagnostics);
});

// 🔍 Diagnóstico de códigos de creador
router.get('/diagnostics/creators', async (req, res) => {
  try {
    const creators = await CreatorProfile.find({ isActive: true }).select('userId code discountRate commissionRate totalReferred totalEstimatedEarningsCents');
    res.json({
      total: creators.length,
      creators: creators.map(c => ({
        userId: c.userId,
        code: c.code,
        discountRate: c.discountRate,
        commissionRate: c.commissionRate,
        totalReferred: c.totalReferred,
        estimatedEarnings: (c.totalEstimatedEarningsCents / 100).toFixed(2) + ' ARS'
      }))
    });
  } catch (error) {
    console.error('Error fetching creators:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 🚨 CANCELAR SUSCRIPCIÓN EN MERCADO PAGO
 * POST /api/billing/cancel-subscription
 * Body: { userId: string }
 * Crítico: Cancela la suscripción en Mercado Pago para evitar cobros futuros
 */
router.post('/cancel-subscription', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId requerido' });
    }

    if (!MP_ACCESS_TOKEN) {
      return res.status(500).json({ error: 'Mercado Pago no está configurado' });
    }

    // Obtener suscripción del usuario
    const subscription = await Subscription.findOne({ userId });
    
    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No tienes una suscripción activa' });
    }

    const preapprovalId = subscription.stripeSubscriptionId;

    // CANCELAR en Mercado Pago
    console.log(`🚨 Cancelando preapproval ${preapprovalId} para usuario ${userId}`);
    
    const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'cancelled'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error cancelando en Mercado Pago:', data);
      return res.status(500).json({ 
        error: 'No se pudo cancelar en Mercado Pago. Por favor intenta más tarde.',
        details: data.error || data.message
      });
    }

    // ACTUALIZAR en Base de Datos
    subscription.tier = 'free';
    subscription.status = 'canceled';
    subscription.stripeSubscriptionId = null;
    subscription.currentPeriodEnd = null;
    await subscription.save();

    // Marcar referrals como cancelados si existen
    await CreatorReferral.findOneAndUpdate(
      { referredUserId: userId, status: 'active' },
      { status: 'canceled' }
    );

    console.log(`Suscripción de ${userId} cancelada exitosamente. Preapproval: ${preapprovalId}`);
    
    res.json({
      success: true,
      message: 'Suscripción cancelada. No te cobraremos más.',
      subscription: {
        userId: subscription.userId,
        tier: subscription.tier,
        status: subscription.status
      }
    });

  } catch (error) {
    console.error('Error en cancel-subscription:', error);
    res.status(500).json({ error: 'Error al cancelar suscripción: ' + error.message });
  }
});

/**
 * ℹ️ INFORMACIÓN PARA UPGRADE MANUAL
 * GET /api/billing/upgrade-info?userId=XXX
 * Retorna información para que el usuario haga upgrade
 */
router.get('/upgrade-info', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId requerido' });
    }

    const subscription = await Subscription.findOne({ userId });
    const currentTier = subscription?.tier || 'free';
    const currentPeriodEnd = subscription?.currentPeriodEnd;

    // Calcular días restantes en el período actual
    const daysRemaining = currentPeriodEnd
      ? Math.ceil((new Date(currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24))
      : 0;

    res.json({
      currentTier,
      currentPeriodEnd,
      daysRemaining,
      message: daysRemaining > 0 
        ? `Para hacer upgrade, dirígete a /pricing. Tu período actual termina en ${daysRemaining} días.`
        : 'Tu período actual ha terminado. Puedes convertirte a cualquier plan.',
      upgradeUrl: '/pricing'
    });

  } catch (error) {
    console.error('Error en upgrade-info:', error);
    res.status(500).json({ error: 'Error al obtener información de upgrade' });
  }
});

export default router;
