import axios from 'axios';
import { UserToken } from '../models/UserToken.js';

const EXPIRY_SAFETY_WINDOW_MS = 60 * 1000;

const isTokenExpired = (tokenData) => {
  if (!tokenData?.accessToken || !tokenData?.expiresIn || !tokenData?.obtainmentTimestamp) {
    return true;
  }

  const expiresAt = tokenData.obtainmentTimestamp + (tokenData.expiresIn * 1000);
  return Date.now() >= (expiresAt - EXPIRY_SAFETY_WINDOW_MS);
};

export const getValidAccessToken = async (userId) => {
  const tokenData = await UserToken.findOne({ userId });
  if (!tokenData) {
    throw new Error('Usuario no encontrado');
  }

  if (!isTokenExpired(tokenData)) {
    return tokenData.accessToken;
  }

  if (!tokenData.refreshToken) {
    throw new Error('Refresh token no disponible');
  }

  const tokenResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
    params: {
      grant_type: 'refresh_token',
      refresh_token: tokenData.refreshToken,
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET
    }
  });

  const { access_token, refresh_token, expires_in, scope } = tokenResponse.data;

  await UserToken.findOneAndUpdate(
    { userId },
    {
      accessToken: access_token,
      refreshToken: refresh_token || tokenData.refreshToken,
      expiresIn: expires_in,
      obtainmentTimestamp: Date.now(),
      scope
    }
  );

  return access_token;
};
