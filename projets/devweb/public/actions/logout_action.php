<?php
/* ============================================================
   logout_action.php – Déconnexion
   ============================================================ */

require_once __DIR__ . "/../../includes/auth.php";

session_destroy();

/* Si appelé en AJAX → JSON, sinon redirection */
if (
    isset($_SERVER['HTTP_X_REQUESTED_WITH']) &&
    strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest'
) {
    header('Content-Type: application/json');
    echo json_encode(['ok' => true]);
    exit();
}

header("Location: /index.php");
exit();
