import { db } from './lib/firebaseAdmin.js';
import { verifyAuth } from './lib/authMiddleware.js';

export default async function handler(req, res) {
  // 1. Solo permitimos GET (Lectura)
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  // 2. Extraemos el ID y la COLECCIÓN de la URL (?id=...&coleccion=...)
  const { id, coleccion } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'El ID del reporte es requerido.' });
  }

  try {
    // 3. SEGURIDAD: Verificar sesión del terapeuta
    verifyAuth(req);

    // 4. Determinar en qué tabla buscar
    // Si no se especifica, por defecto usamos 'reportes-personales'
    const nombreColeccion = coleccion || 'reportes-personales';

    // 5. Consulta a Firestore
    const docRef = db.collection(nombreColeccion).doc(id);
    const doc = await docRef.get();

    // 6. Si no existe, error 404
    if (!doc.exists) {
      return res.status(404).json({ message: `Reporte no encontrado en la colección ${nombreColeccion}.` });
    }

    const data = doc.data();

    // 7. TRATAMIENTO DE FECHA (Tu lógica original)
    // Convertimos el Timestamp de Firebase a un formato ISO que el navegador entienda
    let fechaISO = null;
    if (data.timestamp && typeof data.timestamp.toDate === 'function') {
      fechaISO = data.timestamp.toDate().toISOString();
    } else if (data.fecha) {
      fechaISO = data.fecha;
    }

    // 8. RESPUESTA COMPLETA
    // Devolvemos todo el objeto (...data) para que rdpvper.html vea todos los campos
    const responseData = {
      id: doc.id,
      coleccion: nombreColeccion,
      ...data, // Aquí van demográficos, resultados del radar, respuestas, etc.
      fecha: fechaISO
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error(`Error al obtener reporte ${id}:`, error.message);
    
    // Manejo de error de sesión expirada
    if (error.message.includes('Token')) {
      return res.status(401).json({ message: 'Sesión expirada o inválida.' });
    }

    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}
