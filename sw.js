// Service worker de SIRENA (versión instalable para iPhone y navegador).
// Guarda la app completa en el teléfono para que abra sin conexión. VERSION cambia cuando cambia
// cualquier archivo (se recalcula al publicar), y así los teléfonos descargan la versión nueva.
const VERSION = "d1721c4d22";
const APP = "sirena-app-" + VERSION;
const MAPA = "sirena-mapa";          // teselas de la imagen satelital ya vistas, para verlas sin red
const MAX_TESELAS = 3000;
const ARCHIVOS = [
  "./",
  "./capas.js",
  "./config.js",
  "./ejemplo.js",
  "./fonts/OFL-FiraSans.txt",
  "./fonts/fira-sans-400.woff",
  "./fonts/fira-sans-600.woff",
  "./fonts/fira-sans-700.woff",
  "./fonts/fira-sans-900.woff",
  "./index.html",
  "./logos/sirena_icono.svg",
  "./logos/sirena_icono_180.png",
  "./logos/sirena_icono_32.png",
  "./logos/sirena_icono_512.png",
  "./logos/sirena_logo_horizontal.svg",
  "./logos/unal.webp",
  "./manifest.webmanifest",
  "./predios/c_10_2.js",
  "./predios/c_10_3.js",
  "./predios/c_10_4.js",
  "./predios/c_10_5.js",
  "./predios/c_10_6.js",
  "./predios/c_11_2.js",
  "./predios/c_11_3.js",
  "./predios/c_11_4.js",
  "./predios/c_11_5.js",
  "./predios/c_11_6.js",
  "./predios/c_12_2.js",
  "./predios/c_12_3.js",
  "./predios/c_12_4.js",
  "./predios/c_12_5.js",
  "./predios/c_12_6.js",
  "./predios/c_13_2.js",
  "./predios/c_13_3.js",
  "./predios/c_13_4.js",
  "./predios/c_13_5.js",
  "./predios/c_13_6.js",
  "./predios/c_14_2.js",
  "./predios/c_14_3.js",
  "./predios/c_14_4.js",
  "./predios/c_14_5.js",
  "./predios/c_14_6.js",
  "./predios/c_15_2.js",
  "./predios/c_15_3.js",
  "./predios/c_15_4.js",
  "./predios/c_15_5.js",
  "./predios/c_15_6.js",
  "./predios/c_16_2.js",
  "./predios/c_16_3.js",
  "./predios/c_16_4.js",
  "./predios/c_16_5.js",
  "./predios/c_16_6.js",
  "./predios/c_8_2.js",
  "./predios/c_8_3.js",
  "./predios/c_8_4.js",
  "./predios/c_8_5.js",
  "./predios/c_8_6.js",
  "./predios/c_9_2.js",
  "./predios/c_9_3.js",
  "./predios/c_9_4.js",
  "./predios/c_9_5.js",
  "./predios/c_9_6.js",
  "./predios/indice.js",
  "./vendor/leaflet.css",
  "./vendor/leaflet.js"
];

self.addEventListener("install", ev => {
  ev.waitUntil(caches.open(APP).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", ev => {
  ev.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("sirena-app-") && k !== APP).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function recortarMapa(){
  const c = await caches.open(MAPA), ks = await c.keys();
  for (let i = 0; i < ks.length - MAX_TESELAS; i++) await c.delete(ks[i]);
}

self.addEventListener("fetch", ev => {
  const req = ev.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Supabase, Nominatim y todo lo demás de afuera va directo a la red: nunca se guarda una respuesta vieja.
  if (url.origin !== self.location.origin){
    if (/arcgisonline\.com$/.test(url.hostname) && url.pathname.includes("/tile/")){
      ev.respondWith(caches.open(MAPA).then(async c => {
        const hit = await c.match(req);
        const red = fetch(req).then(r => { if (r.ok || r.type === "opaque"){ c.put(req, r.clone()); recortarMapa(); } return r; }).catch(() => hit);
        return hit || red;
      }));
    }
    return;
  }

  // Archivos de la app: primero lo guardado (abre al instante y sin red); la versión nueva llega con VERSION.
  ev.respondWith(caches.open(APP).then(async c => {
    const hit = await c.match(req, {ignoreSearch: true}) || (req.mode === "navigate" ? await c.match("./index.html") : null);
    if (hit) return hit;
    try{ return await fetch(req); }catch(e){ return c.match("./index.html"); }
  }));
});
