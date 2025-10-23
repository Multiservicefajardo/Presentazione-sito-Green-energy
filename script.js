/* ===== Utils ===== */
const qs = (s, el=document)=>el.querySelector(s);
const qsa = (s, el=document)=>[...el.querySelectorAll(s)];
const toastEl = qs('#toast');

/* Toast */
function showToast(msg='Operazione eseguita'){
  if(!toastEl) return;
  toastEl.textContent = msg;
  toastEl.style.display = 'block';
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> (toastEl.style.display='none'), 2200);
}

/* Navbar mobile */
const navToggle = qs('.nav__toggle');
const navLinks = qs('.nav__links');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.style.display === 'flex';
    navLinks.style.display = open ? 'none' : 'flex';
    navToggle.setAttribute('aria-expanded', String(!open));
  });
}

/* Smooth scroll */
qsa('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const id=a.getAttribute('href');
    if(!id||id==="#") return;
    const target=qs(id);
    if(target){ e.preventDefault(); target.scrollIntoView({behavior:'smooth', block:'start'}); }
  });
});

/* ===== Lightbox / Gallery ===== */
const lb = {
  dialog: qs('#lightbox'),
  img: qs('#lb-image'),
  thumbs: qs('#lb-thumbs'),
  titleEl: qs('.lightbox__title'),
  prev: qs('#lb-prev'),
  next: qs('#lb-next'),
  closeBtns: document.querySelectorAll('.lightbox__close'),
  images: [],
  index: 0
};

function openGallery(title, sources){
  lb.images = sources;
  lb.index = 0;
  lb.titleEl.textContent = title || 'Galleria';
  renderLightbox();
  lb.dialog.showModal();

  // Preload vicini
  preloadImg(lb.images[1]);
  document.body.style.overflow='hidden';
}
function closeGallery(){
  lb.dialog.close();
  document.body.style.overflow='';
}
function renderLightbox(){
  const src = lb.images[lb.index];
  lb.img.src = src;
  lb.img.alt = `${lb.titleEl.textContent} — immagine ${lb.index+1}/${lb.images.length}`;
  // thumbs
  lb.thumbs.innerHTML = '';
  lb.images.forEach((s,i)=>{
    const t = new Image();
    t.src = s; t.alt = `Miniatura ${i+1}`;
    if(i===lb.index) t.classList.add('is-active');
    t.addEventListener('click',()=>{ lb.index=i; renderLightbox(); preloadNeighbors(); });
    lb.thumbs.appendChild(t);
  });
}
function preloadImg(src){ if(!src) return; const i=new Image(); i.src=src; }
function preloadNeighbors(){ preloadImg(lb.images[lb.index+1]); preloadImg(lb.images[lb.index-1]); }

/* Controls */
lb.prev?.addEventListener('click', ()=>{ lb.index=(lb.index-1+lb.images.length)%lb.images.length; renderLightbox(); preloadNeighbors(); });
lb.next?.addEventListener('click', ()=>{ lb.index=(lb.index+1)%lb.images.length; renderLightbox(); preloadNeighbors(); });
lb.closeBtns.forEach(b=> b.addEventListener('click', closeGallery));
lb.dialog?.addEventListener('click', (e)=>{ if(e.target===lb.dialog) closeGallery(); });
document.addEventListener('keydown', (e)=>{
  if(!lb.dialog?.open) return;
  if(e.key==='Escape') closeGallery();
  if(e.key==='ArrowRight') lb.next?.click();
  if(e.key==='ArrowLeft') lb.prev?.click();
});
/* Swipe touch */
let touchX=null;
lb.dialog?.addEventListener('touchstart',(e)=>{ touchX=e.touches[0].clientX; },{passive:true});
lb.dialog?.addEventListener('touchend',(e)=>{
  if(touchX===null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if(Math.abs(dx)>40){ dx<0 ? lb.next.click() : lb.prev.click(); }
  touchX=null;
},{passive:true});

/* Bind gallerie su pulsanti */
document.querySelectorAll('.js-gallery').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const title = btn.getAttribute('data-gallery-title') || 'Galleria';
    const list = (btn.getAttribute('data-images')||'').split(',').map(s=>s.trim()).filter(Boolean);
    if(!list.length){ showToast('Nessuna immagine disponibile'); return; }
    openGallery(title, list);
  });
});

