import { db } from '..api/lib/firebaseAdmin.js';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

export default async function handler(request, response) {
    // 1. Solo permitimos solicitudes POST (envío de datos)
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Método no permitido' });
    }

    try {
        const { password } = request.body;
        
        // 2. Leemos las "Llaves Maestras" del entorno seguro de Vercel
        const correctPassword = process.env.LOGIN_PASS;
        const jwtSecret = process.env.JWT_SECRET;

        // Validación de seguridad del servidor
        if (!correctPassword || !jwtSecret) {
            console.error("CRÍTICO: Variables de entorno LOGIN_PASS o JWT_SECRET no están configuradas.");
            return response.status(500).json({ message: 'Error de configuración en el servidor.' });
        }
        
        // 3. Verificamos la contraseña
        if (password === correctPassword) {
            // ¡Éxito! Creamos el "Pase de Acceso" (Token)
            const token = jwt.sign(
                { user: 'terapeuta_dpvper', role: 'admin' }, // Datos dentro del token
                jwtSecret,             // Firma digital única
                { expiresIn: '8h' }    // El pase vence en 8 horas (jornada laboral)
            );

            // 4. Empaquetamos el token en una Cookie Segura
            const serializedCookie = cookie.serialize('authToken', token, {
                httpOnly: true, // INVISIBLE para JavaScript (Anti-Robo XSS)
                secure: process.env.NODE_ENV === 'production', // Solo viaja por HTTPS en producción
                sameSite: 'strict', // Solo se envía si estás en tu propia página (Anti-CSRF)
                maxAge: 8 * 60 * 60, // Dura 8 horas
                path: '/', // Válida en todo el sitio
            });

            // 5. Enviamos la cookie al navegador
            response.setHeader('Set-Cookie', serializedCookie);
            
            return response.status(200).json({ success: true, message: 'Acceso autorizado.' });
        } else {
            // Fallo de seguridad
            return response.status(401).json({ success: false, message: 'Credenciales inválidas.' });
        }

    } catch (error) {
        console.error("Error en el endpoint de autenticación:", error);
        return response.status(500).json({ message: 'Error interno del servidor.' });
    }
}


