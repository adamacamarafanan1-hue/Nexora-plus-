const CACHE_VERSION = 'nexora-v212-secure-render-1';
const APP_CACHE = `${CACHE_VERSION}-application`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const PREMIUM_CACHE = 'nexora-premium-encrypted-v211';
const APP_ASSETS = [
  "./",
  "./assets/css/nexora-v209.css",
  "./assets/icons/icon-192x192.png",
  "./assets/icons/icon-512x512.png",
  "./assets/js/nexora-health.js",
  "./assets/js/nexora-parent-system-v192.js",
  "./assets/js/nexora-primary-secure-loader-v211.js",
  "./assets/js/nexora-render-guard-v212.js",
  "./assets/js/nexora-secure-content-v211.js",
  "./assets/js/nexora-security-anti-suppression-config.js",
  "./assets/js/nexora-single-file-pwa-service-worker.js",
  "./assets/js/nexora-ui-premium-icons-v1.js",
  "./assets/js/nexora-visible-cleanup-v60.js",
  "./assets/js/nx-kdo-v204-script.js",
  "./assets/js/nx-v108-adams-orientation-script.js",
  "./assets/js/nx-v136-paid-labels-script.js",
  "./assets/js/nx-v140-navigation-educative-js.js",
  "./assets/js/nx-v142-course-trainer-link-script.js",
  "./assets/js/nx-v160-homework-script.js",
  "./assets/js/nx-v168-payment-subscription-script.js",
  "./assets/js/nx-v182-real-academy-script.js",
  "./assets/js/nx-v90-bac-academy-script.js",
  "./assets/js/nx-v91-school-programs-script.js",
  "./assets/js/nx-v99-course-game-bridge.js",
  "./assets/js/script-03.js",
  "./assets/js/script-06.js",
  "./assets/js/script-07.js",
  "./assets/js/script-08.js",
  "./assets/js/script-09.js",
  "./assets/js/script-28.js",
  "./assets/js/script-43.js",
  "./index.html",
  "./manifest.webmanifest",
  "./modules/formateur/manifest.json",
  "./modules/formation/catalogue.json",
  "./modules/formation/citoyennete/manifest.json",
  "./modules/formation/communication/manifest.json",
  "./modules/formation/creation-entreprise/manifest.json",
  "./modules/formation/culture-generale/manifest.json",
  "./modules/formation/developpement-personnel/manifest.json",
  "./modules/formation/education-financiere/manifest.json",
  "./modules/formation/employabilite/manifest.json",
  "./modules/formation/entrepreneuriat/manifest.json",
  "./modules/formation/gestion-projet/manifest.json",
  "./modules/formation/hygiene/manifest.json",
  "./modules/formation/ia/manifest.json",
  "./modules/formation/innovation/manifest.json",
  "./modules/formation/leadership/manifest.json",
  "./modules/formation/marketing-digital/manifest.json",
  "./modules/formation/orientation-ethique/manifest.json",
  "./modules/formation/premiers-secours/manifest.json",
  "./modules/formation/preparation-emploi/manifest.json",
  "./modules/formation/prise-parole/manifest.json",
  "./modules/formation/redaction-pro/manifest.json",
  "./modules/formation/sante/manifest.json",
  "./modules/formation/securite-numerique/manifest.json",
  "./modules/formation/securite-travail/manifest.json",
  "./offline.html",
  "./protected/manifest.json",
  "./service-worker.js"
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(APP_CACHE).then(cache => cache.addAll(APP_ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => ![APP_CACHE,RUNTIME_CACHE,PREMIUM_CACHE].includes(key)).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
function local(request) { if(request.method!=='GET')return false;return new URL(request.url).origin===self.location.origin; }
self.addEventListener('fetch', event => {
  const request=event.request;if(!local(request))return;const url=new URL(request.url);
  if(url.pathname.startsWith('/api/')){event.respondWith(fetch(request));return;}
  if(url.pathname.startsWith('/modules/') && !url.pathname.endsWith('/manifest.json') && !url.pathname.endsWith('/catalogue.json')){event.respondWith(new Response('Contenu protégé',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}}));return;}
  if(url.pathname==='/protected/manifest.json'){event.respondWith(caches.match(request).then(cached=>cached||caches.match('./protected/manifest.json').then(fallback=>fallback||fetch(request,{cache:'no-store'}))));return;}
  if(url.pathname.startsWith('/protected/')){event.respondWith(caches.open(PREMIUM_CACHE).then(async cache => (await cache.match(request)) || fetch(request,{cache:'no-store'}).then(response => {if(response.ok)cache.put(request,response.clone());return response;})));return;}
  if(request.mode==='navigate'){event.respondWith(fetch(request).then(response=>{if(response&&response.ok)caches.open(RUNTIME_CACHE).then(cache=>cache.put(request,response.clone()));return response;}).catch(async()=> (await caches.match(request))||(await caches.match('./index.html'))||(await caches.match('./offline.html'))));return;}
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response&&response.ok)caches.open(RUNTIME_CACHE).then(cache=>cache.put(request,response.clone()));return response;})));
});
self.addEventListener('message', event => {
  const data=event.data||{};if(data==='SKIP_WAITING'||data.type==='SKIP_WAITING')self.skipWaiting();
  if(data.type==='NEXORA_PURGE_PREMIUM')event.waitUntil(caches.delete(PREMIUM_CACHE));
});
