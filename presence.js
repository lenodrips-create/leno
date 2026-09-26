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

  var ACTIVE_MS = 150000;
  var BEAT_MS = 60000;
  var NAME_MAX = 24;
  var GAME_MAX = 40;
  var MAX_SHOWN = 50;

  var db = null, meId = null, meRef = null, myName = "", myGame = null;
  var serverOffset = 0;
  var latest = {};
  var strip = null;

  function clip(v, max) {
    return String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, max);
  }

  function storedName() {
    try { return clip(localStorage.getItem("edudeck_name"), NAME_MAX); } catch (e) { return ""; }
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
      '<div style="font-size:13px;color:#8b8f9c;margin-bottom:16px">everyone on the site can see this name</div>' +
      '<input id="ed-name" placeholder="type any name" autocomplete="off" maxlength="' + NAME_MAX + '" ' +
      'style="width:100%;padding:12px 14px;border-radius:9px;border:1px solid #2a2a33;background:#000;' +
      'color:#fff;font:inherit;text-align:center;margin-bottom:14px">' +
      '<button id="ed-go" style="width:100%;padding:12px;border-radius:9px;border:none;cursor:pointer;' +
      'background:#4ade4a;color:#06210a;font:inherit;font-weight:700;font-size:16px">let’s go</button>' +
      '</div>';
    document.body.appendChild(wrap);
    var input = wrap.querySelector("#ed-name");
    var go = wrap.querySelector("#ed-go");
    var finished = false;
    input.focus();
    function done() {
      if (finished) return;
      finished = true;
      var n = clip(input.value, NAME_MAX) || "guest";
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      saveName(n);
      cb(n);
    }
    go.addEventListener("click", done);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") done(); });
  }

  function signIn() {
    if (!firebase.auth) return Promise.resolve(null);
    return firebase.auth().signInAnonymously().then(function (cred) {
      return cred && cred.user ? cred.user.uid : null;
    }, function (err) {
      console.warn("[presence] anonymous sign-in unavailable:", err && err.code);
      return null;
    });
  }

  function connect() {
    if (!window.firebase || !firebase.database) {
      setStatus("offline — can’t reach the server");
      console.warn("[presence] Firebase library did not load (network/filter blocked gstatic.com).");
      return;
    }
    try {
      if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(firebaseConfig);
      db = firebase.database();
    } catch (e) {
      setStatus("offline — setup error");
      console.error("[presence] init failed:", e);
      return;
    }
    signIn().then(function (uid) {
      meId = uid || (Math.random().toString(36).slice(2) + Date.now().toString(36));
      meRef = db.ref("presence/" + meId);
      start();
    });
  }

  function start() {
    db.ref(".info/serverTimeOffset").on("value", function (s) {
      var v = Number(s && s.val());
      serverOffset = isFinite(v) ? v : 0;
    });

    db.ref(".info/connected").on("value", function (s) {
      if (!s || s.val() !== true) { setStatus("connecting…"); return; }
      meRef.onDisconnect().remove().then(write, function (err) {
        console.error("[presence] could not arm disconnect cleanup:", err);
        write();
      });
    });

    setInterval(write, BEAT_MS);
    setInterval(render, 30000);
    window.addEventListener("pagehide", function () { try { meRef.remove(); } catch (e) {} });

    db.ref("presence").on("value", function (snap) {
      latest = snap.val() || {};
      render();
    }, function (err) {
      setStatus("offline — database blocked this read");
      console.error("[presence] read denied — check Realtime Database rules:", err);
    });
  }

  function write() {
    if (!meRef) return;
    var entry = { name: myName || "guest", ts: firebase.database.ServerValue.TIMESTAMP };
    if (myGame) entry.game = myGame;
    try { meRef.set(entry).catch(function () {}); } catch (e) {}
  }

  function hookGameClicks() {
    document.addEventListener("click", function (e) {
      var card = e.target.closest ? e.target.closest(".card") : null;
      if (!card) return;
      var nameEl = card.querySelector(".name");
      if (!nameEl) return;
      var g = clip(nameEl.textContent, GAME_MAX);
      if (!g || g === "request a game" || g === "movies") return;
      myGame = g;
      write();
    });
  }

  var RINGS = ["#3ddc84", "#3b9dff", "#a855f7", "#f5a524", "#ec4899", "#22d3ee"];
  var ICON_PERSON = '<svg viewBox="0 0 24 24" width="17" height="17" fill="#fff">' +
    '<circle cx="12" cy="8" r="4"/><path d="M4 20.5C4 16.4 7.6 14 12 14s8 2.4 8 6.5V21H4z"/></svg>';
  var ICON_GAME = '<svg viewBox="0 0 24 24" width="17" height="17" fill="#fff">' +
    '<path d="M6.5 8h11a4.5 4.5 0 0 1 4.4 5.4l-.6 3A2.7 2.7 0 0 1 16.4 17l-1.2-1.6a1.5 1.5 0 0 0-1.2-.6h-4a1.5 1.5 0 0 0-1.2.6L7.6 17a2.7 2.7 0 0 1-4.9-.6l-.6-3A4.5 4.5 0 0 1 6.5 8z"/>' +
    '<rect x="5.2" y="10.3" width="1.4" height="4" rx=".7" fill="#1b1d22"/>' +
    '<rect x="3.9" y="11.6" width="4" height="1.4" rx=".7" fill="#1b1d22"/>' +
    '<circle cx="16" cy="11.4" r="1" fill="#1b1d22"/><circle cx="18" cy="13.4" r="1" fill="#1b1d22"/></svg>';

  function buildWidget() {
    var header = document.querySelector(".top");
    strip = document.createElement("div");
    strip.id = "ed-presence";
    var s = "display:flex;align-items:center;gap:10px;overflow-x:auto;overflow-y:hidden;" +
      "-ms-overflow-style:none;scrollbar-width:none;";
    strip.style.cssText = header
      ? s + "order:-1;margin-right:12px;max-width:min(72vw,860px);"
      : s + "position:fixed;top:10px;left:10px;z-index:9000;max-width:calc(100vw - 20px);";
    var st = document.createElement("style");
    st.textContent = "#ed-presence::-webkit-scrollbar{display:none}";
    document.head.appendChild(st);
    if (header) header.insertBefore(strip, header.firstChild);
    else document.body.appendChild(strip);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function card(ring, icon, title, sub, highlight) {
    return '<div style="display:flex;align-items:center;gap:11px;flex:none;padding:5px 18px 5px 5px;' +
      'border-radius:999px;background:' + (highlight ? "#181c22" : "#141619") + ';' +
      'border:1px solid #23262d">' +
      '<span style="width:38px;height:38px;border-radius:50%;flex:none;display:grid;place-items:center;' +
      'background:#20242b;border:2px solid ' + ring + ';box-shadow:0 0 10px ' + ring + '66">' + icon + '</span>' +
      '<span style="display:flex;flex-direction:column;line-height:1.15;white-space:nowrap">' +
      '<span style="font-weight:700;font-size:15px;color:#fff">' + title + '</span>' +
      '<span style="font-size:12px;color:#8b8f9c">' + sub + '</span></span></div>';
  }

  function setStatus(text) {
    if (!strip) return;
    strip.innerHTML = card("#3ddc84", ICON_PERSON, "—", esc(text || "…"), false);
  }

  function render() {
    if (!strip) return;
    var now = Date.now() + serverOffset;
    var rows = [];
    for (var k in latest) {
      if (!Object.prototype.hasOwnProperty.call(latest, k)) continue;
      var u = latest[k];
      if (!u || typeof u !== "object") continue;
      var ts = Number(u.ts);
      if (!isFinite(ts) || now - ts > ACTIVE_MS || ts - now > ACTIVE_MS) continue;
      rows.push({ name: clip(u.name, NAME_MAX) || "guest", game: clip(u.game, GAME_MAX), mine: k === meId });
    }
    rows.sort(function (a, b) {
      if (a.mine !== b.mine) return a.mine ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    var html = card("#3ddc84", ICON_PERSON, String(rows.length), "online", false);
    var shown = Math.min(rows.length, MAX_SHOWN);
    for (var i = 0; i < shown; i++) {
      var r = rows[i];
      html += card(RINGS[i % RINGS.length], r.game ? ICON_GAME : ICON_PERSON,
        esc(r.name) + (r.mine ? " (you)" : ""), r.game ? "playing " + esc(r.game) : "online", r.mine);
    }
    strip.innerHTML = html;
  }

  function boot() {
    buildWidget();
    setStatus("…");
    hookGameClicks();
    var n = storedName();
    if (n) { myName = n; connect(); }
    else askName(function (name) { myName = name; connect(); });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
