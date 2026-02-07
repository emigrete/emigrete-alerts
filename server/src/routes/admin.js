import express from 'express';
import Feedback from '../models/Feedback.js';

const router = express.Router();


function getAdminId(req) {
  return (
    req.query.adminId ||
    req.body?.adminId ||
    req.headers['x-admin-id'] ||
    req.headers['x-adminid'] ||
    null
  );
}

function requireAdmin(req, res, next) {
  const adminId = getAdminId(req);
  if (!adminId) return res.status(401).json({ error: 'Missing adminId' });
  req.adminId = adminId;
  next();
}


router.get('/feedback', requireAdmin, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({})
      .sort({ createdAt: -1 })
      .lean();

    res.json({ feedbacks });
  } catch (e) {
    console.error('[ADMIN] Error fetching feedback:', e);
    res.status(500).json({ error: 'Error fetching feedback' });
  }
});


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

export default router;
