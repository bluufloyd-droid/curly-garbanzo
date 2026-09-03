/* Service worker del generador de QR: deja la app instalada y funcionando sin
   conexión. Al publicar cambios hay que subir el número de CACHE. */
var CACHE = "qr-v1";
var ARCHIVOS = [
  "./", "./index.html", "./qr.js", "./manifest.json", "./icono.svg"
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

/* Responde primero con lo guardado y en paralelo busca la versión nueva.
   La lista de documentos se pide siempre a la red primero, así un documento
   recién publicado aparece sin esperar a la próxima apertura. */
self.addEventListener("fetch", function(ev){
  var req = ev.request;
  if(req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  if(/documentos\.json$/.test(new URL(req.url).pathname)){
    ev.respondWith(fetch(req).catch(function(){ return caches.match(req); }));
    return;
  }

  ev.respondWith(
    caches.match(req).then(function(guardado){
      var red = fetch(req).then(function(res){
        if(res && res.status === 200 && res.type === "basic"){
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
