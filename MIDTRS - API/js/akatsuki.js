NS.start(function () {
  var root = NS.$('#akatsuki-root'), q = NS.$('#q'), all = [];
  root.innerHTML = NS.skeletonGrid(10);
  function render() {
    var term = q.value.trim().toLowerCase();
    var list = all.filter(function (c) { return c.name.toLowerCase().indexOf(term) >= 0; });
    root.innerHTML = list.length ? NS.charGrid(list) : NS.empty('No member found', 'No Akatsuki member matches that name.');
  }
  NS.listAkatsuki().then(function (l) { all = l; render(); });
  q.addEventListener('input', render);
});
