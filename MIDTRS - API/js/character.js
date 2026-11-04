NS.start(function () {
  var params = NS.params();
  var id = Number(params.get('id'));
  var kind = params.get('type') === 'beast' ? 'beast' : 'character';
  var root = NS.$('#character-root');
  var esc = NS.esc;

  var NATURE_ICON = { Fire: 'fire', Water: 'droplet', Wind: 'wind', Earth: 'gem', Lightning: 'lightning-charge' };
  var MEDIA_ICON = { Manga: 'book', Anime: 'tv', Movie: 'film', Game: 'controller', Novel: 'book', OVA: 'film' };

  function notFound() {
    root.innerHTML = '<div class="container py-5xl">' + NS.empty('Scroll not found', 'The live API did not return this character.', '<a class="btn btn-primary" href="characters.html">Back to characters</a>') + '</div>';
  }
  if (!id) return notFound();

  function nameMap(groups) {
    var m = new Map();
    groups.forEach(function (g) { m.set(g.name.toLowerCase(), g.id); });
    return m;
  }

  Promise.all([NS.getCharacter(id, kind), NS.listGroups('villages'), NS.listGroups('clans'), NS.listGroups('kekkei-genkai')]).then(function (res) {
    var c = res[0];
    if (!c) return notFound();
    var villages = res[1], villageMap = nameMap(villages), clanMap = nameMap(res[2]), kgMap = nameMap(res[3]);
    document.title = c.name + ' · NaruSeeki';

    var words = c.name.split(' '), first = words[0], rest = words.slice(1).join(' ');
    var tails = NS.lore.beastTails[c.name];
    var tone = NS.toneClass(c.village);
    var back = kind === 'beast' ? 'powers.html?tab=tailed-beasts' : 'characters.html';

    var hero =
      '<section class="hero-sky"><div class="container position-relative py-3xl py-md-4xl"><div class="row align-items-center gutter-2xl">' +
      '<div class="col-lg-7 d-flex flex-column gap-lg">' +
      '<div><a class="btn btn-subtle btn-sm btn-on-dark" href="' + back + '">' + NS.icon('arrow-left') + (kind === 'beast' ? 'All tailed beasts' : 'All characters') + '</a></div>' +
      '<div class="d-flex flex-wrap gap-sm">' + NS.badge(tails ? tails + '-Tailed Beast' : c.role, 'brand') + NS.badge(c.primarySeries, 'light') +
      (c.status ? NS.badge(c.status, /deceased/i.test(c.status) ? 'danger' : 'success') : '') + '</div>' +
      '<h1 class="d-flex flex-column"><span class="text-display-xl tx-brand text-ink-shadow">' + esc(first) + '</span>' +
      (rest ? '<span class="text-display-lg text-ink-shadow">' + esc(rest) + '</span>' : '') + '</h1>' +
      (c.nameJapanese ? '<span class="text-kanji text-title tx-gold">' + esc(c.nameJapanese) + '</span>' : '') +
      (c.aliases[0] ? '<span class="text-label text-uppercase tx-on-brand-soft hero-alias">' + esc(c.aliases[0]) + '</span>' : '') +
      '<dl class="row row-cols-2 row-cols-sm-4 gutter-xl measure-wide m-0 mt-md">' +
      [['Village', c.village], ['Clan', c.clan], ['Rank', c.rank], ['Birthday', c.birthday]].map(function (x) {
        return '<div class="col"><dt class="text-meta text-uppercase tx-on-brand-faint hero-dt">' + x[0] + '</dt><dd class="text-label-sm m-0">' + esc(x[1] || '—') + '</dd></div>';
      }).join('') + '</dl></div>' +
      '<div class="col-lg-5"><div class="hero-scroll">' + NS.art(c.imageUrl, c.name) + '</div></div>' +
      '</div></div></section>';

    var about = NS.scroll('<div class="d-flex flex-column gap-xl">' + NS.ribbon('About ' + first, 'brand') +
      '<p class="text-label">' + esc(c.biography) + '</p>' +
      (c.aliases.length ? '<div class="d-flex flex-column gap-md"><span class="text-kicker tx-brand-dark">Also known as</span><div class="d-flex flex-wrap gap-md">' + c.aliases.map(function (a) { return NS.badge(a, 'secondary'); }).join('') + '</div></div>' : '') +
      (c.tags.length ? '<div class="d-flex flex-wrap gap-md">' + c.tags.map(function (t) { return NS.badge('#' + t, 'default'); }).join('') + '</div>' : '') + '</div>');

    function block(title, inner) { return '<section class="d-flex flex-column gap-md"><h4 class="text-label fw-semibold">' + esc(title) + '</h4>' + inner + '</section>'; }
    function pills(list) { return '<ul class="list-reset d-flex flex-wrap gap-md">' + list.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>'; }

    var abilities = '<div class="d-flex flex-column gap-2xl pt-xl">';
    if (c.natureTypes.length) {
      abilities += block('Nature types', pills(c.natureTypes.map(function (n) {
        var clean = n.replace(/\s+\(.*\)/, ''), stem = clean.replace(/ Release.*/, '');
        var lore = NS.lore.natures[clean] || NS.lore.natures[stem + ' Release'];
        return '<a class="ns-pill tone-' + (lore ? lore.tone : 'brand-primary') + '" href="nature.html?name=' + NS.enc(clean) + '"><span class="ns-dot ns-dot-sm">' + NS.icon(NATURE_ICON[stem] || 'stars') + '</span>' + esc(n) + '</a>';
      })));
    }
    if (c.kekkeiGenkai.length) {
      abilities += block('Kekkei Genkai', pills(c.kekkeiGenkai.map(function (k) {
        var gid = kgMap.get(k.toLowerCase());
        return gid !== undefined ? '<a class="ns-pill ns-pill-ink" href="group.html?kind=kekkei-genkai&id=' + gid + '"><span class="tx-brand">' + NS.icon('eye') + '</span>' + esc(k) + '</a>' : NS.badge(k, 'default');
      })));
    }
    if (c.tailedBeast) abilities += block('Tailed beast', '<div class="text-label-sm d-flex align-items-center gap-md"><span class="tx-brand">' + NS.icon('stars') + '</span>' + esc(c.tailedBeast) + '</div>');
    if (c.jutsu.length) {
      var shown = c.jutsu.slice(0, 18);
      abilities += block('Jutsu (' + c.jutsu.length + ')', '<div id="jutsu-list">' + pills(shown.map(jutsuChip)) + '</div>' +
        (c.jutsu.length > 18 ? '<div><button class="btn btn-neutral btn-sm" type="button" id="jutsu-toggle">Show all ' + c.jutsu.length + '</button></div>' : ''));
    }
    if (c.weapons.length) abilities += block('Weapons & tools', pills(c.weapons.map(function (w) { return '<span class="ns-chip d-inline-flex align-items-center gap-sm"><span class="tx-muted">' + NS.icon('shield-shaded') + '</span>' + esc(w) + '</span>'; })));
    if (!c.natureTypes.length && !c.jutsu.length && !c.kekkeiGenkai.length && !c.weapons.length) abilities += '<p class="text-label-sm tx-secondary">No abilities are recorded for this character yet.</p>';
    abilities += '</div>';
    function jutsuChip(j) { return '<a class="ns-chip" href="jutsu.html?name=' + NS.enc(j) + '">' + esc(j) + '</a>'; }

    var relations = c.relations.length
      ? '<ul class="list-reset row gutter-lg row-cols-1 row-cols-sm-2 pt-xl">' + c.relations.map(function (r) {
        return '<li class="col"><a class="ns-card-link d-flex align-items-center gap-lg p-lg" href="' + (r.characterId ? 'character.html?id=' + r.characterId : 'characters.html?q=' + NS.enc(r.name)) + '">' +
          '<span class="ns-dot ns-dot-soft text-label">' + esc(r.name.charAt(0)) + '</span><span class="d-flex flex-column min-w-0"><span class="text-label fw-semibold">' + esc(r.name) + '</span><span class="text-label-sm tx-secondary">' + esc(r.relationship) + '</span></span></a></li>';
      }).join('') + '</ul>'
      : '<p class="text-label-sm tx-secondary pt-xl">No relations are recorded for this character.</p>';

    function voice(label, names) {
      return '<div class="col"><div class="d-flex align-items-start gap-lg bg-faint r-lg p-lg h-100"><span class="ns-dot ns-dot-ink">' + NS.icon('mic') + '</span><div class="d-flex flex-column gap-xs"><span class="text-kicker tx-brand-dark">' + label + '</span>' +
        (names.length ? names.map(function (n) { return '<span class="text-label-sm">' + esc(n) + '</span>'; }).join('') : '<span class="text-label-sm tx-secondary">Not listed</span>') + '</div></div></div>';
    }
    var voiceTab = '<div class="d-flex flex-column gap-2xl pt-xl"><div class="row gutter-xl row-cols-1 row-cols-sm-2">' + voice('Japanese voice', c.voiceJp) + voice('English voice', c.voiceEn) + '</div>' +
      block('Appearances', '<dl class="facts">' + NS.fact('Series', esc(c.primarySeries)) + NS.fact('First episode', c.firstAppearanceEpisode ? 'Episode ' + c.firstAppearanceEpisode : '') +
        c.debut.map(function (d) { return NS.fact(d.label, esc(d.value)); }).join('') + '</dl>') + '</div>';

    var gallery = c.gallery.length
      ? '<ul class="list-reset row gutter-lg row-cols-2 row-cols-md-3 pt-xl">' + c.gallery.map(function (src, i) { return '<li class="col"><div class="card-art">' + NS.art(src, c.name + ', image ' + (i + 1)) + '</div></li>'; }).join('') + '</ul>'
      : '<p class="text-label-sm tx-secondary pt-xl">No gallery images available.</p>';

    var vId = c.village ? villageMap.get(c.village.toLowerCase()) : undefined;
    var cId = c.clan ? clanMap.get(c.clan.toLowerCase()) : undefined;
    var eyeColorFact = kind === 'character'
      ? NS.fact('Eye color', '<span id="wiki-eye-color">Looking up…</span>').replace('<div class="fact">', '<div class="fact" id="wiki-eye-color-fact">')
      : '';
    var overview = '<div class="ns-card"><h3 class="ribbon">Overview</h3><dl class="facts mt-lg">' +
      NS.fact('Village', c.village && (vId !== undefined ? '<a class="tx-brand" href="group.html?kind=villages&id=' + vId + '">' + esc(c.village) + '</a>' : esc(c.village))) +
      NS.fact('Clan', c.clan && (cId !== undefined ? '<a class="tx-brand" href="group.html?kind=clans&id=' + cId + '">' + esc(c.clan) + '</a>' : esc(c.clan))) +
      NS.fact('Affiliations', esc(c.affiliations.join(', '))) + NS.fact('Team', esc(c.team.slice(0, 4).join(', '))) + NS.fact('Rank', esc(c.rank)) +
      NS.fact('Occupation', esc(c.occupation.join(', '))) + NS.fact('Class', esc(c.classification.join(', '))) + NS.fact('Species', esc(c.species)) +
      NS.fact('Jinchuriki', esc(c.jinchuriki.join(', '))) + NS.fact('Gender', esc(c.gender && NS.capital(c.gender))) +
      eyeColorFact +
      NS.fact('Age', esc(c.ageExact ? c.ageExact + (c.apparentAge ? ' (' + c.apparentAge + ')' : '') : c.apparentAge)) +
      NS.fact('Birthday', esc(c.birthday ? c.birthday + (c.zodiac ? ' · ' + c.zodiac : '') : '')) + NS.fact('Height', esc(c.height)) + NS.fact('Weight', esc(c.weight)) +
      NS.fact('Blood type', esc(c.bloodType)) + NS.fact('Registration', esc(c.registration)) + '</dl></div>';

    var journey = c.debut.length
      ? '<section class="container section"><div class="d-flex flex-column gap-xs section-title"><span class="text-kicker tx-brand">Across the media</span><h2 class="text-display">Journey highlights</h2></div>' +
      '<ol class="list-reset journey">' + c.debut.map(function (d) {
        return '<li><span class="ns-dot ns-dot-ink">' + NS.icon(MEDIA_ICON[d.label] || 'film', 'icon-lg') + '</span><span class="text-label fw-semibold">' + d.label + '</span><span class="text-label-sm tx-secondary">' + esc(d.value) + '</span></li>';
      }).join('') + '</ol></section>' : '';

    root.innerHTML = hero +
      '<div class="container section"><div class="row gutter-3xl align-items-start">' +
      '<div class="col-lg-8 d-flex flex-column gap-4xl">' + about +
      '<section class="ns-card">' + NS.tabs('char-tabs', [
        { id: 'abilities', label: 'Abilities', html: abilities }, { id: 'relations', label: 'Relations', html: relations },
        { id: 'voice', label: 'Voice', html: voiceTab }, { id: 'gallery', label: 'Gallery', html: gallery }]) + '</section></div>' +
      '<aside class="col-lg-4"><div class="sticky-aside">' + overview + '</div></aside></div></div>' + journey +
      '<div id="related"></div>';

    if (kind === 'character') {
      NS.wikiEyeColor(c.name).then(function (color) {
        var fact = NS.$('#wiki-eye-color-fact');
        if (!fact) return;
        if (color) NS.$('#wiki-eye-color').textContent = color;
        else fact.remove();
      }).catch(function (error) {
        console.error('Could not load eye color for ' + c.name + '.', error);
        var fact = NS.$('#wiki-eye-color-fact');
        if (fact) fact.remove();
      });
    }

    var toggle = NS.$('#jutsu-toggle');
    if (toggle) {
      var all = false;
      toggle.addEventListener('click', function () {
        all = !all;
        NS.$('#jutsu-list').innerHTML = pills((all ? c.jutsu : c.jutsu.slice(0, 18)).map(jutsuChip));
        toggle.textContent = all ? 'Show fewer' : 'Show all ' + c.jutsu.length;
      });
    }

    if (kind === 'character' && c.village) {
      var g = villages.filter(function (v) { return v.name.toLowerCase() === c.village.toLowerCase(); })[0];
      if (g) {
        NS.getCharactersByIds(g.characters.filter(function (i) { return i !== c.id; }).slice(0, 5)).then(function (list) {
          if (!list.length) return;
          NS.$('#related').innerHTML = '<section class="container section"><div class="d-flex flex-wrap align-items-end justify-content-between gap-lg section-title"><div class="d-flex flex-column gap-xs"><span class="text-kicker tx-brand">More from ' + esc(g.name) + '</span><h2 class="text-display">Fellow shinobi</h2></div>' +
            '<a class="btn btn-neutral btn-sm" href="group.html?kind=villages&id=' + g.id + '">Open the village' + NS.icon('arrow-right') + '</a></div>' + NS.charGrid(list, true) + '</section>';
        });
      }
    }
  });
});
