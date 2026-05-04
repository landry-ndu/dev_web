/* ============================================================
   jeux.js – Page catalogue des jeux : affichage, filtres, modal
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  renderGamesPage();
  bindFilters();
  bindModal();
});

let filteredGames = [...GAMES];

function renderGamesPage() {
  const grid = document.getElementById('gamesGrid');
  if (!grid) return;
  grid.innerHTML = filteredGames.map(game => createGameCard(game)).join('');
  grid.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.dataset.id);
      openGameModal(GAMES.find(g => g.id === id));
    });
  });
}

function bindFilters() {
  const search = document.getElementById('searchGames');
  const genre  = document.getElementById('filterGenre');
  const sort   = document.getElementById('sortGames');

  function applyFilters() {
    const q   = (search?.value || '').toLowerCase();
    const g   = genre?.value || '';
    const s   = sort?.value || 'note';

    filteredGames = GAMES
      .filter(game =>
        (!q || game.title.toLowerCase().includes(q) || game.developer.toLowerCase().includes(q)) &&
        (!g || game.genre === g)
      )
      .sort((a, b) => {
        if (s === 'note')  return b.avgRating - a.avgRating;
        if (s === 'titre') return a.title.localeCompare(b.title);
        if (s === 'annee') return b.year - a.year;
        return 0;
      });

    renderGamesPage();
  }

  search?.addEventListener('input', applyFilters);
  genre?.addEventListener('change', applyFilters);
  sort?.addEventListener('change', applyFilters);
}

function bindModal() {
  const overlay = document.getElementById('gameModal');
  const closeBtn = document.getElementById('modalClose');
  if (!overlay) return;

  closeBtn?.addEventListener('click', () => overlay.classList.add('hidden'));
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });
}