/* ===== Preventivo: bozza + rimbalzo ===== */
const formPrev = qs('#form-preventivo');
if(formPrev){
  // ripristina bozza
  try{
    const saved = JSON.parse(localStorage.getItem('preventivo-bozza')||'null');
    if(saved){
      for(const [k,v] of Object.entries(saved)){
        const el = formPrev.elements[k];
        if(el && 'value' in el) el.value = v;
      }
    }
  }catch{}

  // salva bozza
  qs('#btn-salva-bozza')?.addEventListener('click', ()=>{
    const data = Object.fromEntries(new FormData(formPrev).entries());
    localStorage.setItem('preventivo-bozza', JSON.stringify(data));
    showToast('Bozza salvata 💾');
  });

  // invio
  formPrev.addEventListener('submit', (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(formPrev).entries());
    const required = ['servizio','provincia','budget','email','telefono','urgenza','privacy'];
    for(const k of required){
      if(!data[k]){ setMsg('Compila tutti i campi obbligatori e accetta la privacy.', true); return; }
    }
    const budget = Number(data.budget||0);
    const s = data.servizio;
    let noteRimbalzo = null;
    if(s==='fotovoltaico' && budget<4000) noteRimbalzo='Budget contenuto per FV: consigliamo consulenza/pre-check gratuito.';
    if(s==='pavimento' && budget<5000) noteRimbalzo='Per pavimento sotto 5000€, proponiamo sopralluogo tecnico.';
    if(s==='clima' && budget<1200) noteRimbalzo='Per clima sotto 1200€, verifica promozioni attive.';

    // Hook integrazione (sostituisci con fetch() verso backend/CRM)
    console.info('[Lead]', { ...data, rimbalzato: Boolean(noteRimbalzo) });

    showToast(noteRimbalzo ? 'Richiesta indirizzata 🔀' : 'Preventivo inviato ✅');
    setMsg(noteRimbalzo || 'Richiesta inviata con successo!');
    localStorage.removeItem('preventivo-bozza');
    formPrev.reset();
  });

  function setMsg(text, isErr=false){
    const el = formPrev.querySelector('.form__msg');
    if(!el) return;
    el.textContent = text;
    el.style.color = isErr ? 'var(--danger)' : '#cfe7da';
  }
}
/* ===== Recensioni / Feedback clienti (localStorage) ===== */
(function(){
  const LS_KEY = 'recensioni-greenenergy';
  const form = document.getElementById('review-form');
  const listEl = document.getElementById('reviews-list');
  const avgStarsEl = document.getElementById('avg-stars');
  const avgScoreEl = document.getElementById('avg-score');
  const countEl = document.getElementById('rating-count');
  const demoBtn = document.getElementById('btn-dummy-reviews');

  if(!form || !listEl) return;

  const read = ()=> {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
    catch { return []; }
  };
  const write = (arr)=> localStorage.setItem(LS_KEY, JSON.stringify(arr));

  function render(){
    const items = read();
    // sort per data desc
    items.sort((a,b)=> b.ts - a.ts);

    // media
    const media = items.length ? (items.reduce((s,i)=>s+Number(i.rating),0) / items.length) : 0;
    if(avgScoreEl) avgScoreEl.textContent = media.toFixed(1);
    if(countEl) countEl.textContent = String(items.length);
    if(avgStarsEl) avgStarsEl.textContent = toStars(Math.round(media));

    // html
    listEl.innerHTML = items.slice(0,9).map(toCard).join('');
  }

  function toCard(r){
    const stars = toStars(r.rating);
    const when = new Date(r.ts).toLocaleDateString('it-IT');
    const city = r.citta ? ` · ${escapeHtml(r.citta)}` : '';
    return `
      <article class="review" itemscope itemtype="https://schema.org/Review">
        <div class="review__head">
          <div>
            <div class="review__name" itemprop="author">${escapeHtml(r.nome)}</div>
            <div class="review__meta">${escapeHtml(r.servizio)}${city} · <time itemprop="datePublished" datetime="${new Date(r.ts).toISOString()}">${when}</time></div>
          </div>
          <div class="review__stars" aria-label="${r.rating} stelle" itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
            <span aria-hidden="true">${stars}</span>
            <meta itemprop="ratingValue" content="${r.rating}">
            <meta itemprop="bestRating" content="5">
            <meta itemprop="worstRating" content="1">
          </div>
        </div>
        <p class="review__text" itemprop="reviewBody">${escapeHtml(r.commento)}</p>
      </article>
    `;
  }

  function toStars(n){
    const full = '★'.repeat(Number(n||0));
    const empty = '☆'.repeat(5-Number(n||0));
    return full + empty;
  }

  function escapeHtml(s){
    return String(s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  }

  // submit
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    // validazioni base
    if(!data.nome || !data.servizio || !data.rating || !data.commento){
      setFormMsg('Compila i campi obbligatori (nome, servizio, valutazione, commento).', true);
      return;
    }

    // “moderazione”: se il commento è lunghissimo, accorcia (demo client-side)
    const MAX_LEN = 800;
    data.commento = String(data.commento).slice(0, MAX_LEN);

    const rec = {
      nome: data.nome.trim(),
      citta: (data.citta||'').trim(),
      servizio: data.servizio,
      rating: Number(data.rating),
      commento: data.commento.trim(),
      ts: Date.now()
    };

    const items = read();
    items.push(rec);
    write(items);
    render();

    form.reset();
    showToast('Recensione inviata ✅');
    setFormMsg('Grazie per il tuo feedback!');
  });

  function setFormMsg(text, isErr=false){
    const el = form.querySelector('.form__msg');
    if(!el) return;
    el.textContent = text;
    el.style.color = isErr ? 'var(--danger)' : '#cfe7da';
  }

  // Esempi rapidi per test layout
  demoBtn?.addEventListener('click', ()=>{
    const seed = [
      { nome:'Luca G.', citta:'Genova',   servizio:'Fotovoltaico', rating:5, commento:'Installazione pulita e puntuale. Produzione in linea con le stime.', ts: Date.now()-86400000*3 },
      { nome:'Serena P.', citta:'Savona',  servizio:'Pavimento radiante', rating:5, commento:'Comfort eccezionale in tutta la casa. Team molto disponibile.', ts: Date.now()-86400000*7 },
      { nome:'Marco R.', citta:'La Spezia',servizio:'Climatizzazione', rating:4, commento:'Clima silenzioso e consumi ridotti. Consigliati!', ts: Date.now()-86400000*11 }
    ];
    write(seed);
    render();
    showToast('Esempi caricati');
  });

  render();
})();

