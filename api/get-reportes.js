import { db } from './lib/firebaseAdmin.js'; 
import { verifyAuth } from './lib/authMiddleware.js';

export default async function handler(req, res) {
    // 1. Solo permitimos el método GET (Lectura)
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido. Use GET.' });
    }

    try {
        // 2. SEGURIDAD: El guardián verifica la cookie
        // Si no hay sesión válida, esto lanza un error y salta al catch
        verifyAuth(req);

        // 3. CONSULTA A LA BÓVEDA
        // Traemos todos los reportes ordenados por fecha
        const snapshot = await db.collection('reportes_personal')
            .orderBy('timestamp', 'desc')
            .get();

        // Si no hay nada, devolvemos array vacío
        if (snapshot.empty) {
            return res.status(200).json({ reportes: [] });
        }

        // 4. PREPARAR DATOS (Mapeo)
        // Convertimos los documentos complejos de Firebase en objetos JSON simples para el frontend
        const reportes = snapshot.docs.map(doc => {
            const data = doc.data();
            
            // Manejo seguro de fechas (Firestore Timestamp -> String)
            let fechaLegible = 'Fecha desconocida';
            if (data.timestamp && typeof data.timestamp.toDate === 'function') {
                fechaLegible = data.timestamp.toDate().toISOString(); 
            } else if (data.fecha) {
                fechaLegible = data.fecha;
            }

            return {
                id: doc.id,
                nombre: data.demograficos?.nombre || 'Anónimo',
                fecha: fechaLegible,
                arquetipo: data.arquetipoDominante || 'Procesando...'
            };
        });

        // 5. ENVIAR RESPUESTA
        return res.status(200).json({ reportes });

    } catch (error) {
        console.error("Error al obtener lista de reportes:", error);

        // Manejo de errores de autenticación específicos del middleware
        if (error.message.includes('Token')) {
            return res.status(401).json({ message: 'Sesión expirada o inválida. Por favor ingrese nuevamente.' });
        }

        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
}
