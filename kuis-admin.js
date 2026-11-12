/* =====================================================================
   KUIS BerAKHLAK — menu admin & layar pemandu kuis (gaya Kahoot)
   Admin membuka kuis di laptop/proyektor, pegawai menjawab dari HP (kuis.html).
   Data keadaan diambil tiap detik dari Supabase (fungsi kuis_layar).
   ===================================================================== */
(() => {
  const S = window.SKP, $ = id => document.getElementById(id), esc = S.esc, c = () => S.client();
  const WARNA = ['#e21b3c', '#1368ce', '#d89e00', '#26890c'];
  const BENTUK = [
    '<svg viewBox="0 0 32 32"><path d="M16 4 29 27H3z" fill="#fff"/></svg>',
    '<svg viewBox="0 0 32 32"><path d="M16 2 30 16 16 30 2 16z" fill="#fff"/></svg>',
    '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#fff"/></svg>',
    '<svg viewBox="0 0 32 32"><rect x="4" y="4" width="24" height="24" rx="2" fill="#fff"/></svg>'];
  const fmt = n => Number(n || 0).toLocaleString('id-ID');
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'k' + Date.now().toString(16) + Math.random().toString(16).slice(2, 10));
  const inisial = n => String(n || '?').replace(/,.*$/, '').trim().split(/\s+/).map(w => w.replace(/\.+$/, '')).filter(w => w && !/^(hj|h|dr|ir|drs|dra|prof)$/i.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  const namaPendek = n => { const w = String(n || '').replace(/,.*$/, '').trim().split(/\s+/).filter(x => !/^(hj?|dr|ir|drs|dra|prof)\.?$/i.test(x)); return w.slice(0, 3).join(' ') || n; };

  const css = `
  .kz-hero { position: relative; overflow: hidden; border-radius: 22px; padding: 26px 28px; background: linear-gradient(135deg, #46178f, #7b2ff7 60%, #a855f7); color: #fff; display: flex; align-items: center; gap: 20px; flex-wrap: wrap; margin-bottom: 20px; box-shadow: 0 14px 30px rgba(70,23,143,.25); }
  .kz-hero h2 { margin: 6px 0 6px; font-size: 28px; letter-spacing: -.3px; } .kz-hero p { margin: 0; opacity: .9; max-width: 620px; font-size: 14.5px; line-height: 1.5; }
  .kz-hero > div { flex: 1; min-width: 240px; position: relative; z-index: 1; }
  .kz-tag { display: inline-block; background: rgba(255,255,255,.18); border-radius: 99px; padding: 4px 12px; font-size: 12.5px; font-weight: 700; }
  .kz-hero .dekor { position: absolute; inset: 0; pointer-events: none; } .kz-hero .dekor i { position: absolute; width: 70px; height: 70px; opacity: .14; }
  .kz-hero .dekor i svg { width: 100%; height: 100%; }
  .kz-main { position: relative; z-index: 1; border: 0; background: #fff; color: #46178f; font-weight: 900; font-size: 18px; border-radius: 14px; padding: 16px 30px; cursor: pointer; box-shadow: 0 5px 0 rgba(0,0,0,.22); font-family: inherit; }
  .kz-main:active { transform: translateY(3px); box-shadow: 0 2px 0 rgba(0,0,0,.22); }
  .kz-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
  .kz-kartu { padding: 20px 22px; } .kz-kartu h3 { margin: 0 0 4px; font-size: 17px; } .kz-kartu .kz-sub { margin: 0 0 14px; color: var(--teks2); font-size: 13px; font-weight: 400; }
  .kz-lbl { display: block; font-size: 12.5px; font-weight: 700; color: var(--teks2); margin: 14px 0 6px; text-transform: uppercase; letter-spacing: .3px; }
  .kz-in { width: 100%; box-sizing: border-box; border: 1px solid #d7e0ea; border-radius: 10px; padding: 10px 12px; font: inherit; font-size: 14.5px; }
  .kz-chipset { display: flex; gap: 8px; flex-wrap: wrap; } .kz-chipset button { border: 1px solid #d7e0ea; background: #fff; border-radius: 10px; padding: 9px 14px; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; color: var(--teks); }
  .kz-chipset button.on { background: #46178f; border-color: #46178f; color: #fff; }
  .kz-info { margin: 14px 0 0; font-size: 13px; color: var(--teks2); background: #f6f2fd; border-radius: 10px; padding: 10px 12px; }
  .kz-info b { color: #46178f; }
  .kz-contoh { margin-top: 12px; font-size: 13px; } .kz-contoh summary { cursor: pointer; color: #46178f; font-weight: 700; } .kz-contoh ol { margin: 8px 0 0; padding-left: 20px; max-height: 260px; overflow: auto; } .kz-contoh li { margin-bottom: 6px; } .kz-contoh li small { color: #059669; display: block; }
  .kz-rw { display: flex; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f3f7; } .kz-rw:last-child { border-bottom: 0; }
  .kz-rw .ik { width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; font-size: 20px; background: #f6f2fd; flex: 0 0 auto; }
  .kz-rw .tx { flex: 1; min-width: 0; } .kz-rw .tx b { display: block; font-size: 14.5px; } .kz-rw .tx small { color: var(--teks2); font-size: 12.5px; }
  .kz-rw .jr { font-size: 12.5px; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .kz-rw .aksi { display: flex; gap: 6px; } .kz-rw .aksi button { border: 1px solid #d7e0ea; background: #fff; border-radius: 9px; padding: 7px 10px; font: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer; white-space: nowrap; }
  .kz-rw .aksi button.ung { background: #46178f; border-color: #46178f; color: #fff; }
  .kz-live { display: inline-flex; align-items: center; gap: 5px; color: #15803d; font-weight: 700; font-size: 12px; } .kz-live::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: #22c55e; }
  .kz-bank-kep { display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap; } .kz-bank-kep > div { flex: 1; min-width: 220px; }
  .kz-tbtn { border: 0; background: #46178f; color: #fff; border-radius: 11px; padding: 10px 16px; font: inherit; font-weight: 700; cursor: pointer; }
  .kz-soalitem { border: 1px solid #edf1f5; border-radius: 14px; padding: 14px 16px; margin-top: 12px; background: #fbfcfe; }
  .kz-soalitem.mati { opacity: .55; }
  .kz-soalitem .q { font-weight: 700; font-size: 14.5px; margin-bottom: 10px; display: flex; gap: 10px; } .kz-soalitem .q span { flex: 1; }
  .kz-ops { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; } .kz-ops div { display: flex; align-items: center; gap: 8px; border-radius: 9px; padding: 7px 10px; color: #fff; font-size: 13px; font-weight: 600; }
  .kz-ops div svg { width: 16px; height: 16px; flex: 0 0 auto; } .kz-ops div.salah { opacity: .45; } .kz-ops div b { margin-left: auto; }
  .kz-soalitem .kz-alat { display: flex; gap: 6px; margin-top: 10px; justify-content: flex-end; } .kz-soalitem .kz-alat button { border: 1px solid #d7e0ea; background: #fff; border-radius: 9px; padding: 6px 10px; font: inherit; font-size: 12.5px; cursor: pointer; }
  .kz-form { border: 2px dashed #c9b6ef; border-radius: 16px; padding: 16px; margin-top: 14px; background: #fcfaff; }
  .kz-form .opsi { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
  .kz-form .opsi label { display: flex; align-items: center; gap: 8px; border-radius: 11px; padding: 6px 8px 6px 10px; color: #fff; }
  .kz-form .opsi label svg { width: 20px; height: 20px; flex: 0 0 auto; } .kz-form .opsi input[type=text] { flex: 1; min-width: 0; border: 0; border-radius: 8px; padding: 8px 10px; font: inherit; font-size: 14px; }
  .kz-form .opsi input[type=radio] { width: 20px; height: 20px; accent-color: #fff; flex: 0 0 auto; margin: 0; }
  .kz-form .ket { font-size: 12.5px; color: var(--teks2); margin-top: 8px; }
  .kz-form .tb { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }
  .kz-kosong { text-align: center; color: var(--teks2); font-size: 13.5px; padding: 22px 10px; }
  @media (max-width: 860px) { .kz-grid { grid-template-columns: 1fr; } }
  @media (max-width: 560px) { .kz-ops, .kz-form .opsi { grid-template-columns: 1fr; } .kz-hero { padding: 22px 20px; } .kz-main { width: 100%; } .kz-rw { flex-wrap: wrap; } .kz-rw .aksi { width: 100%; justify-content: flex-end; } }

  /* ---------- Layar pemandu (layar penuh) ---------- */
  .kz-layar { position: fixed; inset: 0; z-index: 9000; background: #46178f; color: #fff; display: flex; flex-direction: column; overflow: hidden; font-family: inherit; }
  .kz-layar[hidden] { display: none; }
  .kz-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
  .kz-bg i { position: absolute; opacity: .07; animation: kzApung 18s linear infinite; } .kz-bg i svg { width: 100%; height: 100%; }
  @keyframes kzApung { from { transform: translateY(0) rotate(0); } to { transform: translateY(-40px) rotate(360deg); } }
  .kz-atas { position: relative; z-index: 2; display: flex; align-items: center; gap: 12px; padding: 12px 20px; background: rgba(0,0,0,.2); font-weight: 800; font-size: 17px; }
  .kz-atas .jd { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .kz-atas .no { background: rgba(255,255,255,.16); border-radius: 9px; padding: 5px 12px; font-size: 15px; white-space: nowrap; }
  .kz-atas .pin { background: #fff; color: #333; border-radius: 9px; padding: 5px 12px; font-size: 15px; white-space: nowrap; } .kz-atas .pin b { letter-spacing: .08em; }
  .kz-atas .sp { flex: 1; }
  .kz-atas button { background: rgba(255,255,255,.15); border: 0; color: #fff; border-radius: 10px; height: 40px; min-width: 40px; padding: 0 12px; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; white-space: nowrap; }
  .kz-atas button:hover { background: rgba(255,255,255,.26); }
  .kz-isi { position: relative; z-index: 1; flex: 1; min-height: 0; display: flex; flex-direction: column; padding: clamp(14px, 2.4vh, 26px) clamp(16px, 3vw, 40px); }
  .kz-bawah { position: relative; z-index: 2; display: flex; align-items: center; gap: 12px; padding: 12px 20px; background: rgba(0,0,0,.2); min-height: 52px; }
  .kz-bawah .ket { flex: 1; opacity: .85; font-size: 15px; font-weight: 600; }
  .kz-btn { background: #fff; color: #46178f; border: 0; border-radius: 12px; padding: 13px 26px; font: inherit; font-weight: 900; font-size: 17px; cursor: pointer; box-shadow: 0 4px 0 rgba(0,0,0,.28); white-space: nowrap; }
  .kz-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 rgba(0,0,0,.28); } .kz-btn:disabled { opacity: .5; cursor: default; }
  .kz-btn.sek { background: rgba(255,255,255,.16); color: #fff; box-shadow: none; }
  .kz-w { max-width: 1200px; margin: 0 auto; width: 100%; }
  /* lobi */
  .kz-lobi { display: flex; align-items: center; gap: clamp(18px, 3vw, 40px); background: rgba(0,0,0,.18); border-radius: 22px; padding: clamp(16px, 2.4vw, 28px); }
  .kz-qr { background: #fff; border-radius: 16px; padding: 12px; flex: 0 0 auto; } .kz-qr svg, .kz-qr img { width: clamp(140px, 19vw, 240px); height: auto; display: block; }
  .kz-gab { flex: 1; min-width: 0; } .kz-gab .l1 { font-size: clamp(16px, 1.7vw, 22px); opacity: .9; font-weight: 700; } .kz-gab .url { font-size: clamp(18px, 2.2vw, 30px); font-weight: 900; word-break: break-all; margin: 4px 0 14px; }
  .kz-gab .l2 { font-size: clamp(15px, 1.5vw, 20px); opacity: .85; font-weight: 700; } .kz-gab .pinb { font-size: clamp(54px, 8.5vw, 116px); font-weight: 900; letter-spacing: .07em; line-height: 1; }
  .kz-gab .ket { margin-top: 12px; opacity: .8; font-size: clamp(13px, 1.2vw, 16px); }
  .kz-pkep { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: clamp(14px, 2.4vh, 26px) 0 12px; }
  .kz-pkep .jml { background: rgba(0,0,0,.25); border-radius: 12px; padding: 8px 16px; font-size: 20px; font-weight: 900; } .kz-pkep .jdl { font-size: clamp(20px, 2.4vw, 32px); font-weight: 900; }
  .kz-chips { flex: 1; min-height: 0; overflow: auto; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; align-content: flex-start; }
  .kz-chip { background: #fff; color: #222; border-radius: 10px; padding: 10px 18px; font-weight: 800; font-size: clamp(15px, 1.5vw, 20px); animation: kzPop .45s cubic-bezier(.3,1.6,.6,1); }
  @keyframes kzPop { from { transform: scale(0); } to { transform: scale(1); } }
  .kz-tunggu { text-align: center; font-size: clamp(18px, 2vw, 26px); font-weight: 800; opacity: .85; margin: auto; animation: kzKedip 2s ease-in-out infinite; }
  @keyframes kzKedip { 50% { opacity: .45; } }
  /* soal */
  .kz-soal { background: #fff; color: #1d1d1d; border-radius: 14px; padding: clamp(14px, 2.4vh, 28px) clamp(16px, 2.4vw, 32px); text-align: center; font-size: clamp(22px, 2.9vw, 42px); font-weight: 900; line-height: 1.25; box-shadow: 0 6px 0 rgba(0,0,0,.2); }
  .kz-tengah { flex: 1; min-height: 110px; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 14px 0; }
  .kz-timer { position: relative; width: clamp(92px, 10vw, 140px); aspect-ratio: 1; border-radius: 50%; display: grid; place-items: center; font-size: clamp(36px, 4.4vw, 60px); font-weight: 900; background: conic-gradient(#fff var(--p, 100%), rgba(255,255,255,.18) 0); }
  .kz-timer::before { content: ""; position: absolute; inset: 9px; border-radius: 50%; background: #864cbf; } .kz-timer span { position: relative; } .kz-timer.genting::before { background: #e21b3c; } .kz-timer.genting { animation: kzDenyut .5s infinite alternate; }
  @keyframes kzDenyut { to { transform: scale(1.07); } }
  .kz-logo { display: flex; gap: 4px; justify-content: center; flex-wrap: wrap; } .kz-logo span { width: clamp(30px, 3.6vw, 52px); height: clamp(38px, 4.6vw, 66px); border-radius: 10px; display: grid; place-items: center; font-size: clamp(18px, 2.4vw, 34px); font-weight: 900; box-shadow: 0 4px 0 rgba(0,0,0,.2); animation: kzLompat 2.4s ease-in-out infinite; }
  @keyframes kzLompat { 0%, 70%, 100% { transform: translateY(0); } 80% { transform: translateY(-10px); } }
  .kz-dj { text-align: center; min-width: clamp(92px, 10vw, 140px); } .kz-dj b { display: block; font-size: clamp(36px, 4.4vw, 60px); line-height: 1; } .kz-dj span { font-size: clamp(14px, 1.4vw, 19px); font-weight: 700; opacity: .9; }
  .kz-opsi { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(8px, 1.2vw, 14px); }
  .kz-op { display: flex; align-items: center; gap: clamp(10px, 1.4vw, 18px); border-radius: 10px; padding: clamp(12px, 2vh, 22px) clamp(14px, 1.8vw, 24px); font-size: clamp(16px, 1.9vw, 27px); font-weight: 800; line-height: 1.25; color: #fff; box-shadow: 0 5px 0 rgba(0,0,0,.25); min-height: clamp(64px, 11vh, 120px); transition: opacity .4s, transform .4s; }
  .kz-op svg { width: clamp(28px, 3.2vw, 46px); height: clamp(28px, 3.2vw, 46px); flex: 0 0 auto; } .kz-op .tx { flex: 1; } .kz-op .cek { font-size: clamp(26px, 3vw, 42px); }
  .kz-op.redup { opacity: .28; } .kz-op.benar { transform: scale(1.02); }
  /* sebaran jawaban */
  .kz-sebaran { flex: 1; min-height: 150px; display: flex; align-items: flex-end; justify-content: center; gap: clamp(14px, 4vw, 54px); padding: 18px 0 12px; }
  .kz-bar { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; width: clamp(64px, 9vw, 124px); }
  .kz-bar .n { font-size: clamp(22px, 2.6vw, 36px); font-weight: 900; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
  .kz-bar i { width: 100%; border-radius: 8px 8px 0 0; height: 8px; transition: height 1s cubic-bezier(.2,.8,.2,1); }
  .kz-bar .bt { width: 100%; border-radius: 0 0 8px 8px; padding: 8px 0; display: flex; justify-content: center; align-items: center; gap: 6px; font-weight: 900; font-size: 20px; } .kz-bar .bt svg { width: 26px; height: 26px; }
  .kz-bar.redup { opacity: .35; }
  /* papan skor */
  .kz-jb { text-align: center; } .kz-jb span { display: inline-block; background: #fff; color: #222; font-size: clamp(24px, 3.2vw, 44px); font-weight: 900; border-radius: 12px; padding: 10px 34px; box-shadow: 0 5px 0 rgba(0,0,0,.2); }
  .kz-papan { max-width: 920px; margin: clamp(16px, 3vh, 30px) auto 0; width: 100%; display: flex; flex-direction: column; gap: clamp(8px, 1.4vh, 14px); }
  .kz-baris { display: flex; align-items: center; gap: 16px; background: #fff; color: #222; border-radius: 12px; padding: clamp(10px, 1.6vh, 16px) 20px; font-size: clamp(18px, 2.2vw, 30px); font-weight: 900; box-shadow: 0 4px 0 rgba(0,0,0,.2); transition: transform 1s cubic-bezier(.2,.8,.2,1), opacity .6s; }
  .kz-baris .rk { width: clamp(38px, 3.6vw, 52px); height: clamp(38px, 3.6vw, 52px); border-radius: 10px; background: #46178f; color: #fff; display: grid; place-items: center; flex: 0 0 auto; }
  .kz-baris.r1 .rk { background: #f5b301; } .kz-baris.r2 .rk { background: #94a3b8; } .kz-baris.r3 .rk { background: #e07b39; }
  .kz-baris .nm { flex: 1; min-width: 0; } .kz-baris .nm small { display: block; font-size: .5em; color: #6b7280; font-weight: 700; }
  .kz-baris .gr { font-size: .62em; font-weight: 800; white-space: nowrap; } .kz-baris .gr.naik { color: #16a34a; } .kz-baris .gr.api { color: #ea580c; }
  .kz-baris .sk { min-width: 110px; text-align: right; font-variant-numeric: tabular-nums; }
  .kz-baris .plus { font-size: .55em; color: #16a34a; display: block; }
  /* podium */
  .kz-podium { flex: 1; min-height: 0; display: flex; align-items: flex-end; justify-content: center; gap: clamp(10px, 2vw, 26px); padding-top: 10px; }
  .kz-tiang { display: flex; flex-direction: column; align-items: center; width: clamp(140px, 20vw, 270px); }
  .kz-tiang .nmp { background: #fff; color: #222; border-radius: 12px; padding: 10px 14px; font-weight: 900; font-size: clamp(16px, 1.9vw, 26px); text-align: center; margin-bottom: 12px; max-width: 100%; box-sizing: border-box; opacity: 0; animation: kzMuncul .6s forwards; animation-delay: var(--t); line-height: 1.2; }
  .kz-tiang .nmp small { display: block; font-size: .6em; color: #6b7280; }
  .kz-tiang .blok { width: 100%; height: 0; border-radius: 12px 12px 0 0; display: flex; flex-direction: column; align-items: center; padding-top: 14px; font-weight: 900; font-size: clamp(18px, 2vw, 28px); overflow: hidden; animation: kzNaik 1.3s forwards cubic-bezier(.2,.8,.2,1); animation-delay: var(--t); }
  .kz-tiang .medali { font-size: clamp(44px, 5.4vw, 78px); line-height: 1.1; }
  .kz-tiang.j1 .blok { background: linear-gradient(#f5b301, #d18f00); } .kz-tiang.j2 .blok { background: linear-gradient(#b8c4d4, #8a99ad); } .kz-tiang.j3 .blok { background: linear-gradient(#e8925a, #c26a2f); }
  @keyframes kzNaik { to { height: var(--h); } } @keyframes kzMuncul { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
  .kz-lain { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 14px; } .kz-lain span { background: rgba(0,0,0,.25); border-radius: 9px; padding: 6px 12px; font-weight: 700; font-size: 15px; }
  .kz-konfeti { position: absolute; inset: 0; pointer-events: none; z-index: 3; }
  @media (max-width: 760px) { .kz-lobi { flex-direction: column; text-align: center; } .kz-opsi { grid-template-columns: 1fr; } .kz-atas .jd { display: none; } .kz-baris .gr { display: none; } }
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---------- Pengaturan & data ---------- */
  let set = { judul: 'Kuis BerAKHLAK', n: 10, d: 20, sumber: 'semua' };
  try { Object.assign(set, JSON.parse(localStorage.getItem('sakti-kuis-set') || '{}')); } catch (e) { }
  const simpanSet = () => { try { localStorage.setItem('sakti-kuis-set', JSON.stringify(set)); } catch (e) { } };
  let bank = [], riwayat = [], ubah = null, dibangun = false;
  const ACAK_BANK = S.soalBerakhlak().length;

  function bangun() {
    const sec = $('v-kuis'); if (!sec || dibangun) return; dibangun = true;
    const dek = [[6, 12, 0], [80, 8, 1], [88, 60, 2], [62, 70, 3], [40, -10, 2]].map(([x, y, b]) => `<i style="left:${x}%;top:${y}%">${BENTUK[b]}</i>`).join('');
    sec.innerHTML = `
    <div class="kz-hero"><div class="dekor">${dek}</div><div><span class="kz-tag">🎮 Kuis langsung</span><h2>Kuis BerAKHLAK</h2><p>Tampilkan layar kuis di proyektor. Pegawai bergabung dari HP dengan memindai kode QR atau memasukkan PIN. Semakin cepat menjawab benar, semakin besar poinnya, dan papan juara diperbarui langsung setelah setiap soal.</p></div>
      <button class="kz-main" type="button" id="kzMulai">▶ Mulai Kuis</button></div>
    <div class="kz-grid">
      <div class="d-kartu kz-kartu"><h3>Pengaturan permainan</h3><p class="kz-sub">Soal diacak setiap kali kuis dimulai.</p>
        <label class="kz-lbl" for="kzJudul">Judul kuis</label><input class="kz-in" id="kzJudul" maxlength="60">
        <span class="kz-lbl">Jumlah soal</span><div class="kz-chipset" data-set="n">${[5, 10, 15, 20].map(v => `<button type="button" data-v="${v}">${v}</button>`).join('')}</div>
        <span class="kz-lbl">Waktu menjawab</span><div class="kz-chipset" data-set="d">${[10, 20, 30, 45].map(v => `<button type="button" data-v="${v}">${v} detik</button>`).join('')}</div>
        <span class="kz-lbl">Sumber soal</span><div class="kz-chipset" data-set="sumber"><button type="button" data-v="semua">Materi BerAKHLAK + soal tambahan</button><button type="button" data-v="tambahan">Soal tambahan saja</button></div>
        <p class="kz-info" id="kzInfo"></p>
        <details class="kz-contoh"><summary>Lihat contoh soal otomatis</summary><ol id="kzContoh"></ol></details></div>
      <div class="d-kartu kz-kartu"><h3>Juara kuis</h3><p class="kz-sub">Riwayat permainan beserta tiga besar pemenangnya.</p><div id="kzRiwayat"><div class="kz-kosong">Memuat…</div></div></div>
    </div>
    <div class="d-kartu kz-kartu" style="margin-bottom:22px"><div class="kz-bank-kep"><div><h3>Soal tambahan</h3><p class="kz-sub" style="margin:0">Buat soal sendiri, misalnya tentang budaya kerja kantor. Soal tambahan ikut diacak bersama materi BerAKHLAK.</p></div><button class="kz-tbtn" type="button" id="kzTambah">+ Tambah soal</button></div>
      <div id="kzForm"></div><div id="kzBank"></div></div>`;
    $('kzJudul').value = set.judul; $('kzJudul').oninput = () => { set.judul = $('kzJudul').value; simpanSet(); };
    sec.querySelectorAll('.kz-chipset').forEach(g => g.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const k = g.dataset.set; set[k] = k === 'sumber' ? b.dataset.v : Number(b.dataset.v); simpanSet(); tandai(); }));
    $('kzMulai').onclick = mulaiBaru;
    $('kzTambah').onclick = () => { ubah = { id: null, teks: '', pilihan: ['', '', '', ''], benar: 0 }; formSoal(); };
    $('kzContoh').innerHTML = S.soalBerakhlak().slice().sort(() => Math.random() - .5).slice(0, 12).map(q => `<li>${esc(q.t)}<small>✓ ${esc(q.p[q.b])}</small></li>`).join('');
    $('kzBank').addEventListener('click', aksiBank); $('kzRiwayat').addEventListener('click', aksiRiwayat);
    tandai();
  }
  function tandai() {
    document.querySelectorAll('#v-kuis .kz-chipset').forEach(g => g.querySelectorAll('button').forEach(b => b.classList.toggle('on', String(set[g.dataset.set]) === b.dataset.v)));
    const nb = bank.filter(b => b.aktif).length, tersedia = set.sumber === 'tambahan' ? nb : nb + ACAK_BANK;
    $('kzInfo').innerHTML = `<b>${set.sumber === 'tambahan' ? '' : ACAK_BANK + ' soal otomatis dari materi BerAKHLAK · '}${nb} soal tambahan</b><br>Kuis berisi ${Math.min(set.n, tersedia)} soal, masing-masing ${set.d} detik (± ${Math.max(1, Math.round(Math.min(set.n, tersedia) * (set.d + 15) / 60))} menit).`;
  }

  async function render() { bangun(); await Promise.all([muatBank(), muatRiwayat()]); }
  async function muatBank() {
    try { bank = (S.cek(await c().from('kuis_bank').select('*')) || []).sort((a, b) => String(a.dibuat).localeCompare(String(b.dibuat))); }
    catch (x) { bank = []; $('kzBank').innerHTML = `<div class="kz-kosong">${/kuis_bank|schema|relation/i.test(x.message) ? 'Database belum diperbarui: jalankan setup.sql terbaru di Supabase.' : esc(x.message)}</div>`; tandai(); return; }
    renderBank(); tandai();
  }
  function renderBank() {
    $('kzBank').innerHTML = bank.length ? bank.map((q, i) => `<div class="kz-soalitem${q.aktif ? '' : ' mati'}"><div class="q"><b>${i + 1}.</b><span>${esc(q.teks)}</span></div>
      <div class="kz-ops">${q.pilihan.map((p, j) => `<div class="${j === q.benar ? '' : 'salah'}" style="background:${WARNA[j]}">${BENTUK[j]}${esc(p)}${j === q.benar ? '<b>✓</b>' : ''}</div>`).join('')}</div>
      <div class="kz-alat"><button type="button" data-b="aktif" data-id="${q.id}">${q.aktif ? 'Nonaktifkan' : 'Aktifkan'}</button><button type="button" data-b="ubah" data-id="${q.id}">Ubah</button><button type="button" data-b="hapus" data-id="${q.id}">Hapus</button></div></div>`).join('')
      : '<div class="kz-kosong">Belum ada soal tambahan. Kuis tetap bisa dimainkan dengan soal otomatis dari materi BerAKHLAK.</div>';
  }
  function formSoal() {
    const q = ubah; if (!q) { $('kzForm').innerHTML = ''; return; }
    $('kzForm').innerHTML = `<div class="kz-form"><label class="kz-lbl" style="margin-top:0" for="kzT">Pertanyaan</label><textarea class="kz-in" id="kzT" rows="2" maxlength="200" placeholder="Tulis pertanyaan…">${esc(q.teks)}</textarea>
      <div class="opsi">${q.pilihan.map((p, j) => `<label style="background:${WARNA[j]}">${BENTUK[j]}<input type="text" data-o="${j}" maxlength="90" value="${esc(p)}" placeholder="Jawaban ${j + 1}"><input type="radio" name="kzB" value="${j}"${j === q.benar ? ' checked' : ''} title="Tandai sebagai jawaban benar" aria-label="Jawaban benar ${j + 1}"></label>`).join('')}</div>
      <div class="ket">Pilih bulatan di sebelah kanan untuk menandai jawaban yang benar.</div>
      <div class="tb"><button class="btn" type="button" id="kzBatal">Batal</button><button class="kz-tbtn" type="button" id="kzSimpan">Simpan soal</button></div></div>`;
    $('kzT').focus(); $('kzBatal').onclick = () => { ubah = null; formSoal(); };
    $('kzSimpan').onclick = async () => {
      const teks = $('kzT').value.trim(), pilihan = [...document.querySelectorAll('#kzForm [data-o]')].map(x => x.value.trim()), benar = Number((document.querySelector('#kzForm [name=kzB]:checked') || {}).value || 0);
      if (!teks) return S.toast('Pertanyaan belum diisi'); if (pilihan.some(p => !p)) return S.toast('Keempat pilihan jawaban harus diisi'); if (new Set(pilihan.map(p => p.toLowerCase())).size < 4) return S.toast('Pilihan jawaban tidak boleh sama');
      try {
        if (q.id) S.cek(await c().from('kuis_bank').update({ teks, pilihan, benar }).eq('id', q.id), 'Gagal menyimpan soal');
        else S.cek(await c().from('kuis_bank').insert({ id: uuid(), teks, pilihan, benar, aktif: true, dibuat: new Date().toISOString() }), 'Gagal menyimpan soal');
        ubah = null; formSoal(); S.toast('Soal disimpan'); await muatBank();
      } catch (x) { S.toast(x.message, 5000); }
    };
  }
  async function aksiBank(e) {
    const b = e.target.closest('[data-b]'); if (!b) return; const q = bank.find(x => x.id === b.dataset.id); if (!q) return;
    try {
      if (b.dataset.b === 'ubah') { ubah = { id: q.id, teks: q.teks, pilihan: q.pilihan.slice(), benar: q.benar }; formSoal(); $('kzForm').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      if (b.dataset.b === 'aktif') S.cek(await c().from('kuis_bank').update({ aktif: !q.aktif }).eq('id', q.id));
      if (b.dataset.b === 'hapus') { if (!confirm('Hapus soal ini?')) return; S.cek(await c().from('kuis_bank').delete().eq('id', q.id)); }
      await muatBank();
    } catch (x) { S.toast(x.message, 5000); }
  }
  async function muatRiwayat() {
    try {
      const s = (S.cek(await c().from('kuis_sesi').select('id,pin,judul,status,no,dibuat').order('dibuat', { ascending: false }).limit(30)) || []).sort((a, b) => String(b.dibuat).localeCompare(String(a.dibuat))).slice(0, 8);
      const p = s.length ? S.cek(await c().from('kuis_peserta').select('sesi_id,nama,unit,skor,gabung').in('sesi_id', s.map(x => x.id))) || [] : [];
      riwayat = s.map(x => ({ ...x, peserta: p.filter(y => y.sesi_id === x.id).sort((a, b) => b.skor - a.skor || String(a.gabung).localeCompare(String(b.gabung))) }));
    } catch (x) { riwayat = []; $('kzRiwayat').innerHTML = `<div class="kz-kosong">${/kuis_|schema|relation/i.test(x.message) ? 'Database belum diperbarui: jalankan setup.sql terbaru di Supabase.' : esc(x.message)}</div>`; return; }
    const tgl = t => { const d = new Date(t); return isNaN(d) ? '' : S.tglSedang(S.ymd(d)) + ' · ' + String(d.getHours()).padStart(2, '0') + '.' + String(d.getMinutes()).padStart(2, '0'); };
    $('kzRiwayat').innerHTML = riwayat.length ? riwayat.map(r => { const jalan = r.status !== 'selesai';
      return `<div class="kz-rw"><span class="ik">${jalan ? '🎮' : '🏆'}</span><div class="tx"><b>${esc(r.judul)}</b><small>${tgl(r.dibuat)} · ${r.peserta.length} peserta ${jalan ? '· <span class="kz-live">berlangsung · PIN ' + esc(r.pin) + '</span>' : ''}</small>
        <div class="jr">${r.peserta.length ? r.peserta.slice(0, 3).map((p, i) => ['🥇', '🥈', '🥉'][i] + ' ' + esc(namaPendek(p.nama)) + ' <small style="color:var(--teks2)">' + fmt(p.skor) + '</small>').join(' &nbsp; ') : '<small style="color:var(--teks2)">Belum ada peserta</small>'}</div></div>
        <div class="aksi">${jalan ? `<button type="button" class="ung" data-rw="buka" data-id="${r.id}">Lanjutkan</button>` : `<button type="button" class="ung" data-rw="buka" data-id="${r.id}">Papan juara</button>`}<button type="button" data-rw="hapus" data-id="${r.id}" title="Hapus riwayat">🗑</button></div></div>`; }).join('')
      : '<div class="kz-kosong">Belum ada kuis. Tekan <b>Mulai Kuis</b> untuk bermain pertama kali.</div>';
  }
  async function aksiRiwayat(e) {
    const b = e.target.closest('[data-rw]'); if (!b) return; const id = b.dataset.id;
    if (b.dataset.rw === 'buka') return buka(id);
    if (!confirm('Hapus riwayat kuis ini beserta skor pesertanya?')) return;
    try { S.cek(await c().from('kuis_sesi').delete().eq('id', id)); S.toast('Riwayat kuis dihapus'); await muatRiwayat(); } catch (x) { S.toast(x.message, 5000); }
  }
  async function mulaiBaru() {
    const tamb = bank.filter(b => b.aktif); const soal = S.susunKuis(set.n, set.d, tamb, set.sumber === 'tambahan');
    if (!soal.length) return S.toast('Belum ada soal tambahan yang aktif. Pilih sumber "Materi BerAKHLAK + soal tambahan".', 5000);
    try { const r = await S.proses('Menyiapkan kuis…', async () => S.cek(await c().rpc('kuis_buat', { p_judul: (set.judul || '').trim() || 'Kuis BerAKHLAK', p_soal: soal }), 'Gagal membuat kuis')); buka(r.id); }
    catch (x) { S.toast(/kuis_buat|function|schema/i.test(x.message) ? 'Database belum diperbarui: jalankan setup.sql terbaru di Supabase.' : x.message, 6000); }
  }

  /* ---------- Layar pemandu ---------- */
  let sesi = null, data = null, kunci = '', tahap = 'jawaban', polling = null, sibukPoll = false, tenggat = 0, kirimTampil = false, rankLalu = new Map(), sudahChip = new Set(), timerI = null, detikLalu = -1;
  let suara = localStorage.getItem('sakti-kuis-suara') !== '0', ac = null;
  function bunyi(j) {
    if (!suara) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume();
      const nada = (f, t0, dur, type = 'sine', vol = .15) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, ac.currentTime + t0); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + t0 + dur); o.connect(g).connect(ac.destination); o.start(ac.currentTime + t0); o.stop(ac.currentTime + t0 + dur + .05); };
      if (j === 'tik') nada(880, 0, .07, 'square', .04);
      if (j === 'gabung') { nada(660, 0, .1, 'triangle', .12); nada(990, .08, .14, 'triangle', .1); }
      if (j === 'mulai') [523, 659, 784].forEach((f, i) => nada(f, i * .12, .25, 'triangle'));
      if (j === 'gong') { nada(196, 0, 1.2, 'sine', .3); nada(392, 0, .7, 'sine', .1); }
      if (j === 'menang') [523, 659, 784, 1047, 784, 1047].forEach((f, i) => nada(f, i * .16, .32, 'triangle', .18));
    } catch (e) { }
  }
  function layar() {
    let el = $('kzLayar'); if (el) return el;
    el = document.createElement('div'); el.className = 'kz-layar'; el.id = 'kzLayar'; el.hidden = true;
    const bg = Array.from({ length: 14 }, (_, i) => `<i style="left:${(i * 37) % 100}%;top:${(i * 53) % 100}%;width:${50 + (i * 17) % 70}px;height:${50 + (i * 17) % 70}px;animation-duration:${14 + i % 6 * 3}s">${BENTUK[i % 4]}</i>`).join('');
    el.innerHTML = `<div class="kz-bg">${bg}</div><header class="kz-atas"><span class="jd" id="kzJd"></span><span class="no" id="kzNo"></span><span class="pin">PIN <b id="kzPinA"></b></span><span class="sp"></span>
      <button type="button" id="kzSuara" title="Suara"></button><button type="button" id="kzPenuh" title="Layar penuh">⛶</button><button type="button" id="kzAkhiri">Akhiri</button><button type="button" id="kzTutup" title="Tutup layar kuis">✕</button></header>
      <main class="kz-isi" id="kzIsi"></main><footer class="kz-bawah" id="kzBawah"></footer>`;
    document.body.appendChild(el);
    const ikSuara = () => $('kzSuara').textContent = suara ? '🔊' : '🔇'; ikSuara();
    $('kzSuara').onclick = () => { suara = !suara; localStorage.setItem('sakti-kuis-suara', suara ? '1' : '0'); ikSuara(); };
    $('kzPenuh').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else (el.requestFullscreen || (() => { })).call(el); };
    $('kzTutup').onclick = () => { if (data && data.status !== 'selesai' && !confirm('Tutup layar kuis? Kuis tetap berjalan dan dapat dibuka lagi melalui tombol "Lanjutkan".')) return; tutup(); };
    $('kzAkhiri').onclick = async () => { if (!confirm('Akhiri kuis sekarang dan tampilkan juara?')) return; await aksi('akhiri'); };
    document.addEventListener('keydown', e => { if (el.hidden || /input|textarea/i.test((e.target.tagName || ''))) return; if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { const b = document.querySelector('#kzBawah .kz-btn:not(.sek):not(:disabled)'); if (b) { e.preventDefault(); b.click(); } } });
    return el;
  }
  function buka(id) {
    sesi = id; data = null; kunci = ''; tahap = 'jawaban'; rankLalu = new Map(); sudahChip = new Set(); kirimTampil = false;
    const el = layar(); el.hidden = false; document.body.style.overflow = 'hidden'; $('kzIsi').innerHTML = '<div class="kz-tunggu">Memuat kuis…</div>'; $('kzBawah').innerHTML = '';
    clearInterval(polling); polling = setInterval(tarik, 1000); tarik();
    clearInterval(timerI); timerI = setInterval(detak, 100);
  }
  function tutup() { clearInterval(polling); clearInterval(timerI); polling = null; const el = $('kzLayar'); if (el) el.hidden = true; document.body.style.overflow = ''; if (document.fullscreenElement) document.exitFullscreen(); sesi = null; muatRiwayat(); }
  async function tarik() {
    if (!sesi || sibukPoll) return; sibukPoll = true;
    try { const d = S.cek(await c().rpc('kuis_layar', { p_sesi: sesi })); if (sesi && d) terima(d); }
    catch (x) { $('kzBawah').querySelector('.ket') && ($('kzBawah').querySelector('.ket').textContent = 'Koneksi terputus, mencoba lagi…'); }
    finally { sibukPoll = false; }
  }
  async function aksi(a) {
    try { S.cek(await c().rpc('kuis_host', { p_sesi: sesi, p_aksi: a }), 'Gagal'); } catch (x) { S.toast(x.message, 5000); }
    sibukPoll = false; await tarik();
  }
  function terima(d) {
    const lama = data; data = d;
    $('kzJd').textContent = d.judul; $('kzPinA').textContent = d.pin; $('kzAkhiri').hidden = d.status === 'selesai';
    $('kzNo').textContent = d.status === 'lobi' ? 'Ruang tunggu' : d.status === 'selesai' ? 'Selesai' : `Soal ${d.no + 1} / ${d.total}`;
    if (d.status === 'soal') tenggat = performance.now() + (d.sisa_ms || 0);
    const k = d.status + '|' + d.no + '|' + (d.status === 'hasil' ? tahap : '');
    if (k !== kunci) {
      const statusBaru = !lama || lama.status !== d.status || lama.no !== d.no;
      if (statusBaru && d.status === 'hasil') tahap = 'jawaban';
      kunci = d.status + '|' + d.no + '|' + (d.status === 'hasil' ? tahap : ''); kirimTampil = false;
      if (d.status === 'lobi') gambarLobi(); else if (d.status === 'soal') { gambarSoal(); if (statusBaru) bunyi('mulai'); }
      else if (d.status === 'hasil') { tahap === 'skor' ? gambarSkor() : gambarJawaban(); if (statusBaru) bunyi('gong'); }
      else gambarPodium();
    }
    perbarui();
  }
  function perbarui() {
    const d = data; if (!d) return;
    if (d.status === 'lobi') {
      const box = $('kzChips'); if (!box) return; let baru = false;
      d.peserta.forEach(p => { if (sudahChip.has(p.user_id)) return; sudahChip.add(p.user_id); baru = true; const s = document.createElement('span'); s.className = 'kz-chip'; s.textContent = namaPendek(p.nama); box.appendChild(s); });
      if (baru) bunyi('gabung');
      $('kzJml').textContent = d.peserta.length + ' pemain'; const k = box.querySelector('.kz-tunggu'); if (k && d.peserta.length) k.remove();
      $('kzBtnMulai').disabled = !d.peserta.length;
    }
    if (d.status === 'soal') {
      const n = d.peserta.length; $('kzDj') && ($('kzDj').textContent = d.dijawab);
      if (!kirimTampil && n && d.dijawab >= n) { kirimTampil = true; setTimeout(() => aksi('tampil'), 600); }
    }
  }
  function detak() {
    if (!data || data.status !== 'soal' || !$('kzTimer')) return;
    const sisa = Math.max(0, tenggat - performance.now()), dt = Math.ceil(sisa / 1000), q = data.soal || { d: 20 };
    const t = $('kzTimer'); t.style.setProperty('--p', (sisa / (q.d * 1000) * 100).toFixed(1) + '%'); t.querySelector('span').textContent = dt; t.classList.toggle('genting', dt <= 5 && dt > 0);
    if (dt !== detikLalu) { detikLalu = dt; if (dt <= 5 && dt > 0) bunyi('tik'); }
    if (sisa <= 0 && !kirimTampil) { kirimTampil = true; setTimeout(() => aksi('tampil'), 400); }
  }
  const opsiHtml = (q, benar) => `<div class="kz-opsi kz-w">${q.p.map((p, j) => `<div class="kz-op${benar == null ? '' : j === benar ? ' benar' : ' redup'}" style="background:${WARNA[j]}">${BENTUK[j]}<span class="tx">${esc(p)}</span>${benar === j ? '<span class="cek">✓</span>' : ''}</div>`).join('')}</div>`;
  function gambarLobi() {
    const url = location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '') + 'kuis.html', link = url + '?pin=' + data.pin;
    let qr = ''; try { const g = qrcode(0, 'M'); g.addData(link); g.make(); qr = g.createSvgTag({ cellSize: 6, margin: 1, scalable: true }); } catch (e) { }
    $('kzIsi').innerHTML = `<div class="kz-lobi kz-w">${qr ? `<div class="kz-qr">${qr}</div>` : ''}<div class="kz-gab"><div class="l1">Pindai kode QR atau buka di HP:</div><div class="url">${esc(url.replace(/^https?:\/\//, ''))}</div>
      <div class="l2">PIN Kuis</div><div class="pinb">${esc(data.pin.slice(0, 3) + ' ' + data.pin.slice(3))}</div><div class="ket">Pegawai yang membuka aplikasi SAKTI juga akan melihat tombol <b>Ikut Kuis</b>.</div></div></div>
      <div class="kz-pkep kz-w"><span class="jml" id="kzJml">0 pemain</span><span class="jdl">${esc(data.judul)}</span><span class="jml">${data.total} soal</span></div>
      <div class="kz-chips kz-w" id="kzChips"><div class="kz-tunggu">Menunggu pemain bergabung…</div></div>`;
    sudahChip = new Set();
    $('kzBawah').innerHTML = `<span class="ket">Mulai setelah semua pemain masuk. Tekan Spasi atau Enter untuk lanjut.</span><button class="kz-btn" type="button" id="kzBtnMulai" disabled>Mulai ▶</button>`;
    $('kzBtnMulai').onclick = () => aksi('mulai');
  }
  function gambarSoal() {
    const q = data.soal; detikLalu = -1;
    const logo = 'BerAKHLAK'.split('').map((h, i) => `<span style="background:${['#1d4ed8', '#1d4ed8', '#1d4ed8', '#0f766e', '#7c3aed', '#db2777', '#b91c1c', '#ea580c', '#059669'][i]};animation-delay:${i * .12}s">${h}</span>`).join('');
    $('kzIsi').innerHTML = `<div class="kz-soal kz-w">${esc(q.t)}</div>
      <div class="kz-tengah kz-w"><div class="kz-timer" id="kzTimer"><span>${q.d}</span></div><div class="kz-logo">${logo}</div><div class="kz-dj"><b id="kzDj">0</b><span>jawaban</span></div></div>${opsiHtml(q, null)}`;
    $('kzBawah').innerHTML = `<span class="ket">${data.peserta.length} pemain · jawaban ditutup otomatis saat waktu habis atau semua sudah menjawab</span><button class="kz-btn sek" type="button" id="kzLewati">Tutup jawaban ⏭</button>`;
    $('kzLewati').onclick = () => { kirimTampil = true; aksi('tampil'); };
  }
  function gambarJawaban() {
    const q = data.soal, sb = data.sebaran || [0, 0, 0, 0], maks = Math.max(1, ...sb), n = data.peserta.length, benarN = sb[q.b] || 0;
    $('kzIsi').innerHTML = `<div class="kz-soal kz-w" style="font-size:clamp(20px,2.4vw,34px)">${esc(q.t)}</div>
      <div class="kz-sebaran">${sb.map((v, j) => `<div class="kz-bar${j === q.b ? '' : ' redup'}"><span class="n">${j === q.b ? '✓ ' : ''}${v}</span><i style="background:${WARNA[j]}" data-h="${Math.round(v / maks * 100)}"></i><span class="bt" style="background:${WARNA[j]}">${BENTUK[j]}</span></div>`).join('')}</div>${opsiHtml(q, q.b)}`;
    requestAnimationFrame(() => setTimeout(() => document.querySelectorAll('.kz-bar i').forEach(i => i.style.height = `max(8px, calc(${i.dataset.h}% - 70px))`), 60));
    $('kzBawah').innerHTML = `<span class="ket">${benarN} dari ${n} pemain menjawab benar</span><button class="kz-btn" type="button" id="kzKeSkor">Papan skor ▶</button>`;
    $('kzKeSkor').onclick = () => { tahap = 'skor'; kunci = ''; terima(data); };
  }
  function gambarSkor() {
    const L = data.peserta, top = L.slice(0, 5), akhir = data.no + 1 >= data.total;
    $('kzIsi').innerHTML = `<div class="kz-jb"><span>Papan Skor</span></div><div class="kz-papan" id="kzPapan">${top.length ? top.map((p, i) => { const lalu = rankLalu.get(p.user_id), naik = lalu != null && lalu > i;
      return `<div class="kz-baris r${i + 1}" data-u="${p.user_id}"><span class="rk">${i + 1}</span><span class="nm">${esc(namaPendek(p.nama))}<small>${esc(p.unit || '')}</small></span>
        ${p.beruntun >= 2 ? `<span class="gr api">🔥 ${p.beruntun} beruntun</span>` : naik ? `<span class="gr naik">▲ ${lalu - i}</span>` : ''}<span class="sk"><span data-dari="${p.skor - (p.poin || 0)}" data-ke="${p.skor}">${fmt(p.skor - (p.poin || 0))}</span>${p.poin ? `<span class="plus">+${fmt(p.poin)}</span>` : ''}</span></div>`; }).join('') : '<div class="kz-tunggu">Belum ada pemain.</div>'}</div>`;
    // animasi perpindahan peringkat & hitung naik skor
    const tinggi = 78;
    document.querySelectorAll('#kzPapan .kz-baris').forEach((r, i) => { const lalu = rankLalu.get(r.dataset.u); const geser = lalu == null ? 5 - i : Math.min(lalu, 5) - i; if (geser) { r.style.transition = 'none'; r.style.transform = `translateY(${geser * tinggi}px)`; r.style.opacity = lalu == null || lalu >= 5 ? '0' : '1'; } });
    setTimeout(() => {
      document.querySelectorAll('#kzPapan .kz-baris').forEach(r => { r.style.transition = ''; r.style.transform = ''; r.style.opacity = ''; });
      document.querySelectorAll('#kzPapan [data-ke]').forEach(s => { const a = Number(s.dataset.dari), b = Number(s.dataset.ke), t0 = performance.now(); const f = t => { const k = Math.min(1, (t - t0) / 1100); s.textContent = fmt(Math.round(a + (b - a) * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); });
    }, 350);
    rankLalu = new Map(L.map((p, i) => [p.user_id, i]));
    const pemimpin = L[0];
    $('kzBawah').innerHTML = `<span class="ket">${pemimpin ? '👑 ' + esc(namaPendek(pemimpin.nama)) + ' memimpin dengan ' + fmt(pemimpin.skor) + ' poin' : ''}</span><button class="kz-btn" type="button" id="kzLanjut">${akhir ? 'Lihat juara 🏆' : 'Soal berikutnya ▶'}</button>`;
    $('kzLanjut').onclick = () => aksi('lanjut');
  }
  function gambarPodium() {
    const L = data.peserta, urut = [[1, 'j2', '🥈', '44%', '.8s'], [0, 'j1', '🥇', '62%', '1.6s'], [2, 'j3', '🥉', '30%', '0s']];
    $('kzIsi').innerHTML = `<div class="kz-jb"><span>🏆 Juara ${esc(data.judul)}</span></div>
      <div class="kz-podium">${L.length ? urut.map(([i, cl, m, h, t]) => L[i] ? `<div class="kz-tiang ${cl}" style="--h:${h};--t:${t}"><div class="nmp" style="--t:calc(${t} + .9s)">${esc(namaPendek(L[i].nama))}<small>${esc(L[i].unit || '')}</small></div><div class="blok" style="--h:${h};--t:${t};height:0"><span class="medali">${m}</span>${fmt(L[i].skor)}<small style="font-size:.6em;opacity:.85">poin</small></div></div>` : `<div class="kz-tiang"></div>`).join('') : '<div class="kz-tunggu">Tidak ada pemain.</div>'}</div>
      ${L.length > 3 ? `<div class="kz-lain">${L.slice(3, 10).map((p, i) => `<span>${i + 4}. ${esc(namaPendek(p.nama))} · ${fmt(p.skor)}</span>`).join('')}</div>` : ''}`;
    // tinggi podium relatif terhadap ruang yang tersedia
    const pod = document.querySelector('.kz-podium'); if (pod) { const h = pod.clientHeight - 110; pod.querySelectorAll('.kz-tiang').forEach(t => { const p = parseFloat(t.style.getPropertyValue('--h')) / 62; if (p) t.querySelector('.blok').style.setProperty('--h', Math.max(90, Math.round(h * p)) + 'px'); }); }
    $('kzBawah').innerHTML = `<span class="ket">${L.length} pemain · ${data.total} soal</span><button class="kz-btn sek" type="button" id="kzSalin">Salin hasil</button><button class="kz-btn" type="button" id="kzSelesai">Selesai</button>`;
    $('kzSelesai').onclick = tutup;
    $('kzSalin').onclick = () => { const t = `🏆 ${data.judul}\n` + L.map((p, i) => `${i + 1}. ${p.nama} (${p.unit || '-'}) — ${p.skor} poin`).join('\n'); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => S.toast('Hasil kuis disalin, siap ditempel di WhatsApp'), () => S.toast('Tidak dapat menyalin')); };
    if (L.length) { setTimeout(() => bunyi('menang'), 1500); setTimeout(konfeti, 1700); }
  }
  function konfeti() {
    const host = $('kzLayar'); if (!host || host.hidden) return; const cv = document.createElement('canvas'); cv.className = 'kz-konfeti'; host.appendChild(cv);
    const w = cv.width = host.clientWidth, h = cv.height = host.clientHeight, g = cv.getContext('2d'), W = ['#e21b3c', '#1368ce', '#d89e00', '#26890c', '#fff', '#f5b301'];
    const P = Array.from({ length: 160 }, () => ({ x: Math.random() * w, y: -20 - Math.random() * h * .5, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 3, r: Math.random() * 6, s: 6 + Math.random() * 6, c: W[Math.floor(Math.random() * W.length)], a: Math.random() * 6 }));
    const t0 = performance.now(); const f = t => { g.clearRect(0, 0, w, h); P.forEach(p => { p.x += p.vx; p.y += p.vy; p.a += .1; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); }); if (t - t0 < 5000) requestAnimationFrame(f); else cv.remove(); }; requestAnimationFrame(f);
  }

  window.KuisAdmin = { render, buka };
})();
