/* data.js – Jeux de secours si l'API RAWG est indisponible */
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

