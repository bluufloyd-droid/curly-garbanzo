/*
 * Generador de códigos QR. Modelo 2, versiones 1 a 40, modo byte (UTF-8),
 * niveles de corrección L/M/Q/H y elección automática de máscara.
 *
 * Sin dependencias: se usa tal cual en el navegador y también desde Node
 * (las pruebas de qr/test/ comparan la matriz contra una implementación
 * de referencia).
 *
 * Uso:  const m = qrMatrix('https://ejemplo/doc.pdf', { ec: 'M' });
 *       m.size            → cantidad de módulos por lado
 *       m.get(fila, col)  → true si el módulo es oscuro
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Corrección de errores por bloque: [codewords de EC, cantidad de bloques]
  // para cada nivel, en orden L, M, Q, H. Índice 0 = versión 1.
  const EC_BLOCKS = [
    [7,1,10,1,13,1,17,1],       [10,1,16,1,22,1,28,1],      [15,1,26,1,18,2,22,2],
    [20,1,18,2,26,2,16,4],      [26,1,24,2,18,4,22,4],      [18,2,16,4,24,4,28,4],
    [20,2,18,4,18,6,26,5],      [24,2,22,4,22,6,26,6],      [30,2,22,5,20,8,24,8],
    [18,4,26,5,24,8,28,8],      [20,4,30,5,28,8,24,11],     [24,4,22,8,26,10,28,11],
    [26,4,22,9,24,12,22,16],    [30,4,24,9,20,16,24,16],    [22,6,24,10,30,12,24,18],
    [24,6,28,10,24,17,30,16],   [28,6,28,11,28,16,28,19],   [30,6,26,13,28,18,28,21],
    [28,7,26,14,26,21,26,25],   [28,8,26,16,30,20,28,25],   [28,8,26,17,28,23,30,25],
    [28,9,28,17,30,23,24,34],   [30,9,28,18,30,25,30,30],   [30,10,28,20,30,27,30,32],
    [26,12,28,21,30,29,30,35],  [28,12,28,23,28,34,30,37],  [30,12,28,25,30,34,30,40],
    [30,13,28,26,30,35,30,42],  [30,14,28,28,30,38,30,45],  [30,15,28,29,30,40,30,48],
    [30,16,28,31,30,43,30,51],  [30,17,28,33,30,45,30,54],  [30,18,28,35,30,48,30,57],
    [30,19,28,37,30,51,30,60],  [30,19,28,38,30,53,30,63],  [30,20,28,40,30,56,30,66],
    [30,21,28,43,30,59,30,70],  [30,22,28,45,30,62,30,74],  [30,24,28,47,30,65,30,77],
    [30,25,28,49,30,68,30,81]
  ];

  // Centros de los patrones de alineación, desde la versión 2.
  const ALIGN_POS = [
    [6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],
    [6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],
    [6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],
    [6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],
    [6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],
    [6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],
    [6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],
    [6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]
  ];

  const EC_LEVELS = ['L', 'M', 'Q', 'H'];
  // Los dos bits que identifican el nivel dentro de la información de formato.
  const EC_BITS = { L: 1, M: 0, Q: 3, H: 2 };

  // ---- Aritmética en GF(256), polinomio primitivo 0x11D ------------------
  const EXP = new Uint8Array(256);
  const LOG = new Uint8Array(256);
  (function () {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    EXP[255] = EXP[0];
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[(LOG[a] + LOG[b]) % 255];
  }

  // Polinomio generador de grado `degree` para Reed-Solomon.
  function generatorPoly(degree) {
    let poly = [1];
    for (let i = 0; i < degree; i++) {
      const next = new Array(poly.length + 1).fill(0);
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], EXP[i]);
      }
      poly = next;
    }
    return poly;
  }

  // Codewords de corrección de errores para un bloque de datos.
  function rsEncode(data, ecCount) {
    const gen = generatorPoly(ecCount);
    const rest = new Uint8Array(ecCount);
    for (let i = 0; i < data.length; i++) {
      const factor = data[i] ^ rest[0];
      rest.copyWithin(0, 1);
      rest[ecCount - 1] = 0;
      if (factor !== 0) {
        for (let j = 0; j < ecCount; j++) rest[j] ^= gfMul(gen[j + 1], factor);
      }
    }
    return rest;
  }

  // ---- Códigos BCH de formato y de versión -------------------------------
  function bch(value, poly, bits) {
    let v = value << bits;
    const polyBits = 32 - Math.clz32(poly);
    while (32 - Math.clz32(v) >= polyBits) v ^= poly << (32 - Math.clz32(v) - polyBits);
    return (value << bits) | v;
  }

  function formatInfo(ec, mask) {
    return bch((EC_BITS[ec] << 3) | mask, 0x537, 10) ^ 0x5412;
  }

  function versionInfo(version) {
    return bch(version, 0x1f25, 12);
  }

  // ---- Geometría del símbolo ---------------------------------------------
  function alignCenters(version) {
    return version < 2 ? [] : ALIGN_POS[version - 2];
  }

  // Matriz de módulos reservados: patrones fijos e información de formato
  // y versión. Todo lo que queda libre es donde entran los datos.
  function reservedModules(version) {
    const size = version * 4 + 17;
    const res = [];
    for (let i = 0; i < size; i++) res.push(new Uint8Array(size));

    const block = (row, col, h, w) => {
      for (let r = row; r < row + h; r++) {
        for (let c = col; c < col + w; c++) {
          if (r >= 0 && r < size && c >= 0 && c < size) res[r][c] = 1;
        }
      }
    };

    // Patrones de búsqueda con su separador.
    block(0, 0, 8, 8);
    block(0, size - 8, 8, 8);
    block(size - 8, 0, 8, 8);
    // Patrones de sincronización.
    for (let i = 8; i < size - 8; i++) { res[6][i] = 1; res[i][6] = 1; }
    // Información de formato y módulo siempre oscuro.
    for (let i = 0; i < 9; i++) { res[8][i] = 1; res[i][8] = 1; }
    for (let i = 0; i < 8; i++) { res[8][size - 1 - i] = 1; res[size - 1 - i][8] = 1; }
    // Información de versión (desde la versión 7).
    if (version >= 7) {
      block(0, size - 11, 6, 3);
      block(size - 11, 0, 3, 6);
    }
    // Patrones de alineación, salvo los que pisarían un patrón de búsqueda.
    const centers = alignCenters(version);
    for (const r of centers) {
      for (const c of centers) {
        if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6)) continue;
        block(r - 2, c - 2, 5, 5);
      }
    }
    return res;
  }

  // Cantidad total de codewords del símbolo: los módulos libres, en bytes.
  const totalCodewordsCache = new Map();
  function totalCodewords(version) {
    if (totalCodewordsCache.has(version)) return totalCodewordsCache.get(version);
    const res = reservedModules(version);
    const size = res.length;
    let free = 0;
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (!res[r][c]) free++;
    const total = Math.floor(free / 8);
    totalCodewordsCache.set(version, total);
    return total;
  }

  function ecParams(version, ec) {
    const row = EC_BLOCKS[version - 1];
    const i = EC_LEVELS.indexOf(ec) * 2;
    const ecPerBlock = row[i];
    const blocks = row[i + 1];
    const dataTotal = totalCodewords(version) - ecPerBlock * blocks;
    const shortLen = Math.floor(dataTotal / blocks);
    const longBlocks = dataTotal % blocks;
    return { ecPerBlock, blocks, dataTotal, shortLen, longBlocks };
  }

  // ---- Codificación de los datos -----------------------------------------
  function utf8Bytes(text) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(text);
    return Uint8Array.from(Buffer.from(text, 'utf8'));
  }

  function charCountBits(version) {
    return version < 10 ? 8 : 16;
  }

  function chooseVersion(byteLen, ec, minVersion) {
    for (let v = Math.max(1, minVersion || 1); v <= 40; v++) {
      const needed = 4 + charCountBits(v) + 8 * byteLen;
      if (needed <= ecParams(v, ec).dataTotal * 8) return v;
    }
    return null;
  }

  // Bits del mensaje, ya rellenado hasta la capacidad de la versión.
  function dataCodewords(bytes, version, ec) {
    const { dataTotal } = ecParams(version, ec);
    const out = new Uint8Array(dataTotal);
    let bitPos = 0;
    const put = (value, len) => {
      for (let i = len - 1; i >= 0; i--) {
        if ((value >>> i) & 1) out[bitPos >> 3] |= 0x80 >> (bitPos & 7);
        bitPos++;
      }
    };
    put(0b0100, 4);                          // modo byte
    put(bytes.length, charCountBits(version));
    for (const b of bytes) put(b, 8);
    // Terminador (hasta cuatro ceros) y relleno hasta completar el byte.
    put(0, Math.min(4, dataTotal * 8 - bitPos));
    if (bitPos & 7) put(0, 8 - (bitPos & 7));
    // Bytes de relleno alternados.
    for (let i = bitPos >> 3, alt = 0; i < dataTotal; i++, alt ^= 1) out[i] = alt ? 0x11 : 0xec;
    return out;
  }

  // Reparte en bloques, calcula la corrección y entrelaza todo.
  function finalCodewords(data, version, ec) {
    const { ecPerBlock, blocks, shortLen, longBlocks } = ecParams(version, ec);
    const dataBlocks = [];
    const ecBlocks = [];
    let offset = 0;
    for (let b = 0; b < blocks; b++) {
      const len = shortLen + (b >= blocks - longBlocks ? 1 : 0);
      const chunk = data.subarray(offset, offset + len);
      offset += len;
      dataBlocks.push(chunk);
      ecBlocks.push(rsEncode(chunk, ecPerBlock));
    }
    const out = [];
    for (let i = 0; i < shortLen + 1; i++) {
      for (const b of dataBlocks) if (i < b.length) out.push(b[i]);
    }
    for (let i = 0; i < ecPerBlock; i++) {
      for (const b of ecBlocks) out.push(b[i]);
    }
    return Uint8Array.from(out);
  }

  // ---- Dibujo de la matriz ------------------------------------------------
  function maskBit(mask, r, c) {
    switch (mask) {
      case 0: return (r + c) % 2 === 0;
      case 1: return r % 2 === 0;
      case 2: return c % 3 === 0;
      case 3: return (r + c) % 3 === 0;
      case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
      case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
      default: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    }
  }

  function drawFunctionPatterns(m, version) {
    const size = m.length;
    const finder = (row, col) => {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const rr = row + r, cc = col + c;
          if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
          const inside = r >= 0 && r <= 6 && c >= 0 && c <= 6;
          const ring = r === 0 || r === 6 || c === 0 || c === 6;
          const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          m[rr][cc] = inside && (ring || core) ? 1 : 0;
        }
      }
    };
    finder(0, 0);
    finder(0, size - 7);
    finder(size - 7, 0);

    for (let i = 8; i < size - 8; i++) {
      m[6][i] = i % 2 === 0 ? 1 : 0;
      m[i][6] = i % 2 === 0 ? 1 : 0;
    }

    const centers = alignCenters(version);
    for (const r of centers) {
      for (const c of centers) {
        if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6)) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const edge = Math.max(Math.abs(dr), Math.abs(dc));
            m[r + dr][c + dc] = edge === 1 ? 0 : 1;
          }
        }
      }
    }

    m[size - 8][8] = 1; // módulo siempre oscuro

    if (version >= 7) {
      const bits = versionInfo(version);
      for (let i = 0; i < 18; i++) {
        const bit = (bits >> i) & 1;
        m[Math.floor(i / 3)][size - 11 + (i % 3)] = bit;
        m[size - 11 + (i % 3)][Math.floor(i / 3)] = bit;
      }
    }
  }

  function drawFormatInfo(m, ec, mask) {
    const size = m.length;
    const bits = formatInfo(ec, mask);
    for (let i = 0; i < 15; i++) {
      const bit = (bits >> i) & 1;
      if (i < 6) m[i][8] = bit;
      else if (i < 8) m[i + 1][8] = bit;
      else m[size - 15 + i][8] = bit;

      if (i < 8) m[8][size - 1 - i] = bit;
      else if (i === 8) m[8][7] = bit;
      else m[8][14 - i] = bit;
    }
  }

  function drawData(m, reserved, codewords, mask) {
    const size = m.length;
    let bit = 0;
    const total = codewords.length * 8;
    let row = size - 1;
    let up = true;
    for (let col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      for (;;) {
        for (let i = 0; i < 2; i++) {
          const c = col - i;
          if (reserved[row][c]) continue;
          let dark = bit < total && ((codewords[bit >> 3] >>> (7 - (bit & 7))) & 1) === 1;
          bit++;
          if (maskBit(mask, row, c)) dark = !dark;
          m[row][c] = dark ? 1 : 0;
        }
        row += up ? -1 : 1;
        if (row < 0 || row >= size) { row -= up ? -1 : 1; up = !up; break; }
      }
    }
  }

  // ---- Penalización, para elegir la máscara ------------------------------
  function penalty(m) {
    const size = m.length;
    let score = 0;

    // Regla 1: cinco o más módulos seguidos del mismo color.
    const runs = (get) => {
      for (let a = 0; a < size; a++) {
        let run = 1;
        for (let b = 1; b < size; b++) {
          if (get(a, b) === get(a, b - 1)) {
            run++;
            if (run === 5) score += 3;
            else if (run > 5) score += 1;
          } else run = 1;
        }
      }
    };
    runs((r, c) => m[r][c]);
    runs((c, r) => m[r][c]);

    // Regla 2: bloques de 2x2 del mismo color.
    for (let r = 0; r + 1 < size; r++) {
      for (let c = 0; c + 1 < size; c++) {
        const v = m[r][c];
        if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) score += 3;
      }
    }

    // Regla 3: el patrón 1:1:3:1:1 (oscuro-claro-oscuro-oscuro-oscuro-claro-oscuro)
    // con cuatro módulos claros de un lado. El borde del símbolo cuenta como claro.
    const P = [1, 0, 1, 1, 1, 0, 1];
    const linea = (get) => {
      let idx = 0;
      const claros = (desde, hasta) => {
        for (let k = Math.max(desde, 0); k < Math.min(hasta, size); k++) if (get(k)) return false;
        return true;
      };
      while (idx + 7 <= size) {
        let hit = true;
        for (let k = 0; k < 7; k++) if (get(idx + k) !== P[k]) { hit = false; break; }
        if (!hit) { idx++; continue; }
        if (idx === 0 || idx === size - 7 || claros(idx - 4, idx) || claros(idx + 7, idx + 11)) {
          score += 40;
          idx += 7;
        } else {
          idx += 4;
        }
      }
    };
    for (let a = 0; a < size; a++) {
      linea((k) => m[a][k]);
      linea((k) => m[k][a]);
    }

    // Regla 4: desbalance entre módulos oscuros y claros.
    let dark = 0;
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) dark += m[r][c];
    const ratio = (dark * 100) / (size * size);
    score += Math.floor(Math.abs(ratio - 50) / 5) * 10;
    return score;
  }

  /**
   * Arma el código QR de un texto.
   * @param {string} text        contenido (se codifica en UTF-8)
   * @param {object} [opts]      { ec: 'L'|'M'|'Q'|'H', minVersion, mask }
   * @returns {{size:number, version:number, ec:string, mask:number, get:function}}
   */
  function qrMatrix(text, opts) {
    const options = opts || {};
    const ec = (options.ec || 'M').toUpperCase();
    if (EC_LEVELS.indexOf(ec) === -1) throw new Error('Nivel de corrección inválido: ' + ec);

    const bytes = utf8Bytes(String(text));
    const version = chooseVersion(bytes.length, ec, options.minVersion);
    if (!version) throw new Error('El texto es demasiado largo para un código QR.');

    const codewords = finalCodewords(dataCodewords(bytes, version, ec), version, ec);
    const reserved = reservedModules(version);
    const size = version * 4 + 17;

    let best = null;
    const masks = options.mask == null ? [0, 1, 2, 3, 4, 5, 6, 7] : [options.mask];
    for (const mask of masks) {
      const m = [];
      for (let i = 0; i < size; i++) m.push(new Uint8Array(size));
      drawFunctionPatterns(m, version);
      drawFormatInfo(m, ec, mask);
      drawData(m, reserved, codewords, mask);
      const score = penalty(m);
      if (!best || score < best.score) best = { m, mask, score };
    }

    return {
      size,
      version,
      ec,
      mask: best.mask,
      bytes: bytes.length,
      get: (r, c) => best.m[r][c] === 1,
      rows: best.m
    };
  }

  // Capacidad en bytes de cada nivel, para avisar cuánto texto entra.
  function maxBytes(ec) {
    return ecParams(40, ec).dataTotal - 2 - 1; // menos cabecera de modo y contador
  }

  /**
   * Cuántos bytes UTF-8 entran en una versión y nivel dados, en modo byte.
   */
  function qrCapacity(version, ec) {
    const bits = ecParams(version, ec).dataTotal * 8 - 4 - charCountBits(version);
    return Math.floor(bits / 8);
  }

  return { qrMatrix, qrCapacity, qrPenalty: penalty };
});
