NS.start(function () {
  var root = NS.$('#powers-root');
  var tab = NS.params().get('tab') || 'kekkei-genkai';
  root.innerHTML = NS.loading('Unrolling the scroll…');

  Promise.all([NS.listGroups('kekkei-genkai'), NS.listBeasts(), NS.allCharacters()]).then(function (r) {
    var kgs = r[0], beasts = r[1].slice().sort(function (a, b) { return (NS.lore.beastTails[a.name] || 99) - (NS.lore.beastTails[b.name] || 99); });
    var jutsu = NS.jutsuIndex(), limit = 30;

    var kgHtml = '<div class="pt-xl">' + NS.grid(kgs, function (g) {
      return NS.groupCard(g, 'group.html?kind=kekkei-genkai&id=' + g.id, NS.lore.kekkeiGenkai[g.name.toLowerCase()] || 'A rare bloodline ability of the shinobi world.', 'eye');
    }, 'row-cols-1 row-cols-sm-2 row-cols-lg-3') + '</div>';

    var beastHtml = '<div class="pt-xl">' + NS.grid(beasts, NS.beastCard, 'row-cols-2 row-cols-sm-3 row-cols-lg-5') + '</div>';

    var natureHtml = '<div class="pt-xl">' + NS.grid(Object.keys(NS.lore.natures), function (name) {
      var n = NS.lore.natures[name];
      return '<a class="ns-card-link d-flex flex-column gap-md p-xl tone-' + n.tone + '" href="nature.html?name=' + NS.enc(name) + '"><span class="ns-dot ns-dot-sm">' + NS.icon('stars') + '</span><h3 class="text-brush">' + NS.esc(name) + '</h3><p class="text-label-sm tx-secondary">' + NS.esc(n.blurb) + '</p></a>';
    }, 'row-cols-1 row-cols-sm-2 row-cols-lg-4') + '</div>';

    var jutsuHtml = '<div class="d-flex flex-column gap-xl pt-xl"><div class="measure"><label class="form-label" for="jutsu-q">Search jutsu</label>' +
      '<div class="input-group"><span class="input-group-text">' + NS.icon('search') + '</span><input class="form-control" id="jutsu-q" type="search" placeholder="Rasengan, Chidori…" autocomplete="off"></div></div>' +
      '<p class="text-label-sm tx-secondary">Compiled from ' + jutsu.length.toLocaleString() + ' techniques across the character records.</p><div id="jutsu-list"></div><div class="text-center" id="jutsu-more"></div></div>';

    root.innerHTML = NS.tabs('power-tabs', [
      { id: 'kekkei-genkai', label: 'Kekkei Genkai', html: kgHtml }, { id: 'tailed-beasts', label: 'Tailed Beasts', html: beastHtml },
      { id: 'jutsu', label: 'Jutsu', html: jutsuHtml }, { id: 'natures', label: 'Nature Releases', html: natureHtml }], tab);

    function renderJutsu() {
      var term = NS.$('#jutsu-q').value.trim().toLowerCase();
      var list = jutsu.filter(function (j) { return j.name.toLowerCase().indexOf(term) >= 0; });
      NS.$('#jutsu-list').innerHTML = NS.grid(list.slice(0, limit), function (j) {
        return '<a class="ns-card-link d-flex align-items-center gap-lg p-lg" href="jutsu.html?name=' + NS.enc(j.name) + '"><span class="ns-dot ns-dot-ink">' + NS.icon('journal-text') + '</span>' +
          '<span class="flex-grow-1 min-w-0 d-flex flex-column gap-xs"><span class="text-label fw-semibold">' + NS.esc(j.name) + '</span><span class="text-label-sm tx-secondary">' + (j.nature || 'Technique') + ' · ' + j.users.length + (j.users.length === 1 ? ' user' : ' users') + '</span></span>' + NS.icon('chevron-right', 'tx-tertiary') + '</a>';
      }, 'row-cols-1 row-cols-md-2');
      NS.$('#jutsu-more').innerHTML = limit < list.length ? '<button class="btn btn-primary" type="button" id="jutsu-more-btn">Show more</button>' : '';
      var b = NS.$('#jutsu-more-btn');
      if (b) b.addEventListener('click', function () { limit += 30; renderJutsu(); });
    }
    NS.$('#jutsu-q').addEventListener('input', function () { limit = 30; renderJutsu(); });
    renderJutsu();
  });
});
