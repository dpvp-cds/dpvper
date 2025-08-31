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
    if (req.method !== 'DELETE') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    // NOTA DE SEGURIDAD: En un entorno de producción real, aquí deberías
    // verificar un token de autenticación para asegurar que solo los
    // terapeutas autorizados puedan eliminar reportes.
    
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ message: 'ID de reporte es requerido.' });
    }

    try {
        initializeFirebaseAdmin();
        const db = admin.firestore();
        
        const docRef = db.collection('reportes_dpvper').doc(id);
        await docRef.delete();
        
        res.status(200).json({ message: 'Reporte eliminado con éxito.' });

    } catch (error) {
        console.error(`Error al eliminar reporte ${id}:`, error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}
