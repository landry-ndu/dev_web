/* ============================================================
   main.js – Page d'accueil : jeux populaires + actus récentes
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  renderPopularGames();
  renderRecentNews();
});

function renderPopularGames() {
  const grid = document.getElementById('popularGamesGrid');
  if (!grid) return;

  const top = [...GAMES].sort((a, b) => b.avgRating - a.avgRating).slice(0, 4);
  grid.innerHTML = top.map(game => createGameCard(game)).join('');

  grid.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.dataset.id);
      openGameModal(GAMES.find(g => g.id === id));
    });
  });
}

function renderRecentNews() {
  const grid = document.getElementById('recentNewsGrid');
  if (!grid) return;

  const recent = [...ARTICLES].slice(0, 3);
  grid.innerHTML = recent.map(article => createNewsCard(article)).join('');

  grid.querySelectorAll('.news-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.action-btn')) return;
      const id = parseInt(card.dataset.id);
      openArticleModal(ARTICLES.find(a => a.id === id));
    });
  });

  bindNewsCardActions(grid);
}

/* ---------- Game Card ---------- */
function createGameCard(game) {
  const stars = '★'.repeat(Math.round(game.avgRating)) + '☆'.repeat(5 - Math.round(game.avgRating));
  return `
    <div class="game-card" data-id="${game.id}">
      <div class="game-card-img placeholder">${game.cover}</div>
      <div class="game-card-body">
        <div class="game-card-genre">${game.genre}</div>
        <div class="game-card-title">${game.title}</div>
        <div class="game-card-rating">
          <span>${stars}</span>
          <span>${game.avgRating}/5</span>
        </div>
      </div>
    </div>`;
}

/* ---------- News Card ---------- */
function createNewsCard(article) {
  const liked = isLiked(article.id);
  return `
    <div class="news-card" data-id="${article.id}">
      <span class="news-card-category">${article.category}</span>
      <div class="news-card-title">${article.title}</div>
      <p class="news-card-excerpt">${article.excerpt}</p>
      <div class="news-card-meta">
        <span>${article.author} · ${article.date}</span>
        <div class="news-card-actions">
          <button class="action-btn like-btn ${liked ? 'liked' : ''}" data-id="${article.id}">
            ${liked ? '♥' : '♡'} ${article.likes}
          </button>
          <button class="action-btn comment-btn" data-id="${article.id}">
            💬 ${article.comments.length}
          </button>
        </div>
      </div>
    </div>`;
}

/* ---------- Likes ---------- */
function getLikedArticles() {
  return JSON.parse(localStorage.getItem('gb_liked') || '[]');
}

function isLiked(articleId) {
  return getLikedArticles().includes(articleId);
}

function toggleLike(articleId) {
  const liked = getLikedArticles();
  const article = ARTICLES.find(a => a.id === articleId);
  if (!article) return;
  const idx = liked.indexOf(articleId);
  if (idx === -1) {
    liked.push(articleId);
    article.likes++;
  } else {
    liked.splice(idx, 1);
    article.likes = Math.max(0, article.likes - 1);
  }
  localStorage.setItem('gb_liked', JSON.stringify(liked));
  saveDynamicData();
}

function bindNewsCardActions(container) {
  container.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      toggleLike(id);
      const article = ARTICLES.find(a => a.id === id);
      const liked = isLiked(id);
      btn.classList.toggle('liked', liked);
      btn.innerHTML = `${liked ? '♥' : '♡'} ${article.likes}`;
    });
  });

  container.querySelectorAll('.comment-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      openArticleModal(ARTICLES.find(a => a.id === id));
    });
  });
}

/* ---------- Game Modal ---------- */
function openGameModal(game) {
  const overlay = document.getElementById('gameModal');
  const content = document.getElementById('modalContent');
  if (!overlay || !content || !game) return;

  const reviews = game.reviews || [];
  const stars = [1,2,3,4,5].map(i =>
    `<span class="star" data-val="${i}">★</span>`
  ).join('');

  content.innerHTML = `
    <div class="modal-game-header">
      <div class="modal-game-cover">${game.cover}</div>
      <div class="modal-game-info">
        <div class="modal-game-title">${game.title}</div>
        <div class="modal-game-meta">
          <span class="meta-tag">${game.genre}</span>
          <span class="meta-tag">${game.year}</span>
          <span class="meta-tag">${game.developer}</span>
        </div>
        <div class="modal-avg-rating">★ ${game.avgRating}/5</div>
      </div>
    </div>
    <p class="modal-game-desc">${game.description}</p>

    <div class="modal-section-title">Avis des joueurs</div>
    <div class="reviews-list" id="reviewsList">
      ${reviews.length === 0
        ? '<p style="color:var(--text-muted);font-size:0.85rem;">Sois le premier à donner ton avis !</p>'
        : reviews.map(r => `
          <div class="review-item">
            <div class="review-header">
              <span class="review-author">${r.author}</span>
              <span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
            </div>
            <p class="review-text">${r.text}</p>
          </div>`).join('')}
    </div>

    <div id="reviewFormWrapper">
      ${Auth.isLoggedIn() ? `
        <div class="modal-section-title">Laisser un avis</div>
        <div class="review-form">
          <div class="star-rating" id="starRating">${stars}</div>
          <textarea id="reviewText" rows="3" placeholder="Ton avis sur ce jeu..."></textarea>
          <button class="btn-primary" id="submitReview">Publier</button>
        </div>` : `
        <p style="color:var(--text-muted);font-size:0.85rem;">
          <a href="auth.html" style="color:var(--accent)">Connecte-toi</a> pour laisser un avis.
        </p>`}
    </div>`;

  overlay.classList.remove('hidden');

  /* Star rating interaction */
  let selectedRating = 0;
  const starEls = content.querySelectorAll('.star');
  starEls.forEach(star => {
    star.addEventListener('mouseenter', () => {
      const v = parseInt(star.dataset.val);
      starEls.forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= v));
    });
    star.addEventListener('mouseleave', () => {
      starEls.forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= selectedRating));
    });
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.val);
      starEls.forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= selectedRating));
    });
  });

  /* Submit review */
  const submitBtn = content.querySelector('#submitReview');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const text = content.querySelector('#reviewText').value.trim();
      if (!text || selectedRating === 0) return;

      const user = Auth.getCurrentUser();
      const review = { author: user.username, rating: selectedRating, text };
      if (!game.reviews) game.reviews = [];
      game.reviews.push(review);
      game.ratings.push(selectedRating);
      game.avgRating = +(game.ratings.reduce((a,b)=>a+b,0)/game.ratings.length).toFixed(1);

      /* Persist */
      const dyn = JSON.parse(localStorage.getItem('gb_dynamic') || '{}');
      if (!dyn.gameReviews) dyn.gameReviews = [];
      dyn.gameReviews.push({ gameId: game.id, review });
      localStorage.setItem('gb_dynamic', JSON.stringify(dyn));

      openGameModal(game); /* refresh modal */
    });
  }

  /* Close */
  document.getElementById('modalClose').addEventListener('click', () => {
    overlay.classList.add('hidden');
  });
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });
}

