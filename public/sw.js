// Zelf-opruimende service worker: schakelt zichzelf uit en wist alle oude caches.
// Hierdoor draait niemand meer op een vastgeroeste oude versie — elke keer dat de
// app opent wordt de nieuwste code van het netwerk geladen.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: "window" });
    for (const client of clients) client.navigate(client.url);
  })());
});
