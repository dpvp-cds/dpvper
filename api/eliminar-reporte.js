import { db } from './lib/firebaseAdmin.js'; 
import { verifyAuth } from './lib/authMiddleware.js';

export default async function handler(req, res) {
    // 1. Solo permitimos el método DELETE
    if (req.method !== 'DELETE') {
        return res.status(405).json({ message: 'Método no permitido. Use DELETE.' });
    }

    // 2. Extraemos ID y Colección de los parámetros de la URL
    const { id, coleccion } = req.query;

    if (!id || !coleccion) {
        return res.status(400).json({ message: 'El ID y la colección son obligatorios para eliminar.' });
    }

    try {
        // 3. SEGURIDAD: Verificar sesión del terapeuta
        verifyAuth(req);

        // 4. Ejecutar el borrado en Firestore
        // Buscamos específicamente en la colección indicada por el portal
        await db.collection(coleccion).doc(id).delete();

        // 5. Confirmar éxito
        console.log(`Reporte ${id} eliminado con éxito de la colección ${coleccion}.`);
        
        return res.status(200).json({ 
            success: true, 
            message: 'El registro ha sido eliminado permanentemente de la base de datos.' 
        });

    } catch (error) {
        console.error("Error al eliminar el reporte:", error.message);

        // Manejo de errores de autenticación
        if (error.message.includes('Token')) {
            return res.status(401).json({ message: 'Sesión inválida. Acceso denegado.' });
        }

        return res.status(500).json({ message: 'Error interno al intentar eliminar el registro.' });
    }
}
