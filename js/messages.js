/* ============================================================
   messages.js – Inbox + chat (polling localStorage)
   URL : messages.html?to=pseudo  ouvre direct la conversation
   ============================================================ */

let me              = null;
let activeOther     = null;
let pollInterval    = null;

document.addEventListener('DOMContentLoaded', () => {
  me = Auth.getCurrentUser();
  if (!me) { window.location.href = 'auth.html'; return; }

  /* Si ?to=... ouvre direct la conversation */
  const params = new URLSearchParams(location.search);
  const to = params.get('to');

  renderConvoList();
  bindNewChat();
  bindForm();

  if (to && to !== me.username) {
    openConversation(to);
  }

  /* Sync entre onglets : si une autre fenêtre écrit dans localStorage */
  window.addEventListener('storage', e => {
    if (e.key === 'gb_convos') {
      renderConvoList();
      if (activeOther) renderMessages();
    }
  });

  /* Polling toutes les 1.5s pour refléter les changements même sur cet onglet */
  pollInterval = setInterval(() => {
    renderConvoList();
    if (activeOther) renderMessages();
  }, 1500);
});

window.addEventListener('beforeunload', () => clearInterval(pollInterval));

/* ---- Liste des conversations ---- */
function renderConvoList() {
  const list = document.getElementById('convoListItems');
  const convos = Social.getConversations(me.username);

  if (!convos.length) {
    list.innerHTML = `<p style="color:var(--text-muted);padding:1rem;font-size:0.85rem;">
      Aucune discussion. Clique sur <strong>+ Nouveau</strong> pour en démarrer une.</p>`;
    return;
  }

  list.innerHTML = convos.map(c => `
    <div class="convo-item ${activeOther === c.user ? 'active' : ''}" data-user="${c.user}">
      <img class="friend-avatar" src="${avatarFor(c.user)}" alt="${c.user}" />
      <div class="convo-item-body">
        <div class="convo-item-top">
          <span class="convo-item-name">${c.user}</span>
          <span class="convo-item-time">${formatRelative(c.lastMessage.date)}</span>
        </div>
        <div class="convo-item-preview">
          ${c.lastMessage.from === me.username ? '<small>Toi :</small> ' : ''}
          ${escapeHtml(c.lastMessage.text).substring(0, 50)}${c.lastMessage.text.length > 50 ? '…' : ''}
        </div>
      </div>
      ${c.unread ? `<span class="badge convo-badge">${c.unread}</span>` : ''}
    </div>`).join('');

  list.querySelectorAll('.convo-item').forEach(el => {
    el.addEventListener('click', () => openConversation(el.dataset.user));
  });
}

/* ---- Ouvrir conversation ---- */
function openConversation(other) {
  activeOther = other;
  Social.markConversationRead(me.username, other);

  document.getElementById('convoPlaceholder').classList.add('hidden');
  document.getElementById('convoView').classList.remove('hidden');

  document.getElementById('convoOtherName').textContent = other;
  document.getElementById('convoOtherName').href = `profile.html?user=${other}`;
  document.getElementById('convoOtherAvatar').src = avatarFor(other);

  renderMessages();
  renderConvoList();

  setTimeout(() => document.getElementById('msgInput')?.focus(), 50);
}

/* ---- Messages ---- */
function renderMessages() {
  if (!activeOther) return;
  const messages = Social.getConversation(me.username, activeOther);
  const wrap = document.getElementById('convoMessages');

  if (!messages.length) {
    wrap.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:2rem;font-size:0.85rem;">
      Pas encore de message. Dis bonjour à ${activeOther} !</p>`;
    return;
  }

  /* Préserver le scroll en bas si on était déjà en bas */
  const wasAtBottom = wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight < 50;

  let lastDay = '';
  wrap.innerHTML = messages.map(m => {
    const day = new Date(m.date).toLocaleDateString('fr-FR');
    let sep = '';
    if (day !== lastDay) {
      sep = `<div class="msg-day-sep">${day}</div>`;
      lastDay = day;
    }
    const cls = m.from === me.username ? 'msg-out' : 'msg-in';
    return sep + `
      <div class="msg ${cls}">
        <div class="msg-bubble">${escapeHtml(m.text)}</div>
        <div class="msg-time">${formatTime(m.date)}</div>
      </div>`;
  }).join('');

  if (wasAtBottom) wrap.scrollTop = wrap.scrollHeight;

  Social.markConversationRead(me.username, activeOther);
}

/* ---- Envoi ---- */
function bindForm() {
  const form = document.getElementById('convoForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!activeOther) return;
    const input = document.getElementById('msgInput');
    const text = input.value;
    if (!text.trim()) return;

    Social.sendMessage(me.username, activeOther, text);
    input.value = '';
    renderMessages();
    renderConvoList();
    /* scroll en bas */
    const wrap = document.getElementById('convoMessages');
    wrap.scrollTop = wrap.scrollHeight;
  });
}

/* ---- Nouveau chat ---- */
function bindNewChat() {
  const btn = document.getElementById('newChatBtn');
  const block = document.getElementById('convoSearchBlock');
  const input = document.getElementById('convoSearch');
  const results = document.getElementById('convoSearchResults');

  btn.addEventListener('click', () => {
    block.classList.toggle('hidden');
    if (!block.classList.contains('hidden')) input.focus();
  });

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const q = input.value.trim();
      if (!q) { results.innerHTML = ''; return; }
      const users = Social.searchUsers(q, me.username);
      if (!users.length) {
        results.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;padding:0.5rem;">Aucun utilisateur.</p>';
        return;
      }
      results.innerHTML = users.map(u => `
        <div class="convo-search-item" data-user="${u}">
          <img class="friend-avatar" src="${avatarFor(u)}" alt="${u}" />
          <span>${u}</span>
        </div>`).join('');
      results.querySelectorAll('.convo-search-item').forEach(el => {
        el.addEventListener('click', () => {
          openConversation(el.dataset.user);
          block.classList.add('hidden');
          input.value = '';
          results.innerHTML = '';
        });
      });
    }, 200);
  });
}

/* ---- Utilitaires ---- */
function avatarFor(username) {
  const photo = Social.getProfile(username).photo;
  if (photo) return photo;
  const colors = ['#e8c84a', '#a855f7', '#4ade80', '#f87171', '#60a5fa', '#fb923c'];
  const hash = [...username].reduce((s, c) => s + c.charCodeAt(0), 0);
  const bg = colors[hash % colors.length];
  const initial = (username[0] || '?').toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <rect width="80" height="80" fill="${bg}"/>
    <text x="40" y="54" font-family="sans-serif" font-size="38" font-weight="800"
          text-anchor="middle" fill="#000">${initial}</text></svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
}

function formatRelative(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60)   return 'à l\'instant';
  if (diff < 3600) return Math.floor(diff/60) + ' min';
  if (diff < 86400) return Math.floor(diff/3600) + ' h';
  return new Date(ts).toLocaleDateString('fr-FR', { day:'numeric', month:'short' });
}
