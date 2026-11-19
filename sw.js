/* Service worker: membuat aplikasi tetap terbuka walau sinyal hilang.
   Hemat kuota: saat versi naik hanya berkas inti (±130 KB terkompresi) yang diunduh ulang.
   Pustaka besar (Excel, template Word/Excel, halaman admin) baru disimpan saat pertama kali dipakai. */
const CACHE = 'sakti-v76';
const PUSTAKA = 'sakti-pustaka-1';   // berkas bernama-versi (vendor/, fonts/): disimpan sekali, tidak diunduh ulang tiap versi
// berkas lain (gambar latar, docx.js, dinas.js, admin, kuis) tetap tersimpan otomatis saat pertama kali dibuka
const INTI = ['./', 'index.html', 'input.html', 'tema.css', 'config.js', 'common.js', 'excel.js', 'rkpicker.js', 'manifest-input.json', 'manifest-dashboard.json', 'icons/input-192.png', 'icons/dashboard-192.png', 'img/logo-sakti.svg', 'img/karakter-perempuan.webp', 'img/karakter-laki.webp', 'img/karakter-duo.webp', 'img/awan.svg'];
const PUSTAKA_INTI = ['vendor/supabase-js-2.119.0.js', 'fonts/nunito.woff2'];
const tetap = u => /\/(vendor|fonts)\//.test(u.pathname);

self.addEventListener('install', e => {
  e.waitUntil(Promise.all([
    caches.open(CACHE).then(c => c.addAll(INTI.map(f => new Request(f, { cache: 'reload' })))),
    caches.open(PUSTAKA).then(async c => { for (const f of PUSTAKA_INTI) if (!(await c.match(f))) await c.add(f); })
  ]).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== PUSTAKA).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // Hanya berkas aplikasi yang disimpan; data database selalu langsung ke server
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // Pustaka & huruf bernama-versi: ambil dari simpanan dulu (lebih cepat), unduh hanya bila belum ada
  if (tetap(u)) {
    e.respondWith(caches.open(PUSTAKA).then(c => c.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(res => { if (res.ok) c.put(e.request, res.clone()); return res; }))));
    return;
  }
  // Berkas aplikasi: jaringan dulu & selalu cek versi terbaru ke server, pakai simpanan bila offline
  e.respondWith(fetch(new Request(e.request, { cache: 'no-cache' })).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});

/* ---------- Pengingat (Web Push) ---------- */
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { isi: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.judul || 'Pengingat SAKTI', {
    body: d.isi || 'Jangan lupa catat kegiatan hari ini.', icon: 'icons/input-192.png', badge: 'icons/input-192.png',
    tag: d.tag || 'pengingat', renotify: true, requireInteraction: false, vibrate: [120, 60, 120],
    data: { url: d.url || 'input.html' }, actions: [{ action: 'catat', title: 'Catat sekarang' }]
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const tujuan = new URL((e.notification.data && e.notification.data.url) || 'input.html', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    const ada = ws.find(w => w.url.split('#')[0] === tujuan.split('#')[0]); if (ada) return ada.focus();
    return self.clients.openWindow(tujuan);
  }));
});
// langganan diperbarui otomatis oleh peramban: simpan ulang saat aplikasi dibuka berikutnya (lihat halaman Pengingat)
