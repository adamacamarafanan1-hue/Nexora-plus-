/* Jeu Adams — service worker minimal : l'application s'installe, les contenus viennent toujours du réseau. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function () { /* réseau direct */ });
