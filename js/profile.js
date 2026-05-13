/* ============================================================
   profile.js – Page profil utilisateur
   URL : profile.html?user=pseudo  (sinon = profil courant)
   ============================================================ */

let viewedUser = null;
let currentUser = null;
let isOwn = false;

document.addEventListener('DOMContentLoaded', () => {
  currentUser = Auth.getCurrentUser();

  /* Pas connecté → auth */
  if (!currentUser) {
    window.location.href = 'auth.html';
    return;
  }

  const params = new URLSearchParams(location.search);
  viewedUser = params.get('user') || currentUser.username;
  isOwn = (viewedUser === currentUser.username);

  /* Utilisateur existe-t-il ? */
  const users = JSON.parse(localStorage.getItem('gb_users') || '[]');
  if (!users.find(u => u.username === viewedUser)) {
    document.getElementById('profileMain').innerHTML =
      '<p style="padding:3rem;text-align:center;color:var(--text-muted);">' +
      'Utilisateur introuvable. <a href="index.html" style="color:var(--accent)">Retour →</a></p>';
    return;
  }

  renderProfile();
  bindTabs();
  bindEditForm();
  updateMessagesBadge();
});

/* ---- Rendu principal ---- */
function renderProfile() {
  const profile = Social.getProfile(viewedUser);

  /* Avatar */
  const avatar = document.getElementById('profileAvatar');
  avatar.src = profile.photo || defaultAvatar(viewedUser);
  avatar.onerror = () => { avatar.src = defaultAvatar(viewedUser); };

  document.getElementById('profileUsername').textContent = viewedUser;
  document.getElementById('profileBio').textContent =
    profile.bio || (isOwn ? 'Ajoute une bio dans tes paramètres ↓' : 'Aucune bio.');
  document.getElementById('profileMeta').innerHTML =
    `Inscrit le ${formatDate(profile.createdAt)}
     · ${profile.visibility === 'public' ? '🌐 Liste publique' : '🔒 Liste privée'}`;

  /* Actions */
  const actions = document.getElementById('profileActions');
  if (isOwn) {
    actions.innerHTML = `
      <button class="btn-secondary" id="toggleEditBtn">⚙ Modifier mon profil</button>
      <button class="btn-secondary" id="copyLinkBtn">🔗 Copier le lien</button>`;
    document.getElementById('avatarEditBtn').classList.remove('hidden');
    document.getElementById('avatarEditBtn').addEventListener('click', () => toggleEdit(true));
    document.getElementById('toggleEditBtn').addEventListener('click', () =>
      document.getElementById('editProfile').classList.toggle('hidden'));
    document.getElementById('copyLinkBtn').addEventListener('click', copyProfileLink);

    /* Pré-remplir le form */
    document.getElementById('inputPhoto').value = profile.photo || '';
    document.getElementById('inputBio').value   = profile.bio   || '';
    document.getElementById('inputVisibility').value = profile.visibility;
  } else {
    const friends    = Social.areFriends(currentUser.username, viewedUser);
    const outgoing   = Social.getOutgoingRequests(currentUser.username)
                              .find(r => r.to === viewedUser);
    const incoming   = Social.getIncomingRequests(currentUser.username)
                              .find(r => r.from === viewedUser);

    let btn;
    if (friends) {
      btn = `<button class="btn-secondary" id="removeFriendBtn">✓ Ami · Retirer</button>`;
    } else if (incoming) {
      btn = `<button class="btn-primary" id="acceptBtn">Accepter sa demande</button>
             <button class="btn-secondary" id="refuseBtn">Refuser</button>`;
    } else if (outgoing) {
      btn = `<button class="btn-secondary" disabled>Demande envoyée</button>`;
    } else {
      btn = `<button class="btn-primary" id="addFriendBtn">+ Ajouter en ami</button>`;
    }
    actions.innerHTML = btn +
      ` <a class="btn-secondary" href="messages.html?to=${viewedUser}">💬 Message</a>
        <button class="btn-secondary" id="copyLinkBtn">🔗 Lien</button>`;

    document.getElementById('copyLinkBtn')?.addEventListener('click', copyProfileLink);
    document.getElementById('addFriendBtn')?.addEventListener('click', () => {
      const r = Social.sendRequest(currentUser.username, viewedUser);
      if (!r.ok) return toast(r.error);
      toast('✓ Demande envoyée');
      renderProfile();
    });
    document.getElementById('removeFriendBtn')?.addEventListener('click', () => {
      if (!confirm(`Retirer ${viewedUser} de tes amis ?`)) return;
      Social.removeFriend(currentUser.username, viewedUser);
      renderProfile();
    });
    document.getElementById('acceptBtn')?.addEventListener('click', () => {
      Social.acceptRequest(currentUser.username, viewedUser);
      toast('✓ Demande acceptée');
      renderProfile();
    });
    document.getElementById('refuseBtn')?.addEventListener('click', () => {
      Social.refuseRequest(currentUser.username, viewedUser);
      renderProfile();
    });
  }

  renderStats();
  renderGames();
  renderReviews();
  renderFriends();
}

