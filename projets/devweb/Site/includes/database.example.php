<?php
/* ============================================================
   database.php – Connexion PDO à la base MySQL

   ╔══════════════════════════════════════════════════════════╗
   ║  👉 C'EST ICI QUE TU CONNECTES LE SERVEUR DE L'ÉCOLE 👈   ║
   ╠══════════════════════════════════════════════════════════╣
   ║  Remplace les 4 valeurs ci-dessous par celles fournies   ║
   ║  par l'école (proxy / serveur MySQL).                     ║
   ║                                                          ║
   ║  - $host : adresse du serveur MySQL de l'école           ║
   ║           (ex: "mysql.univ.fr" ou "127.0.0.1" via proxy) ║
   ║  - $port : port MySQL (3306 par défaut, parfois autre    ║
   ║           si tunnel/proxy SSH)                            ║
   ║  - $dbname : nom de ta base sur le serveur école         ║
   ║  - $user / $pass : tes identifiants MySQL école          ║
   ╚══════════════════════════════════════════════════════════╝

   💡 Si tu passes par un PROXY SSH (cas fréquent en fac), tu
      ouvres d'abord un tunnel dans un terminal séparé :

        ssh -L 3306:serveur-mysql-ecole:3306 ton_login@proxy.ecole.fr

      puis tu mets ici  $host = "127.0.0.1";  $port = 3306;
   ============================================================ */

/* ---- CONFIG SERVEUR ÉCOLE webetu (Saint-Étienne) ----
   Le code tourne SUR webetu → MySQL est en local ("localhost").
   Si "localhost" ne marche pas, demande au prof l'hôte exact
   (parfois "dbetu.univ-st-etienne.fr" ou un nom interne). */
$host   = "localhost";          // hôte MySQL vu depuis webetu
$port   = 3306;                 // port MySQL standard
$dbname = "TON_LOGIN";           // ta base = ton login
$user   = "TON_LOGIN";           // ton login MySQL université
$pass   = 'TON_MOT_DE_PASSE';     // ton mot de passe MySQL (quotes simples)
/* ----------------------------------------------------- */


try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    /* En prod on n'affiche pas le détail de l'erreur, mais pour
       un projet pédagogique c'est utile pour débugger la connexion. */
    die("Erreur de connexion à la base : " . $e->getMessage());
}
