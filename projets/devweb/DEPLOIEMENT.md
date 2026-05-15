# 🚀 Déployer GameBizarre sur webetu (Saint-Étienne)

Le code PHP ne tourne **pas** sur ton PC : il doit être **envoyé sur
webetu**. Ton PC sert juste à éditer le code et à voir le site dans le
navigateur (via le proxy de l'école).

```
TON PC (Firefox + proxy)  ──►  webetu.univ-st-etienne.fr  ──►  MySQL université
   (édition du code)            (le code PHP s'exécute ici)     (base nl06706y)
```

---

## Étape 1 — Configurer le proxy Firefox (pour voir le site de chez toi)

Firefox → ☰ → **Paramètres** → chercher **"proxy"** → *Paramètres réseau*
→ **Configuration manuelle du proxy** :

| Champ | Valeur |
|---|---|
| Proxy HTTP | `cache.univ-st-etienne.fr` |
| Port | `3128` |
| ☑ Utiliser aussi ce proxy pour HTTPS | coché |

> À refaire en sens inverse (« Pas de proxy ») quand tu es à la fac ou
> que tu veux naviguer normalement.

---

## Étape 2 — Envoyer le code sur webetu (SFTP)

Télécharge **FileZilla** (gratuit) : https://filezilla-project.org

Connexion (panneau du haut) :

| Champ | Valeur |
|---|---|
| Hôte | `sftp://webetu.univ-st-etienne.fr` |
| Identifiant | `nl06706y` |
| Mot de passe | *(ton mot de passe université)* |
| Port | `22` |

> Si l'hôte SFTP exact diffère, demande-le au prof (parfois
> `ssh.univ-st-etienne.fr` ou un serveur dédié).

Une fois connecté, **dépose tout le contenu de `projets/devweb/`** dans
ton dossier web (souvent `www/`, `public_html/` ou `htdocs/` — selon ce
qu'indique le prof). Tu dois retrouver sur webetu :

```
ton_dossier_web/
├── db.sql
├── includes/
│   ├── database.php      ← avec TES identifiants (voir étape 4)
│   ├── auth.php
│   └── navbar.php
└── public/               ← c'est CE dossier que le navigateur ouvrira
    ├── index.php ...
```

---

## Étape 3 — Créer la base via phpMyAdmin de l'université

1. Ouvre le **phpMyAdmin de l'école** (URL donnée par le prof, souvent
   `https://webetu.univ-st-etienne.fr/phpmyadmin` ou similaire).
2. Connecte-toi : identifiant `nl06706y` + ton mot de passe.
3. La base `nl06706y` existe sûrement déjà → clique dessus à gauche.
4. Onglet **Importer** → *Parcourir* → choisis `db.sql` → **Exécuter**.

> ⚠️ Si erreur « base déjà existante » : ouvre `db.sql`, supprime les
> 2 premières lignes `CREATE DATABASE...` et `USE...`, ré-importe.

---

## Étape 4 — Vérifier `includes/database.php`

Ce fichier (sur ton PC, déjà configuré) doit contenir :

```php
$host   = "localhost";        // MySQL est local sur webetu
$port   = 3306;
$dbname = "nl06706y";
$user   = "nl06706y";
$pass   = 'ton_mot_de_passe'; // ← ton mdp MySQL université
```

Envoie ce fichier par SFTP comme les autres (étape 2). Il n'est **pas**
sur GitHub (sécurité), c'est normal — il vient de ton PC.

> Si « localhost » donne une erreur de connexion une fois en ligne,
> demande au prof l'hôte MySQL exact (parfois `dbetu.univ-st-etienne.fr`).

---

## Étape 5 — Ouvrir le site

Dans Firefox (avec le proxy de l'étape 1 activé) :

```
https://webetu.univ-st-etienne.fr/~nl06706y/public/
```

> L'URL exacte dépend de la config webetu (le `~login` et le `/public/`
> peuvent varier). Demande au prof l'URL de base de ton espace web.

---

## ✅ Checklist rapide

- [ ] Proxy Firefox configuré (cache.univ-st-etienne.fr:3128)
- [ ] Code envoyé sur webetu par FileZilla (SFTP)
- [ ] `db.sql` importé via phpMyAdmin
- [ ] `includes/database.php` envoyé avec les bons identifiants
- [ ] Site ouvert dans Firefox → inscription / connexion fonctionne

---

## 🆘 Si ça ne marche pas

| Symptôme | Cause probable | Solution |
|---|---|---|
| Page blanche / erreur 500 | PHP : voir les logs ou activer `display_errors` | déjà activé dans le code |
| « Erreur de connexion à la base » | mauvais `$host` ou identifiants | vérifier `database.php`, demander l'hôte au prof |
| Site inaccessible depuis chez toi | proxy Firefox non configuré | refaire étape 1 |
| CSS/JS absents | chemins `/assets/...` | vérifier que `public/` est bien la racine web |
| « base déjà existante » | base `nl06706y` pré-créée | retirer `CREATE DATABASE`/`USE` de db.sql |
