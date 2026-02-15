import { db } from './lib/firebaseAdmin.js'; 
import { verifyAuth } from './lib/authMiddleware.js';

export default async function handler(req, res) {
    // 1. Solo permitimos el método GET
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido. Use GET.' });
    }

    // 2. Extraemos el ID y la coleccion de la URL
    const { id, coleccion } = req.query;

    if (!id) {
        return res.status(400).json({ message: 'El ID del reporte es obligatorio.' });
    }

    try {
        // 3. SEGURIDAD: Verificar sesión del terapeuta
        verifyAuth(req);

        // 4. Determinar la colección de búsqueda
        // Si no se especifica, por defecto buscamos en 'reportes-personales'
        const nombreColeccion = coleccion || 'reportes-personales';

        // 5. Consulta a Firestore
        const doc = await db.collection(nombreColeccion).doc(id).get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'El reporte no existe en la colección especificada.' });
        }

        const data = doc.data();

        // 6. Respuesta enriquecida para el frontend
        return res.status(200).json({
            id: doc.id,
            coleccion: nombreColeccion,
            ...data,
            // Aseguramos formato de fecha legible si no existe
            fechaLegible: data.fecha || (data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : 'Sin fecha')
        });

    } catch (error) {
        console.error("Error al obtener detalle del reporte:", error.message);
        
        if (error.message.includes('Token')) {
            return res.status(401).json({ message: 'Sesión expirada. Inicie sesión nuevamente.' });
        }

        return res.status(500).json({ message: 'Error interno al leer la base de datos.' });
    }
}
