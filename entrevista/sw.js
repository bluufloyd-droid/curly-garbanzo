/* Service worker del copiloto: deja la app instalada y lista para abrir al
   instante, y guarda la librería de Claude para no depender del CDN en el
   momento de la entrevista. Al publicar cambios hay que subir CACHE. */
var CACHE = "copiloto-v12";
var ARCHIVOS = [
  "./", "./index.html", "./manifest.json", "./icono.svg",
  "./vendor/anthropic.mjs", "./vendor/buffer.mjs", "./vendor/process.mjs",
  "./vendor/events.mjs", "./vendor/tty.mjs", "./vendor/async_hooks.mjs"
];

self.addEventListener("install", function(ev){
  ev.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ARCHIVOS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(ev){
  ev.waitUntil(
    caches.keys().then(function(claves){
      return Promise.all(claves.map(function(k){
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(ev){
  var req = ev.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  /* Nunca tocamos las llamadas a la API: siempre van a la red. */
  if (url.hostname.indexOf("anthropic.com") !== -1) return;

  if (url.origin !== self.location.origin) return;

  /* La app: responde con lo guardado y busca la versión nueva en paralelo. */
  ev.respondWith(
    caches.match(req).then(function(guardado){
      var red = fetch(req).then(function(res){
        if (res && res.status === 200 && res.type === "basic"){
          var copia = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copia); });
        }
        return res;
      }).catch(function(){
        return guardado || caches.match("./index.html");
      });
      return guardado || red;
    })
  );
});
