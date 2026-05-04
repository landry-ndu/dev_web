/* ============================================================
   data.js – Données simulées (jeux et articles)
   ============================================================ */

const GAMES = [
  {
    id: 1,
    title: "Elden Ring",
    genre: "RPG",
    year: 2022,
    developer: "FromSoftware",
    description: "Un vaste monde ouvert forgé par Hidetaka Miyazaki et George R.R. Martin. Explore les Terres Intermédiaires et défie des boss légendaires dans ce RPG d'action exigeant.",
    cover: "🗡️",
    avgRating: 4.8,
    ratings: [5, 5, 4, 5, 5, 4, 5]
  },
  {
    id: 2,
    title: "The Legend of Zelda: Tears of the Kingdom",
    genre: "Aventure",
    year: 2023,
    developer: "Nintendo",
    description: "Link explore les hauteurs célestes et les profondeurs souterraines d'Hyrule. Construit, fusionne et explore dans cette suite épique de Breath of the Wild.",
    cover: "🌿",
    avgRating: 4.7,
    ratings: [5, 5, 4, 5, 4, 5]
  },
  {
    id: 3,
    title: "Baldur's Gate 3",
    genre: "RPG",
    year: 2023,
    developer: "Larian Studios",
    description: "Un RPG tactique monumental basé sur Donjons & Dragons. Chaque décision façonne une aventure narrative d'une richesse inégalée.",
    cover: "🎲",
    avgRating: 4.9,
    ratings: [5, 5, 5, 5, 4, 5, 5]
  },
  {
    id: 4,
    title: "Cyberpunk 2077",
    genre: "Action",
    year: 2020,
    developer: "CD Projekt Red",
    description: "Plonge dans la mégapole dystopique de Night City. Un RPG d'action futuriste avec une narration profonde et un monde vivant.",
    cover: "🤖",
    avgRating: 4.2,
    ratings: [4, 5, 3, 4, 5, 4]
  },
  {
    id: 5,
    title: "Hollow Knight",
    genre: "Aventure",
    year: 2017,
    developer: "Team Cherry",
    description: "Un metroidvania poétique dans un royaume d'insectes souterrain. Atmosphère sombre, gameplay précis, monde mystérieux à explorer.",
    cover: "🦋",
    avgRating: 4.6,
    ratings: [5, 4, 5, 4, 5, 4]
  },
  {
    id: 6,
    title: "Hades",
    genre: "Action",
    year: 2020,
    developer: "Supergiant Games",
    description: "Un roguelite narratif où tu incarnes Zagreus, fils d'Hadès, cherchant à s'échapper des Enfers. Combat fluide, histoire riche, rejouabilité infinie.",
    cover: "⚔️",
    avgRating: 4.7,
    ratings: [5, 5, 4, 5, 4, 5]
  },
  {
    id: 7,
    title: "Counter-Strike 2",
    genre: "FPS",
    year: 2023,
    developer: "Valve",
    description: "Le FPS compétitif par excellence, entièrement reconstruit sur Source 2. Graphismes modernisés, gameplay millimétré, scène esport mondiale.",
    cover: "🎯",
    avgRating: 4.0,
    ratings: [4, 3, 5, 4, 4, 3]
  },
  {
    id: 8,
    title: "Resident Evil 4 Remake",
    genre: "Horreur",
    year: 2023,
    developer: "Capcom",
    description: "Le remake du survival-horror culte de 2005. Leon Kennedy affronte des hordes d'infectés dans un village espagnol isolé. Modernisé mais fidèle à l'original.",
    cover: "🧟",
    avgRating: 4.5,
    ratings: [5, 4, 5, 4, 4, 5]
  }
];