/* ---- Édition ---- */
function toggleEdit(show) {
  document.getElementById('editProfile').classList.toggle('hidden', !show);
}

function bindEditForm() {
  document.getElementById('saveProfileBtn')?.addEventListener('click', () => {
    if (!isOwn) return;
    Social.saveProfile(viewedUser, {
      photo:      document.getElementById('inputPhoto').value.trim(),
      bio:        document.getElementById('inputBio').value.trim(),
      visibility: document.getElementById('inputVisibility').value
    });
    document.getElementById('saveSuccess').classList.remove('hidden');
    setTimeout(() => document.getElementById('saveSuccess').classList.add('hidden'), 2000);
    renderProfile();
  });
}

/* ---- Tabs ---- */
function bindTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.remove('hidden');
    });
  });
}

/* ---- Stats ---- */
function renderStats() {
  const stats = Social.getStats(viewedUser);
  const canSee = Social.canSeeList(currentUser.username, viewedUser);
  const grid = document.getElementById('statsGrid');

  if (!canSee) {
    grid.innerHTML = privateNotice();
    return;
  }

  const avgRating = stats.ratings.length
    ? (stats.ratings.reduce((s, r) => s + r.value, 0) / stats.ratings.length).toFixed(1)
    : '—';

  grid.innerHTML = `
    <div class="stat-card"><div class="stat-num">${stats.played.length}</div><div class="stat-label">Joués</div></div>
    <div class="stat-card"><div class="stat-num">${stats.playing.length}</div><div class="stat-label">En cours</div></div>
    <div class="stat-card"><div class="stat-num">${stats.want.length}</div><div class="stat-label">Envies</div></div>
    <div class="stat-card"><div class="stat-num">${stats.followed.length}</div><div class="stat-label">Suivis</div></div>
    <div class="stat-card"><div class="stat-num">${stats.ratings.length}</div><div class="stat-label">Notes</div></div>
    <div class="stat-card"><div class="stat-num">${stats.reviews.length}</div><div class="stat-label">Avis</div></div>
    <div class="stat-card highlight"><div class="stat-num">${avgRating}</div><div class="stat-label">Note moy. /5</div></div>
    <div class="stat-card"><div class="stat-num">${Social.getFriends(viewedUser).length}</div><div class="stat-label">Amis</div></div>
  `;
}

/* ---- Jeux ---- */
function renderGames() {
  const block = document.getElementById('gamesListBlock');
  if (!Social.canSeeList(currentUser.username, viewedUser)) {
    block.innerHTML = privateNotice();
    return;
  }
  const stats = Social.getStats(viewedUser);
  block.innerHTML = `
    ${gameSection('▶ En cours', stats.playing)}
    ${gameSection('✓ Joués', stats.played)}
    ${gameSection('♡ Envies', stats.want)}
    ${gameSection('🔔 Suivis', stats.followed.map(f => f.id))}
  `;
  setTimeout(loadGameNames, 50);
}

