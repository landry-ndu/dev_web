<?php
/* ============================================================
   register_action.php – Inscription (POST)
   Reprend la méthode du binôme : MySQL + password_hash + PDO
   préparé. Réponse JSON pour la modale.
   ============================================================ */

require_once __DIR__ . "/../../includes/auth.php";
require_once __DIR__ . "/../../includes/database.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    jsonResponse(['ok' => false, 'error' => 'Méthode invalide'], 405);
}

$username = trim($_POST['username'] ?? '');
$email    = trim($_POST['email'] ?? '');
$password = (string)($_POST['password'] ?? '');
$role     = $_POST['role'] ?? 'user';

/* Seuls 'user' et 'journalist' sont choisissables à l'inscription.
   'admin' se définit uniquement en base. */
if (!in_array($role, ['user', 'journalist'], true)) {
    $role = 'user';
}

if ($username === '' || $email === '' || $password === '') {
    jsonResponse(['ok' => false, 'error' => 'Tous les champs sont requis.']);
}
if (strlen($password) < 6) {
    jsonResponse(['ok' => false, 'error' => 'Mot de passe : 6 caractères minimum.']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['ok' => false, 'error' => 'Email invalide.']);
}

/* Unicité username/email */
$st = $pdo->prepare("SELECT id FROM users WHERE email = :e OR username = :u");
$st->execute(['e' => $email, 'u' => $username]);
if ($st->fetch()) {
    jsonResponse(['ok' => false, 'error' => 'Pseudo ou email déjà utilisé.']);
}

/* Hash sécurisé (bcrypt) */
$hash = password_hash($password, PASSWORD_DEFAULT);

$pdo->prepare(
    "INSERT INTO users (username, email, password, role)
     VALUES (:u, :e, :p, :r)"
)->execute([
    'u' => $username,
    'e' => $email,
    'p' => $hash,
    'r' => $role,
]);

$userId = (int)$pdo->lastInsertId();

/* Profil vide associé */
$pdo->prepare(
    "INSERT INTO profiles (user_id, bio, photo, visibility)
     VALUES (:id, '', '', 'public')"
)->execute(['id' => $userId]);

/* Connexion automatique */
$_SESSION['user_id'] = $userId;
$_SESSION['user']    = $username;
$_SESSION['role']    = $role;

jsonResponse(['ok' => true, 'user' => [
    'id' => $userId, 'username' => $username, 'role' => $role
]]);
