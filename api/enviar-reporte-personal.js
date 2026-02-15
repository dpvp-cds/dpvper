import { db } from '../lib/firebaseAdmin';

// Matriz de Arquetipos (Interpretación de las letras a-f)
// Basado en la lógica de tus 12 preguntas
const ARQUETIPOS = {
    'a': 'Racional / Analítico',   // Lógica, datos, planificación
    'b': 'Creativo / Innovador',   // Creación, arte, flexibilidad
    'c': 'Social / Conector',      // Personas, empatía, apoyo
    'd': 'Estructural / Organizador', // Orden, sistemas, seguridad
    'e': 'Acción / Hacedor',       // Movimiento, construcción, impulso
    'f': 'Espiritual / Introspectivo' // Reflexión, calma, propósito interno
};

export default async function handler(req, res) {
    // 1. Validar Método
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido. Use POST.' });
    }

    try {
        const { demograficos, respuestas } = req.body;

        // 2. Validar Datos Mínimos
        if (!demograficos || !respuestas) {
            return res.status(400).json({ message: 'Faltan datos requeridos (demográficos o respuestas).' });
        }

        // 3. LÓGICA DE CÁLCULO (El secreto)
        const conteo = { a:0, b:0, c:0, d:0, e:0, f:0 };
        
        // Contar letras seleccionadas
        Object.values(respuestas).forEach(val => {
            // El valor viene como 'a', 'b', etc. desde el radio button
            if (conteo.hasOwnProperty(val)) {
                conteo[val]++;
            }
        });

        // Calcular arquetipo dominante y puntajes para el gráfico
        let max = -1;
        let dominante = "Indefinido";
        const resultadosGrafico = {};

        Object.keys(conteo).forEach(letra => {
            const label = ARQUETIPOS[letra];
            const valor = conteo[letra];
            
            // Escala para el Radar (0 a 10)
            // Si son 12 preguntas, el máximo teórico de una letra es 12.
            // Normalizamos: (valor / 12) * 10
            resultadosGrafico[label] = Number(((valor / 12) * 10).toFixed(1)); 

            // Determinar dominante (el que tenga más votos)
            if (valor > max) {
                max = valor;
                dominante = label;
            }
        });

        // 4. GUARDAR EN BÓVEDA (Firestore)
        // Usamos la colección 'reportes_personal'
        const nuevoReporte = {
            demograficos,
            respuestas, // Guardamos la data cruda por auditoría
            resultados: resultadosGrafico,
            arquetipoDominante: dominante,
            fecha: new Date().toISOString(),
            timestamp: new Date(), // Objeto fecha para ordenamiento
            origen: 'web_dpvper_api_v2'
        };

        const docRef = await db.collection('reportes_personal').add(nuevoReporte);

        // 5. Responder al cliente
        return res.status(200).json({ 
            id: docRef.id,
            message: 'Diagnóstico procesado exitosamente.',
            exito: true
        });

    } catch (error) {
        console.error("Error crítico en API DPvPer:", error);
        return res.status(500).json({ 
            message: 'Error interno del servidor procesando el diagnóstico.', 
            error: error.message 
        });
    }
}
