import express from 'express';
import feedbackRoutes from './api/feedback.js';
import twitchRoutes from './api/twitch.js';
import triggersRoutes from './api/triggers.js';
import ttsRoutes from './api/tts.js';
import adminRoutes from './api/admin.js';
import subscriptionRoutes from './api/subscription.js';

const router = express.Router();

// Modular route usage
router.use('/feedback', feedbackRoutes);
router.use('/twitch', twitchRoutes);
router.use('/triggers', triggersRoutes);
router.use('/tts', ttsRoutes);
router.use('/admin', adminRoutes);
router.use('/subscription', subscriptionRoutes);

// If you have any root-level or legacy endpoints, add them here or migrate them to modules.

export default router;
