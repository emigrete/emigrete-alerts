import express from 'express';

import Feedback from '../../models/Feedback.js';
import { UserToken } from '../../models/UserToken.js';
import UsageMetrics from '../../models/UsageMetrics.js';
import Subscription from '../../models/Subscription.js';
import CreatorProfile from '../../models/CreatorProfile.js';
import CreatorReferral from '../../models/CreatorReferral.js';

import { getUserSubscriptionStatus } from '../../services/subscriptionService.js';

// Si tu Trigger model exporta { Trigger } como en tu código actual, lo dejamos así:
import { Trigger } from '../../models/Trigger.js';

const router = express.Router();

/** =========================
 *  ADMIN AUTH (bien hecho)
 *  ========================= */
function getAdminId(req) {
  return (
    req.query.adminId ||
    req.body?.adminId ||
    req.headers['x-admin-id'] ||
    req.headers['x-adminid'] ||
    null
  );
}

function isAdminId(adminId) {
  const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  return !!adminId && ADMIN_USER_IDS.includes(String(adminId));
}

function requireAdmin(req, res, next) {
  const adminId = getAdminId(req);
  if (!isAdminId(adminId)) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  req.adminId = String(adminId);
  next();
}

/** =========================
 *  ADMIN FEEDBACK
 *  ========================= */

// GET /api/admin/feedback
router.get('/feedback', requireAdmin, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({}).sort({ createdAt: -1 }).lean();
    res.json({ feedbacks });
  } catch (e) {
    console.error('[ADMIN] Error fetching feedback:', e);
    res.status(500).json({ error: 'Error fetching feedback' });
  }
});

// PUT /api/admin/feedback/:id/response
router.put('/feedback/:id/response', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const responseText = String(req.body?.response || '').trim();
    if (!responseText) {
      return res.status(400).json({ error: 'Response is required' });
    }

    const updated = await Feedback.findByIdAndUpdate(
      id,
      { response: responseText, responded: true },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ error: 'Feedback not found' });
    res.json({ ok: true, feedback: updated });
  } catch (e) {
    console.error('[ADMIN] Error responding feedback:', e);
    res.status(500).json({ error: 'Error responding feedback' });
  }
});

// DELETE /api/admin/feedback/:id (solo si responded)
router.delete('/feedback/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const fb = await Feedback.findById(id);
    if (!fb) return res.status(404).json({ error: 'Feedback not found' });

    if (!fb.responded || !fb.response) {
      return res.status(400).json({ error: 'Only responded feedback can be deleted' });
    }

    await Feedback.deleteOne({ _id: id });
    res.json({ ok: true });
  } catch (e) {
    console.error('[ADMIN] Error deleting feedback:', e);
    res.status(500).json({ error: 'Error deleting feedback' });
  }
});

/** =========================
 *  ADMIN CHECK
 *  ========================= */
// GET /api/admin/check?userId=...
router.get('/check', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.json({ isAdmin: false });

    const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(',') || [];
    const isAdmin = ADMIN_USER_IDS.includes(String(userId));
    res.json({ isAdmin });
  } catch (error) {
    console.error('Error verificando admin:', error);
    res.json({ isAdmin: false });
  }
});

/** =========================
 *  ADMIN USERS
 *  ========================= */

