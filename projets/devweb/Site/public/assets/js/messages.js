/* ============================================================
   messages.js – Messagerie (API MySQL + polling 2s)
   URL : messages.php?to=pseudo  ouvre direct la conversation
   ============================================================ */

let me = null, activeOther = null, poll = null;

document.addEventListener('DOMContentLoaded', () => {
  me = Auth.getCurrentUser();
  if (!me) { location.href = '/index.php'; return; }

  const to = new URLSearchParams(location.search).get('to');
  renderConvoList();
  bindNewChat();
  bindForm();
  if (to && to !== me.username) openConversation(to);

  poll = setInterval(() => {
    renderConvoList();
    if (activeOther) renderMessages(true);
  }, 2000);
});
window.addEventListener('beforeunload', () => clearInterval(poll));

async function renderConvoList() {
  const list = document.getElementById('convoListItems');
  const r = await Social.getConversations().catch(() => ({ conversations: [] }));
  const cs = r.conversations || [];
  if (!cs.length) {
    list.innerHTML = `<p style="color:var(--text-muted);padding:1rem;font-size:0.85rem;">
      Aucune discussion. Clique sur <strong>+ Nouveau</strong>.</p>`;
    return;
  }
  list.innerHTML = cs.map(c=>`
    <div class="convo-item ${activeOther===c.user?'active':''}" data-user="${c.user}">
      <img class="friend-avatar" src="${avatar(c.user)}" alt="" />
      <div class="convo-item-body">
        <div class="convo-item-top">
          <span class="convo-item-name">${c.user}</span>
          <span class="convo-item-time">${rel(c.date)}</span>
        </div>
        <div class="convo-item-preview">${c.mine?'<small>Toi :</small> ':''}${esc(c.last).substring(0,50)}</div>
      </div>
      ${c.unread?`<span class="badge convo-badge">${c.unread}</span>`:''}
    </div>`).join('');
  list.querySelectorAll('.convo-item').forEach(el=>
    el.addEventListener('click',()=>openConversation(el.dataset.user)));
}

async function openConversation(other) {
  activeOther = other;
  document.getElementById('convoPlaceholder').classList.add('hidden');
  document.getElementById('convoView').classList.remove('hidden');
  document.getElementById('convoOtherName').textContent = other;
  document.getElementById('convoOtherName').href = `/profile.php?user=${other}`;
  document.getElementById('convoOtherAvatar').src = avatar(other);
  await renderMessages();
  renderConvoList();
  setTimeout(()=>document.getElementById('msgInput')?.focus(),50);
}

async function renderMessages(keepScroll) {
  if (!activeOther) return;
  const r = await Social.getThread(activeOther).catch(()=>({messages:[]}));
  const msgs = r.messages || [];
  const wrap = document.getElementById('convoMessages');
  const atBottom = wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight < 50;

  if (!msgs.length) {
    wrap.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:2rem;font-size:0.85rem;">
      Dis bonjour à ${activeOther} !</p>`;
    return;
  }
  let lastDay='';
  wrap.innerHTML = msgs.map(m=>{
    const day=new Date(m.date).toLocaleDateString('fr-FR');
    let sep=''; if(day!==lastDay){sep=`<div class="msg-day-sep">${day}</div>`;lastDay=day;}
    return sep+`<div class="msg ${m.mine?'msg-out':'msg-in'}">
      <div class="msg-bubble">${esc(m.text)}</div>
      <div class="msg-time">${time(m.date)}</div></div>`;
  }).join('');
  if (!keepScroll || atBottom) wrap.scrollTop = wrap.scrollHeight;
}

function bindForm() {
  document.getElementById('convoForm').addEventListener('submit', async e=>{
    e.preventDefault();
    if (!activeOther) return;
    const inp = document.getElementById('msgInput');
    const txt = inp.value.trim();
    if (!txt) return;
    inp.value = '';
    await Social.sendMessage(activeOther, txt);
    await renderMessages();
    renderConvoList();
    const w=document.getElementById('convoMessages'); w.scrollTop=w.scrollHeight;
  });
}

function bindNewChat() {
  const btn=document.getElementById('newChatBtn'),
        block=document.getElementById('convoSearchBlock'),
        inp=document.getElementById('convoSearch'),
        res=document.getElementById('convoSearchResults');
  btn.addEventListener('click',()=>{ block.classList.toggle('hidden'); if(!block.classList.contains('hidden'))inp.focus(); });
  let t;
  inp.addEventListener('input',()=>{ clearTimeout(t); t=setTimeout(async()=>{
    const q=inp.value.trim(); if(!q){res.innerHTML='';return;}
    const r=await Social.searchUsers(q);
    const us=r.results||[];
    res.innerHTML=us.length?us.map(u=>`
      <div class="convo-search-item" data-user="${u}">
        <img class="friend-avatar" src="${avatar(u)}" alt="" /><span>${u}</span>
      </div>`).join(''):'<p style="color:var(--text-muted);font-size:0.85rem;padding:0.5rem;">Aucun utilisateur.</p>';
    res.querySelectorAll('.convo-search-item').forEach(el=>el.onclick=()=>{
      openConversation(el.dataset.user); block.classList.add('hidden'); inp.value=''; res.innerHTML='';
    });
  },250); });
}

/* utils */
function avatar(u){
  const cs=['#e8c84a','#a855f7','#4ade80','#f87171','#60a5fa','#fb923c'];
  const h=[...u].reduce((s,c)=>s+c.charCodeAt(0),0);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="${cs[h%cs.length]}"/><text x="40" y="54" font-family="sans-serif" font-size="38" font-weight="800" text-anchor="middle" fill="#000">${(u[0]||'?').toUpperCase()}</text></svg>`;
  return 'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function time(d){return new Date(d).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});}
function rel(d){const s=(Date.now()-new Date(d))/1000;if(s<60)return"à l'instant";if(s<3600)return Math.floor(s/60)+' min';if(s<86400)return Math.floor(s/3600)+' h';return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'short'});}
