// src/imagen.js (versión Cloudflare)
const { fetchSeguro } = require('./errores');

async function generarImagen(descripcion) {
  const clave = process.env.IMAGEN_API_KEY;
  const url = process.env.IMAGEN_URL;
  if (!clave || !url) {
    throw new Error('Faltan variables IMAGEN_* en tu archivo .env.');
  }

  const respuesta = await fetchSeguro(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clave}`,
    },
    body: JSON.stringify({ prompt: descripcion, steps: 4 }),
  }, 60000);

  const datos = await respuesta.json();
  const base64 = datos.result?.image;

  if (!base64) {
    throw new Error('El modelo de imágenes no devolvió una imagen.');
  }

  // La imagen llega como texto base64: se convierte a bytes
  const bytes = Buffer.from(base64, 'base64');
  if (bytes.length === 0) {
    throw new Error('La imagen llegó vacía.');
  }
  return bytes;
}

module.exports = { generarImagen };