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

  var db = null, meId, meRef, myName = "", myGame = null;
  var connected = false;

  // ---- name ----------------------------------------------------------------
  function storedName() {
    try { return localStorage.getItem("edudeck_name") || ""; } catch (e) { return ""; }
  }
  function saveName(n) { try { localStorage.setItem("edudeck_name", n); } catch (e) {} }

  // ---- name filter ---------------------------------------------------------
  // Fold common leet substitutions and strip non-letters so "n1_gg3r" etc. are
  // still caught, then block any name containing a listed word.
  var BANNED = [
    // slurs
    "nigger", "nigga", "faggot", "faggit", "fag", "retard", "chink", "spic",
    "kike", "wetback", "coon", "tranny", "dyke", "beaner", "gook", "paki",
    "goy", "goyim", "heeb", "yid", "shylock", "kkk", "negro", "jigaboo",
    "spook", "darkie", "sambo", "raghead", "towelhead", "sandnigger",
    "zipperhead", "wop", "dago", "kraut", "jap", "homo", "groid",
    "porchmonkey", "mongoloid", "gyp", "redskin", "savage",
    // requested words
    "jew", "jews", "gay", "dress", "dresses",
    // general profanity
    "fuck", "shit", "bitch", "cunt", "pussy", "dick", "cock", "penis",
    "vagina", "porn", "sex", "rape", "nazi", "hitler"
  ];
  function normName(s) {
    return String(s).toLowerCase()
      .replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a")
      .replace(/5/g, "s").replace(/7/g, "t").replace(/8/g, "b").replace(/@/g, "a")
      .replace(/\$/g, "s").replace(/[^a-z]/g, "");
  }
  // Looks like a real street address / postal code (block for privacy).
  var STREET = /\b(st|street|ave|avenue|rd|road|ln|lane|dr|drive|blvd|boulevard|ct|court|cir|circle|way|place|pl|hwy|highway|terrace|ter|apt|suite|ste)\b/;
  function looksLikeAddress(name) {
    var s = String(name).toLowerCase();
    if (/\d{5}/.test(s)) return true;                 // zip code
    if (/\d/.test(s) && STREET.test(s)) return true;  // number + street word
    return false;
  }
  function isBanned(name) {
    var n = normName(name);
    if (n) {
      for (var i = 0; i < BANNED.length; i++) {
        if (n.indexOf(BANNED[i]) !== -1) return true;
      }
    }
    return looksLikeAddress(name);
  }

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
      var n = (input.value || "").trim() || "guest";
      if (isBanned(n)) {          // reject and let them try again
        err.style.display = "block";
        input.value = "";
        input.focus();
        return;
      }
      document.body.removeChild(wrap);
      saveName(n);
      cb(n);
    }
    go.addEventListener("click", done);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") done(); });
  }

  // ---- firebase ------------------------------------------------------------
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
  }

  function write() {
    if (!meRef) return;
    try { meRef.set({ name: myName, game: myGame, ts: Date.now() }); } catch (e) {}
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
    rows.sort(function (a, b) {
      if (a.name === myName) return -1;
      if (b.name === myName) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });

    // leading count card
    var html = card("#3ddc84", ICON_PERSON, String(rows.length),
      rows.length === 1 ? "online" : "online", false);

    // one card per active user
    for (var i = 0; i < rows.length; i++) {
      var u = rows[i];
      var mine = u.name === myName;
      var ring = RINGS[i % RINGS.length];
      var playing = !!u.game;
      var title = esc(u.name) + (mine ? " (you)" : "");
      var sub = playing ? ("playing " + esc(u.game)) : "online";
      html += card(ring, playing ? ICON_GAME : ICON_PERSON, title, sub, mine);
    }
    strip.innerHTML = html;
  }

  // ---- boot ----------------------------------------------------------------
  function boot() {
    buildWidget();               // widget always appears
    setStatus("…");
    hookGameClicks();
    var n = storedName();
    if (n && !isBanned(n)) { myName = n; connect(); }   // re-prompt if a banned name was stored
    else askName(function (name) { myName = name; connect(); });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
