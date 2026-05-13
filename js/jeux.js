/* ============================================================
   jeux.js – Catalogue de jeux via RAWG API (simplifié)
   ============================================================ */

let currentPage  = 1;
let currentQuery = '';
let isLoading    = false;
let hasMore      = true;

document.addEventListener('DOMContentLoaded', () => {
  loadGames(true);
  bindSearch();
  bindLoadMore();
});

/* ---- Chargement ----
   reset = true  → vide la grille, recommence à la page 1
   reset = false → ajoute la page suivante à la fin */
async function loadGames(reset = false) {
  if (isLoading) return;
  isLoading = true;

  if (reset) {
    currentPage = 1;
    hasMore = true;
    document.getElementById('gamesGrid').innerHTML = renderSkeletonCards(8);
  } else {
    currentPage++;
    showLoadMoreSpinner();
  }

  try {
    const data = currentQuery
      ? await API.searchGames(currentQuery, { page: currentPage, pageSize: 20 })
      : await API.getPopularGames({ page: currentPage, pageSize: 20 });

    const grid = document.getElementById('gamesGrid');
    if (reset) grid.innerHTML = '';

    if (!data.results?.length) {
      hasMore = false;
      if (reset) {
        grid.innerHTML = '<p style="color:var(--text-muted);padding:2rem;grid-column:1/-1;">Aucun jeu trouvé.</p>';
      }
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
      hasMore = !!data.next;
    }

    updateLoadMoreBtn();
  } catch (err) {
    console.error('RAWG error:', err);
    if (reset) {
      document.getElementById('gamesGrid').innerHTML = renderApiError(err);
    } else {
      currentPage--; /* on revert si erreur */
      updateLoadMoreBtn();
    }
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
  const status = (typeof Letterbox !== 'undefined') ? Letterbox.getStatus(game.id) : null;
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

/* ---- Recherche (avec debounce) ---- */
function bindSearch() {
  const search = document.getElementById('searchGames');
  let timer;
  search?.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      currentQuery = search.value.trim();
      loadGames(true);
    }, 450);
  });
}

/* ---- Bouton "Charger plus" ---- */
function bindLoadMore() {
  let btn = document.getElementById('loadMoreBtn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'loadMoreBtn';
    btn.className = 'btn-secondary';
    btn.style.cssText = 'display:block;margin:2rem auto;min-width:200px;';
    btn.textContent = 'Charger plus';
    document.querySelector('.page-main')?.appendChild(btn);
  }
  btn.addEventListener('click', () => loadGames(false));
}

function updateLoadMoreBtn() {
  const btn = document.getElementById('loadMoreBtn');
  if (!btn) return;
  btn.textContent = 'Charger plus';
  btn.disabled = false;
  btn.style.display = hasMore ? 'block' : 'none';
}

function showLoadMoreSpinner() {
  const btn = document.getElementById('loadMoreBtn');
  if (!btn) return;
  btn.textContent = 'Chargement…';
  btn.disabled = true;
}

/* ---- Skeleton & erreur ---- */
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
  const needsKey = (typeof CONFIG === 'undefined') ||
                   CONFIG.RAWG_KEY === 'YOUR_RAWG_API_KEY' ||
                   !CONFIG.RAWG_KEY;
  return `<div style="padding:2rem;color:var(--text-muted);grid-column:1/-1;">
    <p style="font-weight:700;color:var(--accent);margin-bottom:0.5rem;">
      ${needsKey ? '⚠️ Clé RAWG manquante' : '⚠️ Impossible de charger les jeux'}
    </p>
    ${needsKey
      ? `<p>Obtiens ta clé gratuite sur <a href="https://rawg.io/apidocs" target="_blank"
           style="color:var(--accent)">rawg.io/apidocs</a>, puis remplace <code>YOUR_RAWG_API_KEY</code>
           dans <code>js/config.js</code>.</p>`
      : `<p>${err.message || err}</p>`}
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
