import admin from 'firebase-admin';
import { createRequire } from 'module';

// Necesario para importar JSON en modo "Module"
const require = createRequire(import.meta.url);

let serviceAccount;

try {
    if (process.env.FIREBASE_CREDENTIALS) {

        console.log("☁️ Detectado entorno Cloud: Leyendo credenciales desde variable...");
        const buffer = Buffer.from(process.env.FIREBASE_CREDENTIALS, 'base64');
        serviceAccount = JSON.parse(buffer.toString('utf8'));
    } else {

        console.log("🏠 Detectado entorno Local: Leyendo serviceAccountKey.json...");
        serviceAccount = require('../../serviceAccountKey.json');
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
        // Si usaras Storage, acá iría: storageBucket: "tu-app.appspot.com"
    });

    console.log("✅ Firebase inicializado correctamente.");

} catch (error) {
    console.error("🔥 Error CRÍTICO inicializando Firebase:", error.message);
    console.error("Asegurate de que FIREBASE_CREDENTIALS esté cargada en Railway o que el archivo exista en local.");
}

export const db = admin.firestore();
export const storage = admin.storage();
export default admin;