// GET /api/admin/users?adminId=...
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const userTokens = await UserToken.find().select('userId username');

    const usersData = [];
    for (const userToken of userTokens) {
      try {
        const status = await getUserSubscriptionStatus(userToken.userId);
        const triggerCount = await Trigger.countDocuments({ userId: userToken.userId });
        const creatorProfile = await CreatorProfile.findOne({ userId: userToken.userId });

        usersData.push({
          userId: userToken.userId,
          username: userToken.username || 'Unknown',
          tier: status.subscription?.tier || 'free',
          subscription: {
            tier: status.subscription?.tier || 'free',
            status: status.subscription?.status || 'active',
            currentPeriodStart: status.subscription?.currentPeriodStart || null,
            currentPeriodEnd: status.subscription?.currentPeriodEnd || null,
            cancelAtPeriodEnd: status.subscription?.cancelAtPeriodEnd || false,
            requiresManualMpCancellation: status.subscription?.requiresManualMpCancellation || false,
            stripeSubscriptionId: status.subscription?.stripeSubscriptionId || null,
            createdAt: status.subscription?.createdAt || null,
            updatedAt: status.subscription?.updatedAt || null,
          },
          isCreator: creatorProfile?.isAssigned || false,
          creatorCode: creatorProfile?.code || null,
          triggers: triggerCount || 0,
          alerts: {
            current: status.usage?.alerts?.current || 0,
            limit: status.usage?.alerts?.limit ?? null,
            percentage: status.usage?.alerts?.percentage || 0,
            isUnlimited: status.usage?.alerts?.isUnlimited || false,
          },
          tts: {
            current: status.usage?.tts?.current || 0,
            limit: status.usage?.tts?.limit ?? null,
            percentage: status.usage?.tts?.percentage || 0,
            isUnlimited: status.usage?.tts?.isUnlimited || false,
          },
          storage: {
            current: status.usage?.storage?.current || 0,
            limit: status.usage?.storage?.limit ?? null,
            percentage: status.usage?.storage?.percentage || 0,
            isUnlimited: status.usage?.storage?.isUnlimited || false,
          },
          bandwidth: {
            current: status.usage?.bandwidth?.current || 0,
            limit: status.usage?.bandwidth?.limit ?? null,
            percentage: status.usage?.bandwidth?.percentage || 0,
            isUnlimited: status.usage?.bandwidth?.isUnlimited || false,
          },
          nextResetDate: status.nextResetDate,
        });
      } catch (error) {
        console.error(`Error obteniendo status para ${userToken.userId}:`, error.message);
      }
    }

    usersData.sort((a, b) => {
      const tierOrder = { premium: 0, pro: 1, free: 2 };
      return (tierOrder[a.tier] ?? 99) - (tierOrder[b.tier] ?? 99);
    });

    res.json({ totalUsers: usersData.length, users: usersData });
  } catch (error) {
    console.error('Error obteniendo usuarios admin:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// PUT /api/admin/users/:userId/tier
router.put('/users/:userId/tier', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { tier } = req.body;

    const validTiers = ['free', 'pro', 'premium'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({ error: 'Tier inválido' });
    }

    const subscription = await Subscription.findOneAndUpdate(
      { userId },
      { tier, status: 'active', updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      subscription: {
        userId: subscription.userId,
        tier: subscription.tier,
        status: subscription.status,
      },
    });
  } catch (error) {
    console.error('Error cambiando tier:', error);
    res.status(500).json({ error: 'Error al cambiar tier' });
  }
});

// POST /api/admin/users/:userId/reset
router.post('/users/:userId/reset', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.body;

    let metrics = await UsageMetrics.findOne({ userId });
    if (!metrics) metrics = new UsageMetrics({ userId });

    switch (type) {
      case 'alerts':
        metrics.alertsCount = 0;
        break;
      case 'tts':
        metrics.ttsCharsUsed = 0;
        break;
      case 'storage':
        metrics.storageUsedBytes = 0;
        break;
      case 'all':
        metrics.alertsCount = 0;
        metrics.ttsCharsUsed = 0;
        metrics.storageUsedBytes = 0;
        break;
      default:
        return res.status(400).json({ error: 'Tipo inválido' });
    }

    await metrics.save();
    res.json({ success: true, message: `${type} reseteado correctamente` });
  } catch (error) {
    console.error('Error reseteando límites:', error);
    res.status(500).json({ error: 'Error al resetear límites' });
  }
});

