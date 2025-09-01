import { db } from './lib/firebaseAdmin.js';
import { Resend } from 'resend';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Función para crear un PDF simple (sin cambios)
async function crearPDF(datos) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let y = height - 50;
    
    page.drawText('Reporte Preliminar - Escala DPvPer', { x: 50, y, font: boldFont, size: 24, color: rgb(0, 0, 0) });
    y -= 40;

    page.drawText(`Nombre: ${datos.demograficos.nombre}`, { x: 50, y, font, size: 12 });
    y -= 20;
    page.drawText(`Email: ${datos.demograficos.email}`, { x: 50, y, font, size: 12 });
    y -= 30;

    page.drawText('Resultados de Arquetipos:', { x: 50, y, font: boldFont, size: 16 });
    y -= 25;

    const scores = { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0 };
    for (const pregunta in datos.respuestas) {
        const arquetipoVotado = datos.respuestas[pregunta];
        if (arquetipoVotado !== 'na') {
            scores[arquetipoVotado]++;
        }
    }
    const arquetiposNombres = { a: 'Analista/Sabio', b: 'Creador', c: 'Conector', d: 'Explorador', e: 'Constructor', f: 'Sanador' };
    
    for(const [key, value] of Object.entries(scores)) {
        page.drawText(`${arquetiposNombres[key]}: ${value} puntos`, { x: 70, y, font, size: 12 });
        y -= 20;
    }

    y -= 20;
    page.drawText('Para un análisis completo, agenda una cita.', { x: 50, y, font, size: 14, color: rgb(0.1, 0.1, 0.1) });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}


export default async function handler(req, res) {
    console.log("Iniciando función enviar-reporte-personal...");
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        const datosCompletos = req.body;
        datosCompletos.fecha = new Date();
        
        console.log("Datos recibidos, guardando en Firebase...");
        const docRef = await db.collection('reportes_dpvper').add(datosCompletos);
        console.log(`Datos guardados en Firestore con ID: ${docRef.id}`);

        // --- SECCIÓN DE CORREO (Punto de Foco) ---
        console.log("Preparando para enviar correo con Resend...");
        const resend = new Resend(process.env.RESEND2_API_KEY); 
        
        console.log("Creando PDF...");
        const pdfBuffer = await crearPDF(datosCompletos);
        console.log("PDF creado exitosamente.");

        console.log(`Enviando correo a ${datosCompletos.demograficos.email} y copia a dpvp.cds@emcotic.com...`);
        const { data, error } = await resend.emails.send({
          from: 'DPvPer Diagnóstico <onboarding@resend.dev>',
          to: datosCompletos.demograficos.email,
          bcc: 'dpvp.cds@emcotic.com',
          subject: `Resultados de tu Diagnóstico DPvPer - ${datosCompletos.demograficos.nombre}`,
          html: `<h1>Hola ${datosCompletos.demograficos.nombre.split(' ')[0]},</h1><p>Gracias por completar la Escala DPvPer. Adjunto encontrarás un resumen en PDF con tus puntuaciones.</p><p>Un saludo,<br>Jorge Arango Castaño</p>`,
          attachments: [
            {
              filename: `Reporte-DPvPer-${docRef.id}.pdf`,
              content: pdfBuffer,
            },
          ],
        });

        if (error) {
            console.error("Resend devolvió un error:", error);
            throw new Error(error.message);
        }

        console.log("Correo enviado exitosamente. ID de envío:", data.id);
        res.status(200).json({ message: 'Reporte guardado y correo enviado con éxito', id: docRef.id });

    } catch (error) {
        console.error('ERROR DETALLADO EN EL BLOQUE CATCH:', error);
        res.status(500).json({ message: 'Error interno del servidor al enviar el correo.' });
    }
}

