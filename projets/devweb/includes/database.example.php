<?php
/*
 * Connexion a la base de donnees MySQL (PDO).
 * Copier ce fichier en database.php et renseigner les
 * parametres du serveur MySQL utilise.
 */

$host   = "localhost";
$port   = 3306;
$dbname = "TON_LOGIN";
$user   = "TON_LOGIN";
$pass   = 'TON_MOT_DE_PASSE';

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => true,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    die("Erreur de connexion a la base : " . $e->getMessage());
}
