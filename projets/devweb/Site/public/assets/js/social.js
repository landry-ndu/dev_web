/* ============================================================
   social.js – Couche sociale (profils, amis, messages)
   Toutes les méthodes sont ASYNC : elles appellent l'API PHP
   qui lit/écrit dans MySQL.
   ============================================================ */

const Social = (() => {

  async function getJSON(url) {
    return fetch(url).then(r => r.json());
  }
  async function postForm(url, data) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.append(k, v));
    return fetch(url, { method: 'POST', body: fd }).then(r => r.json());
  }

  /* ---- Profil ---- */
  function getProfile(username) {
    const q = username ? `?user=${encodeURIComponent(username)}` : '';
    return getJSON(`/api/profile.php${q}`);   /* {profile, stats, canSee, relation, isOwn} */
  }
  function saveProfile({ bio, photo, visibility }) {
    return postForm('/api/profile.php', { bio, photo, visibility });
  }

  /* ---- Amis ---- */
  function getFriends(username) {
    const q = username ? `?action=list&user=${encodeURIComponent(username)}` : '?action=list';
    return getJSON(`/api/friends.php${q}`);
  }
  function getIncomingRequests() {
    return getJSON('/api/friends.php?action=requests');
  }
  function searchUsers(query) {
    return getJSON(`/api/friends.php?action=search&q=${encodeURIComponent(query)}`);
  }
  function sendRequest(target)  { return postForm('/api/friends.php', { action:'send',   target }); }
  function acceptRequest(target){ return postForm('/api/friends.php', { action:'accept', target }); }
  function refuseRequest(target){ return postForm('/api/friends.php', { action:'refuse', target }); }
  function removeFriend(target) { return postForm('/api/friends.php', { action:'remove', target }); }

  /* ---- Messages ---- */
  function getConversations() {
    return getJSON('/api/messages.php?action=conversations');
  }
  function getThread(withUser) {
    return getJSON(`/api/messages.php?action=thread&with=${encodeURIComponent(withUser)}`);
  }
  function sendMessage(to, text) {
    return postForm('/api/messages.php', { to, text });
  }
  function getUnread() {
    return getJSON('/api/messages.php?action=unread');
  }

  return {
    getProfile, saveProfile,
    getFriends, getIncomingRequests, searchUsers,
    sendRequest, acceptRequest, refuseRequest, removeFriend,
    getConversations, getThread, sendMessage, getUnread,
  };
})();

/* ---- Letterbox (jeux : joué/en cours/envie/suivi) ----
   Async aussi, branché sur /api/lists.php */
const Letterbox = (() => {
  async function getLists(username) {
    const q = username ? `?user=${encodeURIComponent(username)}` : '';
    const r = await fetch(`/api/lists.php${q}`).then(r => r.json());
    return r.lists || { played:[], playing:[], want:[], followed:[] };
  }

  function _post(data) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.append(k, v));
    return fetch('/api/lists.php', { method:'POST', body:fd }).then(r => r.json());
  }

  /* status: played|playing|want  (exclusifs) */
  function setStatus(game, status) {
    return _post({
      op: 'set', status,
      game_id: game.id, game_slug: game.slug || '', game_name: game.name || ''
    });
  }
  /* followed : indépendant, toggle */
  function toggleFollow(game) {
    return _post({
      op: 'toggle', status: 'followed',
      game_id: game.id, game_slug: game.slug || '', game_name: game.name || ''
    });
  }
  return { getLists, setStatus, toggleFollow };
})();
