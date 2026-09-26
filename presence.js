/* EduDeck presence: shared "active users" list via Firebase Realtime Database.
   Stores { name, game, ts } per session under /presence/<id>, auto-removed on
   disconnect. Any name is accepted; nothing else about the visitor is collected. */
(function () {
  var firebaseConfig = {
    apiKey: "AIzaSyBpagmgKx238oygQbi6RL1t7L0I2Apg5Hs",
    authDomain: "edudeck-1dc1b.firebaseapp.com",
    databaseURL: "https://edudeck-1dc1b-default-rtdb.firebaseio.com",
    projectId: "edudeck-1dc1b",
    storageBucket: "edudeck-1dc1b.firebasestorage.app",
    messagingSenderId: "724706181986",
    appId: "1:724706181986:web:22732d4b2d533b42e2e23b"
  };

  var ACTIVE_MS = 45000;   // treat someone as online if seen in the last 45s
  var BEAT_MS = 15000;     // how often we say "still here"

  if (!window.firebase || !firebase.database) return;
  firebase.initializeApp(firebaseConfig);
  var db = firebase.database();

  var meId, meRef, myName = "", myGame = null;

  // ---- name ----------------------------------------------------------------
  function storedName() {
    try { return localStorage.getItem("edudeck_name") || ""; } catch (e) { return ""; }
  }
  function saveName(n) { try { localStorage.setItem("edudeck_name", n); } catch (e) {} }

  function askName(cb) {
    var wrap = document.createElement("div");
    wrap.style.cssText = "position:fixed;inset:0;z-index:9999;display:flex;align-items:center;" +
      "justify-content:center;background:rgba(0,0,0,.72);backdrop-filter:blur(3px);";
    wrap.innerHTML =
      '<div style="background:#101014;border:1px solid #2a2a33;border-radius:14px;padding:26px 24px;' +
      'width:min(360px,90vw);text-align:center;font-family:inherit;color:#fff">' +
      '<div style="font-size:20px;font-weight:700;margin-bottom:6px">what’s your name?</div>' +
      '<div style="font-size:13px;color:#8b8f9c;margin-bottom:16px">shows you on the online list</div>' +
      '<input id="ed-name" placeholder="type any name" autocomplete="off" maxlength="24" ' +
      'style="width:100%;padding:12px 14px;border-radius:9px;border:1px solid #2a2a33;background:#000;' +
      'color:#fff;font:inherit;text-align:center;margin-bottom:14px">' +
      '<button id="ed-go" style="width:100%;padding:12px;border-radius:9px;border:none;cursor:pointer;' +
      'background:#4ade4a;color:#06210a;font:inherit;font-weight:700;font-size:16px">let’s go</button>' +
      '</div>';
    document.body.appendChild(wrap);
    var input = wrap.querySelector("#ed-name");
    var go = wrap.querySelector("#ed-go");
    input.focus();
    function done() {
      var n = (input.value || "").trim() || "guest";
      document.body.removeChild(wrap);
      saveName(n);
      cb(n);
    }
    go.addEventListener("click", done);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") done(); });
  }

  // ---- presence ------------------------------------------------------------
  function start(name) {
    myName = name;
    meId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    meRef = db.ref("presence/" + meId);
    meRef.onDisconnect().remove();
    write();
    setInterval(write, BEAT_MS);
    window.addEventListener("beforeunload", function () { try { meRef.remove(); } catch (e) {} });

    hookGameClicks();
    listen();
  }

  function write() {
    if (!meRef) return;
    meRef.set({ name: myName, game: myGame, ts: Date.now() });
  }

  function setGame(g) { myGame = g || null; write(); }

  // Cards open in a new tab and this page stays open, so a click tells us what
  // they launched. "request a game" and "movies" are ignored.
  function hookGameClicks() {
    document.addEventListener("click", function (e) {
      var card = e.target.closest ? e.target.closest(".card") : null;
      if (!card) return;
      var nameEl = card.querySelector(".name");
      if (!nameEl) return;
      var g = nameEl.textContent.trim();
      if (g === "request a game" || g === "movies") return;
      setGame(g);
    });
  }

  // ---- widget --------------------------------------------------------------
  var pill, panel, open = false;
  function buildWidget() {
    var header = document.querySelector(".top");
    pill = document.createElement("button");
    pill.id = "ed-presence-pill";
    pill.type = "button";
    var base = "display:inline-flex;align-items:center;gap:8px;padding:8px 13px;border-radius:999px;" +
      "border:1px solid #2a2a33;background:#101014;color:#fff;font:inherit;font-size:13px;" +
      "font-weight:600;cursor:pointer;";
    // In the header, sit inline at the far left; otherwise pin to the corner.
    pill.style.cssText = header
      ? base + "order:-1;margin-right:6px;"
      : base + "position:fixed;top:12px;left:12px;z-index:9000;box-shadow:0 4px 14px rgba(0,0,0,.4);";
    pill.innerHTML = '<span style="width:9px;height:9px;border-radius:50%;background:#4ade4a;' +
      'box-shadow:0 0 8px #4ade4a"></span><span id="ed-count">0 online</span>';

    panel = document.createElement("div");
    panel.style.cssText = "position:fixed;top:60px;left:12px;z-index:9000;width:min(280px,86vw);" +
      "max-height:60vh;overflow:auto;background:#101014;border:1px solid #2a2a33;border-radius:12px;" +
      "padding:8px;display:none;box-shadow:0 8px 24px rgba(0,0,0,.5);font-size:14px";

    pill.addEventListener("click", function () {
      open = !open;
      panel.style.display = open ? "block" : "none";
    });
    if (header) header.insertBefore(pill, header.firstChild);
    else document.body.appendChild(pill);
    document.body.appendChild(panel);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function render(all) {
    var now = Date.now();
    var rows = [];
    for (var k in all) {
      if (!all.hasOwnProperty(k)) continue;
      var u = all[k];
      if (!u || !u.ts || now - u.ts > ACTIVE_MS) continue;
      rows.push(u);
    }
    rows.sort(function (a, b) { return (a.name || "").localeCompare(b.name || ""); });

    document.getElementById("ed-count").textContent =
      rows.length + (rows.length === 1 ? " online" : " online");

    if (!rows.length) {
      panel.innerHTML = '<div style="padding:10px;color:#8b8f9c">nobody online right now</div>';
      return;
    }
    var html = "";
    for (var i = 0; i < rows.length; i++) {
      var mine = rows[i].name === myName;
      var status = rows[i].game
        ? ("playing " + esc(rows[i].game))
        : "browsing";
      html +=
        '<div style="display:flex;align-items:center;gap:9px;padding:8px 9px;border-radius:8px;' +
        (mine ? "background:#16321a;" : "") + '">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:#4ade4a;flex:none"></span>' +
        '<span style="flex:1;min-width:0"><span style="font-weight:600">' + esc(rows[i].name) +
        (mine ? " (you)" : "") + '</span><br><span style="color:#8b8f9c;font-size:12px">' +
        status + '</span></span></div>';
    }
    panel.innerHTML = html;
  }

  function listen() {
    db.ref("presence").on("value", function (snap) { render(snap.val() || {}); });
  }

  // ---- boot ----------------------------------------------------------------
  function boot() {
    buildWidget();
    var n = storedName();
    if (n) start(n); else askName(start);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
