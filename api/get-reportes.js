import admin from 'firebase-admin';

function initializeFirebaseAdmin() {
    if (admin.apps.length) return admin.app();
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!serviceAccountBase64) throw new Error('Variable de entorno de Firebase no definida.');
    const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJson);
    return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido' });
    }
    
    // NOTA DE SEGURIDAD: En un entorno de producción real, aquí deberías
    // verificar un token de autenticación (ej. Firebase Auth, JWT) para
    // asegurar que solo los terapeutas autorizados puedan ver los reportes.

    try {
        initializeFirebaseAdmin();
        const db = admin.firestore();
        
        const snapshot = await db.collection('reportes_dpvper').orderBy('fecha', 'desc').get();
        
        if (snapshot.empty) {
            return res.status(200).json([]);
        }
        
        const reportes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        res.status(200).json(reportes);

    } catch (error) {
        console.error("Error al obtener reportes:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}
