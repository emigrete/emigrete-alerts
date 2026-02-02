import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { createRequire } from 'module'; 
import rateLimit from 'express-rate-limit';

// IMPORTAMOS RUTAS Y MODELOS
import apiRoutes from './routes/api.js';
import authRoutes from './routes/auth.js';
import { Trigger } from './models/Trigger.js';
import { startTwitchListener } from './services/twitchListener.js';
import { UserToken } from './models/UserToken.js';

// --- CONFIGURACIÓN ---
dotenv.config();
const require = createRequire(import.meta.url);

const app = express();
const httpServer = createServer(app);

// --- SOCKET.IO ---
export const io = new Server(httpServer, { 
  cors: { 
    origin: "*", // En producción cambiar por tu dominio real
    methods: ["GET", "POST"]
  } 
}); 

// --- MIDDLEWARES DE SEGURIDAD ---
app.use(cors()); 
app.use(express.json());

// Limitador de peticiones (Rate Limit)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: "Demasiadas peticiones desde esta IP, intentá más tarde."
});

app.use('/api', limiter);
app.use('/upload', limiter);

// --- FIREBASE CONFIG (MODO HÍBRIDO: LOCAL vs NUBE) ---
let serviceAccount;

if (process.env.FIREBASE_CREDENTIALS) {
    // 1. MODO PRODUCCIÓN (Railway/Docker): Leemos la variable de entorno Base64
    console.log("🔥 Cargando credenciales de Firebase desde ENV (Base64)");
    const buffer = Buffer.from(process.env.FIREBASE_CREDENTIALS, 'base64');
    serviceAccount = JSON.parse(buffer.toString('utf-8'));
} else {
    // 2. MODO DESARROLLO (Local): Leemos el archivo físico
    try {
        console.log("📂 Cargando credenciales de Firebase desde archivo local");
        serviceAccount = require('../serviceAccountKey.json');
    } catch (error) {
        console.error("❌ ERROR CRÍTICO: No se encontraron credenciales de Firebase.");
        console.error("   - Asegurate de tener 'serviceAccountKey.json' en local.");
        console.error("   - O la variable 'FIREBASE_CREDENTIALS' en producción.");
    }
}

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'triggerapp-dd86c.firebasestorage.app' // Tu bucket
});

const bucket = getStorage().bucket();

// --- MULTER ---
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// --- RUTAS ---
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Subida de Archivos
app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
    if (!req.body.twitchRewardId) return res.status(400).json({ error: 'Falta el twitchRewardId' });
    if (!req.body.userId) return res.status(400).json({ error: 'Falta el userId' });

    console.log(`Subiendo archivo para ${req.body.userId}...`);

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
            { twitchRewardId: req.body.twitchRewardId }, 
            { 
                videoUrl: publicUrl,
                fileName: fileName,
                twitchRewardId: req.body.twitchRewardId,
                userId: req.body.userId 
            },
            { new: true, upsert: true } 
        );
        
        console.log("✅ Trigger guardado:", trigger.fileName);
        res.json({ status: 'success', trigger });
      } catch (dbError) {
        res.status(500).json({ error: 'Error al guardar en BD' });
      }
    });

    stream.end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Testeo Manual (Multi-Tenant)
app.post('/test-trigger', async (req, res) => {
  const { twitchRewardId, userId } = req.body;
  
  const trigger = await Trigger.findOne({ twitchRewardId, userId });
  
  if (!trigger) return res.status(404).json({ error: 'Alerta no encontrada para este usuario.' });

  console.log(`🧪 Testeando trigger para ${userId}`);

  io.to(`overlay-${userId}`).emit('media-trigger', {
      url: trigger.videoUrl,
      type: 'video',
      volume: 1.0,
      rewardId: twitchRewardId
  });

  res.json({ success: true, message: 'Evento enviado' });
});

// --- SOCKETS ---
io.on('connection', (socket) => {
  console.log('Cliente conectado al Socket', socket.id);
  socket.on('join-overlay', (userId) => {
      if(userId) {
        socket.join(`overlay-${userId}`);
        console.log(`Socket ${socket.id} -> overlay-${userId}`);
      }
  });
});

// --- RESTORE LISTENERS ---
async function restoreListeners() {
    console.log("🔄 Restaurando listeners de Twitch...");
    const users = await UserToken.find({});
    for (const user of users) {
        startTwitchListener(user.userId).catch(e => console.error(`Error listener ${user.userId}`, e));
    }
}

// --- DB & SERVER START ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:password123@localhost:27017/triggerapp?authSource=admin';

mongoose.connect(MONGO_URI)
  .then(() => {
    httpServer.listen(3000, () => {
        console.log('🚀 Server Cloud-Native corriendo en puerto 3000');
        restoreListeners(); 
    });
  })
  .catch(err => console.error('❌ Error conectando a Mongo:', err));