"""Verifica el codificador de qr/qr.js.

    pip install segno zxing-cpp
    node qr/test/casos.js | python3 qr/test/verificar.py

Dos controles independientes sobre cada caso:

1. La matriz coincide módulo por módulo con la que produce `segno`.
2. Un decodificador real (zxing-cpp) lee el código y devuelve el texto original.

Sobre `segno` hay dos salvedades, y por eso el parche y la máscara fija:

* `segno` agrega 8 bits de relleno aunque el flujo ya termine en un codeword
  completo; el estándar (ISO/IEC 18004, 7.4.10) sólo los agrega cuando NO
  está alineado. Con el parche de abajo `segno` sigue el estándar.
* `segno` elige la máscara puntuando la matriz *sin* la información de
  formato, mientras que qr.js (como ZXing) la puntúa con ella. Las dos son
  válidas, así que la comparación se hace con la máscara fijada; los casos de
  máscara automática se verifican leyéndolos con el decodificador.
"""
import json
import sys

import numpy as np
import segno
import segno.encoder

segno.encoder.write_padding_bits = (
    lambda buff, version, length: buff.extend([0] * ((8 - (length % 8)) % 8))
)

try:
    import zxingcpp
except ImportError:  # el control de lectura es opcional
    zxingcpp = None


def imagen(filas, escala=3, margen=4):
    """Matriz de módulos → imagen en escala de grises con zona de silencio."""
    m = np.array([[int(c) for c in fila] for fila in filas], dtype=np.uint8)
    m = np.pad(m, margen, constant_values=0)
    return np.kron(255 - m * 255, np.ones((escala, escala), dtype=np.uint8))


def main():
    total = fallos = leidos = 0
    for linea in sys.stdin:
        linea = linea.strip()
        if not linea:
            continue
        caso = json.loads(linea)
        total += 1

        if caso["mask"] is not None:
            ref = segno.make(
                caso["text"],
                error=caso["ec"],
                version=caso["version"],
                mode="byte",
                mask=caso["mask"],
                boost_error=False,
            )
            esperado = ["".join(str(b) for b in fila) for fila in ref.matrix]
            if esperado != caso["filas"]:
                fallos += 1
                print(
                    "matriz distinta: ec=%s mask=%s version=%s texto=%.40r"
                    % (caso["ec"], caso["mask"], caso["version"], caso["text"]),
                    file=sys.stderr,
                )
                continue

        if zxingcpp is not None:
            res = zxingcpp.read_barcode(imagen(caso["filas"]))
            leido = res.text if res and res.valid else None
            if leido != caso["text"]:
                fallos += 1
                print(
                    "no se lee igual: ec=%s mask=%s version=%s\n  esperado %.60r\n  leído    %.60r"
                    % (caso["ec"], caso["mask"], caso["version"], caso["text"], leido),
                    file=sys.stderr,
                )
                continue
            leidos += 1

    print(
        "%d casos, %d leídos con decodificador, %d fallas"
        % (total, leidos, fallos)
    )
    return 1 if fallos else 0


if __name__ == "__main__":
    sys.exit(main())
