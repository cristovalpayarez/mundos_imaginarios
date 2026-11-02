# mundos-ia

Programa de consola en Node.js que genera bocetos visuales de mundos imaginarios con inteligencia artificial.

Recibe por parámetros una **situación**, un **mundo** y **5 colores**, y hace tres pasos:

1. Guarda los datos en un objeto JSON (`data/mundo_<id>.json`).
2. Lee ese JSON y se lo envía a un modelo de lenguaje, que escribe la descripción de una imagen en inglés (`descripciones/mundo_<id>.txt`).
3. Envía esa descripción a un modelo de generación de imágenes y guarda el resultado (`imagenes/mundo_<id>.jpg`).

Si los archivos de un mundo ya existen, el programa no vuelve a llamar a las APIs, para ahorrar la cuota gratuita.

## Requisitos

- Node.js 20.12 o superior (`node -v`)
- npm y Git
- Cuenta gratuita en Groq (texto) y en Cloudflare (imagen)

## Configuración

1. Clona el repositorio e instala la dependencia:
   ```bash
   npm install
   ```
2. Copia el archivo de ejemplo y escribe tus claves reales:
   ```bash
   cp .env.example .env
   ```
3. Edita `.env`:
   ```
   TEXTO_API_KEY=tu_clave_de_groq
   TEXTO_URL=https://api.groq.com/openai/v1/chat/completions
   TEXTO_MODELO=openai/gpt-oss-20b
   IMAGEN_API_KEY=tu_token_de_cloudflare
   IMAGEN_URL=https://api.cloudflare.com/client/v4/accounts/TU_ACCOUNT_ID/ai/run/@cf/black-forest-labs/flux-1-schnell
   ```
   El archivo `.env` está en `.gitignore` y nunca se sube a Git.

## Uso

Las comillas son necesarias en la situación y en el mundo; sin ellas, cada palabra llegaría como un argumento distinto.

```bash
npm start -- "Una tormenta eléctrica amenaza la ciudad flotante" "Aerópolis, un archipiélago de islas que flotan sobre las nubes" rojo azul verde dorado violeta
```

Salida esperada:

```
Paso 1: mundo guardado en data/mundo_<id>.json
Paso 2: descripción guardada en descripciones/mundo_<id>.txt
Paso 3: imagen guardada en imagenes/mundo_<id>.jpg
Listo. Revisa la carpeta imagenes/
```

Si repites el mismo comando, los pasos 2 y 3 informan que los archivos ya existían y no llaman a ninguna API.

## Estructura del proyecto

```
mundos-ia/
├── src/
│   ├── index.js     # orquesta los pasos 1 a 3
│   ├── mundo.js     # valida argumentos, crea el objeto, guarda y lee el JSON
│   ├── texto.js     # consulta al modelo de lenguaje (fetch)
│   ├── imagen.js    # consulta al modelo de imágenes (fetch) y devuelve los bytes
│   └── errores.js   # fetch seguro: convierte errores en mensajes en español
├── evidencias/      # capturas de pantalla de la entrega
├── .env             # claves (NO va a Git)
├── .env.example
├── .gitignore
├── package.json
├── PROMPT.md
└── README.md
```

Carpetas generadas al ejecutar (ignoradas por Git): `data/`, `descripciones/`, `imagenes/`.

## Servicios utilizados

