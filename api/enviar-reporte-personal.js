import { db } from './lib/firebaseAdmin.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        const { demograficos, respuestas } = req.body;

        // 1. Lógica de cálculo de arquetipos (12 preguntas)
        const conteo = { a:0, b:0, c:0, d:0, e:0, f:0 };
        Object.values(respuestas).forEach(v => { 
            if(conteo.hasOwnProperty(v)) conteo[v]++; 
        });

        const arquetipos = {
            'a': 'Analista / Sabio', 'b': 'Creador / Innovador', 'c': 'Conector / Humanista', 
            'd': 'Explorador', 'e': 'Constructor / Contribuidor', 'f': 'Sanador / Espiritual'
        };

        let max = -1;
        let dominante = "";
        const resultados = {};
        
        Object.keys(conteo).forEach(k => {
            resultados[arquetipos[k]] = Number(((conteo[k] / 12) * 10).toFixed(1));
            if(conteo[k] > max) { max = conteo[k]; dominante = arquetipos[k]; }
        });

        // 2. Preparar el documento
        const nuevoDoc = {
            demograficos,
            respuestas,
            resultados,
            arquetipoDominante: dominante,
            timestamp: new Date(),
            fecha: new Date().toLocaleString('es-CO'),
            origen: 'web-personal-v2'
        };

        // 3. GUARDADO CRÍTICO: Usamos 'reportes-personales' (con guion)
        // Agregamos un log para ver en Vercel
        console.log("Intentando guardar reporte de:", demograficos.nombre);
        
        const docRef = await db.collection('reportes-personales').add(nuevoDoc);
        
        console.log("Guardado exitoso con ID:", docRef.id);

        return res.status(200).json({ 
            id: docRef.id, 
            success: true,
            mensaje: "Guardado en reportes-personales"
        });

    } catch (error) {
        console.error("ERROR FATAL AL GUARDAR EN FIREBASE:", error);
        return res.status(500).json({ 
            message: "Error al guardar en base de datos",
            error: error.message 
        });
    }
}
