/* ============================================================
   game-page.js – Fiche jeu
   Jeu via RAWG ; notes/avis/letterbox via API MySQL
   URL : game.php?slug=elden-ring
   ============================================================ */

let currentGame = null, screenshots = [], lbIndex = 0;
let myStatus = null, isFollowing = false;

document.addEventListener('DOMContentLoaded', async () => {
  const slug = new URLSearchParams(location.search).get('slug')
            || new URLSearchParams(location.search).get('id');
  if (!slug) { location.href = '/jeux.php'; return; }
  try { await loadGame(slug); } catch (e) { showError(e); }
  bindLightbox();
});

async function loadGame(slug) {
  const [game, ss] = await Promise.all([
    API.getGame(slug),
    API.getScreenshots(slug).catch(() => ({ results: [] })),
  ]);
  currentGame = game;
  screenshots = ss.results || [];
  document.title = `GameBizarre – ${game.name}`;

  renderHero(game);
  renderDescription(game);
  renderScreenshots(screenshots);
  renderSidebar(game);

  document.getElementById('gameSkeleton').classList.add('hidden');
  document.getElementById('gameMain').classList.remove('hidden');

  await Promise.all([loadMyState(game.id), loadReviews(game.id)]);

  API.getSimilar(slug).then(d => d.results?.length && renderSimilar(d.results.slice(0,5))).catch(()=>{});
}

/* ---- État Letterbox + ma note ---- */
async function loadMyState(gameId) {
  if (!Auth.isLoggedIn()) { bindLetterbox(); return; }
  try {
    const lists = await Letterbox.getLists();
    ['played','playing','want'].forEach(s => {
      if ((lists[s]||[]).some(g => g.id === gameId)) myStatus = s;
    });
    isFollowing = (lists.followed||[]).some(g => g.id === gameId);
  } catch {}
  updateLetterboxButtons();
  bindLetterbox();
}

function renderHero(g) {
  document.getElementById('gameHeroBg').style.backgroundImage = `url(${g.background_image||''})`;
  const cover = document.getElementById('gameCover');
  cover.src = g.background_image_additional || g.background_image || '';
  cover.alt = g.name;
  document.getElementById('gameTitle').textContent = g.name;

  const meta = [g.released?.substring(0,4), ...(g.developers||[]).map(d=>d.name),
    ...(g.publishers||[]).slice(0,1).map(p=>p.name)].filter(Boolean);
  document.getElementById('gameMeta').innerHTML =
    meta.map(t=>`<span class="meta-tag">${t}</span>`).join('');

  let html = g.rating ? `<span class="rating-big">★ ${g.rating.toFixed(1)}</span>
    <span class="rating-sub">${(g.ratings_count||0).toLocaleString()} notes<br/>RAWG</span>` : '';
  if (g.metacritic) {
    const c = g.metacritic>=75?'green':g.metacritic>=50?'yellow':'red';
    html += `<span class="metacritic-badge ${c}">MC ${g.metacritic}</span>`;
  }
  document.getElementById('gameRating').innerHTML = html;
}

function renderDescription(g) {
  const el = document.getElementById('gameDescription');
  el.innerHTML = g.description_raw
    ? g.description_raw.split('\n\n').filter(p=>p.trim()).map(p=>`<p>${p.trim()}</p>`).join('')
    : 'Aucune description.';
}

function renderScreenshots(shots) {
  if (!shots.length) { document.getElementById('screenshotsSection').classList.add('hidden'); return; }
  const grid = document.getElementById('screenshotsGrid');
  grid.innerHTML = shots.map((s,i)=>`<img class="screenshot-thumb" src="${s.image}" data-i="${i}" loading="lazy" alt="" />`).join('');
  grid.querySelectorAll('.screenshot-thumb').forEach(img =>
    img.addEventListener('click', () => openLightbox(+img.dataset.i)));
}

