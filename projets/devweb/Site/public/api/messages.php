<?php
/* ============================================================
   /api/messages.php
   GET  ?action=conversations          → liste des discussions
   GET  ?action=thread&with=pseudo     → messages avec qqn (+ marque lus)
   GET  ?action=unread                 → nb total non lus
   POST to=pseudo  text=...            → envoie un message
   ============================================================ */

require_once __DIR__ . "/../../includes/auth.php";
require_once __DIR__ . "/../../includes/database.php";

requireApiLogin();
$me = currentUser();

/* ---------- POST : envoi ---------- */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $to   = trim($_POST['to'] ?? '');
    $text = trim($_POST['text'] ?? '');
    if ($text === '') jsonResponse(['ok'=>false,'error'=>'Message vide']);

    $tid = userIdByUsername($pdo, $to);
    if (!$tid || $tid === $me['id']) jsonResponse(['ok'=>false,'error'=>'Destinataire invalide']);

    $pdo->prepare(
        "INSERT INTO messages (from_user_id,to_user_id,content) VALUES (:f,:t,:c)"
    )->execute(['f'=>$me['id'],'t'=>$tid,'c'=>$text]);

    jsonResponse(['ok'=>true]);
}

/* ---------- GET ---------- */
$action = $_GET['action'] ?? 'conversations';

if ($action === 'unread') {
    $st = $pdo->prepare("SELECT COUNT(*) c FROM messages WHERE to_user_id=:me AND is_read=0");
    $st->execute(['me'=>$me['id']]);
    jsonResponse(['ok'=>true,'unread'=>(int)$st->fetch()['c']]);
}

if ($action === 'thread') {
    $with = trim($_GET['with'] ?? '');
    $oid  = userIdByUsername($pdo, $with);
    if (!$oid) jsonResponse(['ok'=>false,'error'=>'Utilisateur introuvable'], 404);

    $st = $pdo->prepare(
        "SELECT m.content, m.created_at, m.is_read,
                uf.username AS from_user
         FROM messages m
         JOIN users uf ON uf.id = m.from_user_id
         WHERE (m.from_user_id=:me AND m.to_user_id=:o)
            OR (m.from_user_id=:o AND m.to_user_id=:me)
         ORDER BY m.created_at ASC"
    );
    $st->execute(['me'=>$me['id'],'o'=>$oid]);
    $msgs = array_map(function($m) use ($me) {
        return [
            'from' => $m['from_user'],
            'mine' => $m['from_user'] === $me['username'],
            'text' => $m['content'],
            'date' => $m['created_at'],
        ];
    }, $st->fetchAll());

    /* Marque comme lus les messages reçus */
    $pdo->prepare("UPDATE messages SET is_read=1 WHERE to_user_id=:me AND from_user_id=:o AND is_read=0")
        ->execute(['me'=>$me['id'],'o'=>$oid]);

    jsonResponse(['ok'=>true,'messages'=>$msgs,'with'=>$with]);
}

/* action = conversations */
$st = $pdo->prepare(
    "SELECT
        other.username AS other,
        m.content      AS last_text,
        m.created_at   AS last_date,
        m.from_user_id AS last_from,
        (SELECT COUNT(*) FROM messages mm
           WHERE mm.to_user_id = :me
             AND mm.from_user_id = other.id
             AND mm.is_read = 0) AS unread
     FROM messages m
     JOIN users other ON other.id =
        IF(m.from_user_id = :me, m.to_user_id, m.from_user_id)
     WHERE m.id IN (
        SELECT MAX(id) FROM messages
        WHERE from_user_id = :me OR to_user_id = :me
        GROUP BY LEAST(from_user_id,to_user_id), GREATEST(from_user_id,to_user_id)
     )
     ORDER BY m.created_at DESC"
);
$st->execute(['me'=>$me['id']]);

$convos = array_map(function($r) use ($me) {
    return [
        'user'   => $r['other'],
        'last'   => $r['last_text'],
        'date'   => $r['last_date'],
        'mine'   => (int)$r['last_from'] === $me['id'],
        'unread' => (int)$r['unread'],
    ];
}, $st->fetchAll());

jsonResponse(['ok'=>true,'conversations'=>$convos]);
