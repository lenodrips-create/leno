const GAMES = [
  { id:"request", name:"request a game", art:"games/request/banner.jpg", href:"https://docs.google.com/forms/d/e/1FAIpQLScw40AoF5-sUq5rspnKQktBGWedmJmRQNPYbB50016kkYZezg/viewform?usp=dialog", noCrop:true, blurFill:true, noStar:true },
  { id:"granny", name:"granny", cat:"arcade", art:"games/granny/banner.jpg", href:"games/granny/", noCrop:true, blurFill:true },
  { id:"gtasimulator", name:"gta simulator", cat:"arcade", art:"games/gta-simulator/banner.jpg", href:"games/gta-simulator/", noCrop:true, blurFill:true },
  { id:"fortzone", name:"fortzone battle royale", cat:"arcade", art:"games/fortzone/banner.jpg", href:"games/fortzone/", noCrop:true, blurFill:true },
  { id:"blockblast", name:"block blast", cat:"arcade", art:"games/blockblast/banner.jpg", href:"games/blockblast/", noCrop:true, blurFill:true },
  { id:"one",   name:"slope",      cat:"arcade",     art:"games/slope/banner.jpg", href:"games/slope/", noCrop:true, blurFill:true },
  { id:"two",   name:"papa's freezeria", cat:"simulation", art:"games/papasfreezeria/banner.jpg", href:"games/papasfreezeria/", noCrop:true, blurFill:true },
  { id:"survivalrace", name:"survival race", cat:"arcade", art:"games/survival-race/banner.jpg", href:"games/survival-race/", noCrop:true, blurFill:true },
  { id:"three", name:"subway surfers", cat:"arcade", art:"games/game3/banner.jpg", href:"games/game3/", noCrop:true, blurFill:true },
  { id:"four",  name:"retro bowl", cat:"arcade", art:"games/game4/banner.jpg", href:"games/game4/?v=2", noCrop:true, blurFill:true },
  { id:"clusterrush", name:"cluster rush", cat:"arcade", art:"games/clusterrush/banner.jpg", href:"games/clusterrush/", noCrop:true, blurFill:true },
  { id:"stealabrainrot", name:"steal a brainrot", cat:"arcade", art:"games/steal-a-brainrot/banner.webp", href:"games/steal-a-brainrot/", noCrop:true, blurFill:true },
  { id:"onlyup", name:"only up", cat:"arcade", art:"games/only-up/banner.png", href:"games/only-up/", noCrop:true, blurFill:true },
  { id:"five",  name:"five nights at einsteins", cat:"arcade", art:"games/five-nights-at-einsteins/banner.jpg", href:"games/five-nights-at-einsteins/", noCrop:true, blurFill:true },
  { id:"six",   name:"aquapark.io", cat:"arcade", art:"games/aquapark-io/banner.jpg?v=2", href:"games/aquapark-io/", noCrop:true, blurFill:true },
  { id:"seven", name:"snow rider 3d", cat:"arcade", art:"games/snowrider3d/banner.jpg", href:"games/snowrider3d/", noCrop:true, blurFill:true },
  { id:"eight", name:"baldis basic", cat:"arcade", art:"games/baldisbasics/banner.jpg", href:"games/baldisbasics/", noCrop:true, blurFill:true },
  { id:"nine",  name:"soflo wheelie life", cat:"arcade", art:"games/soflowheelielife/banner.jpg", href:"games/soflowheelielife/", noCrop:true, blurFill:true },
  { id:"ten",   name:"backrooms escape", cat:"arcade", art:"games/backrooms-escape/banner.jpg", href:"games/backrooms-escape/", noCrop:true, blurFill:true },
  { id:"eleven", name:"cuphead", cat:"arcade", art:"games/cupped/banner.jpg", href:"games/cupped/", noCrop:true, blurFill:true },
  { id:"twelve", name:"minecraft 1.5.2", cat:"arcade", art:"games/minecraft/banner.jpg", href:"games/minecraft/", noCrop:true, blurFill:true },
  { id:"thirteen", name:"rocket soccer", cat:"arcade", art:"games/rocket-soccer/banner.jpg", href:"games/rocket-soccer/", noCrop:true, blurFill:true },
  { id:"fourteen", name:"super mario 64", cat:"arcade", art:"games/supermario64/banner.jpg", href:"games/supermario64/", noCrop:true, blurFill:true },
  { id:"fifteen", name:"basketball stars", cat:"arcade", art:"games/basketball-stars/banner.jpg", href:"games/basketball-stars/", noCrop:true, blurFill:true },
  { id:"sixteen", name:"among us", cat:"arcade", art:"games/amongus/banner.jpg", href:"games/amongus/", noCrop:true, blurFill:true },
  { id:"seventeen", name:"1v1.lol", cat:"arcade", art:"games/1v1lol/banner.jpg", href:"games/1v1lol/", noCrop:true, blurFill:true },
  { id:"eighteen", name:"donkey kong", cat:"arcade", art:"games/donkeykong/banner.jpg", href:"games/donkeykong/", noCrop:true, blurFill:true },
  { id:"nineteen", name:"super hot", cat:"arcade", art:"games/superhot/banner.jpg", href:"games/superhot/", noCrop:true, blurFill:true },
  { id:"twenty", name:"temple run 2", cat:"arcade", art:"games/templerun2/banner.jpg", href:"games/templerun2/", noCrop:true, blurFill:true },
  { id:"twentyone", name:"geometry dash", cat:"arcade", art:"games/geometrydash/banner.jpg", href:"games/geometrydash/", noCrop:true, blurFill:true },
  { id:"twentytwo", name:"drift boss", cat:"arcade", art:"games/drift-boss/banner.jpg", href:"games/drift-boss/", noCrop:true, blurFill:true },
  { id:"twentythree", name:"red ball 4", cat:"arcade", art:"games/redball4/banner.jpg", href:"games/redball4/", noCrop:true, blurFill:true },
  { id:"twentyfour", name:"papa's burgeria", cat:"arcade", art:"games/papasburgeria/banner.jpg", href:"games/papasburgeria/", noCrop:true, blurFill:true },
  { id:"papasbakeria", name:"papa's bakeria", cat:"arcade", art:"games/papasbakeria/banner.jpg", href:"games/papasbakeria/", noCrop:true, blurFill:true },
  { id:"papassushiria", name:"papa's sushiria", cat:"arcade", art:"games/papassushiria/banner.jpg", href:"games/papassushiria/", noCrop:true, blurFill:true },
  { id:"papaspizzeria", name:"papa's pizzeria", cat:"arcade", art:"games/papaspizzaria/banner.jpg", href:"games/papaspizzaria/", noCrop:true, blurFill:true },
  { id:"twentyfive", name:"moto x3m", cat:"arcade", art:"games/motox3m/banner.jpg", href:"games/motox3m/", noCrop:true, blurFill:true },
  { id:"twentysix", name:"mario kart 64", cat:"arcade", art:"games/mariokart64/banner.jpg", href:"games/mariokart64/", noCrop:true, blurFill:true },
  { id:"sliceitall", name:"slice it all", cat:"arcade", art:"games/slice-it-all/banner.jpg", href:"games/slice-it-all/", noCrop:true, blurFill:true },
  { id:"magictiles3", name:"magic tiles 3", cat:"arcade", art:"games/magic-tiles-3/banner.jpg", href:"games/magic-tiles-3/", noCrop:true, blurFill:true },
  { id:"crazycattle3d", name:"crazy cattle 3d", cat:"arcade", art:"games/crazy-cattle-3d/banner.jpg", href:"games/crazy-cattle-3d/", noCrop:true, blurFill:true },
  { id:"skibidi1v100", name:"skibidi toilet 1v100", cat:"arcade", art:"games/skibidi1v100/banner.jpg", href:"games/skibidi1v100/", noCrop:true, blurFill:true },
  { id:"stack", name:"stack", cat:"arcade", art:"games/stack/banner.jpg", href:"games/stack/", noCrop:true, blurFill:true },
  { id:"spiralroll", name:"spiral roll", cat:"arcade", art:"games/spiral-roll/banner.png", href:"games/spiral-roll/", noCrop:true, blurFill:true },
  { id:"holeio", name:"hole.io", cat:"arcade", art:"games/hole-io/banner.jpg", href:"games/hole-io/", noCrop:true, blurFill:true },
  { id:"slitherio", name:"slither.io", cat:"arcade", art:"games/slither-io/banner.png", href:"games/slither-io/", noCrop:true, blurFill:true },
  { id:"bindingofisaac", name:"the binding of isaac", cat:"arcade", art:"games/thebindingofisaac/banner.jpg", href:"games/thebindingofisaac/", noCrop:true, blurFill:true },
  { id:"impossiblequiz", name:"the impossible quiz", cat:"arcade", art:"games/theimpossiblequiz/banner.jpg", href:"games/theimpossiblequiz/", noCrop:true, blurFill:true }
];

