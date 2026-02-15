import { db } from './lib/firebaseAdmin.js'; 
import { verifyAuth } from './lib/authMiddleware.js'; 

export default async function handler(req, res) {
    // 1. Verificamos que el método sea GET (Lectura)
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido. Use GET.' });
    }

    // 2. Obtenemos el ID desde la URL (?id=...)
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ message: 'El ID del reporte es requerido.' });
    }

    try {
        // 3. SEGURIDAD: Verificamos que sea un terapeuta logueado
        // Si el token no es válido, verifyAuth lanzará un error.
        verifyAuth(req);

        // 4. LECTURA: Buscamos el documento en Firestore
        // Usamos la colección 'reportes_personal' consistente con los otros archivos
        const docRef = db.collection('reportes_personal').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Reporte no encontrado.' });
        }

        const data = doc.data();

        // 5. Formateo de fecha para que sea legible en el frontend
        let fechaLegible = 'Fecha desconocida';
        if (data.timestamp && typeof data.timestamp.toDate === 'function') {
            // Si es un Timestamp de Firestore
            fechaLegible = data.timestamp.toDate().toLocaleString('es-CO');
        } else if (data.fecha) {
            // Si es un string ISO
            fechaLegible = new Date(data.fecha).toLocaleString('es-CO');
        }

        // 6. Enviamos el reporte completo
        const reporte = {
            id: doc.id,
            ...data,
            fechaLegible
        };

        return res.status(200).json(reporte);

    } catch (error) {
        console.error(`Error al obtener reporte ${id}:`, error);

        // Manejo específico de errores de autenticación del middleware
        if (error.message === 'Token de autenticación no encontrado.' || error.message === 'Token inválido o expirado.') {
            return res.status(401).json({ message: 'No autorizado. Su sesión ha expirado.' });
        }

        // Error genérico del servidor
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
}
