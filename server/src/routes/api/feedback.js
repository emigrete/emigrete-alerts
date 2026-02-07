import express from 'express';
import Feedback from '../../models/Feedback.js';

const router = express.Router();

/**
 * USER: GET /api/feedback/mine
 * Devuelve feedbacks del usuario
 */
router.get('/mine', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.query.userId;
    if (!userId) return res.status(400).json({ error: 'Falta userId.' });

    const feedbacks = await Feedback.find({ userId }).sort({ createdAt: -1 });
    res.json({ feedbacks });
  } catch (error) {
    console.error('Error obteniendo feedbacks usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * USER: POST /api/feedback
 * Crea feedback del usuario
 */
router.post('/', async (req, res) => {
  try {
    const { feedback, email, type } = req.body;
    const userId = req.headers['x-user-id'] || req.body.userId || '';
    const username = req.headers['x-username'] || req.body.username || '';

    if (!feedback || !userId) {
      return res.status(400).json({ error: 'Faltan datos requeridos.' });
    }

    const fb = await Feedback.create({
      userId,
      username,
      email,
      type,
      feedback,
    });

    res.json({ success: true, feedback: fb });
  } catch (error) {
    console.error('Error guardando feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