let starred = new Set();
try { starred = new Set(JSON.parse(localStorage.getItem("starred") || "[]")); } catch (e) {}
function save(){ try { localStorage.setItem("starred", JSON.stringify([...starred])); } catch (e) {} }

let query = "";

function card(g){
  const on = starred.has(g.id);
  const el = document.createElement("a");
  el.className = "card" + (g.wide ? " wide-banner" : "") + (g.noCrop ? " no-crop" : "") + (g.blurFill ? " blur-fill" : "");
  el.href = g.href || "#";
  if (g.href) { el.target = "_blank"; el.rel = "noopener"; }
  el.innerHTML =
    (g.blurFill ? '<img class="art-fill" src="' + g.art + '" alt="">' : '') +
    '<img class="art" src="' + g.art + '" alt="">' +
    '<span class="name">' + g.name + '</span>' +
    (g.noStar ? '' : '<button class="star" aria-pressed="' + on + '" aria-label="star ' + g.name + '">' +
    (on ? "\u2605" : "\u2606") + '</button>');
  if (g.noStar) return el;
  el.querySelector(".star").addEventListener("click", e => {
    e.preventDefault(); e.stopPropagation();
    starred.has(g.id) ? starred.delete(g.id) : starred.add(g.id);
    save(); render();
  });
  return el;
}

document.getElementById("movies").appendChild(card({ id:"movies", name:"movies", art:"movies/banner.jpg", href:"movies/", noCrop:true, blurFill:true, noStar:true }));

function render(){
  const all = document.getElementById("all");
  const star = document.getElementById("starred");
  all.innerHTML = ""; star.innerHTML = "";

  const shown = GAMES.filter(g => g.name.includes(query));
  shown.forEach(g => all.appendChild(card(g)));
  document.getElementById("all-empty").hidden = shown.length > 0;

  const fav = GAMES.filter(g => starred.has(g.id));
  fav.forEach(g => star.appendChild(card(g)));
  document.getElementById("starred-section").hidden = fav.length === 0;
}

document.getElementById("q").addEventListener("input", e => {
  query = e.target.value.trim().toLowerCase();
  render();
});

render();

const hero = document.querySelector(".hero");
if (hero) {
  if (hero.readyState >= 2) hero.hidden = false;
  else hero.addEventListener("loadeddata", () => { hero.hidden = false; });
}
