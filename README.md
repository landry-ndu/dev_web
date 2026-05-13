# 🎮 GameBizarre

Plateforme web combinant **critiques de jeux vidéo type Letterboxd** et **fil d'actualités gaming**, avec **système social complet** (profils, amis, messagerie privée).

**🌐 Démo en ligne :** https://landry-ndu.github.io/dev_web/

Projet de Licence Informatique L2 — développement web (HTML / CSS / JavaScript vanilla, sans framework).

---

## 📋 Table des matières

1. [Fonctionnalités](#-fonctionnalités)
2. [Stack technique](#-stack-technique)
3. [Architecture des fichiers](#-architecture-des-fichiers)
4. [La "base de données" (localStorage)](#-la-base-de-données-localstorage)
5. [APIs externes utilisées](#-apis-externes-utilisées)
6. [Authentification et rôles](#-authentification-et-rôles)
7. [Système social](#-système-social)
8. [Installation et lancement](#-installation-et-lancement)
9. [Tester en multi-utilisateur](#-tester-en-multi-utilisateur)
10. [Limites du projet](#-limites-du-projet)

---

## ✨ Fonctionnalités

### Côté jeux (Letterboxd-like)
- Catalogue de **800 000+ jeux** via l'API RAWG
- Recherche, filtres par genre, tri (note / Metacritic / sortie / popularité)
- **Fiche jeu dédiée** : couverture, description, screenshots avec lightbox, jeux similaires
- **Letterbox personnel** : marquer un jeu comme `Joué`, `En cours`, `Envie de jouer`
- **Suivre un jeu** : reçoit ses news dans le fil d'actualité
- **Noter** (★ /5) et **laisser un avis** par jeu

### Côté actualités
- Fil d'actu **temps réel** agrégé depuis 4 sources (IGN, Gamekult, Jeuxvideo.com, Kotaku)
- Filtrage par source, recherche texte
- **Filtre "jeux suivis"** : voir uniquement les news qui concernent tes jeux
- Auto-refresh toutes les 10 min
- **Articles communautaires** : les journalistes peuvent publier / supprimer leurs articles

### Côté social
- **Profil public** : avatar, bio, jeux, notes, avis, amis, date d'inscription
- **Paramètres de confidentialité** : liste de jeux publique ou privée (visible aux amis seulement)
- **Système d'amis** : demande / acceptation / refus / suppression
- **Messagerie privée** : conversations 1-to-1, badges de messages non lus, sync entre onglets
- **Partage du profil** par lien copiable

### UI/UX
- Design inspiré **JoJo's Bizarre Adventure** (jaune/violet contrastés, animations subtiles)
- **Dark mode / Light mode** (préférence persistée)
- Responsive mobile + desktop
- Skeleton loaders pendant les requêtes API

---

## 🛠 Stack technique

| Couche | Technologie | Pourquoi |
|---|---|---|
| Structure | **HTML5** | Standard |
| Style | **CSS3** (variables CSS, grid, flexbox) | Aucun framework |
| Logique | **JavaScript vanilla** (ES2020) | Imposé par le sujet |
| Stockage | **localStorage** (JSON sérialisé) | Pas de backend requis |
| Données jeux | **RAWG API** (REST) | Catalogue de jeux réel |
| Données news | **rss2json** + flux RSS | News en temps réel |
| Hébergement | **GitHub Pages** | Statique, gratuit |

**Aucune dépendance externe** : pas de Node.js, pas de build step, pas de framework. On ouvre les fichiers `.html` et ça marche.

---

## 📁 Architecture des fichiers

```
devweb/
├── index.html              ← page d'accueil
├── jeux.html               ← catalogue de jeux (RAWG)
├── game.html               ← fiche jeu individuelle (?slug=xxx)
├── actualites.html         ← fil d'actu RSS + articles communautaires
├── auth.html               ← inscription / connexion
├── profile.html            ← profil utilisateur (?user=pseudo)
├── messages.html           ← messagerie privée
│
├── css/
│   ├── style.css           ← design system principal
│   ├── animations.css      ← keyframes globales
│   ├── game-page.css       ← styles spécifiques fiche jeu
│   └── social.css          ← styles profil + messagerie
│
├── js/
│   ├── config.js           ← clés API + URLs RSS
│   ├── data.js             ← données statiques + fonctions likes partagées
│   ├── api.js              ← client RAWG + agrégateur RSS + module Letterbox
│   ├── auth.js             ← authentification + dark mode + badge messages
│   ├── auth-page.js        ← logique du formulaire login/register
│   ├── main.js             ← page d'accueil
│   ├── jeux.js             ← catalogue de jeux
│   ├── game-page.js        ← fiche jeu
│   ├── actualites.js       ← fil d'actu
│   ├── social.js           ← module social complet (profils/amis/messages)
│   ├── profile.js          ← logique page profil
│   └── messages.js         ← logique messagerie (polling 1.5s)
│
└── README.md               ← ce fichier
```

### Responsabilité de chaque fichier JS

| Fichier | Ce qu'il fait |
|---|---|
| `config.js` | Centralise la clé API RAWG et les URLs des flux RSS |
| `data.js` | Données statiques de fallback (jeux/articles si l'API échoue) + fonctions `isLiked`, `toggleLike`, `saveDynamicData` utilisées sur toutes les pages |
| `api.js` | Trois modules : `API` (RAWG + RSS) et `Letterbox` (joué/envie/suivi) |
| `auth.js` | Module `Auth` (register / login / logout / session) + dark mode + mise à jour de la navbar |
| `social.js` | Module `Social` : `getProfile`, `saveProfile`, `getStats`, `sendRequest`, `acceptRequest`, `sendMessage`, `getConversation`, `canSeeList`, etc. |

Tous les modules sont exposés en **IIFE** (revealing module pattern) pour éviter la pollution du scope global.

---

## 💾 La "base de données" (localStorage)

**Il n'y a pas de SGBD.** Tout est stocké dans le `localStorage` du navigateur, qui est un *key-value store* synchrone permettant d'enregistrer ~5 Mo de données par origine.

Chaque "table" est un objet JSON sérialisé sous une clé préfixée `gb_`. Voici l'équivalent SQL conceptuel :

### `gb_users` — équivalent table `users`
```js
[
  {
    username: "alice",
    email:    "alice@mail.com",
    password: "(stocké en clair — projet pédagogique)",
    role:     "user" | "journalist"
  },
  ...
]
```

### `gb_session` — utilisateur connecté actuellement
```js
{ username: "alice", role: "user" }
```

### `gb_profiles` — équivalent table `user_profiles`
```js
{
  "alice": {
    bio: "Fan de RPG japonais",
    photo: "https://...",
    visibility: "public" | "private",
    createdAt: "2025-05-01T10:30:00.000Z"
  }
}
```

### `gb_friends` — équivalent table `friends` (relation N-N)
```js
{
  "alice": ["bob", "carol"],
  "bob":   ["alice"]
}
```

### `gb_friend_reqs` — équivalent table `friend_requests`
```js
[
  { from: "alice", to: "dave", date: "2025-05-01T..." },
  ...
]
```

### `gb_convos` — équivalent tables `conversations` + `messages`
```js
{
  "alice::bob": [   // clé = couple d'usernames triés alphabétiquement
    { from: "alice", to: "bob", text: "salut", date: 1714567890, read: true },
    { from: "bob", to: "alice", text: "yo !", date: 1714567950, read: false }
  ]
}
```

### `gb_lb_played`, `gb_lb_playing`, `gb_lb_want`, `gb_lb_followed`
Listes Letterbox de l'utilisateur courant :
```js
[ 3498, 41494, 28 ]   // IDs RAWG des jeux
```

### `gb_rating_<gameId>` et `gb_reviews_<gameId>`
Note personnelle et avis sur un jeu particulier :
```js
localStorage.gb_rating_3498  = "5"
localStorage.gb_reviews_3498 = JSON.stringify([{ author, rating, text, date }])
```

### `gb_liked`
IDs des articles communautaires likés.

### `gb_theme`
Préférence dark/light mode.

### Pourquoi localStorage et pas une vraie BDD ?

- ✅ **Aucun serveur** à déployer ni payer (GitHub Pages = gratuit, statique)
- ✅ **Simplicité** : pas d'ORM, pas de migrations, pas de connexions
- ✅ **Adapté au scope d'un projet L2** front-end
- ❌ Limite : les données restent **dans le navigateur de chaque utilisateur** (pas de partage entre PCs)

Pour passer à une vraie BDD multi-utilisateurs, il faudrait remplacer `social.js` par des appels à **Firebase Firestore** (NoSQL) ou **Supabase** (PostgreSQL).

---

## 🌐 APIs externes utilisées

### 1. RAWG.io (catalogue de jeux)
- **Base URL** : `https://api.rawg.io/api`
- **Auth** : clé API requise (gratuite après inscription sur rawg.io/apidocs)
- **Limite** : 1 000 requêtes / heure
- **Endpoints utilisés** :
  - `GET /games?key=&search=&genres=&ordering=&page=` — liste & recherche
  - `GET /games/{id|slug}?key=` — détail d'un jeu
  - `GET /games/{id}/screenshots?key=` — captures d'écran
  - `GET /games/{id}/game-series?key=` — jeux de la même saga

### 2. rss2json.com (conversion RSS → JSON)
- **Base URL** : `https://api.rss2json.com/v1/api.json?rss_url=<feed>`
- **Auth** : aucune (10 000 requêtes / jour en gratuit)
- **CORS** : OK (lisible depuis un navigateur)
- **Flux RSS sources** :
  - `https://feeds.feedburner.com/ign/games-all` (IGN)
  - `https://www.gamekult.com/feeds/actu.html` (Gamekult)
  - `https://www.jeuxvideo.com/jvxml.htm` (Jeuxvideo.com)
  - `https://kotaku.com/rss` (Kotaku)

---

## 🔐 Authentification et rôles

Le module `Auth` dans `js/auth.js` gère tout :

```js
Auth.register({ username, email, password, role })
Auth.login({ username, password })
Auth.logout()
Auth.getCurrentUser()        // { username, role } ou null
Auth.isLoggedIn()
Auth.isJournalist()
```

**Deux rôles** :
- **`user`** : peut noter, commenter, suivre des jeux, envoyer des messages, gérer ses amis
- **`journalist`** : peut en plus **publier et supprimer** des articles d'actualité

⚠️ **Sécurité** : les mots de passe sont stockés **en clair** dans `localStorage`. C'est volontairement simple pour un projet pédagogique. En production il faudrait bcrypt/argon2 + un vrai backend.

---

## 👥 Système social

Le module `Social` (dans `js/social.js`) centralise tout :

```js
// Profil
Social.getProfile(username)
Social.saveProfile(username, { bio, photo, visibility })
Social.getStats(username)               // jeux joués/notes/avis comptés auto

// Amis
Social.sendRequest(from, to)
Social.getIncomingRequests(username)
Social.acceptRequest(accepter, fromUser)
Social.refuseRequest(refuser, fromUser)
Social.areFriends(a, b)
Social.removeFriend(a, b)
Social.getFriends(username)

// Permissions
Social.canSeeList(viewer, target)       // true si public OU ami OU soi-même

// Messages
Social.sendMessage(from, to, text)
Social.getConversation(a, b)            // tous les messages entre 2 users
Social.getConversations(username)       // inbox triée
Social.getUnreadCount(username)         // pour le badge navbar
Social.markConversationRead(viewer, otherUser)

// Recherche
Social.searchUsers(query, exclude)
```

### Temps réel (simulé)
La messagerie utilise deux mécanismes pour rafraîchir l'affichage :

1. **Event `storage`** : si une autre fenêtre/onglet écrit dans localStorage, on est notifié immédiatement
2. **Polling toutes les 1.5 s** : on relit localStorage et on régénère l'UI si nécessaire

Pas du *vrai* WebSocket, mais ça donne l'impression du temps réel pour 2 utilisateurs sur le même navigateur.

---

## 🚀 Installation et lancement

### Méthode 1 : ouvrir directement
Double-clic sur `index.html`. Fonctionne dans tous les navigateurs modernes.

### Méthode 2 : serveur local (recommandé)
Pour éviter d'éventuels soucis CORS en local :

```bash
# Avec Python
python -m http.server 8000

# Avec VS Code : extension Live Server, clic-droit > Open with Live Server
```

Puis ouvrir `http://localhost:8000`.

### Configuration de la clé RAWG

Récupérer une clé gratuite sur https://rawg.io/apidocs puis dans `js/config.js` :

```js
const CONFIG = {
  RAWG_KEY: 'TA_CLE_ICI',
  ...
};
```

Sans clé valide, le catalogue de jeux ne se charge pas (mais le reste fonctionne avec les données de fallback dans `data.js`).

---

## 🧪 Tester en multi-utilisateur

Comme tout est en localStorage, deux utilisateurs sur **deux PC différents ne peuvent pas se voir**. Mais on peut simuler 2+ utilisateurs sur le **même navigateur** :

1. Ouvre `auth.html` dans un **onglet normal** → crée `alice`
2. Ouvre `auth.html` dans une **fenêtre privée** (Ctrl+Shift+N) → crée `bob`
   - La fenêtre privée a son propre localStorage isolé
3. Depuis Alice, va sur `profile.html?user=bob` → clique "Ajouter en ami"
4. Côté Bob, onglet 👥 Amis → "Accepter"
5. Échangez des messages : `messages.html?to=alice` côté Bob, `messages.html?to=bob` côté Alice

---

## ⚠️ Limites du projet

| Limite | Conséquence | Solution si on voulait scaler |
|---|---|---|
| localStorage = navigateur local | Pas de multi-device, pas de cross-PC | Backend (Firebase, Supabase, Node + DB) |
| Mots de passe en clair | Aucune sécurité réelle | Hashing serveur (bcrypt) + JWT |
| Pas de validation côté serveur | Tout est manipulable via la console | API backend avec validation |
| Quota localStorage (~5 Mo) | Trop de conversations = saturé | DB serveur |
| Pas de temps réel "vrai" | Polling 1.5s | WebSocket / Firebase onSnapshot |
| Clé RAWG visible | Possible quota épuisé | Proxy backend qui cache la clé |

Ces limites sont **assumées** et **discutées** dans la conclusion du projet — elles sont normales pour un projet 100% front-end.

---

## 📜 Licence

Projet pédagogique L2 Informatique — usage libre à but éducatif.

---

## 👤 Auteurs

Projet réalisé en binôme dans le cadre du module Développement Web.
