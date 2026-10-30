// src/mundo.js
const fs = require('fs');
const path = require('path');
const hash = require('object-hash');

const CARPETA_DATA = path.join(__dirname, '..', 'data');

const USO = 'Uso: npm start -- "<situación>" "<mundo>" <color1> <color2> <color3> <color4> <color5>\n' +
  'Ejemplo: npm start -- "Una tormenta amenaza la ciudad" "Aerópolis, islas sobre las nubes" rojo azul verde dorado violeta';

// Paso 1.1: validar los argumentos y crear el objeto
function crearMundo(args) {
  if (args.length !== 7) {
    throw new Error(`Debes enviar exactamente 7 argumentos y recibí ${args.length}.\n${USO}`);
  }

  for (const arg of args) {
    if (arg.trim() === '') {
      throw new Error(`Ningún argumento puede estar vacío.\n${USO}`);
    }
  }

  const situacion = args[0].trim();
  const mundo = args[1].trim();
  const colores = args.slice(2).map((c) => c.trim());

  // Colores distintos, sin distinguir mayúsculas
  const minusculas = colores.map((c) => c.toLowerCase());
  const unicos = new Set(minusculas);
  if (unicos.size !== 5) {
    throw new Error(`Los 5 colores deben ser distintos.\n${USO}`);
  }

  // El id se calcula SIN la fecha, para que los mismos datos den el mismo id
  const id = hash({ situacion, mundo, colores }).slice(0, 8);

  return { id, situacion, mundo, colores, creadoEn: new Date().toISOString() };
}

// Rutas de todos los archivos de un mundo
function rutasMundo(id) {
  return {
    json: path.join(CARPETA_DATA, `mundo_${id}.json`),
    descripcion: path.join(__dirname, '..', 'descripciones', `mundo_${id}.txt`),
    imagen: path.join(__dirname, '..', 'imagenes', `mundo_${id}.jpg`),
  };
}

// Paso 1.2: guardar el JSON
function guardarMundo(mundo) {
  fs.mkdirSync(CARPETA_DATA, { recursive: true });
  const ruta = rutasMundo(mundo.id).json;
  fs.writeFileSync(ruta, JSON.stringify(mundo, null, 2), 'utf-8');
  return ruta;
}

// Paso 2.1: leer el JSON guardado
function leerMundo(ruta) {
  return JSON.parse(fs.readFileSync(ruta, 'utf-8'));
}

module.exports = { crearMundo, rutasMundo, guardarMundo, leerMundo };