/*
 * Genera los casos de prueba del codificador: una línea JSON por caso, con la
 * matriz que produce qr.js. `verificar.py` compara esa salida contra la
 * biblioteca `segno` y además lee cada código con un decodificador real.
 *
 *   node qr/test/casos.js | python3 qr/test/verificar.py
 */
const { qrMatrix, qrCapacity } = require('../qr.js');

const NIVELES = ['L', 'M', 'Q', 'H'];

// Texto reproducible del largo pedido, con algo de variación para que la
// matriz no quede llena de bytes repetidos.
function relleno(largo) {
  const abc = 'abcdefghijklmnopqrstuvwxyz0123456789-_./:?=&';
  let s = '';
  for (let i = 0; s.length < largo; i++) s += abc[(i * 7 + (i >> 3)) % abc.length];
  return s.slice(0, largo);
}

const casos = [];

// Textos reales, cortos, en todos los niveles.
for (const text of [
  'https://bluufloyd-droid.github.io/curly-garbanzo/documentos/contrato.pdf',
  'https://bluufloyd-droid.github.io/curly-garbanzo/',
  'A',
  '12345',
  'HOLA MUNDO $%*+-./:',
  'Documento de cesión — acentos, ñ y símbolos «€»'
]) {
  for (const ec of NIVELES) casos.push({ text, ec });
}

// Las 40 versiones en los 4 niveles, con la carga justa que llena el símbolo
// y con la mínima que obliga a saltar a esa versión.
for (let v = 1; v <= 40; v++) {
  for (const ec of NIVELES) {
    casos.push({ text: relleno(qrCapacity(v, ec)), ec, version: v });
    if (v > 1) casos.push({ text: relleno(qrCapacity(v - 1, ec) + 1), ec, version: v });
  }
}

for (const caso of casos) {
  for (const mask of [null, 0, 1, 2, 3, 4, 5, 6, 7]) {
    const m = qrMatrix(caso.text, { ec: caso.ec, mask: mask === null ? undefined : mask });
    if (caso.version && m.version !== caso.version) {
      throw new Error(`versión ${m.version} en lugar de ${caso.version} (ec ${caso.ec})`);
    }
    process.stdout.write(JSON.stringify({
      text: caso.text,
      ec: caso.ec,
      mask,
      version: m.version,
      elegida: m.mask,
      filas: m.rows.map((row) => Array.from(row).join(''))
    }) + '\n');
  }
}
