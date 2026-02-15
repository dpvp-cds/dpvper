import { db } from './lib/firebaseAdmin.js'; 
import { verifyAuth } from './lib/authMiddleware.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        // 1. Verificamos la sesión del terapeuta
        verifyAuth(req);

        // 2. Buscamos directamente en la colección raíz
        const snapshot = await db.collection('reportes_personal')
            .orderBy('timestamp', 'desc')
            .get();

        if (snapshot.empty) {
            return res.status(200).json({ reportes: [] });
        }

        const reportes = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                nombre: data.demograficos?.nombre || 'Anónimo',
                fecha: data.fecha || 'Sin fecha',
                arquetipo: data.arquetipoDominante || 'N/A'
            };
        });

        return res.status(200).json({ reportes });

    } catch (error) {
        console.error("Error en get-reportes:", error.message);
        return res.status(401).json({ message: 'Sesión inválida o expirada.' });
    }
}
