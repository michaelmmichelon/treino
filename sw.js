// Service worker: guarda os arquivos do app no aparelho para abrir sem internet.
// Ao mudar qualquer arquivo, troque a VERSAO: o celular baixa tudo de novo.
const VERSAO = 'treino-v2';
const ARQUIVOS = [
  './', 'index.html', 'app.css', 'tema.css', 'ui.js', 'exercicios.js', 'treinos.js', 'app.js', 'manifest.webmanifest',
  'icones/icone-180.png', 'icones/icone-192.png', 'icones/icone-512.png',
];
// As fotos (≈ 8 MB) ficam num cache separado, que não é apagado a cada versão nova
const CACHE_FOTOS = 'treino-fotos';

importScripts('exercicios.js'); // traz o GUIA, com a pasta das fotos de cada exercício

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO && n !== CACHE_FOTOS).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
  // Baixa as fotos que faltam em segundo plano, uma por vez; se a rede cair, continua na próxima abertura.
  // Sem waitUntil de propósito: o app não fica esperando 8 MB para começar a funcionar.
  guardarFotos();
});

async function guardarFotos() {
  const cache = await caches.open(CACHE_FOTOS);
  for (const g of Object.values(GUIA)) {
    for (const n of [0, 1]) {
      const url = `exercicios/${g.img}/${n}.jpg`;
      if (await cache.match(url)) continue;
      try { await cache.add(url); } catch { return; }
    }
  }
}

// Cache primeiro (abre na hora, mesmo com o sinal ruim da academia) e, em paralelo,
// busca a versão nova na rede para a próxima abertura.
self.addEventListener('fetch', (ev) => {
  const url = new URL(ev.request.url);
  if (ev.request.method !== 'GET' || url.origin !== location.origin) return;
  // Fotos não mudam: se já estão guardadas, nem vão à rede
  if (url.pathname.includes('/exercicios/')) {
    ev.respondWith(caches.open(CACHE_FOTOS).then(async (cache) => {
      const salvo = await cache.match(ev.request);
      if (salvo) return salvo;
      const resp = await fetch(ev.request);
      if (resp.ok) cache.put(ev.request, resp.clone());
      return resp;
    }));
    return;
  }
  ev.respondWith(
    caches.open(VERSAO).then(async (cache) => {
      const salvo = await cache.match(ev.request, { ignoreSearch: true });
      const daRede = fetch(ev.request)
        .then((resp) => { if (resp.ok) cache.put(ev.request, resp.clone()); return resp; })
        .catch(() => salvo);
      return salvo || daRede;
    }),
  );
});
