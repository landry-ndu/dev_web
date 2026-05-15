# 🎮 GameBizarre — version PHP + MySQL

Plateforme de critiques de jeux vidéo (type Letterboxd) + fil d'actualités
gaming + réseau social (profils, amis, messagerie privée).

**Stack** : PHP 8 (PDO) · MySQL · HTML/CSS/JavaScript vanilla · API RAWG · RSS

---

## 🚀 Lancer le projet en local

### 1. Prérequis
- PHP 8+ (`php --version`)
- MySQL (serveur de l'école, XAMPP, MAMP, ou MySQL local)

### 2. Créer la base de données
Importer le schéma `db.sql` sur le serveur MySQL :

```bash
mysql -u TON_USER -p < db.sql
```
ou via **phpMyAdmin** → onglet *Importer* → choisir `db.sql`.

### 3. ⚙️ Connecter le serveur de l'école

Ouvre **`includes/database.php`** et modifie **uniquement** le bloc
encadré en haut du fichier :

```php
/* ---- CONFIG SERVEUR ÉCOLE (à modifier) ---- */
$host   = "localhost";      // ← adresse serveur MySQL école
$port   = 3306;             // ← port MySQL
$dbname = "gamebizarre";    // ← nom de la base
$user   = "root";           // ← ton login MySQL école
$pass   = "";               // ← ton mot de passe MySQL école
/* ------------------------------------------- */
```

> 💡 **Cas du proxy SSH de l'école** (fréquent en fac) :
> ouvre d'abord un tunnel dans un terminal séparé :
> ```bash
> ssh -L 3306:serveur-mysql-ecole:3306 ton_login@proxy.ecole.fr
> ```
> puis mets dans `database.php` : `$host = "127.0.0.1";` et `$port = 3306;`
> (laisse ce terminal ouvert tant que tu utilises le site).

### 4. Lancer le serveur web

```bash
php -S localhost:8000 -t public
```

Puis ouvre **http://localhost:8000** dans ton navigateur.

### 5. Clé API RAWG (catalogue de jeux)
Récupère une clé gratuite sur https://rawg.io/apidocs et mets-la dans
`public/assets/js/config.js` :
```js
RAWG_KEY: 'TA_CLE_ICI',
```

---

## 👤 Compte admin par défaut

`db.sql` crée un compte admin :
- **identifiant** : `admin`
- **mot de passe** : `admin123`

⚠️ Le hash fourni est un exemple. Si la connexion admin échoue, crée le
compte via l'inscription puis passe son rôle à `admin` en SQL :
```sql
UPDATE users SET role='admin' WHERE username='ton_pseudo';
```

---

## 🗂️ Architecture

```
Site/
├── db.sql                     ← schéma complet (10 tables)
├── README.md
├── includes/
│   ├── database.php           ← 🔧 CONFIG SERVEUR ÉCOLE ICI
│   ├── auth.php               ← session + rôles + helpers JSON
│   └── navbar.php             ← barre de nav + modale de connexion
└── public/                    ← racine web (php -S ... -t public)
    ├── index.php              ← accueil
    ├── jeux.php               ← catalogue (RAWG)
    ├── game.php               ← fiche jeu (?slug=...)
    ├── actualites.php         ← fil RSS + articles communautaires
    ├── profile.php            ← profil (?user=...)  [protégé]
    ├── messages.php           ← messagerie          [protégé]
    ├── actions/               ← formulaires POST
    │   ├── login_action.php
    │   ├── register_action.php
    │   └── logout_action.php
    ├── api/                   ← endpoints JSON (AJAX)
    │   ├── session.php        ← user connecté
    │   ├── profile.php        ← profil + stats + permissions
    │   ├── friends.php        ← demandes / liste / recherche
    │   ├── messages.php       ← conversations / thread / envoi
    │   ├── lists.php          ← Letterbox (joué/en cours/envie/suivi)
    │   ├── reviews.php        ← notes + avis
    │   └── articles.php       ← articles journalistes + likes + comments
    └── assets/ (css, js)      ← front-end
```

---

## 🔐 Sécurité

| Mesure | Implémentation |
|---|---|
| Mots de passe | `password_hash()` / `password_verify()` (bcrypt) |
| Injection SQL | Requêtes **préparées PDO** partout |
| Sessions | `$_SESSION` PHP côté serveur |
| Routes protégées | `requireLogin()` (pages) / `requireApiLogin()` (API → 401) |
| Listes privées | Vérifié serveur : public OU soi-même OU ami |
| Messages privés | L'API ne renvoie que les conversations de l'utilisateur connecté |
| Suppression article | Réservé à l'auteur ou à un admin |
| XSS | Échappement HTML côté affichage JS + `htmlspecialchars` PHP |

---

## 🎭 Rôles

| Rôle | Droits |
|---|---|
| `user` | noter, commenter, suivre, amis, messages |
| `journalist` | + publier / supprimer ses articles d'actu |
| `admin` | + supprimer n'importe quel article |

Le rôle se choisit à l'inscription (user / journaliste). `admin` se
définit uniquement en base.

---

## 🧪 Tester en multi-utilisateur

Contrairement à la version localStorage, ici **tout est en base MySQL** :
deux personnes sur deux PC différents (connectés à la même base école)
**se voient et discutent réellement**.

En local, pour simuler 2 users : ouvre un onglet normal + une fenêtre
privée, crée 2 comptes, envoie une demande d'ami, accepte, et discute.
