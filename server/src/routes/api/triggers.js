import express from 'express';
import axios from 'axios';
import { getStorage } from 'firebase-admin/storage';
import { Trigger } from '../../models/Trigger.js';
import { UserToken } from '../../models/UserToken.js';
import { getValidAccessToken } from '../../services/twitchAuthService.js';
import { decrementStorageUsage, decrementAlertCount, decrementTTSUsage, incrementBandwidthUsage } from '../../services/subscriptionService.js';
const router = express.Router();

const buildPathCandidates = (value, mediaType, bucketName) => {
	const normalized = value;
	if (!normalized) return [];
	const candidates = [normalized];
	const baseName = normalized.split('/').pop();
	const hasTypeFolder = normalized.includes('triggers/video/')
		|| normalized.includes('triggers/audio/')
		|| normalized.includes('triggers/gif/');
	if (normalized.startsWith('triggers/') && hasTypeFolder) {
		candidates.push(`triggers/${baseName}`);
	} else if (normalized.startsWith('triggers/') && !hasTypeFolder && mediaType) {
		candidates.push(`triggers/${mediaType}/${baseName}`);
	}
	return [...new Set(candidates)];
};

const resolveExistingPath = async (bucket, value, mediaType) => {
	const candidates = buildPathCandidates(value, mediaType, bucket.name);
	for (const path of candidates) {
		try {
			const [exists] = await bucket.file(path).exists();
			if (exists) return path;
		} catch {
			// Ignore and try next candidate
		}
	}
	return null;
};

// GET /api/triggers
router.get('/', async (req, res) => {
	const { userId } = req.query;
	if (!userId) return res.status(400).json({ error: 'Falta userId' });

	try {
		const triggers = await Trigger.find({ userId });
		const bucket = getStorage().bucket();

		await Promise.all(triggers.map(async (trigger) => {
			let updated = false;

			if (trigger.fileName) {
				const normalized = await resolveExistingPath(bucket, trigger.fileName, 'video');
				if (normalized && normalized !== trigger.fileName) {
					trigger.fileName = normalized;
					updated = true;
				}
			}

			if (trigger.medias && trigger.medias.length > 0) {
				for (const media of trigger.medias) {
					if (media.fileName) {
						const normalized = await resolveExistingPath(bucket, media.fileName, media.type);
						if (normalized && normalized !== media.fileName) {
							media.fileName = normalized;
							updated = true;
						}
					}
				}
			}

			if (updated) {
				await trigger.save();
			}
		}));

		res.json(triggers);
	} catch {
		res.status(500).json({ error: 'Error al obtener alertas' });
	}
});

