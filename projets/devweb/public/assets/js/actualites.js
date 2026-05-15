/* ============================================================
   actualites.js – Fil RSS temps réel + articles communautaires
   (articles/likes/commentaires stockés en MySQL via /api/articles)
   ============================================================ */

let allNews = [], filterMode = 'all', filterSource = '', filterQuery = '';
let followedNames = [], communityArticles = [];

document.addEventListener('DOMContentLoaded', () => {
  loadNews();
  loadCommunity();
  loadFollowed();
  bindFilters();
  bindArticleModal();
  bindJournalist();
  bindFollowedFilter();
  setInterval(loadNews, CONFIG.NEWS_REFRESH_MS);
});

/* ---- Jeux suivis (pour le filtre + highlight) ---- */
async function loadFollowed() {
  if (!Auth.isLoggedIn()) return;
  try {
    const lists = await Letterbox.getLists();
    followedNames = (lists.followed||[]).map(g => (g.name||'').toLowerCase()).filter(Boolean);
    updateFollowedBtn();
  } catch {}
}

/* ---- RSS ---- */
async function loadNews() {
  const list = document.getElementById('newsList');
  if (!list) return;
  if (!allNews.length) list.innerHTML = skel(6);
  try { allNews = await API.getAllNews(CONFIG.NEWS_PER_FEED); applyFilters(); }
  catch { if (!allNews.length) list.innerHTML = '<p style="color:var(--text-muted);padding:1rem;">Actus indisponibles.</p>'; }
}

function applyFilters() {
  const list = document.getElementById('newsList');
  let items = allNews.filter(it => {
    const txt = (it.title+' '+(it.description||'')).toLowerCase();
    if (filterMode === 'followed') {
      if (!followedNames.length || !followedNames.some(n => txt.includes(n))) return false;
    }
    if (filterSource && it._source !== filterSource) return false;
    if (filterQuery && !it.title.toLowerCase().includes(filterQuery)) return false;
    return true;
  });
  if (!items.length) {
    list.innerHTML = `<p style="color:var(--text-muted);padding:1rem;">${
      filterMode==='followed'
      ? 'Aucune actu pour tes jeux suivis. <a href="/jeux.php" style="color:var(--accent)">Suis des jeux →</a>'
      : 'Aucun article.'}</p>`;
    return;
  }
  list.innerHTML = items.map(rssItem).join('');
}

function rssItem(it) {
  const txt = (it.title+' '+(it.description||'')).toLowerCase();
  const match = followedNames.length && followedNames.some(n => txt.includes(n));
  const thumb = it.thumbnail && it.thumbnail!=='self'
    ? `<img src="${it.thumbnail}" class="rss-thumb" loading="lazy" onerror="this.style.display='none'" alt="" />` : '';
  const date = it.pubDate ? new Date(it.pubDate).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'}) : '';
  return `<div class="news-list-item rss-item ${match?'rss-followed':''}">
    ${thumb}
    <div class="rss-item-body">
      <div style="display:flex;gap:0.4rem;margin-bottom:0.4rem;flex-wrap:wrap;">
        <span class="news-card-category">${it._source}</span>
        ${it._lang==='fr'?'<span class="news-card-category" style="background:rgba(232,200,74,0.08);color:var(--accent)">FR</span>':''}
        ${match?'<span class="news-card-category" style="background:rgba(168,85,247,0.15);color:var(--accent2)">🔔 Suivi</span>':''}
      </div>
      <h3 class="news-list-title rss-title">${it.title}</h3>
      <p class="news-list-excerpt">${strip(it.description||'').substring(0,180)}…</p>
      <div class="news-list-footer">
        <span style="font-size:0.8rem;color:var(--text-muted)">${it.author?it.author+' · ':''}${date}</span>
        <div class="news-card-actions">
          <a href="${it.link}" target="_blank" rel="noopener" class="action-btn">Lire ↗</a>
        </div>
      </div>
    </div></div>`;
}

