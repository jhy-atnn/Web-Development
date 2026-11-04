NS.start(function () {
  var POPULAR = [1344, 1307, 374, 376, 1293, 259, 515, 1280, 928, 865, 437, 878, 1299, 861, 636, 739];
  var SPOTLIGHT = [1344, 1307, 376, 1293, 259, 515, 865, 1299];
  var MAJOR = ['konohagakure', 'sunagakure', 'kirigakure', 'kumogakure', 'iwagakure', 'amegakure'];

  NS.$('#stat-characters').textContent = '—';
  NS.listCharacters({ page: 1, limit: 1 }).then(function (result) {
    NS.$('#stat-characters').textContent = result.total.toLocaleString() + '+';
  });
  NS.listGroups('villages').then(function (g) { NS.$('#stat-villages').textContent = g.length; });
  NS.listGroups('clans').then(function (g) { NS.$('#stat-clans').textContent = g.length; });
  NS.listBeasts().then(function (g) { NS.$('#stat-beasts').textContent = g.length; });

  var index = 0, host = NS.$('#featured');
  function featured() {
    var id = SPOTLIGHT[index % SPOTLIGHT.length];
    host.innerHTML = NS.scroll('<div class="skeleton character-skeleton"></div>');
    NS.getCharacter(id).then(function (c) {
      if (!c) return;
      host.innerHTML = NS.scroll(
        '<div class="row gutter-2xl align-items-center ' + NS.toneClass(c.village) + '">' +
        '<div class="col-md-4"><div class="card-art featured-art">' +
        NS.art(c.id === 1344 ? 'img/narutoprofile.jpg' : c.imageUrl, c.name) + '</div></div>' +
        '<div class="col-md-8 d-flex flex-column gap-lg">' +
        (c.nameJapanese ? '<span class="text-kanji text-heading tx-secondary">' + NS.esc(c.nameJapanese) + '</span>' : '') +
        '<h3 class="text-display-lg tx-brand">' + NS.esc(c.name) + '</h3>' +
        (c.aliases[0] ? '<span class="text-label fw-semibold tx-brand-dark">' + NS.esc(c.aliases[0]) + '</span>' : '') +
        '<p class="text-label">' + NS.esc(c.biography) + '</p>' +
        '<div class="d-flex flex-wrap gap-xs">' + [c.rank, c.village, c.clan].filter(Boolean).map(function (t) { return NS.badge(t, 'secondary'); }).join('') +
        c.jutsu.slice(0, 3).map(function (j) { return NS.badge(j, 'default'); }).join('') + '</div>' +
        '<div class="d-flex flex-wrap gap-md"><a class="btn btn-primary" href="character.html?id=' + c.id + '">Read the full scroll' + NS.icon('arrow-right') + '</a>' +
        '<button class="btn btn-neutral" type="button" id="shuffle">' + NS.icon('shuffle') + 'Another shinobi</button></div></div></div>');
      NS.$('#shuffle').addEventListener('click', function () { index++; featured(); });
    });
  }
  featured();

  NS.$('#popular').innerHTML = NS.skeletonGrid(5);
  NS.getCharactersByIds(POPULAR).then(function (items) {
    function pane(list) {
      return '<div class="pt-xl">' + (list.length ? NS.charGrid(list.slice(0, 10)) : '<p class="text-label-sm tx-secondary">No shinobi in this group yet.</p>') + '</div>';
    }
    function by(f) { return items.filter(f); }
    NS.$('#popular').innerHTML = NS.tabs('popular-tabs', [
      { id: 'all', label: 'All', html: pane(items) },
      { id: 'leaf', label: 'Leaf', html: pane(by(function (c) { return c.village === 'Konohagakure'; })) },
      { id: 'sand', label: 'Sand', html: pane(by(function (c) { return c.village === 'Sunagakure'; })) },
      { id: 'akatsuki', label: 'Akatsuki', html: pane(by(function (c) { return c.role === 'antagonist'; })) },
      { id: 'sound', label: 'Sound', html: pane(by(function (c) { return c.village === 'Otogakure'; })) },
      { id: 'cloud', label: 'Cloud', html: pane(by(function (c) { return c.village === 'Kumogakure'; })) },
    ]);
  });

  NS.listGroups('villages').then(function (groups) {
    var picks = MAJOR.map(function (n) { return groups.filter(function (g) { return g.name.toLowerCase() === n; })[0]; }).filter(Boolean);
    NS.$('#home-villages').innerHTML = NS.grid(picks, NS.villageCard, 'row-cols-1 row-cols-sm-2 row-cols-lg-3');
  });

  NS.listAkatsuki().then(function (list) {
    var members = list.filter(function (c) { return c.thumbnailUrl; }).slice(0, 5);
    NS.$('#home-akatsuki').innerHTML = NS.charGrid(members, true);
  });
});
