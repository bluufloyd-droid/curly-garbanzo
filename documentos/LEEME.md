# Cómo publicar un documento

Todo lo que esté en esta carpeta queda publicado en internet, con una dirección fija,
apenas se sube al repositorio. Esa dirección es la que va adentro del código QR.

## Los tres pasos

1. **Subí el archivo a esta carpeta.** Desde la web de GitHub:
   *Add file → Upload files*, estando parado en `documentos/`.
   Usá nombres sin espacios ni acentos (`contrato-alquiler.pdf`, no `Contrato Alquiler.pdf`):
   así la dirección queda corta y el QR más simple de leer.

2. **Anotalo en `documentos.json`**, para que aparezca en la lista y en el generador:

   ```json
   {
     "documentos": [
       {
         "archivo": "contrato-alquiler.pdf",
         "titulo": "Contrato de alquiler 2026",
         "descripcion": "Versión firmada, con el anexo de expensas."
       }
     ]
   }
   ```

   `archivo` es lo único obligatorio y tiene que coincidir **exactamente** con el
   nombre del archivo subido. Separá cada documento con una coma.

3. **Generá el QR** en el [generador](../qr/) y descargalo en PNG o SVG.

La dirección del documento queda armada así:

```
https://bluufloyd-droid.github.io/curly-garbanzo/documentos/contrato-alquiler.pdf
```

## Qué formatos conviene subir

Los navegadores de celular abren directo el **PDF**, las imágenes (`.jpg`, `.png`)
y las páginas `.html`. Un `.docx` o un `.xlsx`, en cambio, se descargan en vez de
verse: si querés que se lea de una, exportalo a PDF antes de subirlo.

## Reemplazar un documento

Subí el archivo nuevo **con el mismo nombre**: la dirección no cambia y el QR ya
impreso sigue sirviendo. Por eso conviene elegir bien el nombre desde el principio.

## Importante: esto es público

Cualquiera que tenga el enlace —o que escanee el QR— puede ver el documento, y los
buscadores pueden llegar a indexarlo. No subas acá nada con datos personales
sensibles, contraseñas ni información que no quieras que circule.
