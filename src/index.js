// src/index.js
const fs = require('fs');
const path = require('path');
const { crearMundo, rutasMundo, guardarMundo, leerMundo } = require('./mundo');
const { describirMundo } = require('./texto');
const { generarImagen } = require('./imagen');

// Cargar el .env (si no existe, los pasos que lo necesiten avisarán)
try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch (error) {
  // sin .env: se avisará más adelante si falta alguna variable
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const nuevo = crearMundo(args);
    const rutas = rutasMundo(nuevo.id);

    // Paso 1: guardar el JSON (si ya existe, se conserva el original)
    if (!fs.existsSync(rutas.json)) {
      guardarMundo(nuevo);
    }
    console.log(`Paso 1: mundo guardado en data/mundo_${nuevo.id}.json`);

    // Paso 2: descripción con el modelo de texto
    if (fs.existsSync(rutas.descripcion)) {
      console.log('Paso 2: la descripción ya existía, no se llamó al modelo de texto.');
    } else {
      const mundo = leerMundo(rutas.json); // se consulta lo guardado, no la memoria
      const descripcion = await describirMundo(mundo);
      fs.mkdirSync(path.dirname(rutas.descripcion), { recursive: true });
      fs.writeFileSync(rutas.descripcion, descripcion, 'utf-8');
      console.log(`Paso 2: descripción guardada en descripciones/mundo_${nuevo.id}.txt`);
    }

    // Paso 3: imagen con el modelo de imágenes
    if (fs.existsSync(rutas.imagen)) {
      console.log('Paso 3: la imagen ya existía, no se llamó al modelo de imágenes.');
    } else {
      const descripcion = fs.readFileSync(rutas.descripcion, 'utf-8'); // se lee del .txt
      const bytes = await generarImagen(descripcion);
      fs.mkdirSync(path.dirname(rutas.imagen), { recursive: true });
      fs.writeFileSync(rutas.imagen, bytes); // bytes tal cual, SIN 'utf-8'
      console.log(`Paso 3: imagen guardada en imagenes/mundo_${nuevo.id}.jpg`);
    }

    console.log('Listo. Revisa la carpeta imagenes/');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();