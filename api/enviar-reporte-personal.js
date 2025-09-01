import { db } from './lib/firebaseAdmin.js';
import { Resend } from 'resend';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// --- FUNCIÓN DE CREACIÓN DE PDF (COMPLETAMENTE REVISADA Y MEJORADA) ---
async function crearPDF(datos) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const margin = 50;
    let y = height - margin;

    // Helper para dibujar texto con salto de línea automático
    const drawText = async (text, options) => {
        const lines = text.split('\n');
        for (const line of lines) {
            if (y < margin) {
                page = pdfDoc.addPage();
                y = height - margin;
            }
            page.drawText(line, {
                x: margin,
                y,
                font: options.isBold ? boldFont : font,
                size: options.size,
                color: options.color || rgb(0, 0, 0),
                maxWidth: width - 2 * margin,
            });
            y -= options.size * 1.5; // Espacio entre líneas
        }
    };

    // --- Contenido del PDF ---

    // 1. Título
    await drawText('Reporte de Resultados - Escala DPvPer', { isBold: true, size: 22 });
    y -= 20;

    // 2. Datos del Participante
    await drawText('Datos del Participante', { isBold: true, size: 16 });
    y -= 5;
    await drawText(`Nombre: ${datos.demograficos?.nombre || 'No especificado'}`, { size: 12 });
    await drawText(`Email: ${datos.demograficos?.email || 'No especificado'}`, { size: 12 });
    await drawText(`Edad: ${datos.demograficos?.edad || 'No especificada'}`, { size: 12 });
    await drawText(`Ciudad: ${datos.demograficos?.ciudad || 'No especificada'}`, { size: 12 });
    y -= 20;

    // 3. Resultados de Arquetipos
    await drawText('Resumen de Puntuaciones por Arquetipo', { isBold: true, size: 16 });
    y -= 5;
    const arquetiposMap = {
        a: "El Guerrero", b: "El Creador", c: "El Amante", d: "El Sabio",
        e: "El Explorador", f: "El Inocente", g: "El Gobernante", h: "El Mago"
    };

    if (datos.resultados && Object.keys(datos.resultados).length > 0) {
        for (const key in arquetiposMap) {
            const puntaje = datos.resultados[key] !== undefined ? datos.resultados[key] : "N/A";
            await drawText(`${arquetiposMap[key]}: ${puntaje} / 10`, { size: 12 });
        }
    } else {
        await drawText("No se encontraron puntuaciones de resumen.", { size: 12 });
    }
    y -= 20;

    // 4. Respuestas Detalladas
    await drawText('Respuestas Detalladas del Instrumento', { isBold: true, size: 16 });
    
    if (datos.detalles && Object.keys(datos.detalles).length > 0) {
        for (const preguntaId in datos.detalles) {
            const respuesta = datos.detalles[preguntaId];
            const textoPregunta = `${preguntaId}: ${respuesta.pregunta}`;
            const textoRespuesta = `   Respuesta: ${respuesta.textoRespuesta} (Valor: ${respuesta.valor})`;
            
            y -= 10;
            await drawText(textoPregunta, { size: 11, isBold: true });
            await drawText(textoRespuesta, { size: 11 });
        }
    } else {
        y -= 10;
        await drawText("No se encontraron respuestas detalladas.", { size: 12 });
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}


// --- HANDLER PRINCIPAL DE LA API (SIN CAMBIOS EN LA LÓGICA DE ENVÍO) ---
export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Método no permitido' });
    }

    try {
        const datosCompletos = request.body;
        console.log("Recibiendo datos para guardar y enviar...");

        // 1. Guardar en Firestore
        const docRef = await db.collection('reportes-personales').add({
            ...datosCompletos,
            fecha: new Date().toISOString()
        });
        console.log("Datos guardados con éxito. ID del documento:", docRef.id);

        // 2. Crear el PDF con la nueva función mejorada
        const pdfBuffer = await crearPDF(datosCompletos);
        console.log("PDF detallado creado exitosamente.");

        // 3. Enviar correo con Resend
        const resend = new Resend(process.env.RESEND2_API_KEY);
        
        console.log(`Enviando correo a ${datosCompletos.demograficos.email} y copia a dpvp.cds@emcotic.com...`);
        const { data, error } = await resend.emails.send({
          from: 'DPvPer Diagnóstico <dpvp.cds@emcotic.com>', // Asegúrate que este dominio esté verificado
          to: datosCompletos.demograficos.email,
          bcc: 'dpvp.cds@emcotic.com',
          subject: `Resultados de tu Diagnóstico DPvPer - ${datosCompletos.demograficos.nombre}`,
          html: `<h1>Hola ${datosCompletos.demograficos.nombre.split(' ')[0]},</h1><p>Gracias por completar la Escala DPvPer. Adjunto encontrarás un reporte detallado en PDF con tus respuestas y puntuaciones.</p><p>Un saludo,<br>Jorge Arango Castaño</p>`,
          attachments: [
            {
              filename: `Reporte-DPvPer-${docRef.id}.pdf`,
              content: Buffer.from(pdfBuffer),
            },
          ],
        });

        if (error) {
            console.error("Resend devolvió un error:", error);
            throw new Error(JSON.stringify(error));
        }

        console.log("Correo enviado exitosamente. ID de envío:", data.id);
        response.status(200).json({ message: 'Reporte guardado y correo enviado con éxito', id: docRef.id });

    } catch (error) {
        console.error("Error en el proceso:", error.message);
        response.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
}