const ARTICLES = [
  {
    id: 1,
    title: "GTA VI : Rockstar confirme la date de sortie pour l'automne 2025",
    category: "Annonce",
    author: "Journaliste1",
    date: "2025-05-01",
    excerpt: "Rockstar Games a officiellement annoncé que Grand Theft Auto VI sortira le 26 septembre 2025 sur PS5 et Xbox Series X/S.",
    content: "Après des années d'attente et une fuite massive de données en 2022, Rockstar Games a enfin levé le voile sur la date de sortie officielle de GTA VI. Le jeu sortira le 26 septembre 2025 sur PlayStation 5 et Xbox Series X/S, avec une version PC prévue pour 2026.\n\nLe titre se déroulera à Vice City et ses environs, avec deux protagonistes jouables dont Lucia, première héroïne principale de la franchise. La bande-annonce de décembre 2023 avait déjà battu tous les records de vues sur YouTube.\n\nRockstar promet un monde ouvert plus vivant que jamais, des mécaniques de jeu révolutionnaires et une narration cinématographique poussée. Les précommandes sont déjà disponibles.",
    likes: 142,
    comments: []
  },
  {
    id: 2,
    title: "Test – Elden Ring : Shadow of the Erdtree, le DLC parfait ?",
    category: "Test",
    author: "Journaliste1",
    date: "2025-04-28",
    excerpt: "On a passé 40 heures dans le DLC de l'année. Verdict : une extension monumentale qui redéfinit les standards du genre.",
    content: "Shadow of the Erdtree, le DLC d'Elden Ring, est enfin disponible. Après 40 heures passées dans les Terres Fantômes, nous pouvons affirmer que FromSoftware a livré l'une des meilleures extensions de l'histoire du jeu vidéo.\n\nLe nouveau territoire est aussi vaste que la moitié du jeu de base, avec des zones d'une beauté à couper le souffle et des boss d'une difficulté redoutable. Messmer l'Empaleur s'impose comme l'un des meilleurs affrontements jamais conçus par le studio.\n\nNote : 19/20 — Une masterclass.",
    likes: 89,
    comments: []
  },
  {
    id: 3,
    title: "Nintendo Direct : toutes les annonces de juin 2025",
    category: "Annonce",
    author: "Journaliste1",
    date: "2025-04-25",
    excerpt: "Nintendo a dévoilé son line-up pour la Switch 2 lors d'un Direct de 45 minutes. Voici tout ce qu'il faut retenir.",
    content: "Le Nintendo Direct de juin 2025 a été riche en surprises. La firme de Kyoto a présenté une dizaine de titres pour la Nintendo Switch 2, dont un nouveau Metroid, un remake de Fire Emblem et une suite à Pikmin 4.\n\nLa grande surprise de la soirée était l'annonce d'une collaboration avec FromSoftware pour un titre exclusif inédit. Les détails restent rares, mais les premières images montrent un univers fantastique coloré très différent des productions habituelles du studio.\n\nLa Switch 2 sera également compatible avec la grande majorité des titres Switch originaux via une rétrocompatibilité améliorée.",
    likes: 67,
    comments: []
  },
  {
    id: 4,
    title: "Preview – Hollow Knight Silksong : on a joué 2 heures",
    category: "Preview",
    author: "Journaliste1",
    date: "2025-04-20",
    excerpt: "Team Cherry nous a accordé une session de jeu exclusive. Hornet est magnifique à jouer et le monde se révèle encore plus profond.",
    content: "L'attente touche peut-être à sa fin. Nous avons pu jouer deux heures à Hollow Knight Silksong lors d'un événement presse à Paris. Et le moins que l'on puisse dire, c'est que Team Cherry n'a pas chômé.\n\nHornet se contrôle de façon distincte de Knight : plus rapide, plus aérienne, avec un système de soins lié aux combats plutôt qu'à une ressource passive. Le level design semble encore plus élaboré, avec des zones interconnectées de manière brillante.\n\nAucune date de sortie confirmée, mais la démo était stable et complète. On y croit.",
    likes: 201,
    comments: []
  }
];

/* Charge les données dynamiques depuis localStorage (avis, likes, commentaires ajoutés par les users) */
function loadDynamicData() {
  const stored = localStorage.getItem('gb_dynamic');
  if (!stored) return;
  const dyn = JSON.parse(stored);

  if (dyn.gameReviews) {
    dyn.gameReviews.forEach(({ gameId, review }) => {
      const game = GAMES.find(g => g.id === gameId);
      if (game) {
        if (!game.reviews) game.reviews = [];
        game.reviews.push(review);
        game.ratings.push(review.rating);
        game.avgRating = +(game.ratings.reduce((a, b) => a + b, 0) / game.ratings.length).toFixed(1);
      }
    });
  }

  if (dyn.articleLikes) {
    dyn.articleLikes.forEach(({ articleId, count }) => {
      const art = ARTICLES.find(a => a.id === articleId);
      if (art) art.likes = count;
    });
  }

  if (dyn.articleComments) {
    dyn.articleComments.forEach(({ articleId, comments }) => {
      const art = ARTICLES.find(a => a.id === articleId);
      if (art) art.comments = comments;
    });
  }

  if (dyn.userArticles) {
    dyn.userArticles.forEach(a => {
      if (!ARTICLES.find(x => x.id === a.id)) ARTICLES.push(a);
    });
  }
}

function saveDynamicData() {
  const dyn = {
    gameReviews: [],
    articleLikes: ARTICLES.map(a => ({ articleId: a.id, count: a.likes })),
    articleComments: ARTICLES.map(a => ({ articleId: a.id, comments: a.comments })),
    userArticles: ARTICLES.filter(a => a.userCreated)
  };
  localStorage.setItem('gb_dynamic', JSON.stringify(dyn));
}

loadDynamicData();
