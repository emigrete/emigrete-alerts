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

  const tokenData = await UserToken.findOne({ userId });
  if (!tokenData) {
    console.error(`❌ No hay tokens para ${userId}`);
    return;
  }

  const plainToken = {
    accessToken: tokenData.accessToken,
    refreshToken: tokenData.refreshToken,
    expiresIn: tokenData.expiresIn,
    obtainmentTimestamp: tokenData.obtainmentTimestamp,
    scope: Array.from(tokenData.scope || [])
  };

  const authProvider = new RefreshingAuthProvider({
    clientId: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET
  });

  authProvider.onRefresh(async (uid, newTokenData) => {
    await UserToken.findOneAndUpdate(
      { userId: uid },
      {
        accessToken: newTokenData.accessToken,
        refreshToken: newTokenData.refreshToken,
        expiresIn: newTokenData.expiresIn,
        obtainmentTimestamp: newTokenData.obtainmentTimestamp,
        scope: newTokenData.scope
      }
    );
    console.log(`♻️ Tokens renovados para ${uid}`);
  });

  authProvider.addUser(userId, plainToken);

  const apiClient = new ApiClient({ authProvider });
  const listener = new EventSubWsListener({ apiClient });

  listener.start();

  try {
    await listener.onChannelRedemptionAdd(userId, async (event) => {
      console.log(`🎁 Canje: ${event.rewardTitle} (ID: ${event.rewardId})`);

      // ✅ FIX: filtrar por userId también
      const trigger = await Trigger.findOne({
        twitchRewardId: event.rewardId,
        userId
      });

      if (!trigger) {
        console.log(`⚠️ No hay alerta para rewardId=${event.rewardId} userId=${userId}`);
        return;
      }

      console.log(`🎬 Disparando alerta: ${trigger.fileName}`);

      io.to(`overlay-${userId}`).emit('media-trigger', {
        url: trigger.videoUrl,
        type: 'video',
        volume: 1.0,
        rewardId: event.rewardId
      });
    });

    activeListeners.set(userId, listener);
    console.log(`✅ Escuchando eventos de ${tokenData.username}`);

  } catch (err) {
    console.error('❌ Error suscribiendo evento:', err);
  }
}
