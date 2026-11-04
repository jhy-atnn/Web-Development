NS.start(function () {
  var PAGE = 20;
  var params = NS.params();
  var state = { q: params.get('q') || '', village: params.get('village') || '', gender: '', nature: '', view: 'grid', items: [], page: 1, total: 0, group: null, token: 0, loading: true };
  var $q = NS.$('#q'), $v = NS.$('#f-village'), $gender = NS.$('#f-gender'), $nature = NS.$('#f-nature');
  $q.value = state.q;
  if (params.get('focus') === '1') $q.focus();

  var villages = [];
  NS.listGroups('villages').then(function (g) {
    villages = g;
    g.filter(function (x) { return x.total >= 5 && /gakure$/i.test(x.name); }).forEach(function (x) {
      $v.insertAdjacentHTML('beforeend', '<option value="' + x.id + '">' + NS.esc(x.name) + '</option>');
    });
    $v.value = state.village;
    reload();
  });

  function filtered() {
    return state.items.filter(function (c) {
      return (!state.gender || c.gender === state.gender) &&
        (!state.nature || c.natureTypes.some(function (n) { return n.indexOf(state.nature.split(' ')[0]) === 0; }));
    });
  }

  function chips() {
    var out = [];
    if (state.q) out.push(['q', '“' + state.q + '”', 'badge-brand']);
    if (state.village) out.push(['village', $v.options[$v.selectedIndex] ? $v.options[$v.selectedIndex].text : 'Village', 'badge-secondary']);
    ['gender', 'nature'].forEach(function (k) { if (state[k]) out.push([k, state[k], 'badge-secondary']); });
    var host = NS.$('#active-filters');
    host.innerHTML = out.length
      ? out.map(function (o) { return '<span class="badge ' + o[2] + ' d-inline-flex align-items-center gap-xs">' + NS.esc(o[1]) + '<button type="button" class="btn-close chip-close" data-clear="' + o[0] + '" aria-label="Remove filter"></button></span>'; }).join('') +
      '<button class="btn btn-subtle btn-sm" type="button" data-clear="all">Clear all</button>'
      : '';
    NS.$('#filters-label').textContent = 'Filters' + (['village', 'gender', 'nature'].filter(function (k) { return state[k]; }).length ? ' (' + ['village', 'gender', 'nature'].filter(function (k) { return state[k]; }).length + ')' : '');
  }

  function render() {
    chips();
    var list = filtered();
    var count = NS.$('#result-count'), res = NS.$('#results'), more = NS.$('#more');
    if (state.loading && !state.items.length) {
      count.textContent = 'Searching the scrolls…';
      res.innerHTML = NS.skeletonGrid(10);
      more.innerHTML = '';
      return;
    }
    count.innerHTML = list.length + ' shown <span class="text-label-sm tx-secondary">· ' + state.total.toLocaleString() + ' in this view</span>';
    if (!list.length) {
      res.innerHTML = NS.empty('No shinobi found', 'Try a different name or loosen a filter. Role, gender and nature filters apply to the characters loaded so far.', '<button class="btn btn-primary" type="button" data-clear="all">Reset filters</button>');
    } else if (state.view === 'grid') {
      res.innerHTML = NS.charGrid(list);
    } else {
      res.innerHTML = NS.grid(list, function (c) {
        return '<a class="ns-card-link d-flex align-items-center gap-lg p-lg ' + NS.toneClass(c.village) + '" href="character.html?id=' + c.id + '">' +
          '<div class="list-thumb tone-soft">' + NS.art(c.thumbnailUrl, c.name) + '</div>' +
          '<div class="flex-grow-1 min-w-0 d-flex flex-column gap-xs"><span class="text-label fw-semibold">' + NS.esc(c.name) + '</span>' +
          '<span class="text-label-sm tx-secondary text-truncate">' + NS.esc([c.rank, c.village, c.clan].filter(Boolean).join(' · ') || 'Shinobi') + '</span></div>' +
          NS.badge(c.classification[0] || c.rank || 'Shinobi', 'secondary') + '</a>';
      }, 'row-cols-1 row-cols-md-2');
    }
    var hasMore = state.group ? state.page * PAGE < state.group.characters.length : state.page * PAGE < state.total;
    more.innerHTML = hasMore && list.length ? '<button class="btn btn-primary" id="load-more" type="button"' + (state.loading ? ' disabled' : '') + '>' + (state.loading ? 'Unrolling…' : 'Load more shinobi') + '</button>' : '';
  }

  function reload() {
    var token = ++state.token;
    state.loading = true; state.items = []; state.page = 1;
    render();
    var job;
    if (state.village) {
      var g = villages.filter(function (v) { return String(v.id) === state.village; })[0];
      if (!g) return;
      state.group = g;
      job = NS.getCharactersByIds(g.characters.slice(0, PAGE)).then(function (res) {
        if (state.q) res = res.filter(function (c) { return c.name.toLowerCase().indexOf(state.q.toLowerCase()) >= 0; });
        return { items: res, total: Math.max(g.total, g.characters.length) };
      });
    } else {
      state.group = null;
      job = NS.listCharacters({ page: 1, limit: PAGE, name: state.q || undefined });
    }
    job.then(function (r) {
      if (token !== state.token) return;
      state.items = r.items; state.total = r.total; state.loading = false; render();
    }).catch(function () { if (token === state.token) { state.loading = false; render(); } });
  }

  function loadMore() {
    var token = ++state.token, next = state.page + 1;
    state.loading = true; render();
    var job = state.group
      ? NS.getCharactersByIds(state.group.characters.slice((next - 1) * PAGE, next * PAGE))
      : NS.listCharacters({ page: next, limit: PAGE, name: state.q || undefined }).then(function (r) { return r.items; });
    job.then(function (items) {
      if (token !== state.token) return;
      state.items = state.items.concat(items); state.page = next; state.loading = false; render();
    });
  }

  $q.addEventListener('input', NS.debounce(function () { state.q = $q.value.trim(); reload(); }, 350));
  $v.addEventListener('change', function () { state.village = $v.value; reload(); });
  $gender.addEventListener('change', function () { state.gender = $gender.value; render(); });
  $nature.addEventListener('change', function () { state.nature = $nature.value; render(); });
  NS.$$('[data-view]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.view = b.dataset.view;
      NS.$$('[data-view]').forEach(function (x) { var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-pressed', on); });
      render();
    });
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-clear], #load-more');
    if (!t) return;
    if (t.id === 'load-more') return loadMore();
    var k = t.dataset.clear, refetch = false;
    var all = k === 'all' ? ['q', 'village', 'gender', 'nature'] : [k];
    all.forEach(function (key) { if (key === 'q' || key === 'village') refetch = true; state[key] = ''; });
    $q.value = state.q; $v.value = state.village; $gender.value = state.gender; $nature.value = state.nature;
    refetch ? reload() : render();
  });
});
