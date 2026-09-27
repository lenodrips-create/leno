/* EduDeck presence: shared "active users" list via Firebase Realtime Database.
   Stores { name, game, ts } per session under /presence/<id>, auto-removed on
   disconnect. Any name is accepted; nothing else about the visitor is collected.
   The widget always renders (even if Firebase is blocked) and shows its status. */
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

  var db = null, meId, meRef, myName = "", myGame = null, myDev = false;
  var connected = false;

  // ---- name ----------------------------------------------------------------
  function storedName() {
    try { return localStorage.getItem("edudeck_name") || ""; } catch (e) { return ""; }
  }
  function saveName(n) { try { localStorage.setItem("edudeck_name", n); } catch (e) {} }

  // secret dev alias: entering DEV_CODE (or a close typo of it) becomes "Lennon"
  var DEV_CODE = "Hornets10$", DEV_NAME = "Lennon";
  function storedDev() { try { return localStorage.getItem("edudeck_dev") === "1"; } catch (e) { return false; } }
  function saveDev(on) { try { localStorage.setItem("edudeck_dev", on ? "1" : "0"); } catch (e) {} }
  // typo-tolerant match: fold case/spacing/leet ($->s, 0->o, 1->i) both sides
  function isDevCode(x) { return !!x && normName(x) === normName(DEV_CODE); }

  // ---- name filter (shared, see namefilter.js) ----------------------------
  var NF = window.EduNameFilter;
  function normName(s) { return NF.normName(s); }
  function isBanned(name) { return NF.isBanned(name); }

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
      'color:#fff;font:inherit;text-align:center;margin-bottom:8px">' +
      '<div id="ed-err" style="display:none;color:#ff6161;font-size:13px;margin-bottom:10px">' +
      'that name isn’t allowed — pick another</div>' +
      '<button id="ed-go" style="width:100%;padding:12px;border-radius:9px;border:none;cursor:pointer;' +
      'background:#4ade4a;color:#06210a;font:inherit;font-weight:700;font-size:16px;margin-top:6px">let’s go</button>' +
      '</div>';
    document.body.appendChild(wrap);
    var input = wrap.querySelector("#ed-name");
    var go = wrap.querySelector("#ed-go");
    var err = wrap.querySelector("#ed-err");
    input.focus();
    function done() {
      var raw = (input.value || "").trim();
      if (isDevCode(raw)) {       // secret dev alias (typo-tolerant)
        document.body.removeChild(wrap);
        myDev = true; saveDev(true); saveName(DEV_NAME);
        cb(DEV_NAME);
        return;
      }
      var n = raw || "guest";
      if (isBanned(n)) {          // reject and let them try again
        err.style.display = "block";
        input.value = "";
        input.focus();
        return;
      }
      document.body.removeChild(wrap);
      myDev = false; saveDev(false); saveName(n);
      cb(n);
    }
    go.addEventListener("click", done);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") done(); });
  }

  // ---- firebase ------------------------------------------------------------
  function connect() {
    if (myDev) buildDevControls();   // show the pause button as soon as we know we're dev
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

    meId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    meRef = db.ref("presence/" + meId);
    meRef.onDisconnect().remove();

    db.ref(".info/connected").on("value", function (s) {
      connected = !!(s && s.val());
      if (connected) { write(); } else { setStatus("connecting…"); }
    });

    write();
    setInterval(write, BEAT_MS);
    window.addEventListener("beforeunload", function () { try { meRef.remove(); } catch (e) {} });

    db.ref("presence").on("value", function (snap) { render(snap.val() || {}); },
      function (err) {
        setStatus("offline — database blocked this read");
        console.error("[presence] read denied — check Realtime Database rules:", err);
      });

    // site pause: dev gets a toggle, everyone else gets the "be right back" screen
    db.ref("site/paused").on("value", function (s) {
      sitePaused = !!(s && s.val());
      applyPause();
      updateDevBtn();
    });
  }

  // ---- site pause ----------------------------------------------------------
  var sitePaused = false, devBtn = null, maintEl = null;

  function buildDevControls() {
    if (devBtn) return;
    devBtn = document.createElement("button");
    devBtn.type = "button";
    devBtn.style.cssText = "display:inline-flex;align-items:center;gap:7px;padding:8px 13px;" +
      "border-radius:999px;border:1px solid #3a2a2a;background:#1a1214;color:#ff8a8a;" +
      "font:inherit;font-size:13px;font-weight:700;cursor:pointer;margin-right:8px;order:-2;flex:none";
    devBtn.addEventListener("click", function () {
      if (!db) return;
      db.ref("site/paused").set(!sitePaused);
    });
    var header = document.querySelector(".top");
    if (header) header.insertBefore(devBtn, header.firstChild);
    else { devBtn.style.position = "fixed"; devBtn.style.top = "54px"; devBtn.style.left = "12px"; devBtn.style.zIndex = "9000"; document.body.appendChild(devBtn); }
    updateDevBtn();
  }
  function updateDevBtn() {
    if (!devBtn) return;
    devBtn.textContent = sitePaused ? "▶ unpause site" : "⏸ pause site";
  }

  function applyPause() {
    if (sitePaused && !myDev) {
      if (maintEl) return;
      maintEl = document.createElement("div");
      maintEl.style.cssText = "position:fixed;inset:0;z-index:2147483646;background:#0a0a0c;" +
        "display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;" +
        "color:#fff;font-family:inherit;padding:24px";
      maintEl.innerHTML =
        '<div style="font-size:64px;margin-bottom:14px">👀</div>' +
        '<div style="font-size:34px;font-weight:800">pay attention to the teacher</div>';
      document.body.appendChild(maintEl);
    } else if (maintEl) {
      maintEl.parentNode.removeChild(maintEl);
      maintEl = null;
    }
  }

  function write() {
    if (!meRef) return;
    try { meRef.set({ name: myName, game: myGame, ts: Date.now(), dev: myDev }); } catch (e) {}
  }
  function setGame(g) { myGame = g || null; write(); }

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

  // ---- widget: glowing ring cards -----------------------------------------
  var RINGS = ["#3ddc84", "#3b9dff", "#a855f7", "#f5a524", "#ec4899", "#22d3ee"];
  var ICON_PERSON = '<svg viewBox="0 0 24 24" width="17" height="17" fill="#fff">' +
    '<circle cx="12" cy="8" r="4"/><path d="M4 20.5C4 16.4 7.6 14 12 14s8 2.4 8 6.5V21H4z"/></svg>';
  var ICON_GAME = '<svg viewBox="0 0 24 24" width="17" height="17" fill="#fff">' +
    '<path d="M6.5 8h11a4.5 4.5 0 0 1 4.4 5.4l-.6 3A2.7 2.7 0 0 1 16.4 17l-1.2-1.6a1.5 1.5 0 0 0-1.2-.6h-4a1.5 1.5 0 0 0-1.2.6L7.6 17a2.7 2.7 0 0 1-4.9-.6l-.6-3A4.5 4.5 0 0 1 6.5 8z"/>' +
    '<rect x="5.2" y="10.3" width="1.4" height="4" rx=".7" fill="#1b1d22"/>' +
    '<rect x="3.9" y="11.6" width="4" height="1.4" rx=".7" fill="#1b1d22"/>' +
    '<circle cx="16" cy="11.4" r="1" fill="#1b1d22"/><circle cx="18" cy="13.4" r="1" fill="#1b1d22"/></svg>';

  var strip;
  function buildWidget() {
    var header = document.querySelector(".top");
    strip = document.createElement("div");
    strip.id = "ed-presence";
    var s = "display:flex;align-items:center;gap:10px;overflow-x:auto;overflow-y:hidden;" +
      "-ms-overflow-style:none;scrollbar-width:none;";
    strip.style.cssText = header
      ? s + "order:-1;margin-right:12px;max-width:min(72vw,860px);"
      : s + "position:fixed;top:10px;left:10px;z-index:9000;max-width:calc(100vw - 20px);";
    // hide the scrollbar (webkit)
    var st = document.createElement("style");
    st.textContent = "#ed-presence::-webkit-scrollbar{display:none}";
    document.head.appendChild(st);
    if (header) header.insertBefore(strip, header.firstChild);
    else document.body.appendChild(strip);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // one rounded card: colored glowing ring avatar + two lines of text
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
    strip.innerHTML = card("#3ddc84", ICON_PERSON, "—", text || "…", false);
  }

  function render(all) {
    var now = Date.now();
    var rows = [];
    for (var k in all) {
      if (!all.hasOwnProperty(k)) continue;
      var u = all[k];
      if (!u) continue;
      // purge anyone who slipped in with a banned name
      if (isBanned(u.name)) { try { if (db) db.ref("presence/" + k).remove(); } catch (e) {} continue; }
      if (!u.ts || now - u.ts > ACTIVE_MS) continue;
      rows.push(u);
    }
    // the dev is pinned first for everyone, then you, then A-Z
    function isPinned(u) { return !!u.dev && u.name === DEV_NAME; }
    rows.sort(function (a, b) {
      if (isPinned(a) !== isPinned(b)) return isPinned(a) ? -1 : 1;
      if (a.name === myName) return -1;
      if (b.name === myName) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });

    // leading count card, with the pinned dev card beside it; both stay put
    // while the rest of the list scrolls under them
    var html = '<div style="position:sticky;left:0;z-index:1;display:flex;gap:10px;flex:none">' +
      card("#3ddc84", ICON_PERSON, String(rows.length), "online", false);
    var pinnedOpen = true;

    // one card per active user
    for (var i = 0; i < rows.length; i++) {
      var u = rows[i];
      var pin = isPinned(u);
      if (!pin && pinnedOpen) { html += "</div>"; pinnedOpen = false; }
      var mine = u.name === myName && !!u.dev === myDev;
      var ring = RINGS[i % RINGS.length];
      var playing = !!u.game;
      var badge = u.dev ? ' <span style="background:linear-gradient(90deg,#ff004c,#ff8a00,#ffe600,#00c853,#00b0ff,#7c4dff,#ff00c8);-webkit-background-clip:text;background-clip:text;color:transparent;font-weight:800">{dev}</span>' : "";
      var title = (pin ? "\uD83D\uDCCC " : "") + esc(u.name) + badge + (mine ? " (you)" : "");
      var sub = playing ? ("playing " + esc(u.game)) : "online";
      html += card(ring, playing ? ICON_GAME : ICON_PERSON, title, sub, mine || pin);
    }
    if (pinnedOpen) html += "</div>";
    strip.innerHTML = html;
  }

  // ---- boot ----------------------------------------------------------------
  function boot() {
    buildWidget();               // widget always appears
    setStatus("…");
    hookGameClicks();
    var n = storedName();
    if (n && (isDevCode(n) || storedDev())) {   // convert a stored code, or resume a dev session
      myName = DEV_NAME; myDev = true; saveDev(true); saveName(DEV_NAME); connect();
    } else if (n && !isBanned(n)) {
      myName = n; myDev = false; connect();
    } else {
      askName(function (name) { myName = name; connect(); });
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
