/* ============================================================
   profile.js – Page profil (données via API MySQL)
   URL : profile.php?user=pseudo  (sinon = profil courant)
   ============================================================ */

let me = null, viewed = null, P = null;

document.addEventListener('DOMContentLoaded', async () => {
  me = Auth.getCurrentUser();
  if (!me) { location.href = '/index.php'; return; }
  viewed = new URLSearchParams(location.search).get('user') || me.username;
  bindTabs();
  await render();
});

async function render() {
  const r = await Social.getProfile(viewed).catch(() => null);
  if (!r || !r.ok) {
    document.getElementById('profileMain').innerHTML =
      '<p style="padding:3rem;text-align:center;color:var(--text-muted);">Utilisateur introuvable. <a href="/index.php" style="color:var(--accent)">Retour →</a></p>';
    return;
  }
  P = r;
  const p = r.profile, isOwn = r.isOwn;

  const av = document.getElementById('profileAvatar');
  av.src = p.photo || defAvatar(p.username);
  av.onerror = () => { av.src = defAvatar(p.username); };

  document.getElementById('profileUsername').textContent = p.username
    + (p.role !== 'user' ? `  ·  ${p.role === 'admin' ? '👑 Admin' : '✍ Journaliste'}` : '');
  document.getElementById('profileBio').textContent =
    p.bio || (isOwn ? 'Ajoute une bio dans tes paramètres ↓' : 'Aucune bio.');
  document.getElementById('profileMeta').innerHTML =
    `Inscrit le ${fmtDate(p.createdAt)} · ${p.visibility==='public'?'🌐 Liste publique':'🔒 Liste privée'}`;

  renderActions(r);
  renderStats(r);
  renderGames();
  renderReviews();
  renderFriends();
}

/* ---- Boutons d'action ---- */
function renderActions(r) {
  const a = document.getElementById('profileActions');
  if (r.isOwn) {
    a.innerHTML = `<button class="btn-secondary" id="editBtn">⚙ Modifier mon profil</button>
      <button class="btn-secondary" id="linkBtn">🔗 Copier le lien</button>`;
    document.getElementById('avatarEditBtn').classList.remove('hidden');
    document.getElementById('avatarEditBtn').onclick = () => toggleEdit();
    document.getElementById('editBtn').onclick = () => toggleEdit();
    document.getElementById('linkBtn').onclick = copyLink;
    document.getElementById('inputPhoto').value = r.profile.photo || '';
    document.getElementById('inputBio').value = r.profile.bio || '';
    document.getElementById('inputVisibility').value = r.profile.visibility;
    document.getElementById('saveProfileBtn').onclick = saveProfile;
  } else {
    let btn;
    if (r.relation === 'friends')      btn = `<button class="btn-secondary" id="rm">✓ Ami · Retirer</button>`;
    else if (r.relation === 'incoming')btn = `<button class="btn-primary" id="acc">Accepter</button><button class="btn-secondary" id="ref">Refuser</button>`;
    else if (r.relation === 'outgoing')btn = `<button class="btn-secondary" disabled>Demande envoyée</button>`;
    else                               btn = `<button class="btn-primary" id="add">+ Ajouter en ami</button>`;
    a.innerHTML = btn +
      ` <a class="btn-secondary" href="/messages.php?to=${viewed}">💬 Message</a>
        <button class="btn-secondary" id="linkBtn">🔗 Lien</button>`;
    document.getElementById('linkBtn').onclick = copyLink;
    document.getElementById('add')?.addEventListener('click', async()=>{ const x=await Social.sendRequest(viewed); x.ok?(toast('✓ Demande envoyée'),render()):toast(x.error); });
    document.getElementById('rm') ?.addEventListener('click', async()=>{ if(confirm(`Retirer ${viewed} ?`)){await Social.removeFriend(viewed);render();} });
    document.getElementById('acc')?.addEventListener('click', async()=>{ await Social.acceptRequest(viewed); toast('✓ Accepté'); render(); });
    document.getElementById('ref')?.addEventListener('click', async()=>{ await Social.refuseRequest(viewed); render(); });
  }
}
function toggleEdit(){ document.getElementById('editProfile').classList.toggle('hidden'); }
async function saveProfile() {
  await Social.saveProfile({
    photo: document.getElementById('inputPhoto').value.trim(),
    bio: document.getElementById('inputBio').value.trim(),
    visibility: document.getElementById('inputVisibility').value,
  });
  const s=document.getElementById('saveSuccess'); s.classList.remove('hidden');
  setTimeout(()=>s.classList.add('hidden'),2000);
  render();
}

