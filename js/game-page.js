/* ============================================================
   game-page.js – Logique de la fiche jeu individuelle
   URL attendue : game.html?slug=elden-ring  ou  ?id=41494
   ============================================================ */

let currentGame   = null;
let screenshots   = [];
let lightboxIndex = 0;

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const slug   = params.get('slug') || params.get('id');

  if (!slug) {
    window.location.href = 'jeux.html';
    return;
  }

  try {
    await loadGame(slug);
  } catch (err) {
    showError(err);
  }
});

/* ---- Chargement principal ---- */
async function loadGame(slug) {
  const [game, ssData] = await Promise.all([
    API.getGame(slug),
    API.getScreenshots(slug).catch(() => ({ results: [] }))
  ]);

  currentGame = game;
  screenshots = ssData.results || [];

  document.title = `GameBizarre – ${game.name}`;

  renderHero(game);
  renderDescription(game);
  renderScreenshots(screenshots);
  renderSidebar(game);
  renderReviews(game);
  updateLetterboxButtons(game.id);

  document.getElementById('gameSkeleton').classList.add('hidden');
  document.getElementById('gameMain').classList.remove('hidden');

  /* Jeux de la même série */
  API.getSimilar(slug).then(data => {
    if (data.results?.length) renderSimilar(data.results.slice(0, 5));
  }).catch(() => {});
}

/* ---- Hero ---- */
function renderHero(game) {
  const bg    = game.background_image || '';
  const cover = game.background_image_additional || game.background_image || '';

  document.getElementById('gameHeroBg').style.backgroundImage = `url(${bg})`;
  document.getElementById('gameCover').src = cover;
  document.getElementById('gameCover').alt = game.name;
  document.getElementById('gameTitle').textContent = game.name;

  /* Meta */
  const meta = document.getElementById('gameMeta');
  const tags = [
    game.released ? game.released.substring(0, 4) : '',
    ...(game.developers?.map(d => d.name) || []),
    ...(game.publishers?.map(p => p.name).slice(0, 1) || [])
  ].filter(Boolean);
  meta.innerHTML = tags.map(t => `<span class="meta-tag">${t}</span>`).join('');

  /* Rating */
  const ratingEl = document.getElementById('gameRating');
  const rawg = game.rating ? `<span class="rating-big">★ ${game.rating.toFixed(1)}</span>
    <span class="rating-sub">${game.ratings_count?.toLocaleString() || 0} notes<br/>RAWG</span>` : '';

  let metacriticBadge = '';
  if (game.metacritic) {
    const cls = game.metacritic >= 75 ? 'green' : game.metacritic >= 50 ? 'yellow' : 'red';
    metacriticBadge = `<span class="metacritic-badge ${cls}">MC ${game.metacritic}</span>`;
  }
  ratingEl.innerHTML = rawg + metacriticBadge;

  /* Bouton follow */
  updateFollowBtn(game.id, game.name, game.slug);
  bindLetterboxButtons(game.id, game.name, game.slug);
}

