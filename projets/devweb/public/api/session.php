<?php
/* GET /api/session.php → utilisateur connecté (ou null) */
require_once __DIR__ . "/../../includes/auth.php";
jsonResponse(['ok' => true, 'user' => currentUser()]);
