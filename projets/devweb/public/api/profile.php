<?php
/* ============================================================
   /api/profile.php
   GET  ?user=pseudo            → profil + stats
   POST (bio, photo, visibility) → met à jour SON profil
   ============================================================ */

require_once __DIR__ . "/../../includes/auth.php";
require_once __DIR__ . "/../../includes/database.php";

$me = currentUser();

/* ---- POST : mise à jour de son profil ---- */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireApiLogin();

    $bio        = trim($_POST['bio'] ?? '');
    $photo      = trim($_POST['photo'] ?? '');
    $visibility = $_POST['visibility'] === 'private' ? 'private' : 'public';

    $pdo->prepare(
        "INSERT INTO profiles (user_id, bio, photo, visibility)
         VALUES (:id, :b, :p, :v)
         ON DUPLICATE KEY UPDATE bio = :b, photo = :p, visibility = :v"
    )->execute([
        'id' => $me['id'], 'b' => $bio, 'p' => $photo, 'v' => $visibility
    ]);

    jsonResponse(['ok' => true]);
}

/* ---- GET : profil d'un utilisateur ---- */
$username = $_GET['user'] ?? ($me['username'] ?? null);
if (!$username) {
    jsonResponse(['ok' => false, 'error' => 'Aucun utilisateur'], 400);
}

$st = $pdo->prepare(
    "SELECT u.id, u.username, u.role, u.created_at,
            p.bio, p.photo, p.visibility
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE u.username = :u"
);
$st->execute(['u' => $username]);
$user = $st->fetch();

if (!$user) {
    jsonResponse(['ok' => false, 'error' => 'Utilisateur introuvable'], 404);
}

$uid = (int)$user['id'];

/* Permission de voir la liste : public OU soi-même OU ami */
$canSee = ($user['visibility'] ?? 'public') === 'public';
if (!$canSee && $me) {
    if ($me['id'] === $uid) {
        $canSee = true;
    } else {
        $st = $pdo->prepare(
            "SELECT 1 FROM friends
             WHERE (user_a_id = :a AND user_b_id = :b)
                OR (user_a_id = :b AND user_b_id = :a)"
        );
        $st->execute(['a' => $me['id'], 'b' => $uid]);
        $canSee = (bool)$st->fetch();
    }
}

$stats = ['played'=>0,'playing'=>0,'want'=>0,'followed'=>0,'ratings'=>0,'reviews'=>0,'avg'=>null,'friends'=>0];

if ($canSee) {
    /* Compte les jeux par statut */
    $st = $pdo->prepare(
        "SELECT status, COUNT(*) c FROM game_lists WHERE user_id = :id GROUP BY status"
    );
    $st->execute(['id' => $uid]);
    foreach ($st->fetchAll() as $r) {
        if (isset($stats[$r['status']])) $stats[$r['status']] = (int)$r['c'];
    }

    $st = $pdo->prepare("SELECT COUNT(*) c, AVG(value) a FROM ratings WHERE user_id = :id");
    $st->execute(['id' => $uid]);
    $r = $st->fetch();
    $stats['ratings'] = (int)$r['c'];
    $stats['avg']     = $r['a'] !== null ? round((float)$r['a'], 1) : null;

    $st = $pdo->prepare("SELECT COUNT(*) c FROM reviews WHERE user_id = :id");
    $st->execute(['id' => $uid]);
    $stats['reviews'] = (int)$st->fetch()['c'];
}

$st = $pdo->prepare(
    "SELECT COUNT(*) c FROM friends WHERE user_a_id = :id OR user_b_id = :id"
);
$st->execute(['id' => $uid]);
$stats['friends'] = (int)$st->fetch()['c'];

/* Relation entre moi et ce profil */
$relation = 'none';
if ($me && $me['id'] !== $uid) {
    $st = $pdo->prepare(
        "SELECT 1 FROM friends WHERE (user_a_id=:a AND user_b_id=:b) OR (user_a_id=:b AND user_b_id=:a)"
    );
    $st->execute(['a' => $me['id'], 'b' => $uid]);
    if ($st->fetch()) {
        $relation = 'friends';
    } else {
        $st = $pdo->prepare("SELECT 1 FROM friend_requests WHERE from_user_id=:a AND to_user_id=:b");
        $st->execute(['a' => $me['id'], 'b' => $uid]);
        if ($st->fetch()) $relation = 'outgoing';
        else {
            $st = $pdo->prepare("SELECT 1 FROM friend_requests WHERE from_user_id=:b AND to_user_id=:a");
            $st->execute(['a' => $me['id'], 'b' => $uid]);
            if ($st->fetch()) $relation = 'incoming';
        }
    }
}

jsonResponse([
    'ok'       => true,
    'profile'  => [
        'id'         => $uid,
        'username'   => $user['username'],
        'role'       => $user['role'],
        'bio'        => $user['bio'] ?? '',
        'photo'      => $user['photo'] ?? '',
        'visibility' => $user['visibility'] ?? 'public',
        'createdAt'  => $user['created_at'],
    ],
    'canSee'   => $canSee,
    'stats'    => $stats,
    'relation' => $relation,
    'isOwn'    => $me && $me['id'] === $uid,
]);