/* ---- Description ---- */
function renderDescription(game) {
  const el = document.getElementById('gameDescription');
  if (game.description_raw) {
    el.innerHTML = game.description_raw
      .split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p>${p.trim()}</p>`)
      .join('');
  } else {
    el.textContent = 'Aucune description disponible.';
  }
}

/* ---- Screenshots ---- */
function renderScreenshots(shots) {
  const grid = document.getElementById('screenshotsGrid');
  if (!shots.length) {
    document.getElementById('screenshotsSection').classList.add('hidden');
    return;
  }
  grid.innerHTML = shots.map((s, i) => `
    <img class="screenshot-thumb" src="${s.image}" alt="Screenshot ${i+1}"
         data-index="${i}" loading="lazy" />`).join('');

  grid.querySelectorAll('.screenshot-thumb').forEach(img => {
    img.addEventListener('click', () => openLightbox(parseInt(img.dataset.index)));
  });
}

/* ---- Lightbox ---- */
function openLightbox(idx) {
  lightboxIndex = idx;
  const lb = document.getElementById('lightbox');
  lb.classList.remove('hidden');
  document.getElementById('lightboxImg').src = screenshots[idx].image;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('lightboxClose').addEventListener('click', () => {
    document.getElementById('lightbox').classList.add('hidden');
  });
  document.getElementById('lightboxPrev').addEventListener('click', () => {
    lightboxIndex = (lightboxIndex - 1 + screenshots.length) % screenshots.length;
    document.getElementById('lightboxImg').src = screenshots[lightboxIndex].image;
  });
  document.getElementById('lightboxNext').addEventListener('click', () => {
    lightboxIndex = (lightboxIndex + 1) % screenshots.length;
    document.getElementById('lightboxImg').src = screenshots[lightboxIndex].image;
  });
  document.getElementById('lightbox').addEventListener('click', e => {
    if (e.target === document.getElementById('lightbox'))
      document.getElementById('lightbox').classList.add('hidden');
  });
});

/* ---- Sidebar ---- */
function renderSidebar(game) {
  /* Infos */
  const infoEl = document.getElementById('gameInfoList');
  const rows = [
    ['Sortie',      game.released || '—'],
    ['Playtime',    game.playtime ? `~${game.playtime}h` : '—'],
    ['ESRB',        game.esrb_rating?.name || '—'],
    ['Site',        game.website ? `<a href="${game.website}" target="_blank" rel="noopener" style="color:var(--accent)">Officiel ↗</a>` : '—']
  ];
  infoEl.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');

  /* Genres */
  const genreEl = document.getElementById('gameGenres');
  if (game.genres?.length) {
    genreEl.innerHTML = game.genres.map(g =>
      `<span class="tag" onclick="window.location='jeux.html?genre=${g.slug}'">${g.name}</span>`
    ).join('');
  }

  /* Plateformes */
  const platEl = document.getElementById('gamePlatforms');
  if (game.platforms?.length) {
    platEl.innerHTML = game.platforms.map(p =>
      `<span class="tag">${p.platform.name}</span>`
    ).join('');
  }

  /* Ma note */
  initMyRating(game.id);
}

/* ---- Ma note ---- */
function initMyRating(gameId) {
  const stars  = document.querySelectorAll('#myStarRating .star');
  const label  = document.getElementById('myRatingLabel');
  const saved  = parseInt(localStorage.getItem(`gb_rating_${gameId}`) || '0');
  const labels = ['Non noté', 'Décevant', 'Passable', 'Bien', 'Très bien', 'Excellent'];

  function setDisplay(val) {
    stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.val) <= val));
    label.textContent = labels[val];
  }

  setDisplay(saved);

  let hovered = 0;
  stars.forEach(s => {
    s.addEventListener('mouseenter', () => { hovered = parseInt(s.dataset.val); setDisplay(hovered); });
    s.addEventListener('mouseleave', () => setDisplay(parseInt(localStorage.getItem(`gb_rating_${gameId}`) || '0')));
    s.addEventListener('click', () => {
      const val = parseInt(s.dataset.val);
      localStorage.setItem(`gb_rating_${gameId}`, val);
      setDisplay(val);
    });
  });
}

/* ---- Jeux similaires ---- */
function renderSimilar(games) {
  const el = document.getElementById('similarGames');
  if (!games.length) { document.getElementById('similarCard').classList.add('hidden'); return; }
  el.innerHTML = games.map(g => `
    <div class="similar-item" onclick="window.location='game.html?slug=${g.slug}'">
      <img class="similar-cover" src="${g.background_image || ''}" alt="${g.name}" loading="lazy" />
      <div>
        <div class="similar-title">${g.name}</div>
        <div class="similar-rating">★ ${g.rating?.toFixed(1) || '—'}</div>
      </div>
    </div>`).join('');
}

/* ---- Avis utilisateurs ---- */
function renderReviews(game) {
  const list   = document.getElementById('gameReviewsList');
  const stored = JSON.parse(localStorage.getItem(`gb_reviews_${game.id}`) || '[]');

  if (!stored.length) {
    list.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Aucun avis pour l\'instant.</p>';
  } else {
    list.innerHTML = stored.map(r => `
      <div class="review-item">
        <div class="review-header">
          <span class="review-author">${r.author}</span>
          <span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
        </div>
        <p class="review-text">${r.text}</p>
      </div>`).join('');
  }

  /* Formulaire si connecté */
  const section = document.getElementById('reviewFormSection');
  if (Auth.isLoggedIn()) {
    const existing = stored.find(r => r.author === Auth.getCurrentUser().username);
    section.innerHTML = `
      <div class="review-form" style="margin-top:1rem;">
        <p class="modal-section-title" style="margin-bottom:0.5rem;">
          ${existing ? 'Modifier mon avis' : 'Laisser un avis'}
        </p>
        <div class="star-rating" id="reviewStars">
          ${[1,2,3,4,5].map(i=>`<span class="star ${existing && i<=existing.rating?'active':''}" data-val="${i}">★</span>`).join('')}
        </div>
        <textarea id="reviewTextInput" rows="3" placeholder="Ton avis...">${existing?.text||''}</textarea>
        <button class="btn-primary" id="submitReviewBtn">Publier</button>
      </div>`;

    let selectedRating = existing?.rating || 0;
    const reviewStars  = section.querySelectorAll('#reviewStars .star');
    reviewStars.forEach(s => {
      s.addEventListener('mouseenter', () => reviewStars.forEach(x => x.classList.toggle('active', parseInt(x.dataset.val) <= parseInt(s.dataset.val))));
      s.addEventListener('mouseleave', () => reviewStars.forEach(x => x.classList.toggle('active', parseInt(x.dataset.val) <= selectedRating)));
      s.addEventListener('click', () => { selectedRating = parseInt(s.dataset.val); });
    });

    section.querySelector('#submitReviewBtn').addEventListener('click', () => {
      const text = section.querySelector('#reviewTextInput').value.trim();
      if (!text || !selectedRating) return;
      const user     = Auth.getCurrentUser();
      const reviews  = JSON.parse(localStorage.getItem(`gb_reviews_${game.id}`) || '[]')
        .filter(r => r.author !== user.username);
      reviews.unshift({ author: user.username, rating: selectedRating, text, date: new Date().toISOString() });
      localStorage.setItem(`gb_reviews_${game.id}`, JSON.stringify(reviews));
      renderReviews(game);
    });
  } else {
    section.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;margin-top:1rem;">
      <a href="auth.html" style="color:var(--accent)">Connecte-toi</a> pour laisser un avis.</p>`;
  }
}