/* ---- Articles communautaires (MySQL) ---- */
async function loadCommunity() {
  const wrap = document.getElementById('communityArticles');
  if (!wrap) return;
  try {
    const r = await fetch('/api/articles.php').then(r=>r.json());
    communityArticles = r.articles || [];
  } catch { communityArticles = []; }

  if (!communityArticles.length) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = communityArticles.map(a=>`
    <div class="news-list-item community-item" data-id="${a.id}">
      <div style="display:flex;gap:0.4rem;margin-bottom:0.4rem;">
        <span class="news-card-category">${a.category}</span>
        <span class="news-card-category" style="background:rgba(232,200,74,0.12);color:var(--accent)">Communauté</span>
      </div>
      <h3 class="news-list-title" data-open="${a.id}">${esc(a.title)}</h3>
      <p class="news-list-excerpt">${esc(a.excerpt)}…</p>
      <div class="news-list-footer">
        <span style="font-size:0.8rem;color:var(--text-muted)">
          <a href="/profile.php?user=${a.author}" style="color:var(--text-muted)">${a.author}</a> · ${a.date}</span>
        <div class="news-card-actions">
          <button class="action-btn like-btn ${a.liked?'liked':''}" data-like="${a.id}">${a.liked?'♥':'♡'} ${a.likes}</button>
          <button class="action-btn" data-open="${a.id}">Lire →</button>
        </div>
      </div>
    </div>`).join('');

  wrap.querySelectorAll('[data-open]').forEach(el=>el.addEventListener('click',()=>
    openArticle(communityArticles.find(x=>x.id==el.dataset.open))));
  wrap.querySelectorAll('[data-like]').forEach(b=>b.addEventListener('click',async()=>{
    if(!Auth.isLoggedIn()){document.getElementById('openAuthModal')?.click();return;}
    await fetch('/api/articles.php',{method:'POST',body:fd({action:'like',id:b.dataset.like})});
    loadCommunity();
  }));
}

function openArticle(a) {
  if (!a) return;
  const ov = document.getElementById('articleModal');
  const c  = document.getElementById('articleModalContent');
  c.innerHTML = `
    <div class="article-modal-header">
      <span class="news-card-category">${a.category}</span>
      <h2 class="article-modal-title">${esc(a.title)}</h2>
      <div class="article-modal-meta"><span>${a.author}</span><span>·</span><span>${a.date}</span>
        <button class="action-btn like-btn ${a.liked?'liked':''}" id="mLike">${a.liked?'♥':'♡'} ${a.likes}</button></div>
    </div>
    <div class="article-modal-body">${esc(a.content).replace(/\n/g,'<br/><br/>')}</div>
    <div class="article-modal-comments">
      <div class="modal-section-title">Commentaires (${a.comments.length})</div>
      <div id="cList">${a.comments.length?a.comments.map(x=>`
        <div class="comment-item"><div class="comment-author">${x.author}</div>
        <p class="comment-text">${esc(x.content)}</p></div>`).join(''):'<p style="color:var(--text-muted);font-size:0.85rem;">Pas de commentaire.</p>'}</div>
      ${Auth.isLoggedIn()?`<div class="review-form" style="margin-top:1rem;">
        <input type="text" id="cInput" placeholder="Ajouter un commentaire..." />
        <button class="btn-primary" id="cSend">Commenter</button></div>`:
        `<p style="color:var(--text-muted);font-size:0.85rem;margin-top:0.75rem;">Connecte-toi pour commenter.</p>`}
      ${(Auth.isAdmin()||(Auth.getCurrentUser()&&Auth.getCurrentUser().username===a.author))?
        `<div class="journalist-edit-bar"><button class="btn-secondary" id="delArt">Supprimer</button></div>`:''}
    </div>`;
  ov.classList.remove('hidden');
  document.getElementById('articleModalClose').onclick=()=>ov.classList.add('hidden');
  ov.onclick=e=>{if(e.target===ov)ov.classList.add('hidden');};
  c.querySelector('#mLike')?.addEventListener('click',async()=>{
    if(!Auth.isLoggedIn()){document.getElementById('openAuthModal')?.click();return;}
    await fetch('/api/articles.php',{method:'POST',body:fd({action:'like',id:a.id})});
    await loadCommunity(); openArticle(communityArticles.find(x=>x.id===a.id));
  });
  c.querySelector('#cSend')?.addEventListener('click',async()=>{
    const t=c.querySelector('#cInput').value.trim(); if(!t)return;
    await fetch('/api/articles.php',{method:'POST',body:fd({action:'comment',id:a.id,text:t})});
    await loadCommunity(); openArticle(communityArticles.find(x=>x.id===a.id));
  });
  c.querySelector('#delArt')?.addEventListener('click',async()=>{
    if(!confirm('Supprimer cet article ?'))return;
    await fetch('/api/articles.php',{method:'POST',body:fd({action:'delete',id:a.id})});
    ov.classList.add('hidden'); loadCommunity();
  });
}

