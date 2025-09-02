import { db } from './lib/firebaseAdmin.js';
import { Resend } from 'resend';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// --- FUNCIÓN DE CREACIÓN DE PDF (VERSIÓN DEFINITIVA) ---
// Esta función ahora contiene toda la lógica para procesar los datos
async function crearPDF(datos) {
    // 1. DEFINIR LA ESTRUCTURA DE PREGUNTAS (EL "MAPA" DEL CUESTIONARIO)
    const preguntas = [
        { id: 'P1', texto: '¿Sientes que tienes un propósito claro en la vida?', arquetipo: 'd' }, { id: 'P2', texto: '¿Te consideras una persona creativa y original?', arquetipo: 'b' }, { id: 'P3', texto: '¿Disfrutas de la aventura y de explorar nuevos lugares o ideas?', arquetipo: 'e' }, { id: 'P4', texto: '¿Valoras la seguridad y la estabilidad por encima de todo?', arquetipo: 'f' }, { id: 'P5', texto: '¿Te sientes cómodo liderando a otros y tomando decisiones importantes?', arquetipo: 'g' }, { id: 'P6', texto: '¿La gente te busca por tu sabiduría y tus consejos?', arquetipo: 'd' }, { id: 'P7', texto: '¿Te esfuerzas por superar los obstáculos con valentía y determinación?', arquetipo: 'a' }, { id: 'P8', texto: '¿Buscas constantemente transformar las situaciones para mejorarlas?', arquetipo: 'h' }, { id: 'P9', texto: '¿Para ti es fundamental conectar emocionalmente con las personas?', arquetipo: 'c' }, { id: 'P10', texto: '¿Crees que la vida es un viaje lleno de maravillas por descubrir?', arquetipo: 'e' }, { id: 'P11', texto: '¿Prefieres construir algo nuevo y duradero a seguir lo ya establecido?', arquetipo: 'b' }, { id: 'P12', texto: '¿Te sientes responsable del bienestar de tu comunidad o grupo?', arquetipo: 'g' }, { id: 'P13', texto: '¿Crees en el poder del amor y la pasión para guiar tus acciones?', arquetipo: 'c' }, { id: 'P14', texto: '¿Confías en tu intuición y en tu capacidad para que las cosas sucedan?', arquetipo: 'h' }, { id: 'P15', texto: '¿Te identificas con la lucha por la justicia y la defensa de los débiles?', arquetipo: 'a' }, { id: 'P16', texto: '¿Mantienes una actitud optimista y confías en la bondad de los demás?', arquetipo: 'f' }, { id: 'P17', texto: '¿El análisis y la reflexión son cruciales antes de tomar una decisión?', arquetipo: 'd' }, { id: 'P18', texto: '¿Te sientes lleno de energía cuando enfrentas un desafío competitivo?', arquetipo: 'a' }, { id: 'P19', texto: '¿Sientes una profunda curiosidad por entender cómo funciona el mundo?', arquetipo: 'h' }, { id: 'P20', texto: '¿La belleza, la estética y la sensualidad son importantes en tu vida?', arquetipo: 'c' }, { id: 'P21', texto: '¿Sueñas con crear una obra (artística, empresarial, etc.) que deje un legado?', arquetipo: 'b' }, { id: 'P22', texto: '¿Buscas la libertad y la independencia en todos los aspectos de tu vida?', arquetipo: 'e' }, { id: 'P23', texto: '¿Crees que las reglas y el orden son esenciales para una sociedad funcional?', arquetipo: 'g' }, { id: 'P24', texto: '¿Tiendes a ver el lado bueno de las cosas y a esperar un final feliz?', arquetipo: 'f' }, { id: 'P25', texto: '¿Te consideras un maestro o mentor para otras personas?', arquetipo: 'd' }, { id: 'P26', texto: '¿Estás dispuesto a sacrificarte para proteger a quienes amas?', arquetipo: 'a' }, { id: 'P27', texto: '¿Te atrae el misterio y lo que no se ve a simple vista?', arquetipo: 'h' }, { id: 'P28', texto: '¿Valoras las relaciones íntimas y cercanas por encima de los logros materiales?', arquetipo: 'c' }, { id: 'P29', texto: '¿La autoexpresión a través de alguna forma de arte o creación es vital para ti?', arquetipo: 'b' }, { id: 'P30', texto: '¿Sientes un llamado a viajar y experimentar diferentes culturas?', arquetipo: 'e' }, { id: 'P31', texto: '¿Asumes el control de las situaciones para garantizar el éxito?', arquetipo: 'g' }, { id: 'P32', texto: '¿Crees en la simplicidad y en encontrar la felicidad en las pequeñas cosas?', arquetipo: 'f' }, { id: 'P33', texto: '¿La búsqueda de la verdad y el conocimiento es una de tus mayores motivaciones?', arquetipo: 'd' }, { id: 'P34', texto: '¿Te ves a ti mismo como un pionero que abre nuevos caminos?', arquetipo: 'e' }, { id: 'P35', texto: '¿Tienes la habilidad de inspirar cambios profundos en los demás?', arquetipo: 'h' }, { id: 'P36', texto: '¿La lealtad y el compromiso son valores centrales en tus relaciones?', arquetipo: 'c' }, { id: 'P37', texto: '¿Tienes una visión clara de lo que quieres construir en tu futuro?', arquetipo: 'b' }, { id: 'P38', texto: '¿Te consideras una persona disciplinada y con autocontrol?', arquetipo: 'a' }, { id: 'P39', texto: '¿Te sientes más realizado cuando ejerces una posición de influencia y autoridad?', arquetipo: 'g' }, { id: 'P40', texto: '¿Crees que la fe y la esperanza pueden superar cualquier adversidad?', arquetipo: 'f' }
    ];
    const preguntasMap = new Map(preguntas.map(p => [p.id, p]));

    // 2. PROCESAR LOS DATOS RECIBIDOS DEL FORMULARIO
    const resultados = { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0, g: 0, h: 0 };
    const detalles = {};
    
    // El objeto 'datos.respuestas' viene de tu formulario original.
    if (datos.respuestas) {
        for (const preguntaId in datos.respuestas) {
            if (preguntasMap.has(preguntaId)) {
                const pregunta = preguntasMap.get(preguntaId);
                const valorStr = datos.respuestas[preguntaId];
                const valorNum = parseInt(valorStr, 10);
                
                if (!isNaN(valorNum)) {
                    resultados[pregunta.arquetipo] += valorNum;
                    detalles[preguntaId] = {
                        pregunta: pregunta.texto,
                        textoRespuesta: valorStr,
                        valor: valorNum
                    };
                }
            }
        }
    }
    
    // Normalizar los resultados (dividir por 5 para escala de 0 a 10)
    for (const arquetipo in resultados) {
        resultados[arquetipo] = resultados[arquetipo] / 5;
    }
    
    // --- 3. DIBUJAR EL PDF ---
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const margin = 50;
    let y = height - margin;

    const drawText = async (text, options) => {
        const lines = text.split('\n');
        for (const line of lines) {
            if (y < margin) {
                page = pdfDoc.addPage();
                y = height - margin;
            }
            page.drawText(line, { x: margin, y, font: options.isBold ? boldFont : font, size: options.size, color: options.color || rgb(0, 0, 0), maxWidth: width - 2 * margin });
            y -= options.size * 1.5;
        }
    };

    await drawText('Reporte de Resultados - Escala DPvPer', { isBold: true, size: 22 });
    y -= 20;
    await drawText('Datos del Participante', { isBold: true, size: 16 });
    y -= 5;
    await drawText(`Nombre: ${datos.demograficos?.nombre || 'No especificado'}`, { size: 12 });
    await drawText(`Email: ${datos.demograficos?.email || 'No especificado'}`, { size: 12 });
    await drawText(`Edad: ${datos.demograficos?.edad || 'No especificada'}`, { size: 12 });
    await drawText(`Ciudad: ${datos.demograficos?.ciudad || 'No especificada'}`, { size: 12 });
    y -= 20;

    await drawText('Resumen de Puntuaciones por Arquetipo', { isBold: true, size: 16 });
    y -= 5;
    const arquetiposMap = { a: "El Guerrero", b: "El Creador", c: "El Amante", d: "El Sabio", e: "El Explorador", f: "El Inocente", g: "El Gobernante", h: "El Mago" };
    for (const key in arquetiposMap) {
        await drawText(`${arquetiposMap[key]}: ${resultados[key] || 0} / 10`, { size: 12 });
    }
    y -= 20;

    await drawText('Respuestas Detalladas del Instrumento', { isBold: true, size: 16 });
    for (const preguntaId in detalles) {
        const respuesta = detalles[preguntaId];
        y -= 10;
        await drawText(`${preguntaId}: ${respuesta.pregunta}`, { size: 11, isBold: true });
        await drawText(`   Respuesta: ${respuesta.textoRespuesta} (Valor: ${respuesta.valor})`, { size: 11 });
    }
    
    return await pdfDoc.save();
}

