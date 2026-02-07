import express from 'express';
import axios from 'axios';
import { canUseTTS, incrementTTSUsage } from '../../services/subscriptionService.js';
import { getUserSubscriptionStatus } from '../../services/subscriptionService.js';
const router = express.Router();

// GET /api/tts/usage/:userId
router.get('/usage/:userId', async (req, res) => {
	try {
		const { userId } = req.params;
		const status = await getUserSubscriptionStatus(userId);
		const isUnlimited = status.usage.tts.isUnlimited === true;
		const percentageUsed = isUnlimited 
			? 0 
			: Math.round((status.usage.tts.current / status.usage.tts.limit) * 100);
		res.json({
			charsUsed: status.usage.tts.current,
			charsLimit: status.usage.tts.limit,
			charsRemaining: status.usage.tts.remaining,
			percentageUsed,
			isUnlimited,
			tier: status.subscription.tier,
			nextResetDate: status.nextResetDate
		});
	} catch (error) {
		console.error('Error obteniendo TTS usage:', error);
		res.status(500).json({ error: 'Error al obtener uso de TTS' });
	}
});

// POST /api/tts
router.post('/', async (req, res) => {
	const { text, voiceId = 'onwK4e9ZLuTAKqWW03F9', stability = 0.5, similarityBoost = 0.75, userId } = req.body;
	if (!text) {
		return res.status(400).json({ error: 'Falta el texto para generar TTS' });
	}
	if (!userId) {
		return res.status(400).json({ error: 'Falta userId' });
	}
	const MAX_CHARS_PER_REQUEST = 300;
	if (text.length > MAX_CHARS_PER_REQUEST) {
		return res.status(400).json({ 
			error: `Texto demasiado largo. Máximo ${MAX_CHARS_PER_REQUEST} caracteres (actual: ${text.length})` 
		});
	}
	try {
		const ttsCheck = await canUseTTS(userId, text.length);
		if (!ttsCheck.allowed) {
			return res.status(402).json({
				error: ttsCheck.message,
				current: ttsCheck.current,
				requested: ttsCheck.requested,
				limit: ttsCheck.limit,
				remaining: ttsCheck.remaining,
				requiresUpgrade: true
			});
		}
		const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
		if (!ELEVENLABS_API_KEY) {
			console.error('Falta ELEVENLABS_API_KEY en variables de entorno');
			return res.status(500).json({ error: 'TTS no configurado' });
		}
		console.log('🎤 Generando TTS:', { text: text.substring(0, 50), voiceId, userId, length: text.length });
		const response = await axios.post(
			`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
			{
				text,
				model_id: 'eleven_multilingual_v2',
				voice_settings: {
					stability,
					similarity_boost: similarityBoost
				}
			},
			{
				headers: {
					'Accept': 'audio/mpeg',
					'xi-api-key': ELEVENLABS_API_KEY,
					'Content-Type': 'application/json'
				},
				responseType: 'arraybuffer'
			}
		);
		await incrementTTSUsage(userId, text.length);
		const audioBase64 = Buffer.from(response.data, 'binary').toString('base64');
		console.log(`TTS generado (${text.length} chars)`);
		res.json({ 
			success: true, 
			audio: `data:audio/mpeg;base64,${audioBase64}`,
			charsUsed: text.length
		});
	} catch (error) {
		console.error('Error generando TTS:', error.response?.data || error.message);
		if (error.response) {
			const statusCode = error.response.status || 500;
			let data = error.response.data;
			try {
				if (data && data.byteLength) {
					const str = Buffer.from(data).toString('utf8');
					try {
						data = JSON.parse(str);
					} catch {
						data = str;
					}
				}
			} catch (e) {
				// ignore
			}
			const message = data?.error || data?.message || (typeof data === 'string' ? data : JSON.stringify(data));
			console.error('ElevenLabs error payload (decoded):', message);
			return res.status(statusCode).json({ error: message });
		}
		return res.status(500).json({ error: 'Error al generar TTS' });
	}
});

export default router;
