/* ============================================================
   actualites.js – Fil d'actualités gaming en temps réel
   Sources : RSS IGN, Gamekult, Jeuxvideo.com via rss2json
   + articles communautaires (journalistes connectés)
   ============================================================ */

let allNewsItems    = [];   /* articles RSS récupérés */
let filterMode      = 'all'; /* 'all' | 'followed' */
let filterSource    = '';
let filterQuery     = '';
let refreshInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  loadNews();
  bindFilters();
  bindArticleModal();
  bindJournalistActions();
  bindFollowFilter();

  /* Actualisation automatique */
  refreshInterval = setInterval(loadNews, CONFIG.NEWS_REFRESH_MS);
});

/* ---- Chargement RSS ---- */
async function loadNews() {
  const list = document.getElementById('newsList');
  if (!list) return;

  /* Squelette */
  if (!allNewsItems.length) {
    list.innerHTML = renderNewsSkeletons(6);
  }

  try {
    const items = await API.getAllNews(CONFIG.NEWS_PER_FEED);
    allNewsItems = items;
    applyFilters();
  } catch (err) {
    if (!allNewsItems.length) {
      list.innerHTML = `<p style="color:var(--text-muted);padding:1rem;">
        Impossible de charger les actualités. Vérifie ta connexion.</p>`;
    }
  }

  /* Ajoute les articles communautaires en haut */
  renderCommunityArticles();
}

/* ---- Articles communautaires (journalistes) ---- */
function renderCommunityArticles() {
  const wrap = document.getElementById('communityArticles');
  if (!wrap) return;
  if (!ARTICLES.length) { wrap.innerHTML = ''; return; }

  wrap.innerHTML = ARTICLES.map(article => `
    <div class="news-list-item community-item" data-id="${article.id}">
      <div style="display:flex;gap:0.4rem;margin-bottom:0.4rem;">
        <span class="news-card-category">${article.category}</span>
        <span class="news-card-category" style="background:rgba(232,200,74,0.12);color:var(--accent)">Communauté</span>
      </div>
      <h3 class="news-list-title" data-id="${article.id}">${article.title}</h3>
      <p class="news-list-excerpt">${article.excerpt}</p>
      <div class="news-list-footer">
        <span style="font-size:0.8rem;color:var(--text-muted)">${article.author} · ${article.date}</span>
        <div class="news-card-actions">
          <button class="action-btn like-btn ${isLiked(article.id)?'liked':''}" data-id="${article.id}">
            ${isLiked(article.id)?'♥':'♡'} ${article.likes}
          </button>
          <button class="action-btn read-btn" data-id="${article.id}">Lire →</button>
        </div>
      </div>
    </div>`).join('');

  wrap.querySelectorAll('.news-list-title, .read-btn').forEach(el => {
    el.addEventListener('click', () => {
      const id = parseInt(el.dataset.id);
      openArticleModal(ARTICLES.find(a => a.id === id));
    });
  });

  wrap.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      toggleLike(id);
      const article = ARTICLES.find(a => a.id === id);
      const liked = isLiked(id);
      btn.classList.toggle('liked', liked);
      btn.innerHTML = `${liked?'♥':'♡'} ${article.likes}`;
    });
  });
}

/* ---- Rendu RSS ---- */
function applyFilters() {
  const list = document.getElementById('newsList');
  if (!list) return;

  const followed = Letterbox.getFollowed().map(g => g.name.toLowerCase());

  let items = allNewsItems.filter(item => {
    const text = (item.title + ' ' + (item.description || '')).toLowerCase();

    /* Filtre mode suivi */
    if (filterMode === 'followed') {
      if (!followed.length) return false;
      if (!followed.some(name => text.includes(name))) return false;
    }

    /* Filtre source */
    if (filterSource && item._source !== filterSource) return false;

    /* Recherche texte */
    if (filterQuery && !item.title.toLowerCase().includes(filterQuery)) return false;

    return true;
  });

  if (!items.length) {
    list.innerHTML = `<p style="color:var(--text-muted);padding:1rem;">
      ${filterMode === 'followed'
        ? 'Aucune actualité pour tes jeux suivis. <a href="jeux.html" style="color:var(--accent)">Suis des jeux →</a>'
        : 'Aucun article trouvé.'}
    </p>`;
    return;
  }

  list.innerHTML = items.map(item => renderRssItem(item, followed)).join('');
}

function renderRssItem(item, followed = []) {
  const text      = (item.title + ' ' + (item.description || '')).toLowerCase();
  const isMatch   = followed.length && followed.some(n => text.includes(n));
  const thumbnail = item.thumbnail && item.thumbnail !== 'self'
    ? `<img src="${item.thumbnail}" alt="" class="rss-thumb" loading="lazy" onerror="this.style.display='none'" />`
    : '';

  const date = item.pubDate
    ? new Date(item.pubDate).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })
    : '';

  return `
    <div class="news-list-item rss-item ${isMatch ? 'rss-followed' : ''}" data-url="${item.link}">
      ${thumbnail}
      <div class="rss-item-body">
        <div style="display:flex;gap:0.4rem;align-items:center;margin-bottom:0.4rem;flex-wrap:wrap;">
          <span class="news-card-category">${item._source}</span>
          ${item._lang === 'fr' ? '<span class="news-card-category" style="background:rgba(232,200,74,0.08);color:var(--accent)">FR</span>' : ''}
          ${isMatch ? '<span class="news-card-category" style="background:rgba(168,85,247,0.15);color:var(--accent2)">🔔 Suivi</span>' : ''}
        </div>
        <h3 class="news-list-title rss-title">${item.title}</h3>
        <p class="news-list-excerpt">${stripHtml(item.description || '').substring(0, 180)}…</p>
        <div class="news-list-footer">
          <span style="font-size:0.8rem;color:var(--text-muted)">${item.author ? item.author + ' · ' : ''}${date}</span>
          <div class="news-card-actions">
            <a href="${item.link}" target="_blank" rel="noopener" class="action-btn">Lire ↗</a>
            <button class="action-btn share-rss-btn" data-url="${item.link}" data-title="${item.title}">↗ Partager</button>
          </div>
        </div>
      </div>
    </div>`;
}

