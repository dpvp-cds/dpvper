import { db } from './lib/firebaseAdmin.js';

export default async function handler(req, res) {
    // 1. Verificamos que los datos se estén ENVIANDO (POST).
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        // 2. Tomamos los datos completos que nos envió el index.html.
        const datosCompletos = req.body;
        
        // 3. Añadimos una marca de tiempo del servidor. Esto es más fiable que la fecha del navegador.
        datosCompletos.fecha = new Date();

        // 4. Usamos nuestra conexión 'db' para guardar el reporte en la colección 'reportes_dpvper'.
        const docRef = await db.collection('reportes_dpvper').add(datosCompletos);

        // --- INICIO: SECCIÓN PARA ENVÍO DE CORREO CON PDF ---
        // Jorge, aquí es donde integrarías tu lógica para generar el PDF y enviarlo por correo.
        // Los 'datosCompletos' y el ID del nuevo documento 'docRef.id' están disponibles para usar.
        // Ejemplo conceptual:
        //
        // import { Resend } from 'resend';
        // import { crearPDF } from '../utils/pdfGenerator'; // Un helper que tú crearías
        // const resend = new Resend(process.env.RESEND_API_KEY);
        // const pdfBuffer = await crearPDF(datosCompletos);
        // await resend.emails.send({ ... });
        //
        // --- FIN: SECCIÓN PARA ENVÍO DE CORREO CON PDF ---

        // 5. Enviamos una respuesta de éxito de vuelta al index.html.
        res.status(200).json({ message: 'Reporte guardado con éxito', id: docRef.id });

    } catch (error) {
        console.error('Error al procesar el reporte:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
}

