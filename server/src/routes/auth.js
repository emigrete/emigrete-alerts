import express from 'express';
import axios from 'axios';
import { UserToken } from '../models/UserToken.js';
// IMPORTANTE: Importamos la función que arranca el listener
import { startTwitchListener } from '../services/twitchListener.js'; 

const router = express.Router();

router.post('/twitch/callback', async (req, res) => {
  const { code } = req.body;
  
  if (!code) return res.status(400).json({ error: 'Falta el código' });

  try {
    console.log("🔄 Intercambiando código por token con Twitch...");

    // 1. Canjear código por tokens
    const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
            client_id: process.env.TWITCH_CLIENT_ID,
            client_secret: process.env.TWITCH_CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: 'http://localhost:5173/auth-callback'
        }
    });

    // --- EL CHISMOSO: VERIFICAMOS PERMISOS ---
    console.log("👀 SCOPES RECIBIDOS DE TWITCH:", tokenResponse.data.scope);
    // ----------------------------------------

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // 2. Obtener datos del usuario
    const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
        headers: {
            'Client-ID': process.env.TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${access_token}`
        }
    });

    const userData = userResponse.data.data[0];
    const userId = userData.id;

    // 3. Guardar en MongoDB
    await UserToken.findOneAndUpdate(
        { userId },
        {
            userId,
            username: userData.login,
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresIn: expires_in,
            obtainmentTimestamp: Date.now(),
            scope: tokenResponse.data.scope
        },
        { upsert: true, new: true }
    );

    console.log(`✅ ¡Login Exitoso! Usuario: ${userData.display_name} (${userId})`);

    // 4. Arrancar el listener inmediatamente
    try {
        await startTwitchListener(userId); 
        console.log("🎧 Listener invocado correctamente.");
    } catch (listenerError) {
        console.error("⚠️ Error al arrancar listener:", listenerError.message);
    }
    
    res.json({ success: true, userId, name: userData.display_name });

  } catch (error) {
    console.error("❌ Error en Auth:", error.response?.data || error.message);
    res.status(500).json({ error: 'Falló la autenticación con Twitch' });
  }
});

export default router;