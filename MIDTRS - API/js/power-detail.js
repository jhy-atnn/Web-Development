NS.start(function () {
  var root = NS.$('#power-root'), esc = NS.esc;
  var name = NS.params().get('name') || '';
  var isNature = /nature\.html$/.test(location.pathname);
  root.innerHTML = NS.loading('Loading live character records…');

  function hero(kicker, title, back, badges) {
    return '<section class="hero-sky"><div class="container py-4xl py-md-5xl"><a class="btn btn-subtle btn-sm btn-on-dark" href="' + back + '">' + NS.icon('arrow-left') + 'All powers</a>' +
      '<div class="d-flex flex-column gap-lg mt-xl"><div class="d-flex flex-wrap gap-sm">' + NS.badge(kicker, 'brand') + badges + '</div><h1 class="text-display-lg text-ink-shadow">' + esc(title) + '</h1></div></div></section>';
  }
  function jutsuLink(j, icon) {
    return '<a class="ns-card-link d-flex align-items-center gap-lg p-lg" href="jutsu.html?name=' + NS.enc(j.name) + '"><span class="tx-brand">' + NS.icon('journal-text') + '</span><span class="text-label fw-semibold">' + esc(j.name) + '</span></a>';
  }

  NS.allCharacters().then(function () {
    var natureNames = new Set();
    NS.knownCharacters().forEach(function (character) {
      character.natureTypes.forEach(function (rawName) {
        var cleanName = rawName.replace(/\s+\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
        if (/ Release$/i.test(cleanName)) natureNames.add(cleanName);
      });
    });
    if (!isNature) {
      var index = NS.jutsuIndex(), j = index.filter(function (x) { return x.name === name; })[0];
      if (!j) { root.innerHTML = '<div class="container py-5xl">' + NS.empty('Jutsu not found', 'This technique is not listed in the live API records.', '<a class="btn btn-primary" href="powers.html?tab=jutsu">Browse jutsu</a>') + '</div>'; return; }
      document.title = j.name + ' · NaruSeeki';
      var chars = NS.knownCharacters().filter(function (c) { return j.users.some(function (u) { return u.id === c.id; }); });
      var similar = index.filter(function (x) { return x.name !== j.name && j.nature && x.nature === j.nature; }).slice(0, 8);
      root.innerHTML = hero('Jutsu', j.name, 'powers.html?tab=jutsu', (j.nature ? NS.badge(j.nature, 'light') : '') + NS.badge(j.users.length + (j.users.length === 1 ? ' user' : ' users'), 'secondary')) +
        '<div class="container section"><div class="row g-4 align-items-start"><div class="col-lg-8">' +
        NS.scroll('<div class="d-flex flex-column gap-xl">' + NS.ribbon('Technique', 'brand') + '<p class="text-label" id="power-summary">' + esc(j.name) + ' is a technique ' + (j.nature ? 'of the ' + esc(j.nature) + ' nature ' : '') + 'listed in the live API records. It is known to be used by ' +
          esc(chars.slice(0, 3).map(function (c) { return c.name; }).join(', ')) + (chars.length > 3 ? ' and ' + (chars.length - 3) + ' more.' : '.') + '</p><div id="power-summary-source"></div></div>') + '</div>' +
        '<div class="col-lg-4"><div class="ns-card"><h3 class="ribbon">Overview</h3><dl class="facts mt-lg">' + NS.fact('Nature', esc(j.nature || 'Unclassified')) + NS.fact('Users', j.users.length) + '</dl></div></div></div></div>' +
        '<section class="container section"><h2 class="text-display mb-2xl">Who uses it</h2>' + NS.charGrid(chars, true) + '</section>' +
        (similar.length ? '<section class="container section"><h2 class="text-display mb-xl">More ' + esc(j.nature) + ' techniques</h2>' + NS.grid(similar, jutsuLink, 'row-cols-1 row-cols-md-2') + '</section>' : '');
    } else {
      var canonicalName = Array.from(natureNames).filter(function (candidate) { return candidate.toLowerCase() === name.toLowerCase(); })[0];
      if (!canonicalName) { root.innerHTML = '<div class="container py-5xl">' + NS.empty('Nature not found', 'That chakra nature is not in the live API records.', '<a class="btn btn-primary" href="powers.html?tab=natures">All natures</a>') + '</div>'; return; }
      name = canonicalName;
      document.title = name + ' · NaruSeeki';
      var stem = name.split(' ')[0];
      var techniques = NS.jutsuIndex().filter(function (x) { return NS.natureOf(x.name) === name; });
      var users = NS.knownCharacters().filter(function (c) { return c.natureTypes.some(function (n) { return n.indexOf(stem) === 0; }); });
      root.innerHTML = hero('Nature release', name, 'powers.html?tab=natures', NS.badge(users.length + ' known users', 'secondary')) +
        '<div class="container section">' + NS.scroll('<div class="d-flex flex-column gap-xl">' + NS.ribbon('The nature', 'brand') + '<p class="text-label" id="power-summary">' + esc(name) + ' appears in ' + users.length + ' character records and ' + techniques.length + ' named techniques returned by the live API.</p><div id="power-summary-source"></div></div>') + '</div>' +
        (techniques.length ? '<section class="container section"><h2 class="text-display mb-xl">Signature techniques</h2>' + NS.grid(techniques.slice(0, 12), jutsuLink, 'row-cols-1 row-cols-md-2') + '</section>' : '') +
        '<section class="container section"><h2 class="text-display mb-2xl">Known users</h2>' + (users.length ? NS.charGrid(users.slice(0, 15), true) : NS.empty('No users recorded', 'No characters in the live API records list this nature.')) + '</section>';
    }
    NS.wikiSummary(name).then(function (page) {
      var summary = NS.$('#power-summary'), source = NS.$('#power-summary-source');
      if (summary) summary.textContent = page.text;
      if (source) source.innerHTML = NS.wikiSource(page);
    }).catch(function (error) {
      console.error('Could not load the live Wiki summary for ' + name + '.', error);
    });
  }).catch(function (err) {
    console.error('Could not load live character records:', err);
    root.innerHTML = '<div class="container py-5xl">' + NS.empty('Live API unavailable', 'Character records could not be loaded. Please try again when the API is available.') + '</div>';
  });
});
