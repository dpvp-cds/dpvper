import cookie from 'cookie';

export default function handler(request, response) {
    // 1. Configuramos una cookie de reemplazo que expira en el pasado (año 1970)
    // Esto obliga al navegador a borrar la cookie original 'authToken' inmediatamente.
    const serializedCookie = cookie.serialize('authToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
        sameSite: 'strict',
        expires: new Date(0), // Fecha en el pasado = Expiración inmediata
        path: '/',
    });

    // 2. Enviamos la orden de borrado en la cabecera
    response.setHeader('Set-Cookie', serializedCookie);
    
    // 3. Confirmamos al frontend que la sesión se cerró
    response.status(200).json({ message: 'Sesión cerrada exitosamente.' });
}