function gameSection(title, gameIds) {
  if (!gameIds.length) return '';
  return `
    <div class="game-section-block">
      <h3 class="section-title-mini">${title} <span class="count">(${gameIds.length})</span></h3>
      <div class="profile-games-grid" data-ids='${JSON.stringify(gameIds)}'></div>
    </div>`;
}

/* Charge les noms des jeux depuis RAWG (appelé après chaque rendu) */
async function loadGameNames() {
  const grids = document.querySelectorAll('.profile-games-grid');
  for (const grid of grids) {
    const ids = JSON.parse(grid.dataset.ids || '[]');
    grid.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Chargement…</p>';
    const cards = await Promise.all(ids.slice(0, 12).map(async id => {
      try {
        const g = await API.getGame(id);
        return `
          <a href="game.html?slug=${g.slug}" class="mini-game-card">
            <img src="${g.background_image||''}" alt="${g.name}" onerror="this.style.display='none'" />
            <span class="mini-game-title">${g.name}</span>
          </a>`;
      } catch {
        return `<div class="mini-game-card"><span class="mini-game-title">Jeu #${id}</span></div>`;
      }
    }));
    grid.innerHTML = cards.join('') || '<p style="color:var(--text-muted);font-size:0.85rem;">Rien ici.</p>';
  }
}

/* ---- Avis ---- */
function renderReviews() {
  const block = document.getElementById('reviewsListBlock');
  if (!Social.canSeeList(currentUser.username, viewedUser)) {
    block.innerHTML = privateNotice();
    return;
  }
  const { reviews } = Social.getStats(viewedUser);
  if (!reviews.length) {
    block.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">Aucun avis publié.</p>';
    return;
  }
  block.innerHTML = reviews.map(r => `
    <div class="review-item">
      <div class="review-header">
        <a href="game.html?slug=${r.gameId}" style="color:var(--accent);font-weight:700;">Jeu #${r.gameId}</a>
        <span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
      </div>
      <p class="review-text">${escapeHtml(r.text)}</p>
    </div>`).join('');
}

/* ---- Amis ---- */
function renderFriends() {
  /* Recherche d'amis : visible seulement sur son propre profil */
  document.getElementById('friendsSearchBlock').classList.toggle('hidden', !isOwn);
  if (isOwn) bindFriendSearch();

  /* Demandes entrantes */
  const incomingBlock = document.getElementById('incomingRequestsBlock');
  if (isOwn) {
    const incoming = Social.getIncomingRequests(currentUser.username);
    if (incoming.length) {
      incomingBlock.innerHTML = `
        <h3 class="section-title-mini">Demandes reçues (${incoming.length})</h3>
        <div class="friends-list">
          ${incoming.map(r => `
            <div class="friend-item">
              <img class="friend-avatar" src="${avatarFor(r.from)}" alt="${r.from}" />
              <a href="profile.html?user=${r.from}" class="friend-name">${r.from}</a>
              <button class="btn-primary btn-mini" data-accept="${r.from}">Accepter</button>
              <button class="btn-secondary btn-mini" data-refuse="${r.from}">Refuser</button>
            </div>`).join('')}
        </div>`;
      incomingBlock.querySelectorAll('[data-accept]').forEach(b => {
        b.addEventListener('click', () => {
          Social.acceptRequest(currentUser.username, b.dataset.accept);
          renderProfile();
        });
      });
      incomingBlock.querySelectorAll('[data-refuse]').forEach(b => {
        b.addEventListener('click', () => {
          Social.refuseRequest(currentUser.username, b.dataset.refuse);
          renderProfile();
        });
      });
    } else {
      incomingBlock.innerHTML = '';
    }
  } else {
    incomingBlock.innerHTML = '';
  }

  /* Liste d'amis */
  const friends = Social.getFriends(viewedUser);
  const block = document.getElementById('friendsListBlock');
  if (!friends.length) {
    block.innerHTML = '<h3 class="section-title-mini">Amis</h3><p style="color:var(--text-muted);padding:1rem;">Aucun ami pour l\'instant.</p>';
    return;
  }
  block.innerHTML = `
    <h3 class="section-title-mini">Amis (${friends.length})</h3>
    <div class="friends-list">
      ${friends.map(f => `
        <div class="friend-item">
          <img class="friend-avatar" src="${avatarFor(f)}" alt="${f}" />
          <a href="profile.html?user=${f}" class="friend-name">${f}</a>
          <a href="messages.html?to=${f}" class="btn-secondary btn-mini">💬 Message</a>
        </div>`).join('')}
    </div>`;
}

