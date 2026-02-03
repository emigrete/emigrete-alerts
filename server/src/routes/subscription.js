import { Router } from 'express';
import { getUserSubscriptionStatus } from '../services/subscriptionService.js';

const router = Router();

/**
 * GET /api/subscription/status?userId=XXX
 * Obtiene status actual de suscripción y uso
 */
router.get('/status', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId requerido' });
    }

    const status = await getUserSubscriptionStatus(userId);
    res.json(status);
  } catch (error) {
    console.error('Error en /subscription/status:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
