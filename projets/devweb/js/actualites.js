/* ============================================================
   actualites.js – Page actualités : liste, filtres, modal, journaliste
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  renderNewsList();
  bindNewsFilters();
  bindArticleModal();
  bindJournalistActions();
});

let filteredArticles = [...ARTICLES];

function renderNewsList() {
  const list = document.getElementById('newsList');
  if (!list) return;
  filteredArticles = [...ARTICLES]; /* refresh */
  applyNewsFilters();
}

function applyNewsFilters() {
  const list = document.getElementById('newsList');
  if (!list) return;

  const q    = (document.getElementById('searchNews')?.value || '').toLowerCase();
  const cat  = document.getElementById('filterCategory')?.value || '';

  filteredArticles = ARTICLES.filter(a =>
    (!q   || a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q)) &&
    (!cat || a.category === cat)
  );

  list.innerHTML = filteredArticles.map(article => `
    <div class="news-list-item" data-id="${article.id}">
      <div>
        <span class="news-card-category">${article.category}</span>
        ${article.userCreated ? '<span class="news-card-category" style="background:rgba(232,200,74,0.12);color:var(--accent)">Communauté</span>' : ''}
      </div>
      <h3 class="news-list-title" data-id="${article.id}">${article.title}</h3>
      <p class="news-list-excerpt">${article.excerpt}</p>
      <div class="news-list-footer">
        <span style="font-size:0.8rem;color:var(--text-muted)">${article.author} · ${article.date}</span>
        <div class="news-card-actions">
          <button class="action-btn like-btn ${isLiked(article.id) ? 'liked' : ''}" data-id="${article.id}">
            ${isLiked(article.id) ? '♥' : '♡'} ${article.likes}
          </button>
          <button class="action-btn" data-id="${article.id}" onclick="shareArticle(${article.id})">
            ↗ Partager
          </button>
          <button class="action-btn read-btn" data-id="${article.id}">Lire →</button>
        </div>
      </div>
    </div>`).join('');

  /* Bindings */
  list.querySelectorAll('.news-list-title, .read-btn').forEach(el => {
    el.addEventListener('click', () => {
      const id = parseInt(el.dataset.id);
      openArticleModal(ARTICLES.find(a => a.id === id));
    });
  });

  list.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      toggleLike(id);
      const article = ARTICLES.find(a => a.id === id);
      const liked = isLiked(id);
      btn.classList.toggle('liked', liked);
      btn.innerHTML = `${liked ? '♥' : '♡'} ${article.likes}`;
    });
  });
}

function bindNewsFilters() {
  document.getElementById('searchNews')?.addEventListener('input', applyNewsFilters);
  document.getElementById('filterCategory')?.addEventListener('change', applyNewsFilters);
}

function bindArticleModal() {
  const overlay = document.getElementById('articleModal');
  const closeBtn = document.getElementById('articleModalClose');
  if (!overlay) return;
  closeBtn?.addEventListener('click', () => overlay.classList.add('hidden'));
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });
}

function bindJournalistActions() {
  const bar        = document.getElementById('journalistActions');
  const formWrapper= document.getElementById('articleFormWrapper');
  const newBtn     = document.getElementById('newArticleBtn');
  const cancelBtn  = document.getElementById('cancelArticle');
  const form       = document.getElementById('articleForm');

  if (!bar) return;

  if (Auth.isJournalist()) {
    bar.classList.remove('hidden');
  }

  newBtn?.addEventListener('click', () => {
    formWrapper.classList.remove('hidden');
    newBtn.classList.add('hidden');
  });

  cancelBtn?.addEventListener('click', () => {
    formWrapper.classList.add('hidden');
    newBtn.classList.remove('hidden');
    form.reset();
  });

  form?.addEventListener('submit', e => {
    e.preventDefault();
    const user = Auth.getCurrentUser();
    const title    = document.getElementById('articleTitle').value.trim();
    const category = document.getElementById('articleCategory').value;
    const content  = document.getElementById('articleContent').value.trim();

    if (!title || !content) return;

    const newArticle = {
      id: Date.now(),
      title,
      category,
      author: user.username,
      date: new Date().toISOString().split('T')[0],
      excerpt: content.substring(0, 140) + (content.length > 140 ? '…' : ''),
      content,
      likes: 0,
      comments: [],
      userCreated: true
    };

    ARTICLES.unshift(newArticle);
    saveDynamicData();

    form.reset();
    formWrapper.classList.add('hidden');
    newBtn.classList.remove('hidden');
    renderNewsList();
  });
}

/* Simulation partage */
function shareArticle(articleId) {
  const article = ARTICLES.find(a => a.id === articleId);
  if (!article) return;
  if (navigator.share) {
    navigator.share({ title: article.title, text: article.excerpt });
  } else {
    navigator.clipboard?.writeText(window.location.href + '#article-' + articleId);
    alert('Lien copié dans le presse-papiers !');
  }
}
