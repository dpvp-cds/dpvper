import jwt from 'jsonwebtoken';
import cookie from 'cookie';

export default async function handler(request, response) {
    // 1. Solo permitimos peticiones POST para seguridad
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Método no permitido' });
    }

    try {
        const { password } = request.body;
        
        // 2. Variables de entorno (Configuradas en el panel de Vercel)
        const correctPassword = process.env.LOGIN_PASS;
        const jwtSecret = process.env.JWT_SECRET;

        // Validación de configuración en el servidor
        if (!correctPassword || !jwtSecret) {
            console.error("Faltan LOGIN_PASS o JWT_SECRET en las variables de entorno.");
            return response.status(500).json({ message: 'Error de configuración en el servidor.' });
        }
        
        // 3. Verificación de la contraseña
        if (password === correctPassword) {
            // Generamos el Token JWT (el pase de acceso)
            const token = jwt.sign(
                { 
                    user: 'terapeuta_dpvper',
                    role: 'admin' 
                }, 
                jwtSecret,
                { expiresIn: '8h' } // La sesión durará 8 horas
            );

            // 4. Configuramos la Cookie HttpOnly (Invisible para hackers y scripts maliciosos)
            const serializedCookie = cookie.serialize('authToken', token, {
                httpOnly: true, // No accesible vía JS en el navegador
                secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
                sameSite: 'strict', // Protege contra ataques CSRF
                maxAge: 8 * 60 * 60, // 8 horas en segundos
                path: '/', // Válida para toda la web
            });

            // 5. Enviamos la cabecera con la cookie y respuesta exitosa
            response.setHeader('Set-Cookie', serializedCookie);
            
            return response.status(200).json({ 
                success: true, 
                message: 'Autenticación exitosa' 
            });
        } else {
            // Contraseña incorrecta
            return response.status(401).json({ 
                success: false, 
                message: 'Contraseña incorrecta.' 
            });
        }

    } catch (error) {
        console.error("Error en el proceso de autenticación:", error);
        return response.status(500).json({ message: 'Error interno del servidor.' });
    }
}
