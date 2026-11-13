const CACHE='gp-shell-v3-no-login';
self.addEventListener('install',event=>{event.waitUntil(self.skipWaiting())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('gp-shell-')).map(k=>caches.delete(k)));await self.clients.claim()})())});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(new Request(req,{cache:'no-store'})).catch(async()=>{const cached=await caches.match(req);return cached||Response.error()}));
 }
});
