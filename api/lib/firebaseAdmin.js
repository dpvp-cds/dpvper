import admin from 'firebase-admin';
import { Buffer } from 'buffer';

// Variable para almacenar la instancia de la base de datos
let db;

function initializeFirebaseAdmin() {
    // 1. Patrón Singleton: Si ya existe una app, la reutilizamos (Evita errores en Vercel)
    if (admin.apps.length > 0) {
        return admin.firestore();
    }

    // 2. Leemos la llave maestra encriptada (Base64) de las variables de entorno
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

    if (!serviceAccountBase64) {
        // Fallback de seguridad: Intenta leer llave privada normal si no hay Base64 (útil para pruebas)
        if (process.env.FIREBASE_PRIVATE_KEY) {
            try {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    }),
                });
                return admin.firestore();
            } catch (e) {
                console.error("Error iniciando con variables individuales:", e);
            }
        }
        
        console.error("CRITICAL: FIREBASE_SERVICE_ACCOUNT_BASE64 no definida.");
        throw new Error('Configuración de Firebase incompleta.');
    }
    
    try {
        // 3. Decodificamos la llave maestra
        const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
        const serviceAccount = JSON.parse(serviceAccountJson);

        // 4. Inicializamos Firebase Admin
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log("Firebase Admin conectado exitosamente.");
        return admin.firestore();

    } catch (error) {
        console.error("Error fatal en conexión Firebase:", error);
        throw new Error('Error de autenticación con Firebase.');
    }
}

// Inicializamos y exportamos la instancia lista para usar
db = initializeFirebaseAdmin();

export { db };
