<?php
/* ============================================================
   /api/reviews.php
   GET  ?game_id=123          → avis + note moyenne + ma note
   POST game_id, rating, text → publie/maj mon avis + ma note
   ============================================================ */

require_once __DIR__ . "/../../includes/auth.php";
require_once __DIR__ . "/../../includes/database.php";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireApiLogin();
    $me     = currentUser();
    $gameId = (int)($_POST['game_id'] ?? 0);
    $rating = (int)($_POST['rating'] ?? 0);
    $text   = trim($_POST['text'] ?? '');

    if (!$gameId || $rating < 1 || $rating > 5) {
        jsonResponse(['ok'=>false,'error'=>'Note (1-5) requise']);
    }

    /* Note */
    $pdo->prepare(
        "INSERT INTO ratings (user_id,game_id,value) VALUES (:u,:g,:v)
         ON DUPLICATE KEY UPDATE value=:v"
    )->execute(['u'=>$me['id'],'g'=>$gameId,'v'=>$rating]);

    /* Avis (si texte fourni) */
    if ($text !== '') {
        $pdo->prepare(
            "INSERT INTO reviews (user_id,game_id,rating,content) VALUES (:u,:g,:r,:c)
             ON DUPLICATE KEY UPDATE rating=:r, content=:c"
        )->execute(['u'=>$me['id'],'g'=>$gameId,'r'=>$rating,'c'=>$text]);
    }
    jsonResponse(['ok'=>true]);
}

/* ---- GET ?user=pseudo : tous les avis d'un utilisateur ---- */
if (isset($_GET['user'])) {
    $uid = userIdByUsername($pdo, $_GET['user']);
    if (!$uid) jsonResponse(['ok'=>false,'error'=>'Utilisateur introuvable'], 404);
    $st = $pdo->prepare(
        "SELECT game_id, rating, content, created_at
         FROM reviews WHERE user_id = :u ORDER BY created_at DESC"
    );
    $st->execute(['u'=>$uid]);
    jsonResponse(['ok'=>true,'reviews'=>array_map(fn($r)=>[
        'gameId'=>(int)$r['game_id'],
        'rating'=>(int)$r['rating'],
        'text'=>$r['content'],
        'date'=>$r['created_at'],
    ], $st->fetchAll())]);
}

/* ---- GET ---- */
$gameId = (int)($_GET['game_id'] ?? 0);
if (!$gameId) jsonResponse(['ok'=>false,'error'=>'game_id manquant'], 400);

$st = $pdo->prepare(
    "SELECT r.rating, r.content, r.created_at, u.username
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.game_id = :g ORDER BY r.created_at DESC"
);
$st->execute(['g'=>$gameId]);
$reviews = array_map(fn($r) => [
    'author' => $r['username'],
    'rating' => (int)$r['rating'],
    'text'   => $r['content'],
    'date'   => $r['created_at'],
], $st->fetchAll());

$st = $pdo->prepare("SELECT COUNT(*) c, AVG(value) a FROM ratings WHERE game_id=:g");
$st->execute(['g'=>$gameId]);
$agg = $st->fetch();

$myRating = 0;
$me = currentUser();
if ($me) {
    $st = $pdo->prepare("SELECT value FROM ratings WHERE user_id=:u AND game_id=:g");
    $st->execute(['u'=>$me['id'],'g'=>$gameId]);
    $row = $st->fetch();
    $myRating = $row ? (int)$row['value'] : 0;
}

jsonResponse([
    'ok'        => true,
    'reviews'   => $reviews,
    'avg'       => $agg['a'] !== null ? round((float)$agg['a'],1) : null,
    'count'     => (int)$agg['c'],
    'myRating'  => $myRating,
]);
