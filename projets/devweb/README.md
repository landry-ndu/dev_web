# GameBizarre

Site web de critiques de jeux video (notes, avis, listes) avec un fil
d'actualites gaming et des fonctions sociales (profils, amis, messagerie).

Projet de Licence Informatique - PHP / MySQL / JavaScript.

## Technologies

- PHP 8 (PDO)
- MySQL
- HTML / CSS / JavaScript (sans framework)
- API RAWG (catalogue de jeux) et flux RSS (actualites)

## Lancer le projet

1. Importer la base :

   ```
   mysql -u root -p < db.sql
   ```

   (ou via phpMyAdmin, onglet Importer)

2. Configurer la connexion : copier `includes/database.example.php`
   en `includes/database.php` et renseigner host / dbname / user /
   mot de passe.

3. Lancer le serveur :

   ```
   php -S localhost:8000 -t public
   ```

   Sous Windows, le fichier `start.bat` fait la meme chose.

4. Ouvrir http://localhost:8000

L'extension PHP `pdo_mysql` doit etre activee.

## Compte de test

Un compte administrateur est cree par `db.sql` :
identifiant `admin`, mot de passe `admin123`.

## Structure

```
devweb/
  db.sql                schema de la base
  start.bat             lancement du serveur (Windows)
  includes/
    database.php        connexion MySQL
    auth.php            sessions et roles
    navbar.php          barre de navigation + connexion
  public/               racine web
    index.php           accueil
    jeux.php            catalogue de jeux
    game.php            fiche d'un jeu
    actualites.php      fil d'actualites
    profile.php         profil utilisateur
    messages.php        messagerie privee
    actions/            connexion / inscription / deconnexion
    api/                endpoints JSON (profil, amis, messages...)
    assets/             css et js
```

## Roles

- `user` : noter, commenter, suivre des jeux, amis, messages
- `journalist` : publier et supprimer ses articles d'actualite
- `admin` : supprimer n'importe quel article

## Securite

- Mots de passe hashes (bcrypt, `password_hash`)
- Requetes preparees PDO (protection contre l'injection SQL)
- Sessions PHP, verification des droits cote serveur
- Listes privees et messages accessibles seulement aux personnes
  autorisees

## Deploiement sur le serveur de la faculte

1. Envoyer le contenu du dossier par SFTP dans l'espace web.
2. Importer `db.sql` via le phpMyAdmin de l'universite.
3. Adapter `includes/database.php` (host, base, identifiants).
4. Ouvrir l'URL de l'espace web.
