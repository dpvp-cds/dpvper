import { db } from '../lib/firebaseAdmin.js';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

export default async function handler(req, res) {
    // 1. Solo permitimos GET (lectura)
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        // 2. VERIFICACIÓN DE SEGURIDAD (El Portero)
        // Leemos las cookies de la petición
        const cookies = cookie.parse(req.headers.cookie || '');
        const token = cookies.authToken;

        if (!token) {
            return res.status(401).json({ message: 'No autorizado. Por favor inicie sesión.' });
        }

        // Validamos que el token sea auténtico y no haya expirado
        try {
            jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Sesión expirada o inválida.' });
        }

        // 3. CONSULTA A LA BÓVEDA (Firestore)
        // Obtenemos todos los documentos de la colección 'reportes_personal'
        // Ordenados por fecha de creación descendente (los nuevos primero)
        const snapshot = await db.collection('reportes_personal')
            .orderBy('timestamp', 'desc')
            .get();

        if (snapshot.empty) {
            return res.status(200).json({ reportes: [] });
        }

        // 4. Mapeamos los datos para enviarlos limpios al frontend
        const reportes = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                nombre: data.demograficos?.nombre || 'Anónimo',
                fecha: data.fecha || new Date().toISOString(),
                arquetipo: data.arquetipoDominante || 'Pendiente',
                // Puedes agregar más campos resumen si los necesitas en la lista
            };
        });

        // 5. Enviamos la lista
        return res.status(200).json({ reportes });

    } catch (error) {
        console.error("Error al obtener reportes:", error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
}