function renderSidebar(g) {
  const rows = [
    ['Sortie', g.released||'—'],
    ['Durée', g.playtime?`~${g.playtime}h`:'—'],
    ['ESRB', g.esrb_rating?.name||'—'],
    ['Site', g.website?`<a href="${g.website}" target="_blank" rel="noopener" style="color:var(--accent)">Officiel ↗</a>`:'—'],
  ];
  document.getElementById('gameInfoList').innerHTML =
    rows.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('');
  document.getElementById('gameGenres').innerHTML =
    (g.genres||[]).map(x=>`<span class="tag">${x.name}</span>`).join('') || '—';
  document.getElementById('gamePlatforms').innerHTML =
    (g.platforms||[]).map(p=>`<span class="tag">${p.platform.name}</span>`).join('') || '—';
}

function renderSimilar(games) {
  document.getElementById('similarGames').innerHTML = games.map(g=>`
    <div class="similar-item" onclick="location.href='/game.php?slug=${g.slug}'">
      <img class="similar-cover" src="${g.background_image||''}" loading="lazy" alt="" />
      <div><div class="similar-title">${g.name}</div>
      <div class="similar-rating">★ ${g.rating?.toFixed(1)||'—'}</div></div>
    </div>`).join('');
}

/* ---- Lightbox ---- */
function openLightbox(i){ lbIndex=i; document.getElementById('lightbox').classList.remove('hidden');
  document.getElementById('lightboxImg').src=screenshots[i].image; }
function bindLightbox(){
  const lb=document.getElementById('lightbox');
  document.getElementById('lightboxClose').onclick=()=>lb.classList.add('hidden');
  document.getElementById('lightboxPrev').onclick=()=>{lbIndex=(lbIndex-1+screenshots.length)%screenshots.length;document.getElementById('lightboxImg').src=screenshots[lbIndex].image;};
  document.getElementById('lightboxNext').onclick=()=>{lbIndex=(lbIndex+1)%screenshots.length;document.getElementById('lightboxImg').src=screenshots[lbIndex].image;};
  lb.addEventListener('click',e=>{if(e.target===lb)lb.classList.add('hidden');});
}

/* ---- Letterbox ---- */
function bindLetterbox() {
  ['played','playing','want'].forEach(s => {
    const btn = document.getElementById('btn'+s[0].toUpperCase()+s.slice(1));
    btn?.addEventListener('click', async () => {
      if (!Auth.isLoggedIn()) { document.getElementById('openAuthModal')?.click(); return; }
      const next = myStatus === s ? '' : s;
      await Letterbox.setStatus(currentGame, next || 'none');
      myStatus = next || null;
      updateLetterboxButtons();
    });
  });
  document.getElementById('btnFollow')?.addEventListener('click', async () => {
    if (!Auth.isLoggedIn()) { document.getElementById('openAuthModal')?.click(); return; }
    const r = await Letterbox.toggleFollow(currentGame);
    isFollowing = !!r.added;
    updateLetterboxButtons();
    toast(isFollowing ? `🔔 Tu suis ${currentGame.name}` : `🔕 Tu ne suis plus ${currentGame.name}`);
  });
}
function updateLetterboxButtons() {
  ['played','playing','want'].forEach(s => {
    const b = document.getElementById('btn'+s[0].toUpperCase()+s.slice(1));
    if (b) b.classList.toggle('active', myStatus === s);
  });
  const f = document.getElementById('btnFollow');
  if (f) { f.classList.toggle('following', isFollowing); f.textContent = isFollowing ? '🔔 Suivi' : '🔔 Suivre'; }
}

/* ---- Avis + ma note ---- */
async function loadReviews(gameId) {
  let data;
  try { data = await fetch(`/api/reviews.php?game_id=${gameId}`).then(r=>r.json()); }
  catch { data = { reviews:[], myRating:0 }; }

  const list = document.getElementById('gameReviewsList');
  list.innerHTML = data.reviews?.length
    ? data.reviews.map(r=>`
        <div class="review-item">
          <div class="review-header">
            <a href="/profile.php?user=${r.author}" class="review-author">${r.author}</a>
            <span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
          </div>
          <p class="review-text">${esc(r.text)}</p>
        </div>`).join('')
    : '<p style="color:var(--text-muted);font-size:0.85rem;">Aucun avis pour l\'instant.</p>';

  initMyRating(data.myRating || 0);
  renderReviewForm(gameId, data.myRating || 0);
}

