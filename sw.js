const CACHE_NAME = 'torneo-suizo-escolar-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './suizo.png', // Cambiado a local (Asegúrate de tener el archivo PNG en la carpeta)
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  // El audio se mantiene en línea ya que es un asset externo
  'https://raw.githubusercontent.com/ManuelVS8/Efectos_audio/37b3eb2da9c15c04dfb71dfe1be60f088ea3cdfc/Tap.mp3'
];

// INSTALACIÓN
self.addEventListener('install', event => {
  self.skipWaiting(); // Fuerza la activación inmediata del nuevo SW
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cacheando recursos Torneo Suizo Escolar');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch(err => console.error('⚠️ Error al cachear:', err))
  );
});

// ACTIVACIÓN: Limpieza de versiones antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🧹 Limpiando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Asegura que el SW controle la página inmediatamente
});

// FETCH: Estrategia Inteligente
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. EXCEPCIÓN CRÍTICA: Google Script siempre va a la RED
  // Esto es vital para que la app muestre resultados en tiempo real.
  if (url.hostname.includes('script.google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. ESTRATEGIA: Cache First (Intenta leer caché, si no, red)
  event.respondWith(
    caches.match(event.request).then(response => {
      // Si está en caché, lo servimos (rápido y offline)
      if (response) {
        return response;
      }
      
      // Si no, vamos a la red
      return fetch(event.request).then(networkResponse => {
        // Opcional: Guardar en caché los nuevos recursos encontrados
        // para la próxima vez que entremos (app shell dinámico)
        if (networkResponse && networkResponse.status === 200) {
           const responseClone = networkResponse.clone();
           caches.open(CACHE_NAME).then(cache => {
             cache.put(event.request, responseClone);
           });
        }
        return networkResponse;
      });
    }).catch(() => {
        // Opcional: Podrías devolver una página "Offline" personalizada aquí
        // si la red falla completamente y no hay nada en caché.
    })
  );
});