- **Texto:** Groq, modelo `openai/gpt-oss-20b` (https://console.groq.com).
- **Imagen:** Cloudflare Workers AI, modelo FLUX.1-schnell (https://developers.cloudflare.com/workers-ai/).

**Nota:** primero intenté usar NVIDIA FLUX.1-schnell para la imagen, pero la petición no respondía desde mi conexión (`TimeoutError` incluso a los 180 segundos, con la clave y la URL correctas). Por eso cambié a Cloudflare Workers AI, y solo tuve que modificar `imagen.js` y las variables `IMAGEN_*` del `.env`.

## Manejo de errores

El programa explica en español los fallos más comunes, sin mostrar errores técnicos y sin imprimir nunca las claves:

| Situación | Mensaje |
|---|---|
| Estado 401 o 403 | La API key no es válida. Revisa tu archivo .env. |
| Estado 402 o 429 | Superaste el límite gratuito. Espera un momento. |
| Estado 404 o 410 | El modelo o la URL no existen. Revisa tu configuración. |
| `TypeError` de fetch | No se pudo conectar. Revisa tu internet o la URL. |
| `TimeoutError` | El servicio tardó demasiado en responder. |

Las capturas de los errores provocados están en `evidencias/`.

## Experimento con `.gitignore` y `npm publish --dry-run`

Con `.gitignore` presente, `npm publish --dry-run` solo lista el código fuente, `package.json` y `README.md`. No aparecen `.env`, `data/`, `descripciones/` ni `imagenes/`, porque npm usa el `.gitignore` cuando no existe un `.npmignore`.

Después renombré temporalmente `.gitignore` a `.gitignore.off` y repetí el comando.  `.env`, `data/`, `descripciones/` e `imagenes/` en la lista de archivos del paquete.

**Por qué es peligroso:** si se publicara el paquete así, el archivo `.env` con las claves de API quedaría dentro del paquete público, y cualquier persona que lo instale podría leerlas y usar mi cuenta y mis créditos. Además se publicarían archivos generados innecesarios. Después restauré el nombre del archivo a `.gitignore`.

## Preguntas de reflexión

**1. ¿Por qué el id se calcula sin la fecha? ¿Qué pasaría si la incluyeras?**
La fecha cambia en cada ejecución. Si entrara en el hash, el mismo mundo tendría un id distinto cada vez, y el programa nunca encontraría los archivos anteriores. Entonces llamaría de nuevo a las APIs y gastaría cuota sin necesidad. Sin la fecha, los mismos datos siempre producen el mismo id.

**2. ¿Por qué se le pide al modelo de texto la descripción en inglés?**
Los modelos de imágenes se entrenaron sobre todo con descripciones en inglés, así que lo entienden mejor y suelen producir imágenes más fieles al texto. Si no lo probaste, no lo afirmes.

**3. ¿Qué diferencia hay entre una respuesta JSON de texto y una respuesta con los bytes de una imagen? ¿Qué es base64?**
La respuesta de texto trae el contenido directamente en `choices[0].message.content` y se puede guardar tal cual. Una imagen son bytes binarios, y JSON solo puede llevar texto, por eso la imagen llega codificada en base64. Base64 es una forma de representar bytes usando solo caracteres de texto. Para guardarla hay que decodificarla con `Buffer.from(texto, 'base64')`.

**4. ¿Qué pasaría si guardas la imagen con `'utf-8'`? ¿Por qué?**
El archivo quedaría dañado y no se abriría. Con `'utf-8'`, Node trata los datos como texto y los reescribe como caracteres, lo que altera los bytes originales. La imagen debe guardarse con los bytes tal cual (`writeFileSync(ruta, bytes)`, sin codificación).

**5. ¿Qué pasos consumen cuota gratuita y cómo evitaste repetirlos?**
Consumen cuota el paso 2 (modelo de texto en Groq) y el paso 3 (modelo de imágenes en Cloudflare). Antes de cada llamada uso `fs.existsSync`: si el `.txt` o el `.jpg` ya existen, el programa los reutiliza y no llama a la API. Además, el id estable permite reconocer un mundo ya generado, y si un paso falla, los archivos de los pasos anteriores se conservan.

**6. Si usaste IA: ¿qué fue lo más difícil de pedirle y qué parte tuviste que corregir tú?**
Usé Claude como apoyo. Lo más difícil fue diagnosticar el fallo del servicio de imágenes: NVIDIA se quedaba colgado y hubo que descartar causas una por una (clave, URL, tamaño de imagen, red) hasta decidir cambiar a Cloudflare. Una de las pruebas de diagnóstico que me sugirió usaba un tamaño de imagen no válido (512) y devolvió un error 422, así que tuve que interpretar el mensaje del servidor para entenderlo. 