function bindFriendSearch() {
  const input = document.getElementById('friendSearch');
  const out   = document.getElementById('friendSearchResults');

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const q = input.value.trim();
      if (!q) { out.innerHTML = ''; return; }
      const results = Social.searchUsers(q, currentUser.username);
      if (!results.length) {
        out.innerHTML = '<p style="color:var(--text-muted);padding:0.5rem;font-size:0.85rem;">Aucun utilisateur.</p>';
        return;
      }
      out.innerHTML = results.map(u => `
        <div class="friend-item">
          <img class="friend-avatar" src="${avatarFor(u)}" alt="${u}" />
          <a href="profile.html?user=${u}" class="friend-name">${u}</a>
          ${Social.areFriends(currentUser.username, u)
            ? '<span class="tag" style="color:#4ade80;border-color:#4ade80;">✓ Ami</span>'
            : Social.getOutgoingRequests(currentUser.username).find(r => r.to === u)
              ? '<span class="tag">Envoyée</span>'
              : `<button class="btn-primary btn-mini" data-add="${u}">+ Ajouter</button>`}
        </div>`).join('');
      out.querySelectorAll('[data-add]').forEach(b => {
        b.addEventListener('click', () => {
          const r = Social.sendRequest(currentUser.username, b.dataset.add);
          if (!r.ok) return toast(r.error);
          toast('✓ Demande envoyée');
          bindFriendSearch.call(); /* refresh */
          input.dispatchEvent(new Event('input'));
        });
      });
    }, 200);
  });
}

/* ---- Utilitaires ---- */
function defaultAvatar(name) {
  /* Avatar généré : initiale sur fond coloré (data URI SVG) */
  const colors = ['#e8c84a', '#a855f7', '#4ade80', '#f87171', '#60a5fa', '#fb923c'];
  const hash = [...name].reduce((s, c) => s + c.charCodeAt(0), 0);
  const bg = colors[hash % colors.length];
  const initial = (name[0] || '?').toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
    <rect width="120" height="120" fill="${bg}"/>
    <text x="60" y="80" font-family="sans-serif" font-size="56" font-weight="800"
          text-anchor="middle" fill="#000">${initial}</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

function avatarFor(username) {
  return Social.getProfile(username).photo || defaultAvatar(username);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function privateNotice() {
  return `<div style="padding:2rem;text-align:center;color:var(--text-muted);">
    🔒 Cette liste est privée.<br/>
    <small>Seuls les amis de ${viewedUser} peuvent la voir.</small>
  </div>`;
}

function copyProfileLink() {
  const url = `${location.origin}${location.pathname}?user=${viewedUser}`;
  navigator.clipboard?.writeText(url);
  toast('🔗 Lien copié !');
}

function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);' +
      'background:var(--bg2);border:1.5px solid var(--accent);color:var(--text);' +
      'padding:0.75rem 1.5rem;border-radius:8px;font-weight:700;font-size:0.9rem;' +
      'z-index:500;box-shadow:var(--shadow);transition:opacity 0.3s;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._t);
  t._t = setTimeout(() => t.style.opacity = '0', 2500);
}

function updateMessagesBadge() {
  const nav = document.getElementById('navMessages');
  if (!nav || !currentUser) return;
  const unread = Social.getUnreadCount(currentUser.username);
  if (unread) {
    nav.innerHTML = `Messages <span class="badge">${unread}</span>`;
  }
}