/* ---------- Article Modal ---------- */
function openArticleModal(article) {
  const overlay = document.getElementById('articleModal') || document.getElementById('gameModal');
  if (!overlay || !article) return;

  const contentId = overlay.id === 'articleModal' ? 'articleModalContent' : 'modalContent';
  const content = document.getElementById(contentId);
  if (!content) return;

  const liked = isLiked(article.id);

  content.innerHTML = `
    <div class="article-modal-header">
      <span class="news-card-category">${article.category}</span>
      <h2 class="article-modal-title">${article.title}</h2>
      <div class="article-modal-meta">
        <span>${article.author}</span>
        <span>·</span>
        <span>${article.date}</span>
        <span>·</span>
        <button class="action-btn like-btn ${liked ? 'liked' : ''}" id="modalLikeBtn" data-id="${article.id}">
          ${liked ? '♥' : '♡'} ${article.likes} likes
        </button>
      </div>
    </div>
    <div class="article-modal-body">${article.content.replace(/\n/g, '<br/><br/>')}</div>

    <div class="article-modal-comments">
      <div class="modal-section-title">Commentaires (${article.comments.length})</div>
      <div id="commentsList">
        ${article.comments.length === 0
          ? '<p style="color:var(--text-muted);font-size:0.85rem;">Pas encore de commentaires.</p>'
          : article.comments.map(c => `
            <div class="comment-item">
              <div class="comment-author">${c.author}</div>
              <p class="comment-text">${c.text}</p>
            </div>`).join('')}
      </div>

      ${Auth.isLoggedIn() ? `
        <div class="review-form" style="margin-top:1rem;">
          <input type="text" id="commentInput" placeholder="Ajouter un commentaire..." />
          <button class="btn-primary" id="submitComment">Commenter</button>
        </div>` : `
        <p style="color:var(--text-muted);font-size:0.85rem;margin-top:0.75rem;">
          <a href="auth.html" style="color:var(--accent)">Connecte-toi</a> pour commenter.
        </p>`}

      ${Auth.isJournalist() && article.userCreated ? `
        <div class="journalist-edit-bar">
          <button class="btn-secondary" id="deleteArticleBtn">Supprimer l'article</button>
        </div>` : ''}
    </div>`;

  const closeId = overlay.id === 'articleModal' ? 'articleModalClose' : 'modalClose';
  overlay.classList.remove('hidden');

  document.getElementById(closeId).addEventListener('click', () => overlay.classList.add('hidden'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); });

  /* Like */
  const likeBtn = content.querySelector('#modalLikeBtn');
  if (likeBtn) {
    likeBtn.addEventListener('click', () => {
      toggleLike(article.id);
      const nowLiked = isLiked(article.id);
      likeBtn.classList.toggle('liked', nowLiked);
      likeBtn.innerHTML = `${nowLiked ? '♥' : '♡'} ${article.likes} likes`;
    });
  }

  /* Comment */
  const submitComment = content.querySelector('#submitComment');
  if (submitComment) {
    submitComment.addEventListener('click', () => {
      const input = content.querySelector('#commentInput');
      const text = input.value.trim();
      if (!text) return;
      const user = Auth.getCurrentUser();
      article.comments.push({ author: user.username, text });
      saveDynamicData();
      openArticleModal(article);
    });
  }

  /* Delete article (journaliste) */
  const deleteBtn = content.querySelector('#deleteArticleBtn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      const idx = ARTICLES.findIndex(a => a.id === article.id);
      if (idx !== -1) ARTICLES.splice(idx, 1);
      saveDynamicData();
      overlay.classList.add('hidden');
      if (typeof renderNewsList === 'function') renderNewsList();
    });
  }
}
