# PROMPT.md: cómo construí mundos-ia

## A. Declaración

Usé IA: sí.

## B. Herramienta y modelo

- Herramienta: Claude (Anthropic), en la aplicación web.
- Modelo: Sonnet 5.5

## C. Prompt inicial (literal)

Adjunté el enunciado completo del taller (documento de texto) y escribí:

> necesito hacer este taller de nodejs dime el paso a paso, me van a evaluar entonces necesito que tambien me des una guia de explicacion de todo el taller



## D. Prompts siguientes

### Prompt 1: error de API key

- **Qué envié:** pegué la salida de la terminal, donde el paso 1 funcionaba y luego aparecía "La API key no es válida. Revisa tu archivo .env."
- **Qué respondió la IA:** que el error era 401/403 (problema con la clave), y me pidió revisar el `.env` (que no tuviera el texto de ejemplo, ni comillas ni espacios), que estuviera en la raíz y que la clave fuera del servicio correcto.
- **Qué hice:** creé mi clave de Groq en console.groq.com, la pegué en `TEXTO_API_KEY` y volví a ejecutar. El paso 2 funcionó.

### Prompt 2: "¿cómo busco la clave de Groq?" y "¿y la de IMAGEN_API_KEY?"

- **Qué respondió la IA:** los pasos para crear la clave de Groq (`gsk_...`) y de NVIDIA (`nvapi-...`), y dónde pegarlas en el `.env`.
- **Qué hice:** generé ambas claves, las pegué en el `.env` sin compartirlas en el chat.

### Prompt 3: el servicio de imágenes se quedaba sin responder

- **Qué envié:** la salida "El servicio tardó demasiado en responder" en el paso 3, y luego los resultados de `prueba.js`.
- **Qué respondió la IA:** que la clave y la URL probablemente estaban bien, me sugirió reintentar, subir el timeout y crear un script de diagnóstico (`prueba.js`) para medir el estado y el tiempo de respuesta.
- **Qué hice:** ejecuté `prueba.js`. Con 512 respondió 422 en 1.2 s; con un tamaño válido terminó en `TimeoutError` a los 180 s. Concluí que NVIDIA no generaba la imagen desde mi conexión y decidí cambiar de servicio.

### Prompt 4: cambio a Cloudflare

- **Qué envié:** una captura de mi panel de Cloudflare.
- **Qué respondió la IA:** cómo obtener el Account ID (en la URL del panel) y el API Token de Workers AI, cómo actualizar `IMAGEN_API_KEY` e `IMAGEN_URL` en el `.env`, y una versión de `imagen.js` para Cloudflare (`{ prompt, steps: 4 }` y la imagen en `datos.result.image`).
- **Qué hice:** creé el token, actualicé el `.env`, reemplacé `imagen.js` y ejecuté de nuevo. La imagen se generó correctamente.

## E. Cambios que hice yo sobre lo que entregó la IA

1. Cambié el servicio de imágenes de NVIDIA a Cloudflare, porque NVIDIA no respondía desde mi conexión, y adapté `imagen.js` y el `.env`.
2. Cambie el timeout para generar la imagen ya que tardaba mucho con el generador de NVIDIA y use el de cloudflare
3. La clave de la IMAGEN_API_KEY estaba la de NVIDIA y puse la de cloudfare en el .env


## F. Una línea que no entendía al principio

```js
const bytes = Buffer.from(resultado.base64, 'base64');
```

Con mis palabras: la API de imágenes no me envía la imagen como un archivo, sino como un texto largo en base64 dentro de un JSON, porque JSON no puede llevar datos binarios directamente. `Buffer.from(texto, 'base64')` convierte ese texto de nuevo en los bytes originales de la imagen. Luego `writeFileSync` los guarda sin codificación, y así el `.jpg` se puede abrir. Si en cambio guardara el texto o usara `'utf-8'`, el archivo quedaría dañado.



## G. Un error y cómo lo resolví

- **Error:** al generar la imagen con NVIDIA, el programa mostraba "El servicio tardó demasiado en responder" (`TimeoutError`).
- **Diagnóstico:** creé `prueba.js` para llamar directamente a la API. Con una altura de 512 respondió `422` porque FLUX solo acepta tamaños como 768 o 1024 (error de la prueba sugerida por la IA, no de mi programa). Con un tamaño válido, la petición se quedó esperando 180 segundos hasta `TimeoutError`. Eso indicó que la clave y la URL estaban bien, pero la generación no se completaba desde mi conexión.
- **Solución:** cambié al servicio de Cloudflare Workers AI. Los pasos 1 y 2 ya estaban guardados, así que el programa continuó desde el paso 3 sin gastar cuota de texto.

