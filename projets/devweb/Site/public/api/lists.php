<?php
/* ============================================================
   /api/lists.php – Letterbox (joué / en cours / envie / suivi)
   GET  ?user=pseudo            → toutes les listes de l'user
   GET  ?status=played&user=... → une seule liste
   POST status, game_id, game_slug, game_name, op=toggle|set
        op=set + status='' → enlève tous les statuts du jeu
   ============================================================ */

require_once __DIR__ . "/../../includes/auth.php";
require_once __DIR__ . "/../../includes/database.php";

$STATUSES = ['played','playing','want','followed'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireApiLogin();
    $me      = currentUser();
    $status  = $_POST['status'] ?? '';
    $gameId  = (int)($_POST['game_id'] ?? 0);
    $slug    = trim($_POST['game_slug'] ?? '');
    $name    = trim($_POST['game_name'] ?? '');
    $op      = $_POST['op'] ?? 'toggle';

    if (!$gameId) jsonResponse(['ok'=>false,'error'=>'game_id manquant']);

    /* op=set : exclut played/playing/want puis applique le nouveau
       (followed est indépendant et géré via op=toggle) */
    if ($op === 'set') {
        $pdo->prepare(
            "DELETE FROM game_lists
             WHERE user_id=:u AND game_id=:g AND status IN ('played','playing','want')"
        )->execute(['u'=>$me['id'],'g'=>$gameId]);

        if (in_array($status, ['played','playing','want'], true)) {
            $pdo->prepare(
                "INSERT IGNORE INTO game_lists (user_id,game_id,game_slug,game_name,status)
                 VALUES (:u,:g,:s,:n,:st)"
            )->execute(['u'=>$me['id'],'g'=>$gameId,'s'=>$slug,'n'=>$name,'st'=>$status]);
        }
        jsonResponse(['ok'=>true]);
    }

    /* op=toggle */
    if (!in_array($status, $STATUSES, true)) {
        jsonResponse(['ok'=>false,'error'=>'Statut invalide']);
    }
    $st = $pdo->prepare(
        "SELECT id FROM game_lists WHERE user_id=:u AND game_id=:g AND status=:s"
    );
    $st->execute(['u'=>$me['id'],'g'=>$gameId,'s'=>$status]);
    if ($st->fetch()) {
        $pdo->prepare("DELETE FROM game_lists WHERE user_id=:u AND game_id=:g AND status=:s")
            ->execute(['u'=>$me['id'],'g'=>$gameId,'s'=>$status]);
        jsonResponse(['ok'=>true,'added'=>false]);
    }
    $pdo->prepare(
        "INSERT INTO game_lists (user_id,game_id,game_slug,game_name,status)
         VALUES (:u,:g,:sl,:n,:s)"
    )->execute(['u'=>$me['id'],'g'=>$gameId,'sl'=>$slug,'n'=>$name,'s'=>$status]);
    jsonResponse(['ok'=>true,'added'=>true]);
}

/* ---- GET ---- */
$me   = currentUser();
$user = $_GET['user'] ?? ($me['username'] ?? null);
$uid  = $user ? userIdByUsername($pdo, $user) : null;
if (!$uid) jsonResponse(['ok'=>false,'error'=>'Utilisateur introuvable'], 404);

$onlyStatus = $_GET['status'] ?? null;
$sql = "SELECT game_id, game_slug, game_name, status FROM game_lists WHERE user_id=:u";
$params = ['u'=>$uid];
if ($onlyStatus && in_array($onlyStatus, $STATUSES, true)) {
    $sql .= " AND status=:s"; $params['s'] = $onlyStatus;
}
$sql .= " ORDER BY created_at DESC";
$st = $pdo->prepare($sql);
$st->execute($params);

$lists = ['played'=>[],'playing'=>[],'want'=>[],'followed'=>[]];
foreach ($st->fetchAll() as $r) {
    $lists[$r['status']][] = [
        'id'   => (int)$r['game_id'],
        'slug' => $r['game_slug'],
        'name' => $r['game_name'],
    ];
}
jsonResponse(['ok'=>true,'lists'=>$lists]);
