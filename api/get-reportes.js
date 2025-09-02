import { db } from './lib/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const snapshot = await db.collection('reportes-personales').orderBy('fecha', 'desc').get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const reportes = snapshot.docs.map(doc => {
      const data = doc.data();

      let fechaISO;
      if (data.fecha && typeof data.fecha.toDate === 'function') {
        fechaISO = data.fecha.toDate().toISOString();
      } else if (typeof data.fecha === 'string') {
        fechaISO = data.fecha;
      } else {
        fechaISO = null;
      }

      return {
        id: doc.id,
        demograficos: data.demograficos,
        fecha: fechaISO,
      };
    });

    res.status(200).json(reportes);
  } catch (error) {
    console.error("Error al obtener reportes:", error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
}
