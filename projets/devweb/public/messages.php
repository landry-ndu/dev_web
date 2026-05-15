<?php
require_once __DIR__ . "/../includes/auth.php";
requireLogin();
$active = 'messages';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GameBizarre – Messages</title>
  <link rel="stylesheet" href="/assets/css/style.css" />
  <link rel="stylesheet" href="/assets/css/animations.css" />
  <link rel="stylesheet" href="/assets/css/social.css" />
</head>
<body>

  <?php include __DIR__ . "/../includes/navbar.php"; ?>

  <main class="messages-main">
    <aside class="convo-list" id="convoList">
      <div class="convo-header">
        <h2>💬 Discussions</h2>
        <button class="btn-secondary btn-mini" id="newChatBtn">+ Nouveau</button>
      </div>
      <div id="convoSearchBlock" class="hidden">
        <input type="text" id="convoSearch" class="search-input" placeholder="Pseudo de ton ami…" />
        <div id="convoSearchResults"></div>
      </div>
      <div id="convoListItems"></div>
    </aside>

    <section class="convo-active" id="convoActive">
      <div id="convoPlaceholder" class="convo-placeholder">
        Sélectionne une discussion à gauche.
      </div>
      <div id="convoView" class="hidden">
        <header class="convo-active-header">
          <img class="friend-avatar" id="convoOtherAvatar" src="" alt="" />
          <a class="convo-other-name" id="convoOtherName" href="#"></a>
        </header>
        <div class="convo-messages" id="convoMessages"></div>
        <form class="convo-form" id="convoForm">
          <input type="text" id="msgInput" placeholder="Écris ton message…" autocomplete="off" />
          <button type="submit" class="btn-primary">Envoyer</button>
        </form>
      </div>
    </section>
  </main>

  <script src="/assets/js/config.js"></script>
  <script src="/assets/js/data.js"></script>
  <script src="/assets/js/api.js"></script>
  <script src="/assets/js/auth.js"></script>
  <script src="/assets/js/social.js"></script>
  <script src="/assets/js/messages.js"></script>
</body>
</html>
