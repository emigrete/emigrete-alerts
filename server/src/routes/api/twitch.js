import express from 'express';
import axios from 'axios';
import { UserToken } from '../../models/UserToken.js';
import { Trigger } from '../../models/Trigger.js';
import { getValidAccessToken } from '../../services/twitchAuthService.js';
import { canCreateAlert, incrementAlertCount } from '../../services/subscriptionService.js';
const router = express.Router();

// GET /api/twitch/rewards
router.get('/rewards', async (req, res) => {
	const { userId } = req.query;
	if (!userId) return res.status(400).json({ error: 'Falta userId' });

	try {
		const user = await UserToken.findOne({ userId });
		if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

		let accessToken = user.accessToken;
		try {
			accessToken = await getValidAccessToken(userId);
		} catch (error) {
			console.error('Error refrescando token de Twitch:', error.message);
			return res.status(401).json({ error: 'No se pudo refrescar la sesion de Twitch' });
		}

		const response = await axios.get('https://api.twitch.tv/helix/channel_points/custom_rewards', {
			params: { broadcaster_id: userId },
			headers: {
				'Client-ID': process.env.TWITCH_CLIENT_ID,
				'Authorization': `Bearer ${accessToken}`
			}
		});

		const rewards = response.data.data.map(r => ({
			id: r.id,
			title: r.title,
			backgroundColor: r.background_color,
			image: r.image?.url_1x || r.default_image?.url_1x
		}));

		res.json(rewards);
	} catch (error) {
		console.error('Error fetching rewards:', error.response?.data || error.message);
		res.status(500).json({ error: 'Error al obtener recompensas de Twitch' });
	}
});

// POST /api/twitch/create-reward
router.post('/create-reward', async (req, res) => {
	const { 
		userId, 
		title, 
		cost, 
		prompt, 
		backgroundColor,
		enableTTS,
		ttsText,
		ttsUseViewerMessage
	} = req.body;

	if (!userId || !title || !cost) {
		return res.status(400).json({ 
			error: 'Faltan: userId, title, cost'
		});
	}

	try {
		// ✅ CHECK: ¿Puede crear alertas?
		const alertCheck = await canCreateAlert(userId);
		if (!alertCheck.allowed) {
			return res.status(402).json({
				error: alertCheck.message,
				current: alertCheck.current,
				limit: alertCheck.limit,
				requiresUpgrade: true
			});
		}

		const user = await UserToken.findOne({ userId });
		if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

		let accessToken = user.accessToken;
		try {
			accessToken = await getValidAccessToken(userId);
		} catch (error) {
			console.error('Error refrescando token de Twitch:', error.message);
			return res.status(401).json({ error: 'No se pudo refrescar la sesion de Twitch' });
		}

		// Crear recompensa en Twitch
		const response = await axios.post(
			'https://api.twitch.tv/helix/channel_points/custom_rewards',
			{
				title,
				cost: parseInt(cost),
				prompt: prompt || '',
				background_color: backgroundColor || '#9146FF',
				is_enabled: true,
				is_user_input_required: !!req.body.isUserInputRequired,
				is_max_per_stream_enabled: false,
				is_global_cooldown_enabled: false
			},
			{
				headers: {
					'Client-ID': process.env.TWITCH_CLIENT_ID,
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json'
				},
				params: { broadcaster_id: userId }
			}
		);

		const newReward = response.data.data[0];

		// Si TTS está habilitado, crear el trigger con configuración TTS
		if (enableTTS) {
			const ttsConfig = {
				enabled: true,
				voiceId: 'onwK4e9ZLuTAKqWW03F9',
				text: ttsUseViewerMessage ? '' : (ttsText || ''),
				useViewerMessage: ttsUseViewerMessage ?? true,
				readUsername: true,
				stability: 0.5,
				similarityBoost: 0.75
			};

			const trigger = await Trigger.create({
				userId,
				twitchRewardId: newReward.id,
				medias: [],
				ttsConfig,
				alertConfig: {
					displayName: title,
					backgroundColor: backgroundColor || '#9146FF',
					showInChat: true
				}
			});

			console.log(`Trigger TTS creado: ${trigger._id} para recompensa ${newReward.id}`);
		}

		// ✅ INCREMENTAR CONTADOR
		await incrementAlertCount(userId);

		res.json({
			success: true,
			reward: {
				id: newReward.id,
				title: newReward.title,
				cost: newReward.cost,
				backgroundColor: newReward.background_color,
				image: newReward.image?.url_1x || newReward.default_image?.url_1x
			}
		});

	} catch (error) {
		console.error('Error creando recompensa:', error.response?.data || error.message);
		const errorMsg = error.response?.data?.message || 'Error al crear recompensa en Twitch';
		res.status(500).json({ error: errorMsg });
	}
});

export default router;
