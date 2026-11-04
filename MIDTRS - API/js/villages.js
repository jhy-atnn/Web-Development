NS.start(function () {
  var root = NS.$('#villages-root'), q = NS.$('#q'), groups = [];
  root.innerHTML = NS.loading('Unrolling the map…');
  function render() {
    var term = q.value.trim().toLowerCase();
    var list = groups.filter(function (g) { return g.name.toLowerCase().indexOf(term) >= 0; });
    if (!list.length) { root.innerHTML = NS.empty('No village found', 'Check the spelling or clear the search.'); return; }
    var cols = 'row-cols-1 row-cols-sm-2 row-cols-lg-3';
    root.innerHTML = NS.grid(list, NS.villageCard, cols);
  }
  NS.listGroups('villages').then(function (g) { groups = g; render(); });
  q.addEventListener('input', render);
});