// DELETE /api/triggers/:id
router.delete('/:id', async (req, res) => {
	try {
		const userId = req.query.userId;
		if (!userId || userId === 'undefined' || userId === '') {
			console.warn('[DELETE TRIGGER] Falta userId. Query:', req.query);
			return res.status(400).json({ error: 'Falta userId en la solicitud' });
		}

		const trigger = await Trigger.findById(req.params.id);
		if (!trigger) return res.status(404).json({ error: 'Alerta no encontrada' });

		const isOwner = String(trigger.userId) === String(userId);
		console.log(`[DELETE TRIGGER] userId=${userId}, propietario=${trigger.userId}, isOwner=${isOwner}`);
		if (!isOwner) {
			console.warn(`[PERMISSION DENIED] Usuario ${userId} intentó eliminar alerta de ${trigger.userId}`);
			return res.status(403).json({ error: 'Solo el propietario puede eliminar su alerta' });
		}

		let twitchDeleteWarning = null;
		if (trigger.twitchRewardId) {
			const user = await UserToken.findOne({ userId: trigger.userId });
			if (!user) {
				twitchDeleteWarning = 'Usuario no encontrado para borrar recompensa en Twitch';
			} else {
				let accessToken = user.accessToken;
				try {
					accessToken = await getValidAccessToken(trigger.userId);
				} catch (error) {
					console.error('Error refrescando token de Twitch:', error.message);
					twitchDeleteWarning = 'No se pudo refrescar la sesion de Twitch';
				}
				try {
					await axios.delete('https://api.twitch.tv/helix/channel_points/custom_rewards', {
						headers: {
							'Client-ID': process.env.TWITCH_CLIENT_ID,
							'Authorization': `Bearer ${accessToken}`
						},
						params: {
							broadcaster_id: trigger.userId,
							id: trigger.twitchRewardId
						}
					});
				} catch (error) {
					const status = error.response?.status;
					if (status !== 404) {
						console.error('Error al borrar recompensa en Twitch:', error.response?.data || error.message);
						twitchDeleteWarning = 'No se pudo borrar la recompensa en Twitch';
					}
				}
			}
		}

		let totalSizeToDelete = 0;
		const bucket = getStorage().bucket();
		const deleteFromBucket = async (name, mediaType, label) => {
			const candidates = buildPathCandidates(name, mediaType, bucket.name);
			for (const path of candidates) {
				try {
					const [exists] = await bucket.file(path).exists();
					if (!exists) continue;
					const [metadata] = await bucket.file(path).getMetadata().catch(() => [null]);
					if (metadata?.size) {
						totalSizeToDelete += parseInt(metadata.size);
					}
					await bucket.file(path).delete({ ignoreNotFound: true });
					return true;
				} catch (e) {
					console.error(`No se pudo borrar ${label} ${path}:`, e.message);
				}
			}
			return false;
		};
		if (trigger.fileName) {
			const deleted = await deleteFromBucket(trigger.fileName, 'video', 'archivo legacy');
			if (!deleted) {
				console.warn('Archivo legacy no encontrado para borrar:', trigger.fileName);
			}
		}
		if (trigger.medias && trigger.medias.length > 0) {
			for (const media of trigger.medias) {
				if (media.fileName) {
					const deleted = await deleteFromBucket(media.fileName, media.type, 'media');
					if (!deleted) {
						console.warn('Media no encontrada para borrar:', media.fileName);
					}
				}
			}
		}
		if (totalSizeToDelete > 0) {
			console.log(`Liberando storage: ${totalSizeToDelete} bytes para usuario ${trigger.userId}`);
			await decrementStorageUsage(trigger.userId, totalSizeToDelete);
		}
		if (trigger.ttsConfig?.enabled && trigger.ttsConfig?.text) {
			const estimatedChars = trigger.ttsConfig.text.length;
			console.log(`Liberando TTS: ${estimatedChars} caracteres para usuario ${trigger.userId}`);
			await decrementTTSUsage(trigger.userId, estimatedChars);
		}
		console.log(`Liberando alerta: usuario ${trigger.userId}`);
		await decrementAlertCount(trigger.userId);
		await Trigger.findByIdAndDelete(req.params.id);
		return res.json({ success: true, warning: twitchDeleteWarning });
	} catch (e) {
		console.error('Error al borrar alerta:', e.message);
		return res.status(500).json({ error: 'Error al borrar alerta' });
	}
});

// POST /api/triggers/track-playback
router.post('/track-playback', async (req, res) => {
	const { userId, triggerId, fileSize } = req.body;
	if (!userId || !triggerId || !fileSize) {
		return res.status(400).json({ error: 'Faltan userId, triggerId o fileSize' });
	}
	try {
		const trigger = await Trigger.findOne({ _id: triggerId, userId });
		if (!trigger) {
			return res.status(404).json({ error: 'Alerta no encontrada o no autorizado' });
		}
		console.log(`📊 [Playback] Incrementando bandwidth: ${fileSize} bytes para usuario ${userId}`);
		await incrementBandwidthUsage(userId, fileSize);
		return res.json({ 
			success: true, 
			bandwidthUsed: fileSize,
			message: 'Ancho de banda registrado'
		});
	} catch (error) {
		console.error('Error registrando playback:', error.message);
		return res.status(500).json({ error: 'Error al registrar reproducción' });
	}
});

// PUT /api/triggers/:id/tts
router.put('/:id/tts', async (req, res) => {
	try {
		const { ttsConfig } = req.body;
		const trigger = await Trigger.findByIdAndUpdate(
			req.params.id,
			{ ttsConfig },
			{ new: true }
		);
		if (!trigger) {
			return res.status(404).json({ error: 'Trigger no encontrado' });
		}
		res.json({ success: true, trigger });
	} catch (error) {
		console.error('Error actualizando TTS config:', error);
		res.status(500).json({ error: 'Error al actualizar configuración TTS' });
	}
});

export default router;
