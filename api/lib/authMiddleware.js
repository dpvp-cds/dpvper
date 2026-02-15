import jwt from 'jsonwebtoken';
import cookie from 'cookie';

// Esta función es nuestro "guardián" de seguridad.
export function verifyAuth(request) {
    const cookies = cookie.parse(request.headers.cookie || '');
    const token = cookies.authToken;

    // Si no hay token en las cookies, se niega el acceso.
    if (!token) {
        throw new Error('Token de autenticación no encontrado.');
    }

    try {
        // Verificamos que el token sea válido usando nuestra clave secreta.
        // Si la firma no coincide o el token ha expirado, jwt.verify lanzará un error.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded; // Si es válido, devolvemos la información decodificada.
    } catch (error) {
        // Si la verificación falla por cualquier motivo, negamos el acceso.
        throw new Error('Token inválido o expirado.');
    }
}
