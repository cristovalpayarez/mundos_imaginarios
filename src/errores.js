// src/errores.js
// Hace el fetch y convierte cualquier fallo en un mensaje claro en español.
// Nunca incluye la API key en los mensajes.
async function fetchSeguro(url, opciones, tiempoMs) {
  opciones.signal = AbortSignal.timeout(tiempoMs);

  let respuesta;
  try {
    respuesta = await fetch(url, opciones);
  } catch (error) {
    if (error.name === 'TimeoutError') {
      throw new Error('El servicio tardó demasiado en responder.');
    }
    if (error instanceof TypeError) {
      throw new Error('No se pudo conectar. Revisa tu internet o la URL.');
    }
    throw error;
  }

  if (!respuesta.ok) {
    const estado = respuesta.status;
    if (estado === 401 || estado === 403) {
      throw new Error('La API key no es válida. Revisa tu archivo .env.');
    }
    if (estado === 402 || estado === 429) {
      const espera = respuesta.headers.get('retry-after');
      const extra = espera ? ` Reintenta en ${espera} segundos.` : '';
      throw new Error('Superaste el límite gratuito. Espera un momento.' + extra);
    }
    if (estado === 404 || estado === 410) {
      throw new Error('El modelo o la URL no existen. Revisa tu configuración.');
    }
    throw new Error(`El servicio respondió con un error (estado ${estado}).`);
  }

  return respuesta;
}

module.exports = { fetchSeguro };