NS.start(function () {
  var root = NS.$('#clans-root'), q = NS.$('#q');
  var data = { clans: [], teams: [] }, limit = { clans: 24, teams: 24 };
  var tab = NS.params().get('tab') === 'teams' ? 'teams' : 'clans';
  root.innerHTML = NS.loading('Unrolling the registry…');

  function list(kind) {
    var term = q.value.trim().toLowerCase();
    var items = data[kind].filter(function (g) { return g.name.toLowerCase().indexOf(term) >= 0; });
    if (!items.length) return '<div class="pt-xl">' + NS.empty('Nothing found', 'Try a different search.') + '</div>';
    var html = NS.grid(items.slice(0, limit[kind]), function (g) {
      var blurb = g.total + (g.total === 1 ? ' known member' : ' known members') + ' in the live API records.';
      var href = 'group.html?kind=' + (kind === 'clans' ? 'clans' : 'teams') + '&id=' + g.id;
      return kind === 'clans' ? NS.clanCard(g, href, blurb) : NS.groupCard(g, href, blurb, 'people');
    }, 'row-cols-1 row-cols-sm-2 row-cols-lg-3');
    return '<div class="pt-xl">' + html + (limit[kind] < items.length ? '<div class="text-center mt-3xl"><button class="btn btn-primary" type="button" data-more="' + kind + '">Show more</button></div>' : '') + '</div>';
  }
  function render() {
    root.innerHTML = NS.tabs('clan-tabs', [{ id: 'clans', label: 'Clans', html: list('clans') }, { id: 'teams', label: 'Teams', html: list('teams') }], tab);
    NS.$$('#clan-tabs button').forEach(function (b) { b.addEventListener('shown.bs.tab', function () { tab = b.id.indexOf('teams') > 0 ? 'teams' : 'clans'; }); });
  }
  Promise.all([NS.listGroups('clans'), NS.listGroups('teams')]).then(function (r) { data.clans = r[0]; data.teams = r[1]; render(); });
  q.addEventListener('input', render);
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-more]');
    if (b) { limit[b.dataset.more] += 24; render(); }
  });
});
