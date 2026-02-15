import jwt from 'jsonwebtoken';
import cookie from 'cookie';

// Esta función es nuestro "guardián" de seguridad.
// Se llama al inicio de cada API protegida (get-reportes, eliminar, etc.)
export function verifyAuth(request) {
    // 1. Buscamos la cookie en la cabecera de la petición
    const cookies = cookie.parse(request.headers.cookie || '');
    const token = cookies.authToken;

    // 2. Si no hay token, negamos el acceso inmediatamente
    if (!token) {
        throw new Error('Token de autenticación no encontrado.');
    }

    try {
        // 3. Verificamos la firma digital del token
        // Si fue modificado o expiró, jwt.verify lanzará un error
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Si es válido, devolvemos los datos del usuario (aunque por ahora solo validamos el acceso)
        return decoded; 
    } catch (error) {
        // Si algo falla, lanzamos error para que la API responda 401
        throw new Error('Token inválido o expirado.');
    }
}
