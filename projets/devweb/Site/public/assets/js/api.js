/* ============================================================
   api.js – Couche d'accès aux APIs externes
   · RAWG  : catalogue de jeux vidéo
   · rss2json : fil d'actualités gaming (RSS → JSON)
   ============================================================ */

const API = (() => {

  /* ---- RAWG ---- */

  function rawgUrl(path, params = {}) {
    const p = new URLSearchParams({ key: CONFIG.RAWG_KEY, ...params });
    return `${CONFIG.RAWG_BASE}${path}?${p}`;
  }

  async function rawgFetch(path, params = {}) {
    const url = rawgUrl(path, params);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`RAWG ${res.status}`);
    return res.json();
  }

  /* Liste de jeux populaires */
  async function getPopularGames({ page = 1, pageSize = 20, ordering = '-rating' } = {}) {
    return rawgFetch('/games', {
      ordering,
      page,
      page_size: pageSize,
      metacritic: '60,100'
    });
  }

  /* Recherche */
  async function searchGames(query, { page = 1, pageSize = 20, ordering = '-rating' } = {}) {
    return rawgFetch('/games', { search: query, ordering, page, page_size: pageSize });
  }

  /* Filtrer par genre */
  async function getGamesByGenre(genre, { page = 1, pageSize = 20, ordering = '-rating' } = {}) {
    return rawgFetch('/games', {
      genres: genre.toLowerCase(),
      ordering,
      page,
      page_size: pageSize
    });
  }

  /* Détail d'un jeu (par id ou slug) */
  async function getGame(idOrSlug) {
    return rawgFetch(`/games/${idOrSlug}`);
  }

  /* Screenshots */
  async function getScreenshots(idOrSlug) {
    return rawgFetch(`/games/${idOrSlug}/screenshots`);
  }

  /* Jeux similaires */
  async function getSimilar(idOrSlug) {
    return rawgFetch(`/games/${idOrSlug}/game-series`);
  }

  /* ---- RSS News ---- */

  async function fetchFeed(feedUrl, count = CONFIG.NEWS_PER_FEED) {
    const url = `${CONFIG.RSS2JSON}?rss_url=${encodeURIComponent(feedUrl)}&count=${count}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`RSS ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error('RSS parse error');
    return data.items;
  }

  /* Récupère tous les fils en parallèle, retourne un tableau plat trié par date */
  async function getAllNews(count = CONFIG.NEWS_PER_FEED) {
    const results = await Promise.allSettled(
      CONFIG.RSS_FEEDS.map(async feed => {
        const items = await fetchFeed(feed.url, count);
        return items.map(item => ({ ...item, _source: feed.name, _lang: feed.lang }));
      })
    );

    const all = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    all.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    return all;
  }

  return {
    getPopularGames,
    searchGames,
    getGamesByGenre,
    getGame,
    getScreenshots,
    getSimilar,
    getAllNews,
    fetchFeed
  };
})();

/* Letterbox est maintenant dans social.js (branché sur MySQL via /api/lists.php) */
