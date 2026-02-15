import { db } from '..api/lib/firebaseAdmin.js';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

export default async function handler(req, res) {
    // 1. Solo permitimos GET (lectura)
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    // 2. Extraemos el ID que queremos leer
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ message: 'Se requiere el ID del reporte.' });
    }

    try {
        // 3. SEGURIDAD: Verificamos el "Pase de Acceso" (Cookie)
        // Solo un terapeuta logueado debería poder leer reportes ajenos completos desde el portal
        const cookies = cookie.parse(req.headers.cookie || '');
        const token = cookies.authToken;

        if (!token) {
            return res.status(401).json({ message: 'No autorizado. Debe iniciar sesión.' });
        }

        try {
            jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Sesión inválida o expirada.' });
        }

        // 4. CONSULTA A LA BÓVEDA
        // Buscamos el documento específico por su ID
        const docRef = db.collection('reportes_personal').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Reporte no encontrado.' });
        }

        const data = doc.data();

        // 5. RESPUESTA LIMPIA
        // Formateamos la fecha si es necesario, o enviamos todo el objeto data
        const reporte = {
            id: doc.id,
            ...data,
            // Aseguramos que la fecha sea legible si viene como objeto Timestamp de Firestore
            fechaLegible: data.timestamp ? data.timestamp.toDate().toLocaleString('es-CO') : 'Fecha desconocida'
        };

        return res.status(200).json(reporte);

    } catch (error) {
        console.error(`Error al obtener reporte individual ${id}:`, error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
}
