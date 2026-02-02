import { RefreshingAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import { EventSubWsListener } from '@twurple/eventsub-ws';
import { UserToken } from '../models/UserToken.js';
import { Trigger } from '../models/Trigger.js';
import { io } from '../index.js';

const activeListeners = new Map();

export async function startTwitchListener(userId) {
    if (activeListeners.has(userId)) {
        console.log(`⚠️ Ya existe un listener activo para ${userId}`);
        return;
    }

    console.log(`🎧 Iniciando listener para ${userId}...`);

    // 1. Buscar tokens en la DB
    const tokenData = await UserToken.findOne({ userId });

    if (!tokenData) {
        console.error(`❌ No hay tokens para el usuario ${userId}`);
        return;
    }

    // --- SANITIZACIÓN DE DATOS (EL FIX CLAVE) ---
    // Convertimos el objeto Mongoose a un objeto JS puro para que Twurple no se queje
    const plainToken = {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresIn: tokenData.expiresIn,
        obtainmentTimestamp: tokenData.obtainmentTimestamp,
        // Forzamos que scope sea un Array de Strings puro de JS
        scope: Array.from(tokenData.scope || []) 
    };

    console.log("🔍 SCOPES PUROS PARA TWURPLE:", plainToken.scope);
    // --------------------------------------------

    // 2. Configurar Auth Provider
    const authProvider = new RefreshingAuthProvider({
        clientId: process.env.TWITCH_CLIENT_ID,
        clientSecret: process.env.TWITCH_CLIENT_SECRET
    });

    authProvider.onRefresh(async (userId, newTokenData) => {
        await UserToken.findOneAndUpdate(
            { userId },
            {
                accessToken: newTokenData.accessToken,
                refreshToken: newTokenData.refreshToken,
                expiresIn: newTokenData.expiresIn,
                obtainmentTimestamp: newTokenData.obtainmentTimestamp,
                scope: newTokenData.scope // Guardamos los nuevos scopes si cambian
            }
        );
        console.log(`♻️ Tokens renovados para ${userId}`);
    });

    // Cargamos los datos sanitizados
    authProvider.addUser(userId, plainToken);

    // 3. Crear Cliente y Listener
    const apiClient = new ApiClient({ authProvider });
    const listener = new EventSubWsListener({ apiClient });
    
    listener.start();
    
    // 4. Suscribirse al evento
    try {
        await listener.onChannelRedemptionAdd(userId, async (event) => {
            console.log(`🎁 Canje detectado: ${event.rewardTitle} (ID: ${event.rewardId})`);

            const trigger = await Trigger.findOne({ twitchRewardId: event.rewardId });

            if (trigger) {
                console.log(`🎬 ¡Disparando alerta: ${trigger.fileName}!`);
                io.to(`overlay-${userId}`).emit('media-trigger', {
                    url: trigger.videoUrl,
                    type: 'video',
                    volume: 1.0,
                    rewardId: event.rewardId
                });
            } else {
                console.log(`⚠️ Alerta no configurada para ID: ${event.rewardId}`);
            }
        });

        activeListeners.set(userId, listener);
        console.log(`✅ ¡Escuchando eventos de ${tokenData.username}!`);

    } catch (err) {
        console.error("❌ Error FATAL suscribiendo al evento:", err);
    }
}