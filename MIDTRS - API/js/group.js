NS.start(function () {
  var PAGE = 15, root = NS.$('#group-root'), esc = NS.esc;
  var params = NS.params(), kind = params.get('kind') || 'villages', id = Number(params.get('id'));
  var META = {
    villages: { label: 'Hidden village', plural: 'villages', back: 'villages.html', singular: 'village' },
    clans: { label: 'Clan', plural: 'clans', back: 'clans.html', singular: 'clan' },
    teams: { label: 'Team', plural: 'teams', back: 'clans.html?tab=teams', singular: 'team' },
    'kekkei-genkai': { label: 'Kekkei genkai', plural: 'kekkei genkai', back: 'powers.html?tab=kekkei-genkai', singular: 'kekkei genkai' },
  };
  var meta = META[kind] || META.villages;

  function notFound() {
    root.innerHTML = '<div class="container py-5xl">' + NS.empty('Scroll not found', 'This ' + meta.singular + ' could not be found.', '<a class="btn btn-primary" href="' + meta.back + '">Back</a>') + '</div>';
  }

  NS.getGroup(kind, id).then(function (g) {
    if (!g) return notFound();
    document.title = g.name + ' · NaruSeeki';
    var key = g.name.toLowerCase();
    var lore = kind === 'villages' ? NS.lore.villages[key] : null;
    var tone = kind === 'villages' ? NS.toneClass(g.name) : '';
    var blurb = kind === 'villages' ? (lore && lore.blurb) : kind === 'clans' ? NS.lore.clans[key] : kind === 'kekkei-genkai' ? NS.lore.kekkeiGenkai[key] : null;
    blurb = blurb || g.name + ' is a ' + meta.singular + ' of the shinobi world with ' + g.total + ' known ' + (g.total === 1 ? 'member' : 'members') + ' in the encyclopedia.';

    root.innerHTML =
      '<section class="hero-sky ' + tone + '">' + (lore ? '<div class="hero-watermark text-kanji text-kanji-watermark" aria-hidden="true">' + esc(lore.kanji) + '</div>' : '') +
      (tone ? '<span class="hero-bar"></span>' : '') +
      '<div class="container position-relative py-4xl py-md-5xl"><a class="btn btn-subtle btn-sm btn-on-dark" href="' + meta.back + '">' + NS.icon('arrow-left') + 'All ' + meta.plural + '</a>' +
      '<div class="d-flex flex-column gap-lg mt-xl"><div class="d-flex flex-wrap gap-sm">' + NS.badge(meta.label, 'brand') + NS.badge(g.total.toLocaleString() + ' known ' + (g.total === 1 ? 'member' : 'members'), 'light') + '</div>' +
      (lore ? '<span class="text-kanji text-title tx-gold">' + esc(lore.kanji) + '</span>' : '') +
      '<h1 class="text-display-xl text-ink-shadow">' + esc(g.name) + '</h1></div></div></section>' +
      '<div class="container section"><div class="row gutter-3xl align-items-start">' +
      '<div class="col-lg-8">' + NS.scroll('<div class="d-flex flex-column gap-xl">' + NS.ribbon('About', 'brand') + '<p class="text-label">' + esc(blurb) + '</p></div>') + '</div>' +
      '<div class="col-lg-4"><div class="ns-card"><h3 class="ribbon">Overview</h3><dl class="facts mt-lg">' + NS.fact('Type', meta.label) + NS.fact('Country', lore && esc(lore.country)) + NS.fact('Leader', lore && esc(lore.leader)) + NS.fact('Known members', g.total.toLocaleString()) + '</dl></div></div></div></div>' +
      '<section class="container section"><div class="d-flex flex-column gap-xs section-title"><span class="text-kicker tx-brand">Roster</span><h2 class="text-display">Members of ' + esc(g.name) + '</h2></div>' +
      '<div id="members">' + NS.skeletonGrid(5) + '</div><div class="text-center mt-3xl" id="more"></div></section>';

    var page = 1, members = [], busy = true;
    function render() {
      NS.$('#members').innerHTML = members.length ? NS.charGrid(members) : (busy ? NS.skeletonGrid(5) : NS.empty('No members listed', 'The API has no characters recorded for this entry.'));
      var hasMore = page * PAGE < g.characters.length;
      NS.$('#more').innerHTML = hasMore && members.length ? '<button class="btn btn-primary" id="load-more" type="button"' + (busy ? ' disabled' : '') + '>' + (busy ? 'Unrolling…' : 'Load more members') + '</button>' : '';
      var b = NS.$('#load-more');
      if (b) b.addEventListener('click', function () {
        busy = true; page++; render();
        NS.getCharactersByIds(g.characters.slice((page - 1) * PAGE, page * PAGE)).then(function (m) { members = members.concat(m); busy = false; render(); });
      });
    }
    NS.getCharactersByIds(g.characters.slice(0, PAGE)).then(function (m) { members = m; busy = false; render(); });
  });
});