/* ---- Filtres ---- */
function bindFilters() {
  document.getElementById('searchNews')?.addEventListener('input', e => {
    filterQuery = e.target.value.toLowerCase().trim();
    applyFilters();
  });

  document.getElementById('filterSource')?.addEventListener('change', e => {
    filterSource = e.target.value;
    applyFilters();
  });

  /* Délégation pour les boutons partage RSS */
  document.getElementById('newsList')?.addEventListener('click', e => {
    const btn = e.target.closest('.share-rss-btn');
    if (!btn) return;
    const url   = btn.dataset.url;
    const title = btn.dataset.title;
    if (navigator.share) {
      navigator.share({ title, url });
    } else {
      navigator.clipboard?.writeText(url);
      alert('Lien copié !');
    }
  });
}

/* ---- Bouton filtre "Mes jeux suivis" ---- */
function bindFollowFilter() {
  const btn = document.getElementById('btnFollowedFilter');
  if (!btn) return;

  function update() {
    const followed = Letterbox.getFollowed();
    btn.textContent = `🔔 Mes jeux suivis (${followed.length})`;
    btn.classList.toggle('active', filterMode === 'followed');
  }

  btn.addEventListener('click', () => {
    filterMode = filterMode === 'followed' ? 'all' : 'followed';
    update();
    applyFilters();
  });

  update();
}

/* ---- Modal article communautaire ---- */
function bindArticleModal() {
  const overlay = document.getElementById('articleModal');
  const closeBtn = document.getElementById('articleModalClose');
  if (!overlay) return;
  closeBtn?.addEventListener('click', () => overlay.classList.add('hidden'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); });
}

/* ---- Journaliste : nouvel article ---- */
function bindJournalistActions() {
  const bar         = document.getElementById('journalistActions');
  const formWrapper = document.getElementById('articleFormWrapper');
  const newBtn      = document.getElementById('newArticleBtn');
  const cancelBtn   = document.getElementById('cancelArticle');
  const form        = document.getElementById('articleForm');

  if (!bar) return;
  if (Auth.isJournalist()) bar.classList.remove('hidden');

  newBtn?.addEventListener('click', () => {
    formWrapper.classList.remove('hidden');
    newBtn.classList.add('hidden');
  });

  cancelBtn?.addEventListener('click', () => {
    formWrapper.classList.add('hidden');
    newBtn.classList.remove('hidden');
    form?.reset();
  });

  form?.addEventListener('submit', e => {
    e.preventDefault();
    const user     = Auth.getCurrentUser();
    const title    = document.getElementById('articleTitle').value.trim();
    const category = document.getElementById('articleCategory').value;
    const content  = document.getElementById('articleContent').value.trim();
    if (!title || !content) return;

    const article = {
      id: Date.now(),
      title, category,
      author: user.username,
      date: new Date().toISOString().split('T')[0],
      excerpt: content.substring(0, 160) + (content.length > 160 ? '…' : ''),
      content, likes: 0, comments: [], userCreated: true
    };

    ARTICLES.unshift(article);
    saveDynamicData();
    form.reset();
    formWrapper.classList.add('hidden');
    newBtn.classList.remove('hidden');
    renderCommunityArticles();
  });
}

/* ---- Helpers ---- */
function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function renderNewsSkeletons(n) {
  return Array.from({ length: n }, () => `
    <div class="news-list-item" style="pointer-events:none;">
      <div style="height:16px;border-radius:4px;background:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;margin-bottom:8px;width:60%;"></div>
      <div style="height:14px;border-radius:4px;background:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;margin-bottom:6px;width:95%;"></div>
      <div style="height:14px;border-radius:4px;background:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;width:80%;"></div>
    </div>`).join('');
}

/* Styles RSS */
const _rssStyle = document.createElement('style');
_rssStyle.textContent = `
  .rss-item { display:flex; gap:1rem; align-items:flex-start; }
  .rss-thumb { width:120px;height:80px;object-fit:cover;border-radius:6px;flex-shrink:0;border:1px solid var(--border); }
  .rss-item-body { flex:1;min-width:0; }
  .rss-followed { border-left-color:var(--accent2)!important; background:rgba(168,85,247,0.04); }
  .rss-title { cursor:default!important; }
  #btnFollowedFilter.active { border-color:var(--accent2);color:var(--accent2);background:rgba(168,85,247,0.1); }
  @media(max-width:600px){ .rss-thumb{display:none;} }
`;
document.head.appendChild(_rssStyle);
