/* ============================================================
   jeux.js – Catalogue RAWG, recherche + "Charger plus"
   ============================================================ */

let currentPage = 1, currentQuery = '', isLoading = false, hasMore = true;
let statusMap = {};   /* gameId → 'played'|'playing'|'want' (préchargé) */

document.addEventListener('DOMContentLoaded', async () => {
  await preloadStatuses();
  loadGames(true);
  bindSearch();
  bindLoadMore();
});

/* Précharge les listes Letterbox de l'utilisateur connecté */
async function preloadStatuses() {
  if (!Auth.isLoggedIn()) return;
  try {
    const lists = await Letterbox.getLists();
    ['played','playing','want'].forEach(s =>
      (lists[s] || []).forEach(g => statusMap[g.id] = s));
  } catch {}
}

async function loadGames(reset = false) {
  if (isLoading) return;
  isLoading = true;

  if (reset) {
    currentPage = 1; hasMore = true;
    document.getElementById('gamesGrid').innerHTML = skeleton(8);
  } else {
    currentPage++;
    const b = document.getElementById('loadMoreBtn');
    if (b) { b.textContent = 'Chargement…'; b.disabled = true; }
  }

  try {
    const data = currentQuery
      ? await API.searchGames(currentQuery, { page: currentPage, pageSize: 20 })
      : await API.getPopularGames({ page: currentPage, pageSize: 20 });

    const grid = document.getElementById('gamesGrid');
    if (reset) grid.innerHTML = '';

    if (!data.results?.length) {
      hasMore = false;
      if (reset) grid.innerHTML = '<p style="color:var(--text-muted);padding:2rem;grid-column:1/-1;">Aucun jeu trouvé.</p>';
    } else {
      data.results.forEach(game => {
        const w = document.createElement('div');
        w.innerHTML = card(game);
        const el = w.firstElementChild;
        el.addEventListener('click', () => location.href = `/game.php?slug=${game.slug}`);
        grid.appendChild(el);
      });
      hasMore = !!data.next;
    }
    updateLoadMore();
  } catch (err) {
    if (reset) document.getElementById('gamesGrid').innerHTML = apiError(err);
    else { currentPage--; updateLoadMore(); }
  } finally {
    isLoading = false;
  }
}

function card(g) {
  const rating = g.rating ? `★ ${g.rating.toFixed(1)}` : '—';
  const mc = g.metacritic ? `<span style="color:#4ade80;font-size:0.72rem;font-weight:700;margin-left:4px;">MC ${g.metacritic}</span>` : '';
  const st = statusMap[g.id];
  const badge = st ? `<span class="card-status-badge status-${st}">${st==='played'?'✓':st==='playing'?'▶':'♡'}</span>` : '';
  return `
    <div class="game-card" data-slug="${g.slug}" style="position:relative;cursor:pointer;">
      ${badge}
      <div class="game-card-img" style="overflow:hidden;aspect-ratio:3/4;">
        <img src="${g.background_image||''}" alt="${g.name}"
             style="width:100%;height:100%;object-fit:cover;" loading="lazy"
             onerror="this.style.display='none';this.parentElement.innerHTML+='🎮';" />
      </div>
      <div class="game-card-body">
        <div class="game-card-genre">${g.genres?.[0]?.name||'—'}</div>
        <div class="game-card-title" title="${g.name}">${g.name}</div>
        <div class="game-card-rating">${rating}${mc}</div>
      </div>
    </div>`;
}

function bindSearch() {
  const s = document.getElementById('searchGames');
  let t;
  s?.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => { currentQuery = s.value.trim(); loadGames(true); }, 450);
  });
}

function bindLoadMore() {
  let b = document.getElementById('loadMoreBtn');
  if (!b) {
    b = document.createElement('button');
    b.id = 'loadMoreBtn';
    b.className = 'btn-secondary';
    b.style.cssText = 'display:block;margin:2rem auto;min-width:200px;';
    b.textContent = 'Charger plus';
    document.querySelector('.page-main')?.appendChild(b);
  }
  b.addEventListener('click', () => loadGames(false));
}
function updateLoadMore() {
  const b = document.getElementById('loadMoreBtn');
  if (!b) return;
  b.textContent = 'Charger plus'; b.disabled = false;
  b.style.display = hasMore ? 'block' : 'none';
}

function skeleton(n) {
  return Array.from({length:n},()=>`
    <div class="game-card" style="pointer-events:none;">
      <div style="aspect-ratio:3/4;background:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;"></div>
      <div class="game-card-body">
        <div style="height:10px;background:var(--bg3);margin-bottom:6px;width:40%;border-radius:4px;"></div>
        <div style="height:14px;background:var(--bg3);width:90%;border-radius:4px;"></div>
      </div></div>`).join('');
}
function apiError(err) {
  const needsKey = typeof CONFIG==='undefined' || CONFIG.RAWG_KEY==='YOUR_RAWG_API_KEY' || !CONFIG.RAWG_KEY;
  return `<div style="padding:2rem;color:var(--text-muted);grid-column:1/-1;">
    <p style="font-weight:700;color:var(--accent);">${needsKey?'⚠️ Clé RAWG manquante':'⚠️ Impossible de charger les jeux'}</p>
    ${needsKey?'<p>Configure ta clé dans assets/js/config.js</p>':`<p>${err.message||err}</p>`}</div>`;
}

const _s = document.createElement('style');
_s.textContent = `.card-status-badge{position:absolute;top:8px;right:8px;z-index:2;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:800;}
.status-played{background:#4ade80;color:#000;}.status-playing{background:var(--accent);color:#000;}.status-want{background:var(--accent2);color:#fff;}`;
document.head.appendChild(_s);
