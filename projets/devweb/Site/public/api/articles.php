<?php
/* ============================================================
   /api/articles.php – Articles communautaires (journalistes)
   GET                          → tous les articles + likes/comments
   POST action=create  title,category,content   (journaliste/admin)
   POST action=delete  id                       (auteur ou admin)
   POST action=like    id
   POST action=comment id, text
   ============================================================ */

require_once __DIR__ . "/../../includes/auth.php";
require_once __DIR__ . "/../../includes/database.php";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireApiLogin();
    $me     = currentUser();
    $action = $_POST['action'] ?? '';

    if ($action === 'create') {
        if (!isJournalist()) jsonResponse(['ok'=>false,'error'=>'Réservé aux journalistes'], 403);
        $title = trim($_POST['title'] ?? '');
        $cat   = trim($_POST['category'] ?? 'News');
        $body  = trim($_POST['content'] ?? '');
        if ($title === '' || $body === '') jsonResponse(['ok'=>false,'error'=>'Titre et contenu requis']);
        $pdo->prepare(
            "INSERT INTO articles (author_id,title,category,content) VALUES (:a,:t,:c,:b)"
        )->execute(['a'=>$me['id'],'t'=>$title,'c'=>$cat,'b'=>$body]);
        jsonResponse(['ok'=>true]);
    }

    if ($action === 'delete') {
        $id = (int)($_POST['id'] ?? 0);
        $st = $pdo->prepare("SELECT author_id FROM articles WHERE id=:i");
        $st->execute(['i'=>$id]);
        $art = $st->fetch();
        if (!$art) jsonResponse(['ok'=>false,'error'=>'Introuvable'], 404);
        if ((int)$art['author_id'] !== $me['id'] && !isAdmin()) {
            jsonResponse(['ok'=>false,'error'=>'Non autorisé'], 403);
        }
        $pdo->prepare("DELETE FROM articles WHERE id=:i")->execute(['i'=>$id]);
        jsonResponse(['ok'=>true]);
    }

    if ($action === 'like') {
        $id = (int)($_POST['id'] ?? 0);
        $st = $pdo->prepare("SELECT id FROM article_likes WHERE article_id=:a AND user_id=:u");
        $st->execute(['a'=>$id,'u'=>$me['id']]);
        if ($st->fetch()) {
            $pdo->prepare("DELETE FROM article_likes WHERE article_id=:a AND user_id=:u")
                ->execute(['a'=>$id,'u'=>$me['id']]);
            jsonResponse(['ok'=>true,'liked'=>false]);
        }
        $pdo->prepare("INSERT INTO article_likes (article_id,user_id) VALUES (:a,:u)")
            ->execute(['a'=>$id,'u'=>$me['id']]);
        jsonResponse(['ok'=>true,'liked'=>true]);
    }

    if ($action === 'comment') {
        $id   = (int)($_POST['id'] ?? 0);
        $text = trim($_POST['text'] ?? '');
        if ($text === '') jsonResponse(['ok'=>false,'error'=>'Commentaire vide']);
        $pdo->prepare("INSERT INTO article_comments (article_id,user_id,content) VALUES (:a,:u,:c)")
            ->execute(['a'=>$id,'u'=>$me['id'],'c'=>$text]);
        jsonResponse(['ok'=>true]);
    }

    jsonResponse(['ok'=>false,'error'=>'Action inconnue'], 400);
}

/* ---- GET : liste complète ---- */
$me = currentUser();
$myId = $me['id'] ?? 0;

$st = $pdo->query(
    "SELECT a.id, a.title, a.category, a.content, a.created_at,
            u.username AS author,
            (SELECT COUNT(*) FROM article_likes l WHERE l.article_id=a.id) AS likes,
            (SELECT COUNT(*) FROM article_comments c WHERE c.article_id=a.id) AS nb_comments
     FROM articles a JOIN users u ON u.id = a.author_id
     ORDER BY a.created_at DESC"
);
$articles = [];
foreach ($st->fetchAll() as $a) {
    /* Ai-je liké ? */
    $liked = false;
    if ($myId) {
        $q = $pdo->prepare("SELECT 1 FROM article_likes WHERE article_id=:a AND user_id=:u");
        $q->execute(['a'=>$a['id'],'u'=>$myId]);
        $liked = (bool)$q->fetch();
    }
    /* Commentaires */
    $cq = $pdo->prepare(
        "SELECT u.username author, c.content FROM article_comments c
         JOIN users u ON u.id=c.user_id WHERE c.article_id=:a ORDER BY c.created_at ASC"
    );
    $cq->execute(['a'=>$a['id']]);

    $articles[] = [
        'id'       => (int)$a['id'],
        'title'    => $a['title'],
        'category' => $a['category'],
        'content'  => $a['content'],
        'excerpt'  => mb_substr(strip_tags($a['content']), 0, 160),
        'author'   => $a['author'],
        'date'     => substr($a['created_at'], 0, 10),
        'likes'    => (int)$a['likes'],
        'liked'    => $liked,
        'comments' => $cq->fetchAll(),
    ];
}
jsonResponse(['ok'=>true,'articles'=>$articles]);
