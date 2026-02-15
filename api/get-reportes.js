import { db } from './lib/firebaseAdmin.js'; 
import { verifyAuth } from './lib/authMiddleware.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        // 1. Validar seguridad
        verifyAuth(req);

        // 2. Realizar ambas consultas en paralelo para mayor velocidad
        const [snap1, snap2] = await Promise.all([
            db.collection('reportes-personales').get(),
            db.collection('reportes_dpvper').get()
        ]);

        console.log(`Colección 1: ${snap1.size} docs | Colección 2: ${snap2.size} docs`);

        // 3. Procesar resultados de 'reportes-personales'
        const lista1 = snap1.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                coleccion: 'reportes-personales', // Identificador de origen
                nombre: data.demograficos?.nombre || 'Anónimo',
                fecha: data.fecha || 'Sin fecha',
                arquetipo: data.arquetipoDominante || 'N/A',
                timestamp: data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate().getTime() : new Date(data.timestamp).getTime()) : 0
            };
        });

        // 4. Procesar resultados de 'reportes_dpvper'
        const lista2 = snap2.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                coleccion: 'reportes_dpvper', // Identificador de origen
                nombre: data.demograficos?.nombre || 'Anónimo',
                fecha: data.fecha || 'Sin fecha',
                arquetipo: data.arquetipoDominante || 'N/A',
                timestamp: data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate().getTime() : new Date(data.timestamp).getTime()) : 0
            };
        });

        // 5. Unir ambas listas y ordenar por fecha (más reciente primero)
        const reportesUnificados = [...lista1, ...lista2].sort((a, b) => b.timestamp - a.timestamp);

        return res.status(200).json({ reportes: reportesUnificados });

    } catch (error) {
        console.error("Error unificando reportes:", error.message);
        return res.status(401).json({ message: 'No autorizado o error de base de datos.' });
    }
}