/* ---- Journaliste : publier ---- */
function bindJournalist() {
  const bar=document.getElementById('journalistActions');
  if (Auth.isJournalist()) bar?.classList.remove('hidden');
  const wrap=document.getElementById('articleFormWrapper');
  document.getElementById('newArticleBtn')?.addEventListener('click',()=>{
    wrap.classList.remove('hidden'); document.getElementById('newArticleBtn').classList.add('hidden');
  });
  document.getElementById('cancelArticle')?.addEventListener('click',()=>{
    wrap.classList.add('hidden'); document.getElementById('newArticleBtn').classList.remove('hidden');
  });
  document.getElementById('articleForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const r=await fetch('/api/articles.php',{method:'POST',body:fd({
      action:'create',
      title:document.getElementById('articleTitle').value.trim(),
      category:document.getElementById('articleCategory').value,
      content:document.getElementById('articleContent').value.trim(),
    })}).then(r=>r.json());
    if(!r.ok){ alert(r.error||'Erreur'); return; }
    e.target.reset(); wrap.classList.add('hidden');
    document.getElementById('newArticleBtn').classList.remove('hidden');
    loadCommunity();
  });
}

/* ---- Filtres ---- */
function bindFilters() {
  document.getElementById('searchNews')?.addEventListener('input',e=>{
    filterQuery=e.target.value.toLowerCase().trim(); applyFilters();
  });
  document.getElementById('filterSource')?.addEventListener('change',e=>{
    filterSource=e.target.value; applyFilters();
  });
}
function bindFollowedFilter() {
  const b=document.getElementById('btnFollowedFilter');
  b?.addEventListener('click',()=>{
    filterMode = filterMode==='followed'?'all':'followed';
    updateFollowedBtn(); applyFilters();
  });
}
function updateFollowedBtn() {
  const b=document.getElementById('btnFollowedFilter');
  if(!b)return;
  b.textContent=`🔔 Mes jeux suivis (${followedNames.length})`;
  b.classList.toggle('active',filterMode==='followed');
}
function bindArticleModal() {
  const ov=document.getElementById('articleModal');
  document.getElementById('articleModalClose')?.addEventListener('click',()=>ov.classList.add('hidden'));
}

/* ---- utils ---- */
function fd(o){const f=new FormData();Object.entries(o).forEach(([k,v])=>f.append(k,v));return f;}
function strip(h){const d=document.createElement('div');d.innerHTML=h;return d.textContent||'';}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function skel(n){return Array.from({length:n},()=>'<div class="news-list-item" style="height:90px;background:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;"></div>').join('');}

const _rss=document.createElement('style');
_rss.textContent=`.rss-item{display:flex;gap:1rem;align-items:flex-start;}.rss-thumb{width:120px;height:80px;object-fit:cover;border-radius:6px;flex-shrink:0;border:1px solid var(--border);}.rss-item-body{flex:1;min-width:0;}.rss-followed{border-left-color:var(--accent2)!important;background:rgba(168,85,247,0.04);}#btnFollowedFilter.active{border-color:var(--accent2);color:var(--accent2);background:rgba(168,85,247,0.1);}@media(max-width:600px){.rss-thumb{display:none;}}`;
document.head.appendChild(_rss);
