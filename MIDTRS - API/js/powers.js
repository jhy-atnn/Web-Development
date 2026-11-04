NS.start(function () {
  var root = NS.$('#powers-root');
  var tab = NS.params().get('tab') || 'kekkei-genkai';
  root.innerHTML = NS.loading('Unrolling the scroll…');

  Promise.all([NS.listGroups('kekkei-genkai'), NS.listBeasts(), NS.allCharacters()]).then(function (r) {
    var kgs = r[0], beasts = r[1].slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
    var jutsu = NS.jutsuIndex(), limit = 30;
    var natureMap = new Map();
    r[2].forEach(function (character) {
      character.natureTypes.forEach(function (rawName) {
        var name = rawName.replace(/\s+\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
        if (!/ Release$/i.test(name)) return;
        var entry = natureMap.get(name) || { name: name, users: 0 };
        entry.users++;
        natureMap.set(name, entry);
      });
    });
    var natures = Array.from(natureMap.values()).sort(function (a, b) { return b.users - a.users || a.name.localeCompare(b.name); });

    var kgHtml = '<div class="pt-xl">' + NS.grid(kgs, function (g) {
      return NS.imageCard(g.name, 'group.html?kind=kekkei-genkai&id=' + g.id,
        '<div class="d-flex justify-content-end">' + NS.badge(g.total + (g.total === 1 ? ' member' : ' members'), 'secondary') + '</div>' +
        '<div class="d-flex flex-column gap-md mt-auto"><h3 class="text-brush">' + NS.esc(g.name) + '</h3>' +
        '<p class="text-label-sm clamp-3">' + NS.esc(g.total + (g.total === 1 ? ' known user' : ' known users') + ' in the live API records.') + '</p></div>');
    }, 'row-cols-1 row-cols-sm-2 row-cols-lg-3') + '</div>';

    var beastHtml = '<div class="pt-xl">' + NS.grid(beasts, NS.beastCard, 'row-cols-2 row-cols-sm-3 row-cols-lg-5') + '</div>';

    var natureHtml = '<div class="pt-xl">' + NS.grid(natures, function (nature) {
      return NS.imageCard(nature.name, 'nature.html?name=' + NS.enc(nature.name),
        '<div class="d-flex flex-column gap-md mt-auto"><span class="text-kicker">Nature Release</span>' +
        '<h3 class="text-brush">' + NS.esc(nature.name) + '</h3><p class="text-label-sm clamp-3">' + NS.esc(nature.users + (nature.users === 1 ? ' known user' : ' known users') + ' in the live API records.') + '</p></div>');
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
        return NS.imageCard(j.name, 'jutsu.html?name=' + NS.enc(j.name),
          '<div class="d-flex flex-column gap-md mt-auto"><span class="text-kicker">' + NS.esc(j.nature || 'Technique') + '</span>' +
          '<h3 class="text-brush">' + NS.esc(j.name) + '</h3><span class="text-label-sm">' + j.users.length +
          (j.users.length === 1 ? ' known user' : ' known users') + '</span></div>');
      }, 'row-cols-1 row-cols-md-2');
      NS.$('#jutsu-more').innerHTML = limit < list.length ? '<button class="btn btn-primary" type="button" id="jutsu-more-btn">Show more</button>' : '';
      var b = NS.$('#jutsu-more-btn');
      if (b) b.addEventListener('click', function () { limit += 30; renderJutsu(); });
    }
    NS.$('#jutsu-q').addEventListener('input', function () { limit = 30; renderJutsu(); });
    renderJutsu();
  });
});
