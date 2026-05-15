<?php
/* ============================================================
   auth.php – Gestion de session + rôles
   Rôles : 'user' < 'journalist' < 'admin'
   ============================================================ */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/* L'utilisateur est-il connecté ? */
function isLogged() {
    return isset($_SESSION['user_id']);
}

/* Force la connexion (pour pages protégées non-API) */
function requireLogin() {
    if (!isLogged()) {
        header("Location: /index.php");
        exit();
    }
}

/* Rôle courant ('user' par défaut) */
function currentRole() {
    return $_SESSION['role'] ?? 'user';
}

function isAdmin() {
    return currentRole() === 'admin';
}

/* Un journaliste OU un admin peut publier des articles */
function isJournalist() {
    return in_array(currentRole(), ['journalist', 'admin'], true);
}

/* Infos de l'utilisateur connecté (ou null) */
function currentUser() {
    if (!isLogged()) return null;
    return [
        'id'       => $_SESSION['user_id'],
        'username' => $_SESSION['user'],
        'role'     => $_SESSION['role'] ?? 'user',
    ];
}

/* Helper : renvoie une réponse JSON et stoppe le script.
   Utilisé par tous les endpoints de /api et /actions. */
function jsonResponse($data, int $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

/* Helper : exige une session pour les endpoints API (sinon 401 JSON) */
function requireApiLogin() {
    if (!isLogged()) {
        jsonResponse(['ok' => false, 'error' => 'Non authentifié'], 401);
    }
}

/* Récupère l'id d'un user par son username (ou null) */
function userIdByUsername(PDO $pdo, string $username) {
    $st = $pdo->prepare("SELECT id FROM users WHERE username = :u");
    $st->execute(['u' => $username]);
    $row = $st->fetch();
    return $row ? (int)$row['id'] : null;
}
