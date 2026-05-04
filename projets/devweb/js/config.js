/* ============================================================
   config.js – Clés API et configuration
   ➜ Obtiens ta clé RAWG gratuite sur https://rawg.io/apidocs
     (inscription rapide par email, 1000 requêtes/heure)
   ============================================================ */

const CONFIG = {
  /* Remplace par ta clé RAWG (gratuite) */
  RAWG_KEY: '0d9b305b5a4c46108f5b6991a4027a0b',
  RAWG_BASE: 'https://api.rawg.io/api',

  /* Flux RSS convertis en JSON via rss2json (gratuit, CORS ok) */
  RSS2JSON: 'https://api.rss2json.com/v1/api.json',
  RSS_FEEDS: [
    { name: 'IGN',       url: 'https://feeds.feedburner.com/ign/games-all',   lang: 'en' },
    { name: 'Gamekult',  url: 'https://www.gamekult.com/feeds/actu.html',      lang: 'fr' },
    { name: 'Jeuxvideo', url: 'https://www.jeuxvideo.com/jvxml.htm',           lang: 'fr' },
    { name: 'Kotaku',    url: 'https://kotaku.com/rss',                        lang: 'en' }
  ],

  /* Nombre d'articles par flux */
  NEWS_PER_FEED: 8,

  /* Intervalle d'actualisation du fil (ms) */
  NEWS_REFRESH_MS: 10 * 60 * 1000
};
