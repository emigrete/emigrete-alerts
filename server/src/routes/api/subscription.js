import express from 'express';
import Subscription from '../../models/Subscription.js';
import { getUserSubscriptionStatus } from '../../services/subscriptionService.js';
const router = express.Router();

// GET /api/subscription/status - Get current subscription and usage status
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

// POST /api/subscription/change-plan
router.post('/change-plan', async (req, res) => {
	try {
		const { userId, newTier } = req.body;
		if (!userId || !newTier) {
			return res.status(400).json({ error: 'userId y newTier requeridos' });
		}
		const validTiers = ['free', 'pro', 'premium'];
		if (!validTiers.includes(newTier)) {
			return res.status(400).json({ error: 'Tier inválido' });
		}
		const currentSubscription = await Subscription.findOne({ userId });
		if (currentSubscription?.tier === newTier) {
			return res.status(400).json({ error: 'Ya tienes este plan' });
		}
		if (currentSubscription && currentSubscription.status === 'active') {
			const now = new Date();
			const periodEnd = currentSubscription.currentPeriodEnd;
			if (periodEnd && now < periodEnd) {
				const tierHierarchy = { free: 0, pro: 1, premium: 2 };
				const isUpgrade = tierHierarchy[newTier] > tierHierarchy[currentSubscription.tier];
				if (!isUpgrade) {
					if (newTier === 'free') {
						currentSubscription.cancelAtPeriodEnd = true;
						await currentSubscription.save();
						const daysRemaining = Math.ceil(
							(periodEnd - now) / (1000 * 60 * 60 * 24)
						);
						return res.json({
							success: true,
							message: 'Cancelación programada. Tu plan sigue activo hasta fin del período.',
							subscription: {
								userId: currentSubscription.userId,
								tier: currentSubscription.tier,
								status: currentSubscription.status,
								currentPeriodEnd: currentSubscription.currentPeriodEnd,
								cancelAtPeriodEnd: true,
								daysRemaining
							}
						});
					}
					const daysRemaining = Math.ceil(
						(periodEnd - now) / (1000 * 60 * 60 * 24)
					);
					return res.status(403).json({
						error: 'No puedes bajar de plan durante el período actual',
						reason: `Tu período de facturación termina en ${daysRemaining} días. Podrás cambiar de plan después.`,
						currentPeriodEnd: periodEnd,
						daysRemaining
					});
				}
			}
		}
		const updatedSubscription = await Subscription.findOneAndUpdate(
			{ userId },
			{
				tier: newTier,
				status: 'active',
				updatedAt: new Date(),
				...(newTier === 'free' && { 
					stripeSubscriptionId: null,
					stripeCustomerId: null,
					currentPeriodEnd: null,
					cancelAtPeriodEnd: false
				})
			},
			{ upsert: true, new: true }
		);
		console.log(`Usuario ${userId} cambió plan de ${currentSubscription?.tier || 'free'} a ${newTier}`);
		res.json({
			success: true,
			message: newTier === 'free' 
				? 'Plan cancelado correctamente'
				: 'Plan actualizado correctamente',
			subscription: {
				userId: updatedSubscription.userId,
				tier: updatedSubscription.tier,
				status: updatedSubscription.status,
				currentPeriodEnd: updatedSubscription.currentPeriodEnd
			}
		});
	} catch (error) {
		console.error('Error cambiando plan:', error);
		res.status(500).json({ error: 'Error al cambiar plan' });
	}
});

export default router;
