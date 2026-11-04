(function () {
  'use strict';
  var NS = (window.NS = window.NS || {});

  NS.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var esc = NS.esc;
  NS.$ = function (sel, root) { return (root || document).querySelector(sel); };
  NS.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  NS.params = function () { return new URLSearchParams(window.location.search); };
  NS.icon = function (name, cls) {
    return '<svg class="icon ' + (cls || '') + '" aria-hidden="true"><use href="img/icons.svg#i-' + name + '"></use></svg>';
  };
  NS.enc = encodeURIComponent;
  NS.debounce = function (fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms || 350); }; };
  NS.capital = function (s) { return String(s).replace(/^./, function (c) { return c.toUpperCase(); }); };

  var VILLAGE_TONES = {};
  NS.toneClass = function (village) {
    var lore = NS.lore && NS.lore.villages[String(village || '').toLowerCase()];
    return 'tone-' + (lore ? lore.tone : 'default');
  };

  NS.art = function (src, alt, cls) {
    if (!src) return '<div class="art-fallback ' + (cls || '') + '" role="img" aria-label="' + esc(alt) + '">' + esc(String(alt).charAt(0)) + '</div>';
    return '<img data-art src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" referrerpolicy="no-referrer" class="' + (cls || '') + '">';
  };
  function showArtFallback(image) {
    var d = document.createElement('div');
    d.className = 'art-fallback ' + (image.className || '');
    d.setAttribute('role', 'img');
    d.setAttribute('aria-label', image.alt);
    d.textContent = (image.alt || '?').charAt(0);
    image.replaceWith(d);
  }
  function loadWikiImage(image) {
    if (image.dataset.wikiFallback) {
      console.error('Could not load a character image for ' + image.alt + '.');
      showArtFallback(image);
      return;
    }
    image.dataset.wikiFallback = 'requested';
    var url = 'https://naruto.fandom.com/api.php?action=query&titles=' + encodeURIComponent(image.alt) +
      '&prop=pageimages&format=json&pithumbsize=600&origin=*';
    fetch(url).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    }).then(function (data) {
      var pages = data.query && data.query.pages;
      var page = pages && pages[Object.keys(pages)[0]];
      var imageUrl = page && page.thumbnail && page.thumbnail.source;
      if (!imageUrl) {
        showArtFallback(image);
        return;
      }
      image.dataset.wikiFallback = 'loaded';
      image.src = imageUrl;
    }).catch(function (error) {
      console.error('Could not load a character image for ' + image.alt + '.', error);
      showArtFallback(image);
    });
  }
  document.addEventListener('load', function (e) {
    var image = e.target;
    if (image && image.tagName === 'IMG' && image.hasAttribute('data-art') &&
        image.naturalWidth === 300 && image.naturalHeight === 171) {
      loadWikiImage(image);
    }
  }, true);
  document.addEventListener('error', function (e) {
    var image = e.target;
    if (image && image.tagName === 'IMG' && image.hasAttribute('data-art')) loadWikiImage(image);
  }, true);

  var ROLE_BADGE = { main: 'badge-brand', antagonist: 'badge-danger', supporting: 'badge-secondary', background: 'badge-default' };
  NS.badge = function (label, variant) { return '<span class="badge badge-' + (variant || 'default') + '">' + esc(label) + '</span>'; };

  NS.characterCard = function (c, compact) {
    return '<a class="ns-card-link char-card ' + (compact ? 'compact ' : '') + NS.toneClass(c.village) + '" href="character.html?id=' + c.id + '" aria-label="Open ' + esc(c.name) + '">' +
      '<div class="portrait">' + NS.art(c.imageUrl || c.thumbnailUrl, c.name) +
      (c.nameJapanese ? '<span class="kanji-tag text-kanji">' + esc(c.nameJapanese) + '</span>' : '') + '</div>' +
      '<div class="p-xl d-flex flex-column gap-md">' +
      '<span class="text-label fw-semibold">' + esc(c.name) + '</span>' +
      '<span class="text-label-sm tx-secondary">' + esc([c.rank, c.village].filter(Boolean).join(' · ') || 'Shinobi') + '</span>' +
      '<div class="d-flex flex-wrap gap-xs"><span class="badge ' + ROLE_BADGE[c.role] + '">' + esc(c.role) + '</span>' +
      (c.clan ? NS.badge(c.clan, 'default') : '') + '</div></div></a>';
  };

  NS.grid = function (items, render, cols) {
    return '<ul class="list-reset row gutter-xl ' + (cols || 'row-cols-2 row-cols-sm-3 row-cols-lg-4 row-cols-xl-5') + '">' +
      items.map(function (i) { return '<li class="col">' + render(i) + '</li>'; }).join('') + '</ul>';
  };
  NS.charGrid = function (items, compact, cols) {
    return NS.grid(items, function (c) { return NS.characterCard(c, compact); }, cols);
  };
  NS.skeletonGrid = function (n) {
    var cell = '<div class="skeleton skeleton-card"></div>';
    return '<div class="row gutter-xl row-cols-2 row-cols-sm-3 row-cols-lg-4 row-cols-xl-5" aria-busy="true">' +
      new Array(n + 1).join('<div class="col">' + cell + '</div>') + '</div>';
  };
  NS.empty = function (title, text, action) {
    return '<div class="ns-card p-4xl text-center d-flex flex-column align-items-center gap-lg"><h2 class="text-display">' + esc(title) + '</h2>' +
      '<p class="text-label-sm tx-secondary measure">' + esc(text) + '</p>' + (action || '') + '</div>';
  };
  NS.ribbon = function (text, tone) { return '<h3 class="ribbon ' + (tone ? 'ribbon-' + tone : '') + '">' + esc(text) + '</h3>'; };
  NS.scroll = function (inner) { return '<div class="scroll"><div class="scroll-body">' + inner + '</div></div>'; };
  NS.sectionTitle = function (kicker, title, actionLabel, actionHref) {
    return '<div class="d-flex flex-wrap align-items-end justify-content-between gap-lg section-title"><div class="d-flex flex-column gap-xs">' +
      (kicker ? '<span class="text-kicker tx-brand">' + esc(kicker) + '</span>' : '') + '<h2 class="text-display">' + esc(title) + '</h2></div>' +
      (actionLabel ? '<a class="btn btn-neutral btn-sm" href="' + actionHref + '">' + esc(actionLabel) + NS.icon('arrow-right') + '</a>' : '') + '</div>';
  };
  NS.fact = function (label, value) {
    if (value == null || value === '' || (Array.isArray(value) && !value.length)) return '';
    return '<div class="fact"><dt>' + esc(label) + '</dt><dd>' + value + '</dd></div>';
  };
  NS.loading = function (text) { return '<p class="text-label-sm tx-secondary">' + esc(text || 'Unrolling the scroll…') + '</p>'; };

  NS.villageCard = function (g) {
    var lore = NS.lore.villages[g.name.toLowerCase()];
    return '<a class="ns-card-link village-card ' + NS.toneClass(g.name) + '" href="group.html?kind=villages&id=' + g.id + '" aria-label="Open ' + esc(g.name) + '">' +
      '<span class="d-block tone-solid hero-bar-sm"></span>' +
      '<span class="watermark" aria-hidden="true">' + esc(lore ? lore.kanji.charAt(0) : g.name.charAt(0)) + '</span>' +
      '<div class="position-relative d-flex flex-column gap-md p-xl">' +
      '<div class="d-flex flex-column gap-xs">' + (lore ? '<span class="text-kanji text-label tx-secondary">' + esc(lore.kanji) + '</span>' : '') +
      '<h3 class="text-display">' + esc(g.name) + '</h3></div>' +
      '<p class="text-label-sm tx-secondary">' + esc(lore ? lore.country + ' · led by the ' + lore.leader : 'A place in the shinobi world') + '</p>' +
      (lore ? '<p class="text-label-sm tx-secondary clamp-3">' + esc(lore.blurb) + '</p>' : '') +
      '<div class="mt-sm">' + NS.badge(g.total.toLocaleString() + ' known ninja', 'secondary') + '</div></div></a>';
  };
  NS.groupCard = function (g, href, blurb, icon) {
    return '<a class="ns-card-link d-flex flex-column gap-md p-xl" href="' + href + '" aria-label="Open ' + esc(g.name) + '">' +
      '<div class="d-flex align-items-center justify-content-between gap-md"><span class="ns-dot ns-dot-soft">' + NS.icon(icon || 'people') + '</span>' +
      NS.badge(g.total + (g.total === 1 ? ' member' : ' members'), 'secondary') + '</div>' +
      '<h3 class="text-brush">' + esc(g.name) + '</h3>' + (blurb ? '<p class="text-label-sm tx-secondary clamp-3">' + esc(blurb) + '</p>' : '') + '</a>';
  };
  NS.beastCard = function (c) {
    var tails = NS.lore.beastTails[c.name];
    return '<a class="ns-card-link d-flex flex-column" href="character.html?id=' + c.id + '&type=beast" aria-label="Open ' + esc(c.name) + '">' +
      '<div class="position-relative ratio ratio-1x1 bg-brand-soft-faint">' + NS.art(c.imageUrl, c.name, 'p-lg') +
      (tails ? '<span class="text-brush ns-dot ns-dot-ink beast-tails">' + tails + '</span>' : '') + '</div>' +
      '<div class="p-lg d-flex flex-column gap-xs"><span class="text-label fw-semibold">' + esc(c.name) + '</span>' +
      '<span class="text-label-sm tx-secondary">' + (tails ? tails + '-Tailed Beast' : 'Tailed Beast') + '</span></div></a>';
  };

  NS.tabs = function (id, tabs, active) {
    active = active || tabs[0].id;
    return '<ul class="nav nav-tabs" id="' + id + '" role="tablist">' + tabs.map(function (t) {
      return '<li class="nav-item" role="presentation"><button class="nav-link ' + (t.id === active ? 'active' : '') + '" id="' + id + '-' + t.id + '-tab" data-bs-toggle="tab" data-bs-target="#' + id + '-' + t.id + '" type="button" role="tab" aria-controls="' + id + '-' + t.id + '" aria-selected="' + (t.id === active) + '">' + esc(t.label) + '</button></li>';
    }).join('') + '</ul><div class="tab-content">' + tabs.map(function (t) {
      return '<div class="tab-pane fade ' + (t.id === active ? 'show active' : '') + '" id="' + id + '-' + t.id + '" role="tabpanel" aria-labelledby="' + id + '-' + t.id + '-tab" tabindex="0">' + t.html + '</div>';
    }).join('') + '</div>';
  };

  NS.pageHero = function (o) {
    return '<section class="hero-sky"><div class="hero-watermark text-kanji text-kanji-watermark" aria-hidden="true">' + esc(o.kanji || '') + '</div>' +
      '<div class="container position-relative py-4xl py-md-5xl"><span class="text-kicker tx-gold">' + esc(o.kicker) + '</span>' +
      '<h1 class="text-display-lg text-ink-shadow mt-md">' + esc(o.title) + '</h1>' +
      (o.text ? '<p class="text-label tx-on-brand-soft mt-xl measure-wide">' + esc(o.text) + '</p>' : '') + '</div></section>';
  };

  var NAV = [
    { key: 'home', href: 'index.html', label: 'Home' },
    { key: 'characters', href: 'characters.html', label: 'Characters' },
    { key: 'villages', href: 'villages.html', label: 'Villages' },
    { key: 'clans', href: 'clans.html', label: 'Clans & Teams' },
    { key: 'powers', href: 'powers.html', label: 'Powers' },
    { key: 'akatsuki', href: 'akatsuki.html', label: 'Akatsuki' },
  ];

  function themeIcon() { return NS.icon(document.documentElement.dataset.bsTheme === 'dark' ? 'sun' : 'moon-stars'); }

  function renderHeader() {
    var host = NS.$('#site-header');
    if (!host) return;
    var active = document.body.dataset.nav;
    host.className = 'ns-navbar';
    host.innerHTML =
      '<div class="container"><nav class="navbar navbar-expand-lg" aria-label="Primary">' +
      '<a class="navbar-brand" href="index.html" aria-label="NaruSeeki home"><img class="brand-mark" src="img/leaf-dark.png" alt="">' +
      '<span class="text-brush tx-brand text-ink-shadow">NaruSeeki</span></a>' +
      '<div class="d-flex align-items-center gap-md ms-auto order-lg-3">' +
      '<a class="btn btn-primary btn-sm d-none d-sm-inline-flex" href="characters.html?focus=1">' + NS.icon('search') + 'Search</a>' +
      '<button class="btn btn-subtle btn-on-dark btn-icon" id="theme-toggle" type="button" aria-label="Toggle colour theme" title="Toggle colour theme">' + themeIcon() + '</button>' +
      '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Open menu">' + NS.icon('list', 'icon-lg') + '</button></div>' +
      '<div class="collapse navbar-collapse order-lg-2" id="mainNav"><ul class="navbar-nav ms-lg-2xl gap-xs pb-xl pb-lg-0">' +
      NAV.map(function (n) {
        return '<li class="nav-item"><a class="nav-link ' + (n.key === active ? 'active' : '') + '" ' + (n.key === active ? 'aria-current="page" ' : '') + 'href="' + n.href + '">' + n.label + '</a></li>';
      }).join('') + '</ul></div></nav></div>';
    NS.$('#theme-toggle').addEventListener('click', function () {
      var next = document.documentElement.dataset.bsTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.bsTheme = next;
      try { localStorage.setItem('naruseeki-theme', next); } catch (e) { }
      this.innerHTML = themeIcon();
    });
  }

  function renderFooter() {
    var host = NS.$('#site-footer');
    if (!host) return;
    host.className = 'bg-ink mt-6xl';
    host.innerHTML =
      '<div class="container py-4xl"><div class="row gutter-3xl">' +
      '<div class="col-md-4 d-flex flex-column gap-lg"><img class="footer-wordmark" src="img/naruseeki-wordmark.png" alt="NaruSeeki">' +
      '<p class="text-label-sm tx-on-brand-soft">A Naruto Shippuden encyclopedia: characters, villages, clans and the powers of the shinobi world.</p></div>' +
      '<div class="col-md-4 d-flex flex-column gap-md"><h2 class="text-brush-sm tx-brand">Explore</h2><ul class="list-reset row row-cols-2 gap-y-md">' +
      NAV.slice(1).map(function (n) { return '<li class="col"><a class="text-label-sm tx-on-brand-soft footer-link" href="' + n.href + '">' + n.label + '</a></li>'; }).join('') + '</ul></div>' +
      '<div class="col-md-4 d-flex flex-column align-items-start gap-md"><h2 class="text-brush-sm tx-brand">Data</h2>' +
      '<p class="text-label-sm tx-on-brand-soft">Character and group data loads directly from the live Dattebayo Naruto API.</p>' +
      '<button class="btn btn-neutral btn-sm" type="button" data-bs-toggle="modal" data-bs-target="#aboutModal">' + NS.icon('info-circle') + 'About the data</button></div>' +
      '</div></div><div class="bg-ink-deep py-lg"><div class="container"><p class="text-meta tx-on-brand-faint">NaruSeeki is a fan-made prototype. Naruto and all related characters are property of Masashi Kishimoto, Shueisha and TV Tokyo. Headline lettering uses the Ninja Naruto typeface.</p></div></div>';
  }

  function renderExtras() {
    var el = document.createElement('div');
    el.innerHTML =
      '<div class="modal fade" id="aboutModal" tabindex="-1" aria-labelledby="aboutTitle" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content">' +
      '<div class="modal-header"><h2 class="text-title" id="aboutTitle">About the data</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>' +
      '<div class="modal-body d-flex flex-column gap-lg text-label-sm tx-secondary">' +
      '<p>Character records follow the NaruSeeki schema: identity, physical traits, village and rank, jutsu and nature types, relations, voice actors and media debut.</p>' +
      '<p>Character and group records load directly from the open Dattebayo Naruto API (same fields as the NarutoDB reference). Fields the API does not track (eye and hair colour, hair length, animal ears, filler flag) are intentionally left out. Biographies and descriptive lore are hand-written additions; roles and tags are derived from API data.</p>' +
      '<p>This site does not bundle an offline copy of API records. If the API is unreachable, API-powered pages and features cannot load until it is available again.</p>' +
      '<a class="tx-brand text-decoration-underline" href="https://dattebayo-api.onrender.com" target="_blank" rel="noreferrer noopener">dattebayo-api.onrender.com</a></div>' +
      '<div class="modal-footer"><button type="button" class="btn btn-primary" data-bs-dismiss="modal">Understood</button></div></div></div></div>' +
      '<div class="toast-zone"><div class="toast align-items-center" id="apiToast" role="status" aria-live="polite" aria-atomic="true"><div class="d-flex">' +
      '<div class="toast-body">The live Naruto API is unavailable. Check your connection or try again later.</div>' +
      '<button type="button" class="btn-close me-lg m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div></div></div>';
    document.body.appendChild(el);
    var show = function () { bootstrap.Toast.getOrCreateInstance(NS.$('#apiToast'), { autohide: false }).show(); };
    if (NS.status() === 'unavailable') show();
    document.addEventListener('naruseeki:status', function (e) { if (e.detail === 'unavailable') show(); });
  }

  NS.start = function (main) {
    renderHeader();
    renderFooter();
    renderExtras();
    NS.ready().then(main).catch(function (err) {
      console.error(err);
      var m = NS.$('#main');
      if (m) m.innerHTML = '<div class="container py-5xl">' + NS.empty('Could not load site descriptions', 'Open this site through a local web server (for example: python -m http.server) so the hand-written lore file can be fetched.') + '</div>';
    });
  };
})();
