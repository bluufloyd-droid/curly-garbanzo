/* Service worker del marcador: guarda la app en el dispositivo para que abra
   sin conexión. Al cambiar la app hay que subir el número de CACHE. */
var CACHE = "marcador-v3";
var ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png"
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

/* Responde primero con lo guardado (abre al instante y sirve sin señal) y en
   paralelo busca la versión nueva para la próxima vez que se abra. */
self.addEventListener("fetch", function(ev){
  var req = ev.request;
  if(req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  ev.respondWith(
    caches.match(req).then(function(guardado){
      var red = fetch(req).then(function(res){
        if(res && res.status === 200 && res.type === "basic"){
          var copia = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copia); });
        }
        return res;
      }).catch(function(){
        // Sin conexión: si es una navegación, al menos devolvemos la app.
        return guardado || caches.match("./index.html");
      });
      return guardado || red;
    })
  );
});
