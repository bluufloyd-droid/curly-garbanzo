# vendor/

Copia local del **SDK oficial de Anthropic para JavaScript**
(`@anthropic-ai/sdk`, versión **0.122.0**, licencia MIT), empaquetado en un solo
módulo por [esm.sh](https://esm.sh) junto con los cuatro *shims* de Node que necesita
para correr en el navegador (`buffer`, `process`, `events`, `tty`, `async_hooks`).

Está acá adentro, y no cargado desde un CDN, a propósito: el copiloto se usa en vivo
durante una entrevista y no puede quedar colgado esperando un servidor de terceros.
Además así el service worker lo guarda con el resto de la app.

## Actualizar a una versión nueva del SDK

```sh
V=0.123.0   # la versión que quieras
curl -s "https://esm.sh/@anthropic-ai/sdk@$V/es2022/sdk.bundle.mjs" \
  | sed -E 's#(from ?)"/node/([a-z_]+)\.mjs"#\1"./\2.mjs"#g' > anthropic.mjs
for f in buffer process events tty async_hooks; do
  curl -s "https://esm.sh/node/$f.mjs" \
    | sed -E 's#(from ?)"/node/([a-z_]+)\.mjs"#\1"./\2.mjs"#g' > "$f.mjs"
done
```

Después subí el número de `CACHE` en `../sw.js` para que el service worker
se quede con los archivos nuevos.
