/* EduDeck name filter, shared by the landing page and the online list.
   Exposes window.EduNameFilter = { isBanned, normName }.
   A name is folded several ways (look-alike letters, leet, stretched letters,
   sound-alikes, reversed) and blocked if any version contains a banned word. */
(function () {
  var BANNED = [
    // anti-Black
    "nigger", "nigga", "niger", "coon", "jigaboo", "spook", "darkie", "darky",
    "sambo", "negro", "groid", "porchmonkey", "junglebunny", "tarbaby",
    "pickaninny", "golliwog", "moolie", "moulie", "buckwheat", "spearchucker",
    // anti-white
    "honky", "honkey", "cracker", "whitey", "gringo", "peckerwood", "wonderbread",
    // anti-Latino
    "spic", "spik", "beaner", "wetback", "greaser", "cholo",
    // anti-Asian
    "chink", "gook", "jap", "slant", "slanteye", "zipperhead",
    "chingchong", "dink", "coolie", "chinaman",
    // anti-Arab / Muslim
    "raghead", "towelhead", "sandnigger", "cameljockey", "muzzie", "paki",
    // anti-Native
    "redskin", "injun", "squaw", "savage",
    // anti-Jewish
    "kike", "kyke", "heeb", "yid", "shylock", "hymie", "goy", "goyim",
    "jew", "jews", "nazi", "hitler", "shekel",
    // anti-LGBTQ
    "faggot", "faggit", "fag", "dyke", "tranny", "homo", "poofter", "poof",
    "shemale", "ladyboy", "queer", "gay",
    // disability
    "retard", "tard", "spastic", "spaz", "cripple", "mongoloid",
    // Roma
    "gyp", "gypsy",
    // other requested words
    "dress", "dresses",
    // general profanity
    "fuck", "shit", "bitch", "cunt", "pussy", "dick", "cock", "penis",
    "vagina", "porn", "sex", "rape", "wop", "dago", "kraut", "kkk",
    // common evasion spellings the folder won't catch on its own
    "niqqa", "niqqer", "niqa", "knigger", "fgt", "phag", "biatch", "beetch",
    "azn", "kunt", "phuk", "phuck", "shiit",
    // additional slurs
    "jiggaboo", "mooncricket", "cottonpicker", "spearchucka", "nigglet",
    "prairienigger", "timbernigger", "ofay", "gweilo", "redneck", "hillbilly",
    "trailertrash", "inbred", "greaseball", "mojado", "tacobender", "wetneck",
    "chinky", "ching", "chong", "slopehead", "buddhahead", "riceball",
    "haji", "hadji", "dunecoon", "sandmonkey", "camelfucker", "muzzrat",
    "sheeny", "christkiller", "ovendodger", "chug", "gyppo", "pikey",
    "fudgepacker", "carpetmuncher", "buttpirate", "battyboy", "fairy", "poon",
    "sped", "windowlicker", "veggie", "whore", "slut", "faggy", "homofag",
    "chinaman", "jigg", "wigger", "wigga", "hykes", "hyke",
    // profanity (full send)
    "asshole", "arsehole", "arse", "jackass", "dumbass", "asshat", "asswipe",
    "bastard", "twat", "prick", "wank", "wanker", "tosser", "cum", "cumshot",
    "jizz", "tits", "titties", "titty", "boobs", "boob", "hoe", "damn", "crap",
    "piss", "bollocks", "douche", "dickhead", "bullshit", "motherfucker",
    "dildo", "boner", "blowjob", "handjob", "jerkoff", "anus", "butthole",
    "bugger", "skank", "thot", "clit", "schlong", "wiener", "knob", "fanny",
    "minge", "horny", "orgasm", "masturbate", "ejaculate", "semen", "scrotum",
    "ballsack", "nutsack", "cameltoe", "milf", "gilf", "hentai", "coochie",
    "choad", "queef", "smegma", "cocksucker", "cocksuck", "cumming",
    // abbreviations / bad-content terms
    "csam", "childporn", "pedo", "pedophile", "loli", "lolicon", "shota",
    "shotacon", "jailbait", "pthc", "cheesepizza", "groomer",
    "pornhub", "xvideos", "xnxx", "xhamster", "onlyfans", "brazzers", "redtube",
    "kys", "kms",
    // sound-alike / respelled variants
    "faj", "fahg", "fagg", "nigguh", "niggah", "nigguz", "nigha", "nigah",
    "neeger", "kneegrow", "neegrow", "nignog", "spyc",
    // Hitler / nazi salutes and respellings
    "adolf", "hitla", "hitlar", "hitlor", "hitlur", "hitlir", "hitlah", "hitlr",
    "htler", "htlr", "heilhitler", "siegheil", "seigheil", "sieghail", "fuhrer",
    "fuehrer", "furher", "meinkampf", "natzi",
    // 271 / 336 spelled out
    "twoseventyone", "twoseventy1", "twohundredseventyone", "twosevenone",
    "threethreesix", "threethirtysix", "threethirty6", "threehundredthirtysix",
    // Israel respellings
    "yisrael", "isrl"
  ];


  // Short codes matched only as the WHOLE name (before ph->f folding) so they
  // don't clobber "Phil", "Joseph", "cupid", etc.
  var ACRO = ["cp", "ph", "jb", "csam", "hh"];
  // Too short to match inside other names, but blocked as the whole name.
  var WHOLE = ["nig", "nigs", "nigz", "nigg", "nigr", "fqg", "fgs", "heil", "hitr"];
  // Real names that look like a misspelled slur; removed before the fuzzy
  // checks ("randolph" is "adolf" with an extra letter).
  var SAFE = ["randolf", "whistl"];

  // The worst slurs get the extra checks below (misspellings, sound-alikes).
  var SEVERE = ["nigger", "nigga", "faggot"];
  // "nigga" skips the swapped-letter check: it would hit "enigma", "benign".
  var NO_SWAP = ["nigga"];
  // Caught with ANY one-letter change (added, missing, swapped, flipped) or
  // two extra letters; real words that land within that are in DEEP_SAFE.
  var DEEP = ["hitler", "adolf", "israel"];
  var DEEP_SAFE = ["ismael", "israfel", "randolf", "rudolf", "rodolf", "adolesc", "dolfin", "ladelf",
    "leadof", "hitter", "hiller", "hither", "whiter", "whittl", "whistl",
    "littler", "shuttl", "wheel", "heel", "whitle"];
  // Roots checked against the sound-alike version of the name.
  var SOUND_ROOTS = ["nigger", "nigga", "niger", "niga", "faggot", "fagot",
    "fag", "chink", "hitler", "hitla", "adolf"];
  // Slurs caught with one extra letter slipped in ("nigfger").
  var FUZZY = ["nigger", "nigga", "faggot", "faggit", "retard", "beaner",
    "raghead", "towelhead", "redskin", "jigaboo", "chinky", "bitch", "whore",
    "pussy", "fucker", "hitler", "adolf"];

  // Letters from other alphabets that look like latin ones (Cyrillic, Greek,
  // IPA). Accents and fancy/fullwidth fonts are handled by NFKD below.
  var LOOKALIKE = {
    "\u0430": "a", "\u0435": "e", "\u0451": "e", "\u043e": "o", "\u0440": "p",
    "\u0441": "c", "\u0443": "y", "\u0445": "x", "\u0456": "i", "\u0457": "i",
    "\u0458": "j", "\u043a": "k", "\u043c": "m", "\u043d": "h", "\u0442": "t",
    "\u0432": "b", "\u0433": "r", "\u0438": "u", "\u043f": "n", "\u0434": "d",
    "\u0501": "d", "\u0261": "g", "\u0131": "i", "\u2113": "l", "\u0455": "s",
    "\u04bb": "h", "\u0475": "v", "\u051b": "q", "\u051d": "w", "\u0493": "f",
    "\u03b1": "a", "\u03b2": "b", "\u03b5": "e", "\u03b7": "n", "\u03b9": "i",
    "\u03ba": "k", "\u03bd": "v", "\u03bf": "o", "\u03c1": "p", "\u03c4": "t",
    "\u03c5": "u", "\u03c7": "x", "\u03b3": "y", "\u03c9": "w", "\u0274": "n",
    "\u0262": "g", "\u026a": "i", "\u0280": "r", "\u1d07": "e", "\u1d00": "a",
    "\u0493": "f", "\u00df": "ss", "\u00f8": "o", "\u0111": "d", "\u0142": "l",
    "\u0192": "f", "\u0268": "i", "\u0251": "a", "\u0259": "e", "\u0254": "o"
  };

  function fold(s) {
    s = String(s);
    try { s = s.normalize("NFKD"); } catch (e) {}
    s = s.replace(/[\u0300-\u036f]/g, "").toLowerCase();
    var out = "";
    for (var i = 0; i < s.length; i++) out += LOOKALIKE[s[i]] || s[i];
    return out;
  }

  // Fold symbol/letter lookalikes and leet so "n1_gg3r", "phaggot", "|<ike" all
  // reduce to plain letters before matching.
  function normName(s) {
    return fold(s)
      .replace(/\|\\\/\||\/\\\/\\/g, "m").replace(/\|\\\||\/\\\//g, "n")
      .replace(/\\\/\\\/|vv/g, "w").replace(/\\\//g, "v").replace(/\|_\|/g, "u")
      .replace(/\|</g, "k").replace(/\|\)/g, "d").replace(/\(\)|\[\]/g, "o")
      .replace(/ph/g, "f")
      .replace(/[0]/g, "o").replace(/[1!|]/g, "i").replace(/[3\u20ac]/g, "e")
      .replace(/[4@]/g, "a").replace(/[5$\u00a7]/g, "s").replace(/[7+]/g, "t")
      .replace(/[8]/g, "b").replace(/[6]/g, "g").replace(/[9]/g, "g")
      .replace(/[()<>{}\[\]]/g, "c").replace(/[^a-z]/g, "");
  }
  // Drop runs of a repeated letter to one, so "niiigggeeer" -> "niger".
  function collapse(s) { return s.replace(/(.)\1+/g, "$1"); }
  // Sound-alike spelling: "faj", "nikka", "nicca", "nibba", "nyggr", "niqqa".
  function soundAlike(s) {
    return s.replace(/ck/g, "k").replace(/[qj]/g, "g").replace(/y/g, "i")
      .replace(/ni(kk|cc|bb)/g, "nigg").replace(/ee/g, "i");
  }
  function reverse(s) { return s.split("").reverse().join(""); }

  // Collapsed forms of long enough words, to catch stretched spellings without
  // turning short words (coon->con, gay) into false positives.
  var BANNED_COLLAPSED = [];
  for (var _i = 0; _i < BANNED.length; _i++) {
    var _c = collapse(BANNED[_i]);
    if (_c.length >= 4) BANNED_COLLAPSED.push(_c);
  }

  // ---- misspelling checks (s = a window of the name, w = the slur) --------
  function oneInserted(s, w) {           // w with one extra letter
    for (var k = 0; k < s.length; k++) {
      if (s.slice(0, k) + s.slice(k + 1) === w) return true;
    }
    return false;
  }
  function oneSwapped(s, w) {            // one letter changed, not the first
    if (s[0] !== w[0]) return false;
    var diff = 0;
    for (var k = 1; k < w.length; k++) if (s[k] !== w[k] && ++diff > 1) return false;
    return true;
  }
  function oneDropped(s, w) {            // one letter missing, not the first
    for (var k = 1; k < w.length; k++) {
      if (w.slice(0, k) + w.slice(k + 1) === s) return true;
    }
    return false;
  }
  function transposed(s, w) {            // two neighbouring letters flipped
    for (var k = 1; k + 1 < w.length; k++) {
      if (w.slice(0, k) + w[k + 1] + w[k] + w.slice(k + 2) === s) return true;
    }
    return false;
  }
  function spreadOut(s, w) {             // w's letters in order, starting at s[0]
    var k = 0;
    for (var m = 0; m < s.length && k < w.length; m++) if (s[m] === w[k]) k++;
    return k === w.length && s[0] === w[0];
  }

  // Any single edit, including the first letter.
  function oneEdit(t, w) {
    var k, L = w.length;
    if (t.length === L) {
      var diff = 0;
      for (k = 0; k < L; k++) if (t[k] !== w[k]) diff++;
      if (diff <= 1) return true;
      for (k = 0; k + 1 < L; k++) {
        if (w.slice(0, k) + w[k + 1] + w[k] + w.slice(k + 2) === t) return true;
      }
      return false;
    }
    if (t.length === L + 1) return oneInserted(t, w);
    if (t.length === L - 1) {
      for (k = 0; k < L; k++) if (w.slice(0, k) + w.slice(k + 1) === t) return true;
    }
    return false;
  }
  function deepHit(s) {
    for (var i = 0; i < DEEP.length; i++) {
      var w = DEEP[i], L = w.length;
      for (var j = 0; j < s.length; j++) {
        for (var len = L - 1; len <= L + 1; len++) {
          if (j + len <= s.length && oneEdit(s.substr(j, len), w)) return true;
        }
        if (L >= 6 && spreadOut(s.substr(j, L + 2), w)) return true;
      }
    }
    return false;
  }

  function contains(s, list) {
    for (var i = 0; i < list.length; i++) if (s.indexOf(list[i]) !== -1) return true;
    return false;
  }
  function fuzzyHit(s) {
    var i, j, w, L;
    for (i = 0; i < SAFE.length; i++) s = s.split(SAFE[i]).join("-");
    for (i = 0; i < FUZZY.length; i++) {
      w = FUZZY[i];
      for (j = 0; j + w.length + 1 <= s.length; j++) {
        if (oneInserted(s.substr(j, w.length + 1), w)) return true;
      }
    }
    for (i = 0; i < SEVERE.length; i++) {
      w = SEVERE[i]; L = w.length;
      for (j = 0; j < s.length; j++) {
        if (NO_SWAP.indexOf(w) === -1 && oneSwapped(s.substr(j, L), w)) return true;
        if (transposed(s.substr(j, L), w)) return true;
        if (L >= 6 && oneDropped(s.substr(j, L - 1), w)) return true;
        // up to two extra letters mixed in (one for the short "nigga")
        if (spreadOut(s.substr(j, L + (L >= 6 ? 2 : 1)), w)) return true;
      }
    }
    return false;
  }

  // Block anything that even resembles an address (aggressive, for privacy).
  var STREET = /(street|avenue|\bave\b|\brd\b|road|\bln\b|lane|\bdr\b|drive|boulevard|\bblvd\b|\bct\b|court|circle|\bcir\b|\bway\b|place|\bpl\b|highway|\bhwy\b|terrace|\bter\b|\bapt\b|suite|\bste\b|\bunit\b|\bbox\b|\bpo\b|\bcrescent\b|\bcres\b|parkway|\bpkwy\b|\bcourtyard\b|\bloop\b|\btrail\b|\btrl\b)/;
  var DIRN = /\b(north|south|east|west|\bn\b|\bs\b|\be\b|\bw\b|ne|nw|se|sw)\b/;
  function looksLikeAddress(name) {
    var s = String(name).toLowerCase();
    if (/\d{4,}/.test(s)) return true;                 // 4+ digit run (zip / long number)
    if (STREET.test(s)) return true;                   // any street-type word
    if (/\d{1,6}\s*[a-z]/.test(s)) return true;        // number next to letters ("12 oak", "7b")
    if (/[a-z]\s*\d{1,6}/.test(s) && DIRN.test(s)) return true;
    return false;
  }

  function isBanned(name) {
    var acro = fold(name).replace(/[^a-z]/g, "");
    if (ACRO.indexOf(acro) !== -1) return true;   // exact short-code names
    // neo-nazi number codes: 1488 / 14-88, or 88 on its own
    if (/14\D{0,3}88/.test(name) || /^\W*88\W*$/.test(name)) return true;
    // 271 and 336, also split up ("2 7 1", "3.3.6") or with l / i / ! for the 1
    var digits = fold(name).replace(/[\s._\-,:;'"*~+=\/\\]/g, "");
    if (/27[1li!|]/.test(digits) || /336/.test(digits)) return true;
    var n = normName(name);
    if (n) {
      var c = collapse(n), p = soundAlike(n), pc = collapse(p);
      if (WHOLE.indexOf(n) !== -1 || WHOLE.indexOf(c) !== -1 || WHOLE.indexOf(pc) !== -1) return true;
      if (contains(n, BANNED) || contains(c, BANNED_COLLAPSED)) return true;
      if (contains(p, SOUND_ROOTS) || contains(pc, SOUND_ROOTS)) return true;
      if (contains(reverse(n), ["nigger", "faggot", "hitler", "adolf"])) return true;   // "reggin"
      if (fuzzyHit(n) || fuzzyHit(c) || fuzzyHit(p) || fuzzyHit(pc)) return true;
      var d = n;
      for (var i = 0; i < DEEP_SAFE.length; i++) d = d.split(DEEP_SAFE[i]).join("-");
      var dp = soundAlike(d);
      if (deepHit(d) || deepHit(collapse(d)) || deepHit(dp) || deepHit(collapse(dp))) return true;
    }
    return looksLikeAddress(name);
  }

  // Names only the dev may use (they get it through the dev code, never by
  // typing it). Caught through leet, look-alikes, stretching, a capital I or
  // 1 for the l, and any one-letter misspelling.
  var RESERVED = ["lennon"];
  var RESERVED_SAFE = ["lennox", "rhiannon", "brennon"];
  function isReserved(name) {
    var n = normName(name);
    for (var i = 0; i < RESERVED_SAFE.length; i++) n = n.split(RESERVED_SAFE[i]).join("-");
    var l = n.replace(/i/g, "l");                       // "Iennon" / "1ennon"
    var forms = [n, collapse(n), l, collapse(l)];
    for (var f = 0; f < forms.length; f++) {
      var s = forms[f];
      for (var r = 0; r < RESERVED.length; r++) {
        var w = RESERVED[r], L = w.length;
        if (s.indexOf(collapse(w)) !== -1) return true;  // "lenon", "lennnnon"
        for (var j = 0; j < s.length; j++) {
          for (var len = L - 1; len <= L + 1; len++) {
            if (j + len <= s.length && oneEdit(s.substr(j, len), w)) return true;
          }
        }
      }
    }
    return false;
  }

  window.EduNameFilter = { isBanned: isBanned, isReserved: isReserved, normName: normName };
})();
