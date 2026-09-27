/* Site pause for game / movie / app pages. When the dev pauses the site this
   covers the page with the "pay attention to the teacher" screen, even in the
   middle of a game: it leaves fullscreen, mutes audio and swallows key/mouse
   input until the site is unpaused. The dev (edudeck_dev flag) bypasses.
   Talks to the database over its REST stream instead of the Firebase SDK so it
   can't clash with whatever scripts a game ships with. */
(function () {
  if (window.__edudeckPause || window.top !== window.self) return;
  window.__edudeckPause = true;

  var URL = "https://edudeck-1dc1b-default-rtdb.firebaseio.com/site/paused.json";
  var isDev = false;
  try { isDev = localStorage.getItem("edudeck_dev") === "1"; } catch (e) {}
  if (isDev) return;

  // Track Web Audio contexts (Unity, Ruffle, ...) so they can be silenced.
  var contexts = [];
  ["AudioContext", "webkitAudioContext"].forEach(function (k) {
    var AC = window[k];
    if (!AC) return;
    function Tracked() {
      var ctx = new (Function.prototype.bind.apply(AC, [null].concat([].slice.call(arguments))))();
      contexts.push(ctx);
      if (paused) try { ctx.suspend(); } catch (e) {}
      return ctx;
    }
    Tracked.prototype = AC.prototype;
    window[k] = Tracked;
  });

  var paused = false, el = null, media = [], timer = null;

  function block(e) {
    if (!paused) return;
    e.stopImmediatePropagation();
    if (e.cancelable) e.preventDefault();
  }
  var INPUT = ["keydown", "keyup", "keypress", "mousedown", "mouseup", "click",
    "pointerdown", "pointerup", "touchstart", "touchend", "wheel", "contextmenu"];
  function hookInput() {   // re-run: pages that document.write() wipe listeners
    INPUT.forEach(function (t) {
      window.addEventListener(t, block, { capture: true, passive: false });
    });
  }
  hookInput();
  setInterval(hookInput, 1000);

  function leaveFullscreen() {
    try {
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
    } catch (e) {}
  }
  function cover() {
    if (!el) {
      el = document.createElement("div");
      el.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:#0a0a0c;display:flex;" +
        "flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fff;" +
        "font-family:'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:24px";
      el.innerHTML =
        '<div style="font-size:64px;margin-bottom:14px">\ud83d\udc40</div>' +
        '<div style="font-size:34px;font-weight:800">pay attention to the teacher</div>';
    }
    var root = document.body || document.documentElement;
    if (el.parentNode !== root || root.lastChild !== el) root.appendChild(el);   // keep it on top
  }

  function show() {
    paused = true;
    cover();
    leaveFullscreen();
    try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) {}
    var els = document.querySelectorAll("audio,video");
    for (var i = 0; i < els.length; i++) {
      if (!els[i].paused) { media.push(els[i]); try { els[i].pause(); } catch (e) {} }
    }
    contexts.forEach(function (c) {
      if (c.state === "running") { c.__eduResume = true; try { c.suspend(); } catch (e) {} }
    });
    // games can add elements or go fullscreen again; keep the cover in front
    if (!timer) timer = setInterval(function () { hookInput(); cover(); leaveFullscreen(); }, 500);
  }
  function hide() {
    paused = false;
    if (timer) { clearInterval(timer); timer = null; }
    if (el && el.parentNode) el.parentNode.removeChild(el);
    media.forEach(function (m) { try { var r = m.play(); if (r && r.catch) r.catch(function () {}); } catch (e) {} });
    media = [];
    contexts.forEach(function (c) {
      if (c.__eduResume) { c.__eduResume = false; try { c.resume(); } catch (e) {} }
    });
  }
  function apply(v) {
    if (v === true && !paused) show();
    else if (v !== true && paused) hide();
  }

  // Live updates over the REST event stream, with polling as a fallback.
  var polling = null;
  function poll() {
    if (polling) return;
    var once = function () {
      fetch(URL, { cache: "no-store" }).then(function (r) { return r.json(); })
        .then(apply).catch(function () {});
    };
    once();
    polling = setInterval(once, 5000);
  }
  function start() {
    if (!window.EventSource) return poll();
    try {
      var es = new EventSource(URL);
      es.addEventListener("put", function (e) {
        try { var d = JSON.parse(e.data); if (d.path === "/") apply(d.data); } catch (x) {}
      });
      es.addEventListener("error", poll);
    } catch (e) { poll(); }
  }
  start();
})();
