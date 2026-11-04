NS.start(function () {
  var root = NS.$('#villages-root'), q = NS.$('#q'), groups = [];
  root.innerHTML = NS.loading('Unrolling the map…');
  function render() {
    var term = q.value.trim().toLowerCase();
    var list = groups.filter(function (g) { return g.name.toLowerCase().indexOf(term) >= 0; });
    var major = list.filter(function (g) { return NS.lore.villages[g.name.toLowerCase()]; });
    var other = list.filter(function (g) { return !NS.lore.villages[g.name.toLowerCase()]; });
    if (!list.length) { root.innerHTML = NS.empty('No village found', 'Check the spelling or clear the search.'); return; }
    var cols = 'row-cols-1 row-cols-sm-2 row-cols-lg-3';
    root.innerHTML =
      (major.length ? NS.sectionTitle('Great and minor nations', 'Major villages') + NS.grid(major, NS.villageCard, cols) : '') +
      (other.length ? '<div class="mt-5xl">' + NS.sectionTitle('Lesser-known places', 'Other villages & locations') + NS.grid(other, NS.villageCard, cols) + '</div>' : '');
  }
  NS.listGroups('villages').then(function (g) { groups = g; render(); });
  q.addEventListener('input', render);
});