/* ---- Tabs ---- */
function bindTabs() {
  document.querySelectorAll('.tab-btn').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c=>c.classList.add('hidden'));
    b.classList.add('active');
    document.getElementById('tab-'+b.dataset.tab).classList.remove('hidden');
  }));
}

/* ---- Stats ---- */
function renderStats(r) {
  const g = document.getElementById('statsGrid');
  if (!r.canSee) { g.innerHTML = priv(); return; }
  const s = r.stats;
  g.innerHTML = `
    <div class="stat-card"><div class="stat-num">${s.played}</div><div class="stat-label">Joués</div></div>
    <div class="stat-card"><div class="stat-num">${s.playing}</div><div class="stat-label">En cours</div></div>
    <div class="stat-card"><div class="stat-num">${s.want}</div><div class="stat-label">Envies</div></div>
    <div class="stat-card"><div class="stat-num">${s.followed}</div><div class="stat-label">Suivis</div></div>
    <div class="stat-card"><div class="stat-num">${s.ratings}</div><div class="stat-label">Notes</div></div>
    <div class="stat-card"><div class="stat-num">${s.reviews}</div><div class="stat-label">Avis</div></div>
    <div class="stat-card highlight"><div class="stat-num">${s.avg ?? '—'}</div><div class="stat-label">Note moy. /5</div></div>
    <div class="stat-card"><div class="stat-num">${s.friends}</div><div class="stat-label">Amis</div></div>`;
}

/* ---- Jeux ---- */
async function renderGames() {
  const b = document.getElementById('gamesListBlock');
  if (!P.canSee) { b.innerHTML = priv(); return; }
  const r = await fetch(`/api/lists.php?user=${encodeURIComponent(viewed)}`).then(r=>r.json());
  const L = r.lists || {};
  const sec = (title, arr) => !arr || !arr.length ? '' : `
    <div class="game-section-block">
      <h3 class="section-title-mini">${title} <span class="count">(${arr.length})</span></h3>
      <div class="profile-games-grid">${arr.slice(0,12).map(g=>`
        <a href="/game.php?slug=${g.slug||g.id}" class="mini-game-card">
          <span class="mini-game-title">${esc(g.name||('Jeu #'+g.id))}</span>
        </a>`).join('')}</div>
    </div>`;
  b.innerHTML = sec('▶ En cours',L.playing)+sec('✓ Joués',L.played)+sec('♡ Envies',L.want)+sec('🔔 Suivis',L.followed)
    || '<p style="color:var(--text-muted);padding:1rem;">Aucun jeu.</p>';
}

/* ---- Avis ---- */
async function renderReviews() {
  const b = document.getElementById('reviewsListBlock');
  if (!P.canSee) { b.innerHTML = priv(); return; }
  const r = await fetch(`/api/reviews.php?user=${encodeURIComponent(viewed)}`).then(r=>r.json());
  const rv = r.reviews || [];
  b.innerHTML = rv.length ? rv.map(x=>`
    <div class="review-item">
      <div class="review-header">
        <a href="/game.php?slug=${x.gameId}" style="color:var(--accent);font-weight:700;">Jeu #${x.gameId}</a>
        <span class="review-stars">${'★'.repeat(x.rating)}${'☆'.repeat(5-x.rating)}</span>
      </div>
      <p class="review-text">${esc(x.text)}</p>
    </div>`).join('') : '<p style="color:var(--text-muted);padding:1rem;">Aucun avis.</p>';
}

