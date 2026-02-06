import express from 'express';
import axios from 'axios';
import { UserToken } from '../models/UserToken.js';
import { startTwitchListener } from '../services/twitchListener.js';

const router = express.Router();

/**
 * INICIO LOGIN
 * GET /auth/twitch
 */
router.get('/twitch', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID,
    redirect_uri: process.env.TWITCH_REDIRECT_URI,
    response_type: 'code',
    scope: 'channel:read:redemptions channel:manage:redemptions',
    force_verify: 'true',
  });

  res.redirect(`https://id.twitch.tv/oauth2/authorize?${params.toString()}`);
});

/**
 * CALLBACK
 * GET /auth/twitch/callback?code=XXX
 */
router.get('/twitch/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Falta el código de Twitch' });
  }

  try {
    // 1) code -> token
    const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TWITCH_REDIRECT_URI,
      },
    });

    const { access_token, refresh_token, expires_in, scope } = tokenResponse.data;

    // 2) user info
    const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${access_token}`,
      },
    });

    const userData = userResponse.data.data[0];
    const userId = userData.id;

    console.log(`🔑 [AUTH] Login exitoso: userId=${userId}, username=${userData.login}, display_name=${userData.display_name}`);

    // 3) save in mongo
    await UserToken.findOneAndUpdate(
      { userId },
      {
        userId,
        username: userData.login,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in,
        obtainmentTimestamp: Date.now(),
        scope,
      },
      { upsert: true, new: true }
    );

    // 4) start listener
    try {
      await startTwitchListener(userId);
      console.log(`🎧 Listener iniciado para ${userId}`);
    } catch (e) {
      console.error('⚠️ Error listener:', e.message);
    }

    // ✅ REDIRECT FINAL AL FRONT
    const front = process.env.FRONTEND_URL;
    if (!front) {
      return res.send(`Login OK. Usuario ${userData.display_name}`);
    }

    return res.redirect(
      `${front}/auth/callback?userId=${encodeURIComponent(userId)}&username=${encodeURIComponent(userData.login)}`
    );

  } catch (error) {
    console.error('❌ Error OAuth Twitch:', error.response?.data || error.message);
    res.status(500).json({ error: 'Falló autenticación con Twitch' });
  }
});

export default router;
