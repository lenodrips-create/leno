function ask() {
  document.getElementById("namefield").classList.add("show");
  document.getElementById("name").focus();
}

function go() {
  var el = document.getElementById("name");
  var n = el && el.value ? el.value.replace(/\s+/g, " ").trim().slice(0, 24) : "";
  if (n) { try { localStorage.setItem("edudeck_name", n); } catch (e) {} }
  window.location.href = "home.html";
}

document.querySelectorAll("[data-go]").forEach(function (el) { el.addEventListener("click", go); });
document.querySelector("[data-ask]").addEventListener("click", ask);
document.getElementById("name").addEventListener("keydown", function (e) {
  if (e.key === "Enter") { e.preventDefault(); go(); }
});
