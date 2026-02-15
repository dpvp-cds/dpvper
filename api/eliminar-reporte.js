import { db } from './lib/firebaseAdmin.js'; // Ruta corregida: ./lib
import { verifyAuth } from './lib/authMiddleware.js'; // Ruta corregida: ./lib

export default async function handler(req, res) {
    // 1. Solo permitimos el método DELETE
    if (req.method !== 'DELETE') {
        return res.status(405).json({ message: 'Método no permitido. Use DELETE.' });
    }

    // 2. Obtenemos el ID del reporte a eliminar desde la query string (?id=...)
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ message: 'El ID del reporte es requerido.' });
    }

    try {
        // 3. SEGURIDAD: Verificamos que sea un terapeuta logueado
        // Si el token no es válido, verifyAuth lanzará un error y saltará al catch
        verifyAuth(req);

        // 4. BORRADO: Eliminamos el documento de la colección 'reportes_personal'
        // Usamos la referencia al documento específico
        const docRef = db.collection('reportes-personal').doc(id);
        const docRef = db.collection('reportes_dpvper').doc(id);
        
        // Verificamos si existe antes de intentar borrarlo (opcional, pero buena práctica)
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'El reporte no existe o ya fue eliminado.' });
        }

        // Ejecutamos el borrado
        await docRef.delete();
        
        console.log(`Reporte ${id} eliminado correctamente por el terapeuta.`);
        
        // 5. Respuesta de éxito
        return res.status(200).json({ message: 'Reporte eliminado con éxito.' });

    } catch (error) {
        console.error(`Error al eliminar reporte ${id}:`, error);

        // Manejo específico de errores de autenticación
        if (error.message === 'Token de autenticación no encontrado.' || error.message === 'Token inválido o expirado.') {
            return res.status(401).json({ message: 'No autorizado. Su sesión ha expirado.' });
        }

        // Error genérico del servidor
        return res.status(500).json({ message: 'Error interno del servidor al eliminar el reporte.' });
    }
}