/* ---- Amis ---- */
async function renderFriends() {
  const isOwn = P.isOwn;
  document.getElementById('friendsSearchBlock').classList.toggle('hidden', !isOwn);
  if (isOwn) bindFriendSearch();

  const inc = document.getElementById('incomingRequestsBlock');
  if (isOwn) {
    const r = await Social.getIncomingRequests();
    const reqs = r.requests || [];
    inc.innerHTML = reqs.length ? `
      <h3 class="section-title-mini">Demandes reçues (${reqs.length})</h3>
      <div class="friends-list">${reqs.map(u=>`
        <div class="friend-item">
          <img class="friend-avatar" src="${defAvatar(u)}" alt="" />
          <a href="/profile.php?user=${u}" class="friend-name">${u}</a>
          <button class="btn-primary btn-mini" data-acc="${u}">Accepter</button>
          <button class="btn-secondary btn-mini" data-ref="${u}">Refuser</button>
        </div>`).join('')}</div>` : '';
    inc.querySelectorAll('[data-acc]').forEach(x=>x.onclick=async()=>{await Social.acceptRequest(x.dataset.acc);render();});
    inc.querySelectorAll('[data-ref]').forEach(x=>x.onclick=async()=>{await Social.refuseRequest(x.dataset.ref);render();});
  } else inc.innerHTML = '';

  const fr = await Social.getFriends(viewed);
  const friends = fr.friends || [];
  const b = document.getElementById('friendsListBlock');
  b.innerHTML = friends.length ? `
    <h3 class="section-title-mini">Amis (${friends.length})</h3>
    <div class="friends-list">${friends.map(f=>`
      <div class="friend-item">
        <img class="friend-avatar" src="${defAvatar(f)}" alt="" />
        <a href="/profile.php?user=${f}" class="friend-name">${f}</a>
        <a href="/messages.php?to=${f}" class="btn-secondary btn-mini">💬</a>
      </div>`).join('')}</div>`
    : '<h3 class="section-title-mini">Amis</h3><p style="color:var(--text-muted);padding:1rem;">Aucun ami.</p>';
}

function bindFriendSearch() {
  const i=document.getElementById('friendSearch'), o=document.getElementById('friendSearchResults');
  let t;
  i.oninput=()=>{ clearTimeout(t); t=setTimeout(async()=>{
    const q=i.value.trim(); if(!q){o.innerHTML='';return;}
    const r=await Social.searchUsers(q);
    const res=r.results||[];
    o.innerHTML = res.length ? res.map(u=>`
      <div class="friend-item">
        <img class="friend-avatar" src="${defAvatar(u)}" alt="" />
        <a href="/profile.php?user=${u}" class="friend-name">${u}</a>
        <button class="btn-primary btn-mini" data-add="${u}">+ Ajouter</button>
      </div>`).join('') : '<p style="color:var(--text-muted);padding:0.5rem;font-size:0.85rem;">Aucun utilisateur.</p>';
    o.querySelectorAll('[data-add]').forEach(x=>x.onclick=async()=>{
      const z=await Social.sendRequest(x.dataset.add);
      toast(z.ok?'✓ Demande envoyée':z.error); i.dispatchEvent(new Event('input'));
    });
  },250); };
}

/* ---- utils ---- */
function defAvatar(name){
  const cs=['#e8c84a','#a855f7','#4ade80','#f87171','#60a5fa','#fb923c'];
  const h=[...name].reduce((s,c)=>s+c.charCodeAt(0),0);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="${cs[h%cs.length]}"/><text x="60" y="80" font-family="sans-serif" font-size="56" font-weight="800" text-anchor="middle" fill="#000">${(name[0]||'?').toUpperCase()}</text></svg>`;
  return 'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));
}
function fmtDate(d){ return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}); }
function esc(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function priv(){ return `<div style="padding:2rem;text-align:center;color:var(--text-muted);">🔒 Liste privée.<br/><small>Seuls les amis de ${viewed} peuvent voir.</small></div>`; }
function copyLink(){ navigator.clipboard?.writeText(`${location.origin}/profile.php?user=${viewed}`); toast('🔗 Lien copié !'); }
function toast(m){
  let t=document.getElementById('toast');
  if(!t){t=document.createElement('div');t.id='toast';
    t.style.cssText='position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:var(--bg2);border:1.5px solid var(--accent);color:var(--text);padding:0.75rem 1.5rem;border-radius:8px;font-weight:700;z-index:500;box-shadow:var(--shadow);transition:opacity .3s;';
    document.body.appendChild(t);}
  t.textContent=m;t.style.opacity='1';clearTimeout(t._t);t._t=setTimeout(()=>t.style.opacity='0',2500);
}
