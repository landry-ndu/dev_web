/* ============================================================
   main.js – Page d'accueil
   Jeux populaires via RAWG API + dernières actus via RSS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  renderPopularGames();
  renderRecentNews();
});

/* ---- Jeux populaires (RAWG) ---- */
async function renderPopularGames() {
  const grid = document.getElementById('popularGamesGrid');
  if (!grid) return;

  /* Skeleton */
  grid.innerHTML = Array.from({ length: 4 }, () => `
    <div class="game-card" style="pointer-events:none;">
      <div style="aspect-ratio:3/4;background:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;"></div>
      <div class="game-card-body">
        <div style="height:10px;border-radius:4px;background:var(--bg3);margin-bottom:6px;width:40%;"></div>
        <div style="height:14px;border-radius:4px;background:var(--bg3);margin-bottom:6px;width:90%;"></div>
        <div style="height:10px;border-radius:4px;background:var(--bg3);width:30%;"></div>
      </div>
    </div>`).join('');

  try {
    const data = await API.getPopularGames({ pageSize: 8 });
    const games = data.results || [];

    grid.innerHTML = games.slice(0, 8).map(game => {
      const rating = game.rating ? `★ ${game.rating.toFixed(1)}` : '—';
      const status = Letterbox.getStatus(game.id);
      const badge  = status
        ? `<span style="position:absolute;top:8px;right:8px;z-index:2;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:800;background:${status==='played'?'#4ade80':status==='playing'?'var(--accent)':'var(--accent2)'};color:${status==='want'?'#fff':'#000'};">${status==='played'?'✓':status==='playing'?'▶':'♡'}</span>`
        : '';
      return `
        <div class="game-card" data-slug="${game.slug}" style="position:relative;cursor:pointer;">
          ${badge}
          <div class="game-card-img" style="overflow:hidden;aspect-ratio:3/4;">
            <img src="${game.background_image||''}" alt="${game.name}"
                 style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s;"
                 loading="lazy" onerror="this.style.display='none'" />
          </div>
          <div class="game-card-body">
            <div class="game-card-genre">${game.genres?.[0]?.name||'—'}</div>
            <div class="game-card-title" title="${game.name}">${game.name}</div>
            <div class="game-card-rating">${rating}</div>
          </div>
        </div>`;
    }).join('');

    grid.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', () => {
        window.location.href = `game.html?slug=${card.dataset.slug}`;
      });
    });
  } catch {
    /* Fallback données statiques */
    const top = [...GAMES].sort((a, b) => b.avgRating - a.avgRating).slice(0, 4);
    grid.innerHTML = top.map(game => `
      <div class="game-card" data-id="${game.id}" style="cursor:pointer;">
        <div class="game-card-img placeholder">${game.cover}</div>
        <div class="game-card-body">
          <div class="game-card-genre">${game.genre}</div>
          <div class="game-card-title">${game.title}</div>
          <div class="game-card-rating">★ ${game.avgRating}/5</div>
        </div>
      </div>`).join('');
  }
}

/* ---- Actualités récentes (RSS) ---- */
async function renderRecentNews() {
  const grid = document.getElementById('recentNewsGrid');
  if (!grid) return;

  /* Skeleton */
  grid.innerHTML = Array.from({ length: 3 }, () => `
    <div class="news-card" style="pointer-events:none;">
      <div style="height:12px;border-radius:4px;background:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;margin-bottom:8px;width:30%;"></div>
      <div style="height:18px;border-radius:4px;background:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;margin-bottom:8px;"></div>
      <div style="height:14px;border-radius:4px;background:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;width:80%;"></div>
    </div>`).join('');

  try {
    const items = await API.getAllNews(4);
    const recent = items.slice(0, 3);

    grid.innerHTML = recent.map(item => {
      const date = item.pubDate
        ? new Date(item.pubDate).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })
        : '';
      const thumb = item.thumbnail && item.thumbnail !== 'self'
        ? `<img src="${item.thumbnail}" alt="" style="width:100%;height:140px;object-fit:cover;border-radius:6px;margin-bottom:0.75rem;" loading="lazy" onerror="this.style.display='none'" />`
        : '';
      const desc = item.description
        ? (item.description.replace(/<[^>]*>/g,'').substring(0, 120) + '…')
        : '';
      return `
        <div class="news-card">
          ${thumb}
          <span class="news-card-category">${item._source}</span>
          <div class="news-card-title">${item.title}</div>
          <p class="news-card-excerpt">${desc}</p>
          <div class="news-card-meta">
            <span>${date}</span>
            <a href="${item.link}" target="_blank" rel="noopener" class="action-btn">Lire ↗</a>
          </div>
        </div>`;
    }).join('');
  } catch {
    /* Fallback données statiques */
    const recent = [...ARTICLES].slice(0, 3);
    grid.innerHTML = recent.map(article => `
      <div class="news-card" style="cursor:pointer;" onclick="window.location='actualites.html'">
        <span class="news-card-category">${article.category}</span>
        <div class="news-card-title">${article.title}</div>
        <p class="news-card-excerpt">${article.excerpt}</p>
        <div class="news-card-meta">
          <span>${article.author} · ${article.date}</span>
        </div>
      </div>`).join('');
  }
}

/* getLikedArticles / isLiked / toggleLike sont définis dans data.js */
