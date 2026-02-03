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
const firebaseJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_CREDENTIALS;

if (!firebaseJson) {
  console.error('❌ Falta FIREBASE_SERVICE_ACCOUNT_JSON o FIREBASE_CREDENTIALS');
  process.exit(1);
}

let serviceAccount;
try {
  // Si es Base64, decodificar
  if (firebaseJson.length > 100) {
    try {
      serviceAccount = JSON.parse(Buffer.from(firebaseJson, 'base64').toString());
    } catch {
      // Si no es Base64, intentar JSON directo
      serviceAccount = JSON.parse(firebaseJson);
    }
  } else {
    serviceAccount = JSON.parse(firebaseJson);
  }
} catch (e) {
  console.error('❌ Error decodificando Firebase JSON:', e.message);
  process.exit(1);
}

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

// Detectar tipo de media según MIME type
function getMediaType(mimeType) {
  if (mimeType.includes('video')) return 'video';
  if (mimeType.includes('audio')) return 'audio';
  if (mimeType.includes('gif') || mimeType.includes('image')) return 'gif';
  return 'video'; // default
}

// Upload media (video, audio, gif)
app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    console.log('📤 Upload request recibido:', {
      hasFile: !!req.file,
      twitchRewardId: req.body.twitchRewardId,
      userId: req.body.userId,
      fileSize: req.file?.size,
      mimeType: req.file?.mimetype
    });

    if (!req.file) {
      console.error('❌ No se subió archivo');
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }
    if (!req.body.twitchRewardId) {
      console.error('❌ Falta twitchRewardId');
      return res.status(400).json({ error: 'Falta el twitchRewardId' });
    }
    if (!req.body.userId) {
      console.error('❌ Falta userId');
      return res.status(400).json({ error: 'Falta el userId' });
    }

    const mediaType = getMediaType(req.file.mimetype);
    const fileName = `triggers/${mediaType}/${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(fileName);

    console.log('🔥 Subiendo a Firebase:', fileName);

    const stream = file.createWriteStream({
      metadata: { contentType: req.file.mimetype }
    });

    stream.on('error', (e) => {
      console.error('❌ Error en stream Firebase:', e);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error al subir archivo: ' + e.message });
      }
    });

    stream.on('finish', async () => {
      try {
        console.log('✅ Archivo subido, haciendo público...');
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        console.log('🌐 URL pública generada:', publicUrl);

        // Agregar nueva media al array de medias
        console.log('🔍 Buscando trigger existente...');
        const trigger = await Trigger.findOne({
          twitchRewardId: req.body.twitchRewardId,
          userId: req.body.userId
        });

        if (trigger) {
          console.log('📝 Actualizando trigger existente:', trigger._id);
          // Actualizar trigger existente: agregar nueva media
          trigger.medias.push({
            type: mediaType,
            url: publicUrl,
            fileName,
            volume: 1.0
          });
          // Mantener compatibilidad con videoUrl si es video
          if (mediaType === 'video') {
            trigger.videoUrl = publicUrl;
          }
          await trigger.save();
          console.log('✅ Trigger actualizado exitosamente');
          
          if (!res.headersSent) {
            res.json({ 
              status: 'success', 
              trigger,
              media: {
                type: mediaType,
                url: publicUrl
              }
            });
          }
        } else {
          console.log('➕ Creando nuevo trigger...');
          // Crear nuevo trigger
          const newTrigger = await Trigger.create({
            userId: req.body.userId,
            twitchRewardId: req.body.twitchRewardId,
            medias: [{
              type: mediaType,
              url: publicUrl,
              fileName,
              volume: 1.0
            }],
            videoUrl: mediaType === 'video' ? publicUrl : undefined,
            fileName: mediaType === 'video' ? fileName : undefined
          });
          console.log('✅ Nuevo trigger creado:', newTrigger._id);

          if (!res.headersSent) {
            res.json({ 
              status: 'success', 
              trigger: newTrigger,
              media: {
                type: mediaType,
                url: publicUrl
              }
            });
          }
        }
      } catch (error) {
        console.error('❌ Error al guardar en BD:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error al guardar en BD: ' + error.message });
        }
      }
    });

    stream.end(req.file.buffer);

  } catch (error) {
    console.error('❌ Error general en /upload:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
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
