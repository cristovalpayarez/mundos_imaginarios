// src/texto.js
const { fetchSeguro } = require('./errores');

// Mensaje de sistema: define cómo debe responder el modelo
const SISTEMA = `You are an art director who writes image prompts.
You will receive a JSON with a situation, an imaginary world and 5 colors.
Write ONE single paragraph in English, between 80 and 120 words, that describes
an IMAGE (not a story): the scene, its elements, the lighting, the composition
and the artistic style. Mention all 5 colors (you may translate them).
Do not use titles, markdown or lists. Do not include any written text inside the image.`;

async function describirMundo(mundo) {
  const clave = process.env.TEXTO_API_KEY;
  const url = process.env.TEXTO_URL;
  const modelo = process.env.TEXTO_MODELO;
  if (!clave || !url || !modelo) {
    throw new Error('Faltan variables TEXTO_* en tu archivo .env.');
  }

  const respuesta = await fetchSeguro(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${clave}`,
    },
    body: JSON.stringify({
      model: modelo,
      messages: [
        { role: 'system', content: SISTEMA },
        { role: 'user', content: JSON.stringify(mundo) },
      ],
    }),
  }, 30000);

  const datos = await respuesta.json();
  let texto = datos.choices?.[0]?.message?.content;

  if (!texto || texto.trim() === '') {
    throw new Error('El modelo de texto devolvió una respuesta vacía.');
  }

  texto = texto.trim();
  if (texto.length > 1500) {
    texto = texto.slice(0, 1500);
    console.log('Aviso: la descripción superaba 1500 caracteres y fue recortada.');
  }
  return texto;
}

module.exports = { describirMundo };