// --- HANDLER PRINCIPAL ---
export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Método no permitido' });
    }
    try {
        const datosCompletos = request.body;
        const docRef = await db.collection('reportes-personales').add({ ...datosCompletos, fecha: admin.firestore.Timestamp.now() });
        const pdfBuffer = await crearPDF(datosCompletos);
        const resend = new Resend(process.env.RESEND2_API_KEY);
        
        const { data, error } = await resend.emails.send({
            from: 'DPvPer Diagnóstico <dpvp.cds@emcotic.com>',
            to: datosCompletos.demograficos.email,
            bcc: 'dpvp.cds@emcotic.com',
            subject: `Resultados de tu Diagnóstico DPvPer - ${datosCompletos.demograficos.nombre}`,
            html: `<h1>Hola ${datosCompletos.demograficos.nombre.split(' ')[0]},</h1><p>Gracias por completar la Escala DPvPer. Adjunto encontrarás un reporte detallado en PDF con tus respuestas y puntuaciones.</p><p>Un saludo,<br>Jorge Arango Castaño</p>`,
            attachments: [{ filename: `Reporte-DPvPer-${docRef.id}.pdf`, content: Buffer.from(pdfBuffer) }],
        });

        if (error) throw new Error(JSON.stringify(error));
        response.status(200).json({ message: 'Reporte guardado y correo enviado con éxito', id: docRef.id });
    } catch (error) {
        console.error("Error en el proceso:", error.message);
        response.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
}


