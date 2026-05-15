<?php
/* ============================================================
   /api/friends.php
   GET  ?action=list&user=pseudo     → liste d'amis
   GET  ?action=requests             → mes demandes reçues
   GET  ?action=search&q=...         → recherche d'utilisateurs
   POST action=send|accept|refuse|remove  target=pseudo
   ============================================================ */

require_once __DIR__ . "/../../includes/auth.php";
require_once __DIR__ . "/../../includes/database.php";

/* ---------- POST : actions ---------- */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireApiLogin();
    $me     = currentUser();
    $action = $_POST['action'] ?? '';
    $target = trim($_POST['target'] ?? '');
    $tid    = userIdByUsername($pdo, $target);

    if (!$tid)               jsonResponse(['ok'=>false,'error'=>'Utilisateur introuvable']);
    if ($tid === $me['id'])  jsonResponse(['ok'=>false,'error'=>'Action impossible sur soi-même']);

    if ($action === 'send') {
        /* Déjà amis ? */
        $st = $pdo->prepare("SELECT 1 FROM friends WHERE (user_a_id=:a AND user_b_id=:b) OR (user_a_id=:b AND user_b_id=:a)");
        $st->execute(['a'=>$me['id'],'b'=>$tid]);
        if ($st->fetch()) jsonResponse(['ok'=>false,'error'=>'Déjà amis']);

        /* Demande inverse existante → acceptation auto */
        $st = $pdo->prepare("SELECT id FROM friend_requests WHERE from_user_id=:b AND to_user_id=:a");
        $st->execute(['a'=>$me['id'],'b'=>$tid]);
        if ($st->fetch()) {
            $pdo->prepare("DELETE FROM friend_requests WHERE from_user_id=:b AND to_user_id=:a")
                ->execute(['a'=>$me['id'],'b'=>$tid]);
            addFriendPair($pdo, $me['id'], $tid);
            jsonResponse(['ok'=>true,'autoAccepted'=>true]);
        }

        $pdo->prepare("INSERT IGNORE INTO friend_requests (from_user_id,to_user_id) VALUES (:a,:b)")
            ->execute(['a'=>$me['id'],'b'=>$tid]);
        jsonResponse(['ok'=>true]);
    }

    if ($action === 'accept') {
        $st = $pdo->prepare("DELETE FROM friend_requests WHERE from_user_id=:b AND to_user_id=:a");
        $st->execute(['a'=>$me['id'],'b'=>$tid]);
        if ($st->rowCount() === 0) jsonResponse(['ok'=>false,'error'=>'Demande introuvable']);
        addFriendPair($pdo, $me['id'], $tid);
        jsonResponse(['ok'=>true]);
    }

    if ($action === 'refuse') {
        $pdo->prepare("DELETE FROM friend_requests WHERE from_user_id=:b AND to_user_id=:a")
            ->execute(['a'=>$me['id'],'b'=>$tid]);
        jsonResponse(['ok'=>true]);
    }

    if ($action === 'remove') {
        $pdo->prepare("DELETE FROM friends WHERE (user_a_id=:a AND user_b_id=:b) OR (user_a_id=:b AND user_b_id=:a)")
            ->execute(['a'=>$me['id'],'b'=>$tid]);
        jsonResponse(['ok'=>true]);
    }

    jsonResponse(['ok'=>false,'error'=>'Action inconnue'], 400);
}

/* ---------- GET ---------- */
$action = $_GET['action'] ?? 'list';
$me     = currentUser();

if ($action === 'search') {
    requireApiLogin();
    $q = trim($_GET['q'] ?? '');
    if ($q === '') jsonResponse(['ok'=>true,'results'=>[]]);
    $st = $pdo->prepare(
        "SELECT username FROM users
         WHERE username LIKE :q AND id <> :me
         ORDER BY username LIMIT 10"
    );
    $st->execute(['q'=>"%$q%", 'me'=>$me['id']]);
    jsonResponse(['ok'=>true,'results'=>array_column($st->fetchAll(),'username')]);
}

if ($action === 'requests') {
    requireApiLogin();
    $st = $pdo->prepare(
        "SELECT u.username FROM friend_requests fr
         JOIN users u ON u.id = fr.from_user_id
         WHERE fr.to_user_id = :me ORDER BY fr.created_at DESC"
    );
    $st->execute(['me'=>$me['id']]);
    jsonResponse(['ok'=>true,'requests'=>array_column($st->fetchAll(),'username')]);
}

/* action = list */
$username = $_GET['user'] ?? ($me['username'] ?? null);
$uid = $username ? userIdByUsername($pdo, $username) : null;
if (!$uid) jsonResponse(['ok'=>false,'error'=>'Utilisateur introuvable'], 404);

$st = $pdo->prepare(
    "SELECT u.username
     FROM friends f
     JOIN users u ON u.id = IF(f.user_a_id = :id, f.user_b_id, f.user_a_id)
     WHERE f.user_a_id = :id OR f.user_b_id = :id
     ORDER BY u.username"
);
$st->execute(['id'=>$uid]);
jsonResponse(['ok'=>true,'friends'=>array_column($st->fetchAll(),'username')]);


/* ---- util : insère une paire d'amis (ordre normalisé) ---- */
function addFriendPair(PDO $pdo, int $x, int $y) {
    $a = min($x, $y); $b = max($x, $y);
    $pdo->prepare("INSERT IGNORE INTO friends (user_a_id,user_b_id) VALUES (:a,:b)")
        ->execute(['a'=>$a,'b'=>$b]);
}
