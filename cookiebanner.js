/* Bottom "accept cookies" consent bar. Shows once until accepted. */
(function () {
  var KEY = "edudeck_cookies";
  try { if (localStorage.getItem(KEY) === "1") return; } catch (e) {}

  function build() {
    if (document.getElementById("ed-cookie")) return;
    var bar = document.createElement("div");
    bar.id = "ed-cookie";
    bar.style.cssText =
      "position:fixed;left:0;right:0;bottom:0;z-index:2147483645;" +
      "display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:center;" +
      "padding:12px 16px;background:#101014;border-top:1px solid #2a2a33;" +
      "color:#e8eaed;font-family:'Open Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" +
      "font-size:14px;box-shadow:0 -4px 16px rgba(0,0,0,.4)";
    bar.innerHTML =
      '<span style="max-width:640px">🍪 we use cookies to improve your experience on this site.</span>' +
      '<button id="ed-cookie-ok" style="padding:9px 20px;border:none;border-radius:8px;cursor:pointer;' +
      'background:#4ade4a;color:#06210a;font:inherit;font-weight:700;font-size:14px">accept</button>';
    document.body.appendChild(bar);
    bar.querySelector("#ed-cookie-ok").addEventListener("click", function () {
      try { localStorage.setItem(KEY, "1"); } catch (e) {}
      bar.style.transition = "transform .25s ease, opacity .25s ease";
      bar.style.transform = "translateY(100%)";
      bar.style.opacity = "0";
      setTimeout(function () { if (bar.parentNode) bar.parentNode.removeChild(bar); }, 260);
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
