/* ============================================================
   jeux.js – Catalogue de jeux via RAWG API
   ============================================================ */

let currentPage  = 1;
let totalPages   = 1;
let currentQuery = '';
let currentGenre = '';
let isLoading    = false;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const genre  = params.get('genre');
  if (genre) {
    const sel = document.getElementById('filterGenre');
    if (sel) { sel.value = genre; currentGenre = genre; }
  }

  loadGames(true);
  bindFilters();
});

/* ---- Chargement ---- */
async function loadGames(reset = false) {
  if (isLoading) return;
  isLoading = true;

  if (reset) {
    currentPage = 1;
    document.getElementById('gamesGrid').innerHTML = renderSkeletonCards(8);
  }

  try {
    let data;
    if (currentQuery) {
      data = await API.searchGames(currentQuery, { page: currentPage, pageSize: 20 });
    } else if (currentGenre) {
      data = await API.getGamesByGenre(currentGenre, { page: currentPage, pageSize: 20 });
    } else {
      data = await API.getPopularGames({ page: currentPage, pageSize: 20 });
    }

    totalPages = Math.ceil((data.count || 1) / 20);

    const grid = document.getElementById('gamesGrid');
    if (reset) grid.innerHTML = '';

    if (!data.results?.length) {
      grid.innerHTML = '<p style="color:var(--text-muted);padding:2rem;grid-column:1/-1;">Aucun jeu trouvé.</p>';
    } else {
      data.results.forEach(game => {
        const wrap = document.createElement('div');
        wrap.innerHTML = createGameCard(game);
        const el = wrap.firstElementChild;
        el.addEventListener('click', () => {
          window.location.href = `game.html?slug=${game.slug}`;
        });
        grid.appendChild(el);
      });
    }

    updatePagination();
  } catch (err) {
    document.getElementById('gamesGrid').innerHTML = renderApiError(err);
  } finally {
    isLoading = false;
  }
}

/* ---- Card ---- */
function createGameCard(game) {
  const rating = game.rating ? `★ ${game.rating.toFixed(1)}` : '—';
  const mc     = game.metacritic
    ? `<span style="color:#4ade80;font-size:0.72rem;font-weight:700;margin-left:4px;">MC ${game.metacritic}</span>`
    : '';
  const status = Letterbox.getStatus(game.id);
  const badge  = status
    ? `<span class="card-status-badge status-${status}">${status==='played'?'✓':status==='playing'?'▶':'♡'}</span>`
    : '';

  return `
    <div class="game-card" data-id="${game.id}" data-slug="${game.slug}" style="position:relative;cursor:pointer;">
      ${badge}
      <div class="game-card-img" style="overflow:hidden;aspect-ratio:3/4;">
        <img src="${game.background_image||''}" alt="${game.name}"
             style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s;"
             loading="lazy"
             onerror="this.style.display='none';this.parentElement.innerHTML+='🎮';" />
      </div>
      <div class="game-card-body">
        <div class="game-card-genre">${game.genres?.[0]?.name||'—'}</div>
        <div class="game-card-title" title="${game.name}">${game.name}</div>
        <div class="game-card-rating">${rating}${mc}</div>
      </div>
    </div>`;
}

/* ---- Filtres ---- */
function bindFilters() {
  const search = document.getElementById('searchGames');
  const genre  = document.getElementById('filterGenre');

  let searchTimer;
  search?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentQuery = search.value.trim();
      currentGenre = '';
      if (genre) genre.value = '';
      loadGames(true);
    }, 450);
  });

  genre?.addEventListener('change', () => {
    currentGenre = genre.value;
    currentQuery = '';
    if (search) search.value = '';
    loadGames(true);
  });
}

/* ---- Pagination ---- */
function updatePagination() {
  let pg = document.getElementById('pagination');
  if (!pg) {
    pg = document.createElement('div');
    pg.id = 'pagination';
    pg.style.cssText = 'display:flex;justify-content:center;align-items:center;gap:0.75rem;margin:2rem 0;';
    document.querySelector('.page-main')?.appendChild(pg);
  }

  pg.innerHTML = '';
  if (totalPages <= 1) return;

  const prev = document.createElement('button');
  prev.textContent = '← Précédent';
  prev.className = 'btn-secondary';
  prev.disabled = currentPage === 1;
  prev.addEventListener('click', () => { currentPage--; loadGames(true); window.scrollTo(0, 0); });

  const info = document.createElement('span');
  info.style.cssText = 'color:var(--text-muted);font-size:0.85rem;';
  info.textContent = `Page ${currentPage} / ${totalPages}`;

  const next = document.createElement('button');
  next.textContent = 'Suivant →';
  next.className = 'btn-secondary';
  next.disabled = currentPage >= totalPages;
  next.addEventListener('click', () => { currentPage++; loadGames(true); window.scrollTo(0, 0); });

  pg.append(prev, info, next);
}

/* ---- Skeleton ---- */
function renderSkeletonCards(n) {
  return Array.from({ length: n }, () => `
    <div class="game-card" style="pointer-events:none;">
      <div style="aspect-ratio:3/4;background:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;"></div>
      <div class="game-card-body">
        <div style="height:10px;border-radius:4px;background:var(--bg3);margin-bottom:6px;width:40%;"></div>
        <div style="height:14px;border-radius:4px;background:var(--bg3);margin-bottom:6px;width:90%;"></div>
        <div style="height:10px;border-radius:4px;background:var(--bg3);width:30%;"></div>
      </div>
    </div>`).join('');
}

function renderApiError(err) {
  const needsKey = CONFIG.RAWG_KEY === 'YOUR_RAWG_API_KEY';
  return `<div style="padding:2rem;color:var(--text-muted);grid-column:1/-1;">
    <p style="font-weight:700;color:var(--accent);margin-bottom:0.5rem;">
      ${needsKey ? '⚠️ Clé RAWG manquante' : '⚠️ Impossible de charger les jeux'}
    </p>
    ${needsKey
      ? `<p>Obtiens ta clé gratuite sur <a href="https://rawg.io/apidocs" target="_blank"
           style="color:var(--accent)">rawg.io/apidocs</a>, puis remplace <code>YOUR_RAWG_API_KEY</code>
           dans <code>js/config.js</code>.</p>`
      : `<p>${err.message}</p>`}
  </div>`;
}

/* Badges statut sur les cards */
const _badgeStyle = document.createElement('style');
_badgeStyle.textContent = `
  .card-status-badge {
    position:absolute;top:8px;right:8px;z-index:2;width:24px;height:24px;
    border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-size:0.7rem;font-weight:800;
  }
  .status-played  { background:#4ade80;color:#000; }
  .status-playing { background:var(--accent);color:#000; }
  .status-want    { background:var(--accent2);color:#fff; }
`;
document.head.appendChild(_badgeStyle);
