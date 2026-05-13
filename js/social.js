/* ============================================================
   social.js – Système social (profils, amis, messages)
   Tout est stocké en localStorage. Multi-utilisateur simulé.
   ============================================================ */

const Social = (() => {
  const K = {
    profiles: 'gb_profiles',     /* {username: {bio, photo, visibility, createdAt}} */
    friends:  'gb_friends',      /* {username: [friend1, friend2, ...]} */
    requests: 'gb_friend_reqs',  /* [{from, to, date}] */
    convos:   'gb_convos',       /* {convId: [{from, to, text, date, read}]} */
    reads:    'gb_msg_reads'     /* {username: lastReadTime} */
  };

  /* Helpers */
  function get(key, def) { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)); }
  function set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  function convId(a, b) { return [a, b].sort().join('::'); }

  /* ---- Profils ---- */
  function getProfile(username) {
    const all = get(K.profiles, {});
    return all[username] || {
      bio: '',
      photo: '',
      visibility: 'public',  /* 'public' | 'private' */
      createdAt: new Date().toISOString()
    };
  }

  function saveProfile(username, profile) {
    const all = get(K.profiles, {});
    all[username] = { ...getProfile(username), ...profile };
    set(K.profiles, all);
  }

  /* Stats du profil : jeux marqués, notes, avis */
  function getStats(username) {
    /* Letterbox (jeux suivis/joués) défini dans api.js
       mais ici on accède directement aux clés localStorage pour rester découplé */
    const played   = JSON.parse(localStorage.getItem('gb_lb_played')   || '[]');
    const playing  = JSON.parse(localStorage.getItem('gb_lb_playing')  || '[]');
    const want     = JSON.parse(localStorage.getItem('gb_lb_want')     || '[]');
    const followed = JSON.parse(localStorage.getItem('gb_lb_followed') || '[]');

    /* Notes : balayer toutes les clés gb_rating_* */
    const ratings = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('gb_rating_')) {
        const gameId = k.replace('gb_rating_', '');
        const value  = parseInt(localStorage.getItem(k));
        if (value) ratings.push({ gameId, value });
      }
    }

    /* Avis sur les jeux : clés gb_reviews_* */
    const reviews = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('gb_reviews_')) {
        const gameId = k.replace('gb_reviews_', '');
        const arr = JSON.parse(localStorage.getItem(k) || '[]');
        arr.forEach(r => {
          if (r.author === username) reviews.push({ gameId, ...r });
        });
      }
    }

    return { played, playing, want, followed, ratings, reviews };
  }

  /* ---- Amis ---- */
  function getFriends(username) {
    return get(K.friends, {})[username] || [];
  }

  function areFriends(a, b) {
    return getFriends(a).includes(b);
  }

  function sendRequest(from, to) {
    if (from === to) return { ok: false, error: 'Tu ne peux pas t\'ajouter toi-même.' };
    if (areFriends(from, to)) return { ok: false, error: 'Déjà amis.' };

    const reqs = get(K.requests, []);
    if (reqs.find(r => r.from === from && r.to === to)) {
      return { ok: false, error: 'Demande déjà envoyée.' };
    }
    if (reqs.find(r => r.from === to && r.to === from)) {
      /* Une demande inverse existe → on accepte automatiquement */
      return acceptRequest(from, to);
    }

    reqs.push({ from, to, date: new Date().toISOString() });
    set(K.requests, reqs);
    return { ok: true };
  }

  function getIncomingRequests(username) {
    return get(K.requests, []).filter(r => r.to === username);
  }

  function getOutgoingRequests(username) {
    return get(K.requests, []).filter(r => r.from === username);
  }

  function acceptRequest(accepter, fromUser) {
    const reqs = get(K.requests, []);
    const idx  = reqs.findIndex(r => r.from === fromUser && r.to === accepter);
    if (idx === -1) return { ok: false, error: 'Demande introuvable.' };

    reqs.splice(idx, 1);
    set(K.requests, reqs);

    const friends = get(K.friends, {});
    friends[accepter] = friends[accepter] || [];
    friends[fromUser] = friends[fromUser] || [];
    if (!friends[accepter].includes(fromUser)) friends[accepter].push(fromUser);
    if (!friends[fromUser].includes(accepter)) friends[fromUser].push(accepter);
    set(K.friends, friends);

    return { ok: true };
  }

  function refuseRequest(refuser, fromUser) {
    const reqs = get(K.requests, []).filter(r => !(r.from === fromUser && r.to === refuser));
    set(K.requests, reqs);
    return { ok: true };
  }

  function removeFriend(a, b) {
    const friends = get(K.friends, {});
    friends[a] = (friends[a] || []).filter(u => u !== b);
    friends[b] = (friends[b] || []).filter(u => u !== a);
    set(K.friends, friends);
  }

  /* ---- Permissions de visualisation ---- */
  function canSeeList(viewer, target) {
    if (viewer === target) return true;
    const prof = getProfile(target);
    if (prof.visibility === 'public') return true;
    return areFriends(viewer, target);
  }

  /* ---- Messages ---- */
  function sendMessage(from, to, text) {
    if (!text.trim()) return { ok: false };
    const id     = convId(from, to);
    const convos = get(K.convos, {});
    convos[id]   = convos[id] || [];
    convos[id].push({
      from, to,
      text: text.trim(),
      date: Date.now(),
      read: false
    });
    set(K.convos, convos);
    return { ok: true };
  }

  function getConversation(a, b) {
    return get(K.convos, {})[convId(a, b)] || [];
  }

  function markConversationRead(viewer, otherUser) {
    const id = convId(viewer, otherUser);
    const convos = get(K.convos, {});
    if (!convos[id]) return;
    convos[id].forEach(m => { if (m.to === viewer) m.read = true; });
    set(K.convos, convos);
  }

  /* Liste des conversations pour un utilisateur, triées par date du dernier message */
  function getConversations(username) {
    const convos = get(K.convos, {});
    const result = [];
    Object.entries(convos).forEach(([id, messages]) => {
      const [a, b] = id.split('::');
      if (a !== username && b !== username) return;
      const other  = a === username ? b : a;
      const last   = messages[messages.length - 1];
      const unread = messages.filter(m => m.to === username && !m.read).length;
      result.push({ user: other, lastMessage: last, unread, messages });
    });
    result.sort((x, y) => y.lastMessage.date - x.lastMessage.date);
    return result;
  }

  function getUnreadCount(username) {
    return getConversations(username).reduce((sum, c) => sum + c.unread, 0);
  }

  /* ---- Liste de tous les utilisateurs (pour recherche) ---- */
  function allUsers() {
    return JSON.parse(localStorage.getItem('gb_users') || '[]')
      .map(u => u.username);
  }

  function searchUsers(query, exclude = '') {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return allUsers()
      .filter(u => u !== exclude && u.toLowerCase().includes(q))
      .slice(0, 10);
  }

  return {
    getProfile, saveProfile, getStats,
    getFriends, areFriends, sendRequest,
    getIncomingRequests, getOutgoingRequests,
    acceptRequest, refuseRequest, removeFriend,
    canSeeList,
    sendMessage, getConversation, markConversationRead,
    getConversations, getUnreadCount,
    allUsers, searchUsers
  };
})();