function initMyRating(saved) {
  const stars = document.querySelectorAll('#myStarRating .star');
  const label = document.getElementById('myRatingLabel');
  const lbl = ['Non noté','Décevant','Passable','Bien','Très bien','Excellent'];
  const show = v => { stars.forEach(s=>s.classList.toggle('active',+s.dataset.val<=v)); label.textContent=lbl[v]; };
  show(saved);
  stars.forEach(s => {
    s.addEventListener('mouseenter',()=>show(+s.dataset.val));
    s.addEventListener('mouseleave',()=>show(saved));
    s.addEventListener('click', async () => {
      if (!Auth.isLoggedIn()) { document.getElementById('openAuthModal')?.click(); return; }
      saved = +s.dataset.val; show(saved);
      await fetch('/api/reviews.php', { method:'POST', body:form({ game_id:currentGame.id, rating:saved, text:'' }) });
    });
  });
}

function renderReviewForm(gameId, myRating) {
  const sec = document.getElementById('reviewFormSection');
  if (!Auth.isLoggedIn()) {
    sec.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;margin-top:1rem;">
      <a href="#" id="loginToReview" style="color:var(--accent)">Connecte-toi</a> pour laisser un avis.</p>`;
    sec.querySelector('#loginToReview')?.addEventListener('click', e => {
      e.preventDefault(); document.getElementById('openAuthModal')?.click();
    });
    return;
  }
  sec.innerHTML = `
    <div class="modal-section-title" style="margin-top:1rem;">Laisser un avis</div>
    <div class="review-form">
      <div class="star-rating" id="reviewStars">
        ${[1,2,3,4,5].map(i=>`<span class="star ${i<=myRating?'active':''}" data-val="${i}">★</span>`).join('')}
      </div>
      <textarea id="reviewText" rows="3" placeholder="Ton avis sur ce jeu..."></textarea>
      <button class="btn-primary" id="submitReview">Publier</button>
    </div>`;
  let sel = myRating;
  const rs = sec.querySelectorAll('#reviewStars .star');
  rs.forEach(s=>{
    s.addEventListener('mouseenter',()=>rs.forEach(x=>x.classList.toggle('active',+x.dataset.val<=+s.dataset.val)));
    s.addEventListener('mouseleave',()=>rs.forEach(x=>x.classList.toggle('active',+x.dataset.val<=sel)));
    s.addEventListener('click',()=>{ sel=+s.dataset.val; });
  });
  sec.querySelector('#submitReview').addEventListener('click', async () => {
    const text = sec.querySelector('#reviewText').value.trim();
    if (!sel) { toast('Choisis une note'); return; }
    await fetch('/api/reviews.php', { method:'POST', body:form({ game_id:currentGame.id, rating:sel, text }) });
    loadReviews(currentGame.id);
  });
}

/* ---- utils ---- */
function form(obj){ const f=new FormData(); Object.entries(obj).forEach(([k,v])=>f.append(k,v)); return f; }
function esc(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function toast(m){
  let t=document.getElementById('toast');
  if(!t){t=document.createElement('div');t.id='toast';
    t.style.cssText='position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:var(--bg2);border:1.5px solid var(--accent);color:var(--text);padding:0.75rem 1.5rem;border-radius:8px;font-weight:700;z-index:500;box-shadow:var(--shadow);transition:opacity .3s;';
    document.body.appendChild(t);}
  t.textContent=m;t.style.opacity='1';clearTimeout(t._t);t._t=setTimeout(()=>t.style.opacity='0',2500);
}
function showError(e){
  document.getElementById('gameSkeleton').innerHTML=`<div style="text-align:center;padding:4rem 2rem;color:var(--text-muted);">
    <p style="font-size:1.2rem;font-weight:700;">Impossible de charger ce jeu</p><p>${e.message||e}</p>
    <a href="/jeux.php" class="btn-primary" style="display:inline-flex;margin-top:1.5rem;">← Retour</a></div>`;
}