// POST /api/admin/users/:userId/creator-role
router.post('/users/:userId/creator-role', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isCreator, code: customCode } = req.body;

    if (isCreator === undefined) {
      return res.status(400).json({ error: 'isCreator requerido' });
    }

    const sanitizeCode = (value) =>
      String(value || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 16);

    if (isCreator) {
      const user = await UserToken.findOne({ userId });
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      let profile = await CreatorProfile.findOne({ userId });

      if (!profile) {
        profile = await CreatorProfile.create({
          userId,
          code: null,
          isAssigned: true,
          isActive: true,
        });
      } else {
        profile.isAssigned = true;
        profile.isActive = true;
      }

      if (customCode && customCode.trim()) {
        const newCode = sanitizeCode(customCode);
        const existingCode = await CreatorProfile.findOne({ code: newCode });
        if (existingCode && existingCode.userId !== userId) {
          return res.status(409).json({ error: `El código "${newCode}" ya está en uso` });
        }
        profile.code = newCode;
      }

      await profile.save();

      return res.json({
        success: true,
        message: 'Rol creador asignado',
        profile: {
          userId: profile.userId,
          code: profile.code || null,
          isAssigned: profile.isAssigned,
          isActive: profile.isActive,
        },
      });
    }

    const updatedProfile = await CreatorProfile.findOneAndUpdate(
      { userId },
      { isAssigned: false, isActive: false },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ error: 'Perfil de creador no encontrado' });
    }

    return res.json({
      success: true,
      message: 'Rol creador removido',
      profile: {
        userId: updatedProfile.userId,
        code: updatedProfile.code,
        isAssigned: updatedProfile.isAssigned,
        isActive: updatedProfile.isActive,
      },
    });
  } catch (error) {
    console.error('Error toggling creator role:', error);
    res.status(500).json({ error: 'Error al cambiar rol creador', details: error.message });
  }
});

// PUT /api/admin/users/:userId/creator-code
router.put('/users/:userId/creator-code', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { code } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Código requerido' });
    }

    const newCode = String(code)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 16);

    const existingCode = await CreatorProfile.findOne({ code: newCode });
    if (existingCode && existingCode.userId !== userId) {
      return res.status(409).json({ error: `El código "${newCode}" ya está en uso por otro creador` });
    }

    const updatedProfile = await CreatorProfile.findOneAndUpdate(
      { userId },
      { code: newCode },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ error: 'Perfil de creador no encontrado. Primero asigna el rol creador.' });
    }

    return res.json({
      success: true,
      message: 'Código de creador actualizado',
      profile: {
        userId: updatedProfile.userId,
        code: updatedProfile.code,
        isAssigned: updatedProfile.isAssigned,
        isActive: updatedProfile.isActive,
      },
    });
  } catch (error) {
    console.error('Error actualizando código creador:', error);
    res.status(500).json({ error: 'Error al actualizar código', details: error.message });
  }
});

/**
 * (Opcional) TESTING: /api/admin/test/simulate-payment
 * Si querés “fundamental”, borrá este endpoint o protegelo por NODE_ENV.
 */
router.post('/test/simulate-payment', requireAdmin, async (req, res) => {
  try {
    // Doble protección opcional por token dedicado:
    const adminToken = req.headers['x-admin-token'];
    const expected = process.env.ADMIN_TEST_TOKEN || 'dev-test-token';
    if (adminToken !== expected) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { userId, planTier, creatorCode } = req.body;
    if (!userId || !planTier) {
      return res.status(400).json({ error: 'userId y planTier requeridos' });
    }

    const now = new Date();
    const PLAN_PRICES_CENTS = { pro: 750000, premium: 1500000 };

    await Subscription.findOneAndUpdate(
      { userId },
      {
        userId,
        tier: planTier,
        status: 'active',
        cancelAtPeriodEnd: false,
        stripeCustomerId: 'TEST_CUSTOMER_' + Date.now(),
        stripeSubscriptionId: 'TEST_SUB_' + Date.now(),
        currentPeriodStart: now,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      { upsert: true, new: true }
    );

    if (creatorCode) {
      const creator = await CreatorProfile.findOne({
        code: creatorCode.toUpperCase(),
        isActive: true,
      });

      if (creator) {
        const priceCents = PLAN_PRICES_CENTS[planTier] || 0;
        const estimatedEarnings = Math.round(priceCents * (creator.commissionRate || 0.2));

        await CreatorReferral.create({
          creatorUserId: creator.userId,
          referredUserId: userId,
          code: creatorCode.toUpperCase(),
          planTier,
          priceCents,
          discountRate: creator.discountRate || 0.1,
          commissionRate: creator.commissionRate || 0.2,
          estimatedEarningsCents: estimatedEarnings,
          status: 'active',
        });

        creator.totalEstimatedEarningsCents += estimatedEarnings;
        creator.totalReferred += 1;
        await creator.save();
      }
    }

    const subscription = await Subscription.findOne({ userId });
    const referral = await CreatorReferral.findOne({ referredUserId: userId });

    res.json({
      success: true,
      message: 'Pago simulado exitosamente',
      subscription,
      referral,
    });
  } catch (error) {
    console.error('Error simulando pago:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
