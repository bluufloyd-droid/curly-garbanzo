# QR de Documentos

Genera el código QR que lleva a un documento tuyo publicado en internet. Quien escanea
el código abre el archivo en el navegador del celular, sin cuenta, sin app y sin instalar nada.

Publicada en: **https://bluufloyd-droid.github.io/curly-garbanzo/qr/**

El circuito completo son dos piezas:

| Pieza | Para qué |
| --- | --- |
| [`documentos/`](../documentos/) | Donde vive el archivo. Es el "lugar en línea": lo que está en esa carpeta queda publicado con una dirección fija. |
| [`qr/`](.) | Esta app. Arma el código QR que apunta a esa dirección y lo descarga en PNG o SVG. |

## Cómo se usa

1. **Subí el documento** a la carpeta [`documentos/`](../documentos/) del repositorio
   (en GitHub: *Add file → Upload files*, parado en esa carpeta) y anotalo en
   `documentos.json`. El paso a paso está en [`documentos/LEEME.md`](../documentos/LEEME.md).
2. **Abrí la app** y elegí el documento en el desplegable. Abajo se ve la dirección exacta
   que va a abrir el QR; se puede tocar para comprobar que lleva a donde tiene que llevar.
   Un código apunta siempre a **un archivo**: quien lo escanea abre ese documento y nada más,
   no hay ninguna página que liste los demás.
3. **Descargalo** en PNG (para pegar en un mail, un cartel o un documento) o en SVG
   (para imprimir a cualquier tamaño sin que se pixele), o mandalo directo a la impresora.

Si el documento ya está publicado en otro lado —Drive, Dropbox, el sitio de la empresa—
la pestaña **«Cualquier enlace»** genera el QR de esa dirección, sin subir nada acá.

## Detalles

- **Texto al pie**: lo que escribas ahí sale impreso debajo del código, en el PNG, en el
  SVG y en la hoja impresa. Sirve para que quien lo vea sepa qué va a encontrar.
- **Corrección de errores**: cuanto más alta, más se puede ensuciar, tapar o doblar el
  código sin que deje de leerse, a costa de un dibujo con más puntos, que hay que imprimir
  más grande. Media alcanza para una hoja pegada en la pared; Máxima conviene en una
  etiqueta que se va a manosear.
- **Se instala como app** y **funciona sin conexión** (es una PWA, igual que el resto del
  repositorio). Lo único que necesita red es el desplegable de documentos.
- **Enlace directo**: `?doc=contrato.pdf` abre la app con ese documento ya elegido, y
  `?url=https://…` con esa dirección ya cargada.

## Reemplazar el documento sin reimprimir el QR

El código QR guarda la **dirección**, no el archivo. Si subís una versión nueva **con el
mismo nombre**, la dirección no cambia y todos los códigos ya impresos siguen sirviendo:
quien escanee va a ver la versión nueva. Por eso conviene elegir bien el nombre del
archivo desde el principio.

## Quién puede ver qué

La carpeta `documentos/` **no tiene página de índice**: entrar a
`…/curly-garbanzo/documentos/` da error, así que quien escanea un QR abre ese documento
y no tiene por dónde ver los demás.

Eso esconde la lista, pero **no vuelve privado a ningún archivo**: GitHub Pages sirve
cualquier documento de esa carpeta a quien tenga —o adivine— su dirección exacta, y los
buscadores pueden llegar a indexarlo. Dos consecuencias prácticas:

- Un nombre de archivo previsible (`contrato.pdf`, `cv.pdf`) es fácil de adivinar. Si el
  documento no debería circular, agregale al nombre un tramo al azar:
  `contrato-9f3a71c4.pdf`. La dirección deja de ser adivinable y el QR sigue igual de
  simple de escanear.
- Si el documento es realmente sensible —datos personales, información confidencial—
  no va acá. Guardalo en un servicio con enlaces protegidos y generá el QR de esa
  dirección con la pestaña «Cualquier enlace».

## El generador de códigos

`qr.js` implementa el codificador completo (ISO/IEC 18004, modelo 2): versiones 1 a 40,
modo byte en UTF-8, los cuatro niveles de corrección y elección automática de máscara.
No depende de ninguna librería ni de ningún servicio externo — importa, porque un
generador de QR online ve la dirección de todos tus documentos.

### Las pruebas

```sh
pip install segno zxing-cpp numpy
node qr/test/casos.js | python3 qr/test/verificar.py
```

Son 3060 casos —las 40 versiones, los 4 niveles, las 8 máscaras, más cargas que llenan
el símbolo justo al límite y textos con acentos— y cada uno se controla dos veces:

1. La matriz coincide **módulo por módulo** con la que produce `segno`.
2. Un decodificador real (`zxing-cpp`, el que usan los lectores de QR) lee el código y
   devuelve el texto original.
