import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import rateLimit from 'express-rate-limit';

import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

import apiRoutes from './routes/api.js';
import authRoutes from './routes/auth.js';
import { Trigger } from './models/Trigger.js';
import { startTwitchListener } from './services/twitchListener.js';
import { UserToken } from './models/UserToken.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// ✅ CORS correcto para prod
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
}));

app.use(express.json());

// ✅ Socket.IO con origin correcto
export const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// Rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas peticiones desde esta IP, intentá más tarde.'
});

app.use('/api', limiter);
app.use('/upload', limiter);

// Health check
app.get('/', (req, res) => res.status(200).send('OK'));

// Firebase (service account por env)
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.error('❌ Falta FIREBASE_SERVICE_ACCOUNT_JSON');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'triggerapp-dd86c.firebasestorage.app'
});

const bucket = getStorage().bucket();

// Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Rutas
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Upload video
app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
    if (!req.body.twitchRewardId) return res.status(400).json({ error: 'Falta el twitchRewardId' });
    if (!req.body.userId) return res.status(400).json({ error: 'Falta el userId' });

    const fileName = `triggers/${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(fileName);

    const stream = file.createWriteStream({
      metadata: { contentType: req.file.mimetype }
    });

    stream.on('error', (e) => res.status(500).json({ error: e.message }));

    stream.on('finish', async () => {
      try {
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        const trigger = await Trigger.findOneAndUpdate(
          { twitchRewardId: req.body.twitchRewardId, userId: req.body.userId },
          {
            videoUrl: publicUrl,
            fileName,
            twitchRewardId: req.body.twitchRewardId,
            userId: req.body.userId
          },
          { new: true, upsert: true }
        );

        res.json({ status: 'success', trigger });
      } catch {
        res.status(500).json({ error: 'Error al guardar en BD' });
      }
    });

    stream.end(req.file.buffer);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test manual
app.post('/test-trigger', async (req, res) => {
  const { twitchRewardId, userId } = req.body;

  if (!twitchRewardId || !userId) {
    return res.status(400).json({ error: 'Faltan twitchRewardId o userId' });
  }

  const trigger = await Trigger.findOne({ twitchRewardId, userId });
  if (!trigger) return res.status(404).json({ error: 'Alerta no encontrada.' });

  io.to(`overlay-${userId}`).emit('media-trigger', {
    url: trigger.videoUrl,
    type: 'video',
    volume: 1.0,
    rewardId: twitchRewardId
  });

  res.json({ success: true });
});

// Sockets
io.on('connection', (socket) => {
  socket.on('join-overlay', (userId) => {
    if (userId) socket.join(`overlay-${userId}`);
  });
});

// Restore listeners
async function restoreListeners() {
  console.log('🔄 Restaurando listeners de Twitch...');
  const users = await UserToken.find({});
  for (const user of users) {
    startTwitchListener(user.userId).catch(e =>
      console.error(`Error listener ${user.userId}`, e)
    );
  }
}

// Server first (Railway)
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server corriendo en puerto ${PORT}`);
});

// Mongo
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Falta MONGO_URI');
} else {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('✅ Mongo conectado');
      restoreListeners();
    })
    .catch(err => console.error('❌ Error conectando a Mongo:', err));
}

export default app;
