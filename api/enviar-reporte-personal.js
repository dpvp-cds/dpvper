import admin from 'firebase-admin';

// Helper para inicializar Firebase Admin SDK de forma segura
// Esta función asegura que solo se inicialice una vez.
function initializeFirebaseAdmin() {
    if (admin.apps.length) {
        return admin.app();
    }
    
    // Decodificar la clave de servicio desde la variable de entorno de Vercel
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (!serviceAccountBase64) {
        throw new Error('La variable de entorno FIREBASE_SERVICE_ACCOUNT_BASE64 no está definida.');
    }
    const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

export default async function handler(req, res) {
    // Solo permitir peticiones POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        // Inicializar Firebase
        initializeFirebaseAdmin();
        const db = admin.firestore();

        // Obtener los datos enviados desde el formulario
        const datosCompletos = req.body;
        
        // Añadir una marca de tiempo del servidor para saber cuándo se recibió
        datosCompletos.fecha = admin.firestore.FieldValue.serverTimestamp();

        // Guardar el documento en la nueva colección 'reportes_dpvper'
        const docRef = await db.collection('reportes_dpvper').add(datosCompletos);

        // --- INICIO: SECCIÓN PARA ENVÍO DE CORREO CON PDF ---
        // Jorge, aquí es donde integrarías tu lógica para generar el PDF y enviarlo por correo.
        // Los 'datosCompletos' que recibimos del formulario y el ID del nuevo documento 'docRef.id' están disponibles para usar.
        // Ejemplo conceptual:
        //
        // 1. Importar las librerías necesarias (ej. Resend, pdf-lib).
        // const { Resend } = require('resend');
        // const { crearPDF } = require('./utils/pdfGenerator'); // Un helper que tú crearías
        //
        // 2. Inicializar el cliente de correo.
        // const resend = new Resend(process.env.RESEND_API_KEY);
        //
        // 3. Generar el PDF en memoria.
        // const pdfBuffer = await crearPDF(datosCompletos);
        //
        // 4. Enviar el correo.
        // await resend.emails.send({
        //   from: 'diagnostico@caminosdelser.co',
        //   to: datosCompletos.demograficos.email, // Correo del usuario
        //   bcc: 'tu-correo-de-psicologo@gmail.com', // Tu correo para recibir copia
        //   subject: `Resultados de tu Diagnóstico DPvPer - ${datosCompletos.demograficos.nombre}`,
        //   html: '<h1>Adjunto encontrarás tus resultados preliminares.</h1><p>Para un análisis profundo, agenda una cita.</p>',
        //   attachments: [
        //     {
        //       filename: `Reporte-DPvPer-${docRef.id}.pdf`,
        //       content: pdfBuffer,
        //     },
        //   ],
        // });
        //
        // --- FIN: SECCIÓN PARA ENVÍO DE CORREO CON PDF ---

        // Devolver una respuesta exitosa al frontend
        res.status(200).json({ message: 'Reporte guardado con éxito', id: docRef.id });

    } catch (error) {
        console.error('Error al procesar el reporte:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}

