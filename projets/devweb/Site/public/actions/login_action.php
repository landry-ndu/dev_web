<?php
/* ============================================================
   login_action.php – Connexion (POST)
   Connexion par pseudo OU email + password_verify (bcrypt).
   ============================================================ */

require_once __DIR__ . "/../../includes/auth.php";
require_once __DIR__ . "/../../includes/database.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    jsonResponse(['ok' => false, 'error' => 'Méthode invalide'], 405);
}

$identifier = trim($_POST['identifier'] ?? $_POST['email'] ?? $_POST['username'] ?? '');
$password   = (string)($_POST['password'] ?? '');

if ($identifier === '' || $password === '') {
    jsonResponse(['ok' => false, 'error' => 'Identifiant et mot de passe requis.']);
}

/* Recherche par email OU username */
$st = $pdo->prepare(
    "SELECT * FROM users WHERE email = :id OR username = :id LIMIT 1"
);
$st->execute(['id' => $identifier]);
$user = $st->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    jsonResponse(['ok' => false, 'error' => 'Identifiant ou mot de passe incorrect.']);
}

$_SESSION['user_id'] = (int)$user['id'];
$_SESSION['user']    = $user['username'];
$_SESSION['role']    = $user['role'];

jsonResponse(['ok' => true, 'user' => [
    'id'       => (int)$user['id'],
    'username' => $user['username'],
    'role'     => $user['role'],
]]);
