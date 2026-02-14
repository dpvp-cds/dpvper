const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// MAPA DE ARQUETIPOS (Interpretación de las letras a-f)
// Basado en la naturaleza de tus preguntas en el index.html
const DIMENSIONES = {
    'a': 'Racional / Analítico',   // Resolver problemas, lógica, datos
    'b': 'Creativo / Innovador',   // Crear, arte, flexibilidad
    'c': 'Social / Conector',      // Personas, empatía, apoyo
    'd': 'Estructural / Organizador', // Sistemas, orden, planificación
    'e': 'Acción / Kinestésico',   // Movimiento, construir, impulso
    'f': 'Espiritual / Introspectivo' // Calma, reflexión, sanación
};

// Función Reactiva: Se dispara cuando llega un nuevo reporte a Firestore
exports.procesarDPvPer = functions.firestore
    .document('artifacts/{appId}/public/data/reportes_personal/{docId}')
    .onCreate(async (snap, context) => {
        const data = snap.data();

        // Evitar bucles: si ya está calculado, no hacer nada
        if (data.status === 'completado') return null;

        const respuestas = data.respuestas || {};
        const conteo = { 'a': 0, 'b': 0, 'c': 0, 'd': 0, 'e': 0, 'f': 0 };
        let totalRespondidas = 0;

        // 1. Contabilizar respuestas
        // Recorremos q1 hasta q12
        for (let i = 1; i <= 12; i++) {
            const r = respuestas[`q${i}`]; // Ej: 'a', 'c', 'f'
            if (r && conteo.hasOwnProperty(r)) {
                conteo[r]++;
                totalRespondidas++;
            }
        }

        // 2. Calcular porcentajes y puntajes para el Radar
        const resultadosGrafico = {};
        let arquetipoDominante = '';
        let maxPuntaje = -1;

        Object.keys(DIMENSIONES).forEach(letra => {
            const valor = conteo[letra];
            const nombreDim = DIMENSIONES[letra];
            
            // Escala de 0 a 10 para el gráfico (Normalización simple)
            // Si hay 12 preguntas, el máx posible por letra es 12 (muy raro).
            // Asumimos un "peso" visual. Multiplicamos por un factor para que se vea bien en el radar.
            const puntajeVisual = (valor / 12) * 100; // Porcentaje del total
            
            resultadosGrafico[nombreDim] = Number(puntajeVisual.toFixed(1));

            // Determinar dominante
            if (valor > maxPuntaje) {
                maxPuntaje = valor;
                arquetipoDominante = nombreDim;
            }
        });

        // 3. Escribir resultados en la Bóveda (Actualizar el documento)
        return snap.ref.update({
            resultados: resultadosGrafico,
            arquetipoDominante: arquetipoDominante,
            status: 'completado', // Bandera verde para el frontend
            processedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });
