import { db } from './lib/firebaseAdmin.js';
import { verifyAuth } from './lib/authMiddleware.js';

export default async function handler(req, res) {
  // 1. Verificamos que la solicitud sea GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  // 2. Extraemos el ID y la COLECCIÓN de la URL (?id=...&coleccion=...)
  // El portal ahora le dice a la API exactamente en qué "cajón" buscar
  const { id, coleccion } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'El ID del reporte es requerido.' });
  }

  try {
    // 3. SEGURIDAD: Verificamos la sesión del profesional antes de mostrar datos sensibles
    verifyAuth(req);

    // 4. Determinamos la colección. 
    // Si por algún motivo no llega la colección, usamos 'reportes-personales' por defecto
    const nombreColeccion = coleccion || 'reportes-personales';

    // 5. Buscamos el documento en la colección específica
    const docRef = db.collection(nombreColeccion).doc(id);
    const doc = await docRef.get();

    // 6. Si no existe, devolvemos error 404 con detalle de la colección buscada
    if (!doc.exists) {
      return res.status(404).json({ message: `Reporte no encontrado en la colección ${nombreColeccion}.` });
    }

    // 7. Extraemos la información completa
    const data = doc.data();

    // 8. Tratamiento de fecha para que sea compatible con el frontend (ISO String)
    let fechaISO = null;
    if (data.timestamp && typeof data.timestamp.toDate === 'function') {
      fechaISO = data.timestamp.toDate().toISOString();
    } else if (data.fecha && typeof data.fecha.toDate === 'function') {
       fechaISO = data.fecha.toDate().toISOString();
    } else if (data.fecha) {
      fechaISO = data.fecha;
    }

    // 9. RESPUESTA COMPLETA (Estructura adoptada de tu versión anterior)
    // Devolvemos el ID, la colección de origen y TODO el contenido del documento (...data)
    const responseData = {
      id: doc.id,
      coleccion: nombreColeccion,
      ...data, 
      fecha: fechaISO
    };

    // Enviamos el paquete de datos listo para rdpvper.html o reporte-personal.html
    res.status(200).json(responseData);

  } catch (error) {
    console.error(`Error al obtener reporte ${id}:`, error.message);
    
    // Si el error es de autenticación, avisamos para redirigir al login
    if (error.message.includes('Token')) {
      return res.status(401).json({ message: 'Sesión expirada o inválida.' });
    }

    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}
