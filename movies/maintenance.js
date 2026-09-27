/* Shows a "be right back" screen on the gate / apps / movies pages when the
   site is paused from the dev controls. The dev (edudeck_dev flag) bypasses. */
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
  if (!window.firebase || !firebase.database) return;
  try { if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(firebaseConfig); } catch (e) { return; }
  var db = firebase.database();

  var isDev = false;
  try { isDev = localStorage.getItem("edudeck_dev") === "1"; } catch (e) {}

  var el = null;
  function show() {
    if (el || isDev) return;
    el = document.createElement("div");
    el.style.cssText = "position:fixed;inset:0;z-index:2147483646;background:#0a0a0c;display:flex;" +
      "flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fff;" +
      "font-family:'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:24px";
    el.innerHTML =
      '<div style="font-size:64px;margin-bottom:10px">🚧</div>' +
      '<div style="font-size:30px;font-weight:800;margin-bottom:8px">be right back</div>' +
      '<div style="font-size:16px;color:#8b8f9c;max-width:340px">the site is paused for maintenance — check back soon.</div>';
    document.body.appendChild(el);
  }
  function hide() { if (el) { el.parentNode.removeChild(el); el = null; } }

  db.ref("site/paused").on("value", function (s) {
    if (s && s.val() && !isDev) show(); else hide();
  });
})();
