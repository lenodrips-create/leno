function card(g){
  const el = document.createElement("a");
  el.className = "card" + (g.noCrop ? " no-crop" : "") + (g.blurFill ? " blur-fill" : "");
  el.href = g.href;
  el.target = "_blank";
  el.rel = "noopener";
  el.innerHTML =
    (g.blurFill ? '<img class="art-fill" src="' + g.art + '" alt="">' : '') +
    '<img class="art" src="' + g.art + '" alt="">' +
    '<span class="name">' + g.name + '</span>';
  return el;
}

[
  { name:"a minecraft movie", art:"minecraft-movie/banner.jpg", href:"minecraft-movie/", noCrop:true, blurFill:true },
  { name:"happy gilmore", art:"happy-gilmore/banner.jpg", href:"happy-gilmore/", noCrop:true, blurFill:true }
].forEach(m => document.getElementById("movies").appendChild(card(m)));