/* ===== Hero image override (pv.jpg) — aggiunta per presentazione ===== */
(function(){
  const HERO_SRC = 'pv.jpg';             // cambia qui se usi un URL degli Assets (CodePen/Vercel)
  const img = qs('.hero__img');
  if(!img) return;

  // Preload per evitare flicker
  try {
    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'image';
    preload.href = HERO_SRC;
    document.head.appendChild(preload);
  } catch {}

  // Applica l'immagine
  img.loading = 'eager';
  img.decoding = 'async';
  img.src = HERO_SRC;

  // Alt più generico per la presentazione
  if(!img.getAttribute('alt') || /Tecnico che installa pannelli/.test(img.getAttribute('alt'))){
    img.setAttribute('alt','Energia rinnovabile: pannelli fotovoltaici eolico (immagine presentazione)');
  }

  // Fallback: se l’immagine non carica, ripristina src precedente se presente in data-attr
  img.addEventListener('error', ()=>{
    console.warn('Immagine pv.jpg non trovata, verifica il percorso/Assets.');
    showToast('Immagine hero non trovata');
  });
})();
/* ===== Hero image override (pv.jpg) — aggiunta per presentazione ===== */
(function(){
  const HERO_SRC = 'https://zbimpianti.com/wp-content/uploads/2020/07/Fotovoltaico_00003.jpg'; // URL diretto .jpg
  const img = qs('.hero__img');
  if(!img) return;

  // Preload per evitare flicker
  try {
    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'image';
    preload.href = HERO_SRC;
    document.head.appendChild(preload);
  } catch {}

  // Applica l'immagine
  img.loading = 'eager';
  img.decoding = 'async';
  img.src = HERO_SRC;

  // Alt più generico per la presentazione
  if(!img.getAttribute('alt') || /Tecnico che installa pannelli/.test(img.getAttribute('alt'))){
    img.setAttribute('alt','Energia rinnovabile: pannelli fotovoltaici eolico (immagine presentazione)');
  }

  // Fallback: se l’immagine non carica, ripristina src precedente se presente in data-attr
  img.addEventListener('error', ()=>{
    console.warn('Immagine non caricata, verifica l’URL.');
    showToast('Immagine hero non trovata');
  });
})();
/* ===== Hero: parallax dolce al passaggio del mouse ===== */
(function(){
  const wrap = qs('.hero__media');
  const img  = qs('.hero__img');
  if(!wrap || !img) return;

  let raf = 0;
  const maxShiftX = 6;  // percentuale max spostamento orizzontale
  const maxShiftY = 4;  // percentuale max spostamento verticale

  function onMove(e){
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(()=>{
      const r = wrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;   // -0.5..+0.5
      const y = (e.clientY - r.top)  / r.height - 0.5;
      const tx = (-x * maxShiftX).toFixed(2);
      const ty = (-y * maxShiftY).toFixed(2);

      // Pausa l’animazione CSS mentre interagisci, poi applica un leggero parallax
      img.style.animationPlayState = 'paused';
      img.style.transition = 'transform .12s ease-out';
      img.style.transform  = `scale(1.06) translate(${tx}%, ${ty}%)`;
    });
  }
  function onLeave(){
    cancelAnimationFrame(raf);
    img.style.transition = 'transform .35s ease';
    img.style.transform  = '';
    // lascia riprendere la Ken Burns dopo il rientro
    setTimeout(()=>{ img.style.animationPlayState = 'running'; }, 200);
  }

  wrap.addEventListener('mousemove', onMove, {passive:true});
  wrap.addEventListener('mouseleave', onLeave, {passive:true});
})();

/* ===== Ripple su tutti i pulsanti ===== */
(function(){
  qsa('.btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
      ripple.style.top  = (e.clientY - rect.top  - size/2) + 'px';
      btn.appendChild(ripple);
      setTimeout(()=> ripple.remove(), 650);
    }, {passive:true});
  });
})();

