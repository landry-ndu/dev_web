/* ============================================================
   main.js – Accueil : jeux populaires (RAWG) + news (RSS)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  renderPopularGames();
  renderRecentNews();
});

async function renderPopularGames() {
  const grid = document.getElementById('popularGamesGrid');
  if (!grid) return;
  grid.innerHTML = skeletonCards(8);

  try {
    const data = await API.getPopularGames({ pageSize: 8 });
    const games = data.results || [];
    grid.innerHTML = games.map(g => `
      <div class="game-card" data-slug="${g.slug}" style="cursor:pointer;">
        <div class="game-card-img" style="overflow:hidden;aspect-ratio:3/4;">
          <img src="${g.background_image||''}" alt="${g.name}"
               style="width:100%;height:100%;object-fit:cover;" loading="lazy"
               onerror="this.style.display='none'" />
        </div>
        <div class="game-card-body">
          <div class="game-card-genre">${g.genres?.[0]?.name||'—'}</div>
          <div class="game-card-title" title="${g.name}">${g.name}</div>
          <div class="game-card-rating">${g.rating?'★ '+g.rating.toFixed(1):'—'}</div>
        </div>
      </div>`).join('');
    grid.querySelectorAll('.game-card').forEach(c =>
      c.addEventListener('click', () => location.href = `/game.php?slug=${c.dataset.slug}`));
  } catch {
    const top = (typeof GAMES !== 'undefined' ? GAMES : []).slice(0, 4);
    grid.innerHTML = top.map(g => `
      <div class="game-card"><div class="game-card-img placeholder">${g.cover||'🎮'}</div>
        <div class="game-card-body">
          <div class="game-card-genre">${g.genre||''}</div>
          <div class="game-card-title">${g.title||''}</div>
          <div class="game-card-rating">★ ${g.avgRating||'—'}</div>
        </div></div>`).join('');
  }
}

async function renderRecentNews() {
  const grid = document.getElementById('recentNewsGrid');
  if (!grid) return;
  grid.innerHTML = Array.from({length:3},()=>'<div class="news-card" style="height:140px;background:var(--bg3);border-radius:10px;"></div>').join('');

  try {
    const items = (await API.getAllNews(4)).slice(0, 3);
    grid.innerHTML = items.map(it => {
      const date = it.pubDate ? new Date(it.pubDate).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}) : '';
      const thumb = it.thumbnail && it.thumbnail!=='self'
        ? `<img src="${it.thumbnail}" alt="" style="width:100%;height:140px;object-fit:cover;border-radius:6px;margin-bottom:0.75rem;" loading="lazy" onerror="this.style.display='none'" />` : '';
      return `<div class="news-card">${thumb}
        <span class="news-card-category">${it._source}</span>
        <div class="news-card-title">${it.title}</div>
        <p class="news-card-excerpt">${(it.description||'').replace(/<[^>]*>/g,'').substring(0,120)}…</p>
        <div class="news-card-meta"><span>${date}</span>
          <a href="${it.link}" target="_blank" rel="noopener" class="action-btn">Lire ↗</a></div>
      </div>`;
    }).join('');
  } catch {
    grid.innerHTML = '<p style="color:var(--text-muted);">Actus indisponibles.</p>';
  }
}

function skeletonCards(n) {
  return Array.from({length:n},()=>`
    <div class="game-card" style="pointer-events:none;">
      <div style="aspect-ratio:3/4;background:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;"></div>
      <div class="game-card-body">
        <div style="height:10px;background:var(--bg3);margin-bottom:6px;width:40%;border-radius:4px;"></div>
        <div style="height:14px;background:var(--bg3);width:90%;border-radius:4px;"></div>
      </div></div>`).join('');
}