/* ---- Letterbox buttons ---- */
function bindLetterboxButtons(gameId, gameName, gameSlug) {
  ['played', 'playing', 'want'].forEach(status => {
    const btn = document.getElementById(`btn${status.charAt(0).toUpperCase()+status.slice(1)}`);
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!Auth.isLoggedIn()) { window.location.href = 'auth.html'; return; }
      const current = Letterbox.getStatus(gameId);
      Letterbox.setStatus(gameId, current === status ? null : status);
      updateLetterboxButtons(gameId);
    });
  });

  document.getElementById('btnFollow').addEventListener('click', () => {
    if (!Auth.isLoggedIn()) { window.location.href = 'auth.html'; return; }
    const added = Letterbox.followGame(gameId, gameName, gameSlug);
    updateFollowBtn(gameId, gameName, gameSlug);
    showToast(added ? `🔔 Tu suis maintenant ${gameName}` : `🔕 Tu ne suis plus ${gameName}`);
  });
}

function updateLetterboxButtons(gameId) {
  const status = Letterbox.getStatus(gameId);
  ['played', 'playing', 'want'].forEach(s => {
    const btn = document.getElementById(`btn${s.charAt(0).toUpperCase()+s.slice(1)}`);
    if (btn) btn.classList.toggle('active', status === s);
  });
}

function updateFollowBtn(gameId, gameName, gameSlug) {
  const btn = document.getElementById('btnFollow');
  if (!btn) return;
  const following = Letterbox.isFollowed(gameId);
  btn.classList.toggle('following', following);
  btn.textContent = following ? '🔔 Suivi' : '🔔 Suivre';
}

/* ---- Toast ---- */
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = `position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);
      background:var(--bg2);border:1.5px solid var(--accent);color:var(--text);
      padding:0.75rem 1.5rem;border-radius:8px;font-weight:700;font-size:0.9rem;
      z-index:500;box-shadow:var(--shadow);transition:opacity 0.3s;`;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => { t.style.opacity = '0'; }, 2500);
}

/* ---- Error ---- */
function showError(err) {
  document.getElementById('gameSkeleton').innerHTML = `
    <div style="text-align:center;padding:4rem 2rem;color:var(--text-muted);">
      <p style="font-size:1.2rem;font-weight:700;margin-bottom:0.5rem;">Impossible de charger ce jeu</p>
      <p style="font-size:0.9rem;">${err.message}</p>
      ${CONFIG.RAWG_KEY === 'YOUR_RAWG_API_KEY'
        ? '<p style="margin-top:1rem;color:var(--accent);">⚠️ Configure ta clé RAWG dans js/config.js</p>' : ''}
      <a href="jeux.html" class="btn-primary" style="display:inline-flex;margin-top:1.5rem;">← Retour aux jeux</a>
    </div>`;
}
