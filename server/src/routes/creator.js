import { Router } from 'express';
import CreatorProfile from '../models/CreatorProfile.js';
import CreatorReferral from '../models/CreatorReferral.js';
import { UserToken } from '../models/UserToken.js';

const router = Router();

const DEFAULT_DISCOUNT_RATE = 0.1; // 10%
const DEFAULT_COMMISSION_RATE = 0.2; // 20%
const PLAN_PRICES_CENTS = {
  pro: 499,
  premium: 999
};

const sanitizeCode = (value) =>
  String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 16);

const generateCode = async (userId) => {
  const user = await UserToken.findOne({ userId });
  const base = sanitizeCode(user?.username || 'CREADOR');
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return sanitizeCode(`${base}${suffix}`);
};

router.get('/profile', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId requerido' });

    const profile = await CreatorProfile.findOne({ userId });
    if (!profile) return res.json({ exists: false });

    return res.json({ exists: true, isAssigned: profile.isAssigned, profile });
  } catch (error) {
    console.error('Error en /creator/profile:', error);
    return res.status(500).json({ error: 'Error obteniendo perfil de creador' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { userId, code } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId requerido' });

    const existing = await CreatorProfile.findOne({ userId });
    if (existing) return res.json({ profile: existing });

    let finalCode = sanitizeCode(code);
    if (finalCode.length < 3) {
      finalCode = await generateCode(userId);
    }

    const codeExists = await CreatorProfile.findOne({ code: finalCode });
    if (codeExists) return res.status(409).json({ error: 'Código ya en uso' });

    const profile = await CreatorProfile.create({
      userId,
      code: finalCode,
      discountRate: DEFAULT_DISCOUNT_RATE,
      commissionRate: DEFAULT_COMMISSION_RATE
    });

    return res.json({ profile });
  } catch (error) {
    console.error('Error en /creator/register:', error);
    return res.status(500).json({ error: 'Error creando perfil de creador' });
  }
});

router.post('/apply', async (req, res) => {
  try {
    const { userId, code, planTier } = req.body || {};
    if (!userId || !code || !planTier) {
      return res.status(400).json({ error: 'userId, code y planTier requeridos' });
    }

    if (!PLAN_PRICES_CENTS[planTier]) {
      return res.status(400).json({ error: 'planTier inválido' });
    }

    const normalizedCode = sanitizeCode(code);
    const creator = await CreatorProfile.findOne({ code: normalizedCode, isActive: true });
    if (!creator) return res.status(404).json({ error: 'Código no encontrado' });

    if (creator.userId === userId) {
      return res.status(400).json({ error: 'No podés usar tu propio código' });
    }

    const existingReferral = await CreatorReferral.findOne({ referredUserId: userId, status: 'active' });
    if (existingReferral) {
      return res.status(409).json({ error: 'Ya tenés un código aplicado' });
    }

    const priceCents = PLAN_PRICES_CENTS[planTier];
    const estimatedEarningsCents = Math.round(
      priceCents * (1 - creator.discountRate) * creator.commissionRate
    );

    return res.json({
      discountRate: creator.discountRate,
      commissionRate: creator.commissionRate,
      priceCents,
      estimatedEarningsCents,
      normalizedCode
    });
  } catch (error) {
    console.error('Error en /creator/apply:', error);
    return res.status(500).json({ error: 'Error aplicando código' });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId requerido' });

    const profile = await CreatorProfile.findOne({ userId });
    if (!profile) return res.status(404).json({ error: 'Perfil no encontrado' });

    const referrals = await CreatorReferral.find({ creatorUserId: userId })
      .sort({ createdAt: -1 })
      .lean();

    const totals = referrals
      .filter((ref) => ref.status === 'active')
      .reduce(
      (acc, ref) => {
        acc.totalEstimatedEarningsCents += ref.estimatedEarningsCents;
        acc.totalReferred += 1;
        return acc;
      },
      { totalEstimatedEarningsCents: 0, totalReferred: 0 }
    );

    return res.json({ profile, referrals, totals });
  } catch (error) {
    console.error('Error en /creator/dashboard:', error);
    return res.status(500).json({ error: 'Error obteniendo dashboard' });
  }
});

export default router;
