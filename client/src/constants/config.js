export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const COLORS = {
  bg: '#09090b',
  card: '#18181b',
  primary: '#9146FF',
  text: '#e4e4e7',
  textMuted: '#a1a1aa',
  danger: '#ef4444',
  success: '#22c55e',
  border: '#27272a',
  stepBg: '#27272a',
  cafecito: '#0ec2c2',
  paypal: '#0070ba'
};

export const FILE_CONFIG = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ACCEPTED_TYPES: 'video/mp4,video/webm'
};

export const STEP_GUIDES = [
  {
    id: 1,
    title: 'Crea tu canje',
    description: 'Anda a tu panel de Twitch y crea una recompensa nueva.'
  },
  {
    id: 2,
    title: 'Vincula el video',
    description: 'Elegi la recompensa abajo y subi tu archivo de video.'
  },
  {
    id: 3,
    title: 'Configura OBS',
    description: 'Copia el link para OBS y ponelo como Fuente de Navegador.'
  },
  {
    id: 4,
    title: '¡A disfrutar!',
    description: 'Probalo en el chat. Funciona al instante!'
  }
];
