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
    if (!src) return '<div data-art-placeholder data-art-name="' + esc(alt) + '" class="art-fallback ' + (cls || '') + '" role="img" aria-label="' + esc(alt) + '">' + esc(String(alt).charAt(0)) + '</div>';
    return '<img data-art src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" referrerpolicy="no-referrer" class="' + (cls || '') + '">';
  };
  var wikiImageRequests = {};
  function getWikiImage(name) {
    var key = String(name || '').toLowerCase();
    if (wikiImageRequests[key]) return wikiImageRequests[key];
    var url = 'https://naruto.fandom.com/api.php?action=query&titles=' + encodeURIComponent(name) +
      '&prop=pageimages&format=json&pithumbsize=600&origin=*';
    wikiImageRequests[key] = fetch(url).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    }).then(function (data) {
      var pages = data.query && data.query.pages;
      var page = pages && pages[Object.keys(pages)[0]];
      return page && page.thumbnail && page.thumbnail.source || null;
    }).catch(function (error) {
      delete wikiImageRequests[key];
      throw error;
    });
    return wikiImageRequests[key];
  }
  var wikiCardImageRequests = {}, wikiCardImageQueue = [], wikiCardImageTimer = null;
  function flushWikiCardImageQueue() {
    wikiCardImageTimer = null;
    var batch = wikiCardImageQueue.splice(0, 10);
    if (wikiCardImageQueue.length) wikiCardImageTimer = setTimeout(flushWikiCardImageQueue, 0);
    if (!batch.length) return;
    var names = batch.map(function (item) { return item.name; });
    var url = 'https://naruto.fandom.com/api.php?action=query&titles=' + encodeURIComponent(names.join('|')) +
      '&prop=pageimages&format=json&pithumbsize=900&origin=*';
    fetch(url).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    }).then(function (data) {
      var pages = data.query && data.query.pages || {};
      batch.forEach(function (item) {
        var page = Object.keys(pages).map(function (id) { return pages[id]; }).filter(function (candidate) {
          return candidate.title.toLowerCase() === item.name.toLowerCase();
        })[0];
        item.resolve(page && page.thumbnail && page.thumbnail.source || null);
      });
    }).catch(function () {
      batch.forEach(function (item) { item.resolve(null); });
    });
  }
  function getWikiCardFallbackImage(name) {
    var searchUrl = 'https://naruto.fandom.com/api.php?action=query&generator=search&gsrsearch=' +
      encodeURIComponent('"' + name + '"') + '&gsrlimit=10&prop=pageimages&format=json&pithumbsize=900&origin=*';
    return fetch(searchUrl).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    }).then(function (data) {
      var pages = data.query && data.query.pages;
      var nameKey = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      var page = pages && Object.keys(pages).map(function (id) { return pages[id]; }).filter(function (item) {
        return item.title.toLowerCase().replace(/[^a-z0-9]/g, '') === nameKey && item.thumbnail;
      })[0];
      return page && page.thumbnail.source || null;
    }).catch(function () {
      return null;
    }).then(function (url) {
      if (url) return url;
      var api = 'https://naruto.fandom.com/api.php?action=query&titles=' + encodeURIComponent(name) +
        '&prop=images&imlimit=50&format=json&origin=*';
      return fetch(api).then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      }).then(function (data) {
        var pages = data.query && data.query.pages;
        var page = pages && pages[Object.keys(pages)[0]];
        var nameKey = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        var files = (page && page.images || []).map(function (image) { return image.title; }).filter(function (title) {
          var file = title.replace(/^File:/i, '');
          var fileKey = file.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return /\.(?:png|jpe?g|webp)$/i.test(file) && fileKey.indexOf(nameKey) >= 0 &&
            !/(?:symbol|logo|icon|flag|map)/i.test(file);
        });
        if (!files.length) return null;
        var infoUrl = 'https://naruto.fandom.com/api.php?action=query&titles=' + encodeURIComponent(files.join('|')) +
          '&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json&origin=*';
        return fetch(infoUrl).then(function (response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return response.json();
        }).then(function (result) {
          var imagePages = result.query && result.query.pages;
          var imagePage = imagePages && imagePages[Object.keys(imagePages)[0]];
          var info = imagePage && imagePage.imageinfo && imagePage.imageinfo[0];
          return info && (info.thumburl || info.url) || null;
        });
      });
    });
  }
  function getWikiCardImage(name) {
    var key = String(name || '').toLowerCase();
    if (wikiCardImageRequests[key]) return wikiCardImageRequests[key];
    wikiCardImageRequests[key] = new Promise(function (resolve) {
      wikiCardImageQueue.push({ name: name, resolve: resolve });
      if (!wikiCardImageTimer) wikiCardImageTimer = setTimeout(flushWikiCardImageQueue, 0);
    }).then(function (url) {
      return url || getWikiCardFallbackImage(name);
    }).catch(function (error) {
      delete wikiCardImageRequests[key];
      console.error('Could not load an image for ' + name + '.', error);
      return null;
    });
    return wikiCardImageRequests[key];
  }
  var clanSymbolRequests = {}, clanSymbolQueue = [], clanSymbolTimer = null;
  function normalizedWikiTitle(title) {
    return String(title || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  function flushClanSymbolQueue() {
    clanSymbolTimer = null;
    var batch = clanSymbolQueue;
    clanSymbolQueue = [];
    if (!batch.length) return;
    var titles = batch.map(function (item) { return /\bclan$/i.test(item.name) ? item.name : item.name + ' Clan'; });
    var url = 'https://naruto.fandom.com/api.php?action=query&titles=' + encodeURIComponent(titles.join('|')) +
      '&prop=images&imlimit=100&format=json&origin=*';
    fetch(url).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    }).then(function (data) {
      var pages = data.query && data.query.pages || {};
      var matches = [];
      batch.forEach(function (item, index) {
        var target = normalizedWikiTitle(titles[index]);
        var page = Object.keys(pages).map(function (id) { return pages[id]; }).filter(function (candidate) {
          return normalizedWikiTitle(candidate.title) === target;
        })[0];
        var clanKey = normalizedWikiTitle(item.name.replace(/\s+clan$/i, ''));
        var symbol = (page && page.images || []).map(function (image) { return image.title; }).filter(function (file) {
          var key = normalizedWikiTitle(file.replace(/^File:/i, '').replace(/\.[^.]+$/, ''));
          return /symbol|crest|emblem/i.test(file) && key.indexOf(clanKey) >= 0;
        })[0];
        if (symbol) matches.push({ item: item, title: symbol });
        else item.resolve(null);
      });
      if (!matches.length) return;
      var imageUrl = 'https://naruto.fandom.com/api.php?action=query&titles=' +
        encodeURIComponent(matches.map(function (match) { return match.title; }).join('|')) +
        '&prop=imageinfo&iiprop=url&iiurlwidth=240&format=json&origin=*';
      return fetch(imageUrl).then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      }).then(function (result) {
        var imagePages = result.query && result.query.pages || {};
        matches.forEach(function (match) {
          var page = Object.keys(imagePages).map(function (id) { return imagePages[id]; }).filter(function (candidate) {
            return normalizedWikiTitle(candidate.title) === normalizedWikiTitle(match.title);
          })[0];
          var info = page && page.imageinfo && page.imageinfo[0];
          match.item.resolve(info && (info.thumburl || info.url) || null);
        });
      });
    }).catch(function (error) {
      console.error('Could not load clan symbols from the Naruto Wiki.', error);
      batch.forEach(function (item) { item.resolve(null); });
    });
  }
  function getClanSymbol(name) {
    var key = String(name || '').toLowerCase();
    if (clanSymbolRequests[key]) return clanSymbolRequests[key];
    clanSymbolRequests[key] = new Promise(function (resolve) {
      clanSymbolQueue.push({ name: name, resolve: resolve });
      if (!clanSymbolTimer) clanSymbolTimer = setTimeout(flushClanSymbolQueue, 0);
    });
    return clanSymbolRequests[key];
  }
  function getWikiEyeColor(name) {
    var pageUrl = 'https://naruto.fandom.com/api.php?action=parse&page=' + encodeURIComponent(name) +
      '&prop=sections&format=json&origin=*';
    return fetch(pageUrl).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    }).then(function (data) {
      var sections = data.parse && data.parse.sections || [];
      var appearance = sections.filter(function (section) {
        return section.line && section.line.replace(/<[^>]+>/g, '').trim().toLowerCase() === 'appearance';
      })[0];
      if (!appearance) return null;
      var url = 'https://naruto.fandom.com/api.php?action=parse&page=' + encodeURIComponent(name) +
        '&prop=wikitext&section=' + encodeURIComponent(appearance.index) + '&format=json&origin=*';
      return fetch(url).then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      }).then(function (result) {
        var text = result.parse && result.parse.wikitext && result.parse.wikitext['*'] || '';
        text = text.replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, '').replace(/<ref\b[^>]*\/>/gi, '').replace(/\{\{[\s\S]*?\}\}/g, ' ');
        var colors = 'blue|black|brown|green|grey|gray|red|purple|violet|yellow|amber|white|hazel|orange|lavender|silver|gold';
        var match = text.match(new RegExp('\\b((?:(?:pale|light|dark|deep)\\s+)?(?:' + colors + '))(?:[- ]colou?red)?\\s+eyes?\\b', 'i')) ||
          text.match(new RegExp('\\beyes?\\s+(?:are|were)\\s+((?:(?:pale|light|dark|deep)\\s+)?(?:' + colors + '))\\b', 'i'));
        return match ? match[1].replace(/\b\w/g, function (letter) { return letter.toUpperCase(); }) : null;
      });
    });
  }
  NS.wikiEyeColor = function (name) { return getWikiEyeColor(name); };
  function loadClanSymbol(target) {
    if (target.dataset.clanSymbol) return;
    target.dataset.clanSymbol = 'requested';
    getClanSymbol(target.dataset.clanName).then(function (url) {
      if (!url) {
        target.dataset.clanSymbol = 'unavailable';
        return;
      }
      if (!target.parentNode) return;
      var image = document.createElement('img');
      image.src = url;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      image.referrerPolicy = 'no-referrer';
      image.addEventListener('error', function () {
        image.remove();
        target.dataset.clanSymbol = 'failed';
        console.error('Could not display the clan symbol for ' + target.dataset.clanName + '.');
      }, { once: true });
      target.appendChild(image);
      target.dataset.clanSymbol = 'loaded';
    }).catch(function (error) {
      console.error('Could not load the clan symbol for ' + target.dataset.clanName + '.', error);
      target.dataset.clanSymbol = 'failed';
    });
  }
  function loadMissingWikiImage(placeholder) {
    if (placeholder.dataset.artFallback) return;
    placeholder.dataset.artFallback = 'requested';
    getWikiImage(placeholder.dataset.artName).then(function (url) {
      if (!url) {
        placeholder.dataset.artFallback = 'unavailable';
        return;
      }
      if (!placeholder.parentNode) return;
      var image = document.createElement('img');
      image.setAttribute('data-art', '');
      image.alt = placeholder.getAttribute('aria-label') || placeholder.dataset.artName;
      image.loading = 'lazy';
      image.referrerPolicy = 'no-referrer';
      image.className = placeholder.className.replace(/\bart-fallback\b/g, '').trim();
      image.dataset.wikiFallback = 'loaded';
      image.src = url;
      placeholder.replaceWith(image);
    }).catch(function (error) {
      console.error('Could not load a character image for ' + placeholder.dataset.artName + '.', error);
      placeholder.dataset.artFallback = 'failed';
    });
  }
  function loadVillageImage(card) {
    if (card.dataset.villageImage) return;
    card.dataset.villageImage = 'requested';
    getWikiCardImage(card.dataset.villageName).then(function (url) {
      if (!url) {
        card.dataset.villageImage = 'unavailable';
        return;
      }
      if (!card.parentNode) return;
      var image = document.createElement('img');
      image.src = url;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      image.referrerPolicy = 'no-referrer';
      image.addEventListener('error', function () {
        image.remove();
        card.dataset.villageImage = 'failed';
        console.error('Could not display a village image for ' + card.dataset.villageName + '.');
      }, { once: true });
      card.appendChild(image);
      card.dataset.villageImage = 'loaded';
    }).catch(function (error) {
      console.error('Could not load a village image for ' + card.dataset.villageName + '.', error);
      card.dataset.villageImage = 'failed';
    });
  }
  function loadPowerCardImage(card) {
    if (card.dataset.wikiCardImage) return;
    card.dataset.wikiCardImage = 'requested';
    function showImage(url) {
      if (!url || !card.parentNode) {
        card.dataset.wikiCardImage = url ? 'detached' : 'unavailable';
        return;
      }
      var image = document.createElement('img');
      image.src = url;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      image.referrerPolicy = 'no-referrer';
      image.addEventListener('load', function () { card.dataset.wikiCardImage = 'loaded'; }, { once: true });
      image.addEventListener('error', function () {
        image.remove();
        if (card.dataset.wikiCardSource && card.dataset.wikiCardImage !== 'fallback-requested') {
          card.dataset.wikiCardImage = 'fallback-requested';
          getWikiCardFallbackImage(card.dataset.wikiCardName).then(showImage).catch(function (error) {
            console.error('Could not load a fallback image for ' + card.dataset.wikiCardName + '.', error);
            showImage(null);
          });
          return;
        }
        card.dataset.wikiCardImage = 'failed';
        console.error('Could not display an image for ' + card.dataset.wikiCardName + '.');
      }, { once: true });
      card.appendChild(image);
    }
    if (card.dataset.wikiCardSource) showImage(card.dataset.wikiCardSource);
    else getWikiCardImage(card.dataset.wikiCardName).then(showImage);
  }
  var powerCardObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      powerCardObserver.unobserve(entry.target);
      loadPowerCardImage(entry.target);
    });
  }, { rootMargin: '250px' }) : null;
  function observePowerCardImage(card) {
    if (card.dataset.wikiCardImage || card.dataset.wikiCardObserved) return;
    card.dataset.wikiCardObserved = 'true';
    if (powerCardObserver) powerCardObserver.observe(card);
    else loadPowerCardImage(card);
  }
  function findMissingWikiImages(node) {
    if (node.nodeType !== 1) return;
    if (node.matches('[data-art-placeholder]')) loadMissingWikiImage(node);
    Array.prototype.forEach.call(node.querySelectorAll('[data-art-placeholder]'), loadMissingWikiImage);
    if (node.matches('[data-village-art]')) loadVillageImage(node);
    Array.prototype.forEach.call(node.querySelectorAll('[data-village-art]'), loadVillageImage);
    if (node.matches('[data-wiki-card-art]')) observePowerCardImage(node);
    Array.prototype.forEach.call(node.querySelectorAll('[data-wiki-card-art]'), observePowerCardImage);
    if (node.matches('[data-clan-art]')) loadClanSymbol(node);
    Array.prototype.forEach.call(node.querySelectorAll('[data-clan-art]'), loadClanSymbol);
  }
  var artObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      Array.prototype.forEach.call(mutation.addedNodes, findMissingWikiImages);
    });
  });
  artObserver.observe(document.documentElement, { childList: true, subtree: true });
  findMissingWikiImages(document.documentElement);
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
    getWikiImage(image.alt).then(function (imageUrl) {
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
      '<span class="village-card-background" data-village-art data-village-name="' + esc(g.name) + '" aria-hidden="true"></span>' +
      '<div class="village-card-content d-flex flex-column gap-md p-xl">' +
      '<div class="d-flex flex-column gap-xs"><h3 class="text-display">' + esc(g.name) + '</h3></div>' +
      '<p class="text-label-sm village-card-meta">' + esc(lore ? lore.country + ' · led by the ' + lore.leader : 'A place in the shinobi world') + '</p>' +
      (lore ? '<p class="text-label-sm village-card-blurb clamp-3">' + esc(lore.blurb) + '</p>' : '') +
      '<div class="mt-sm">' + NS.badge(g.total.toLocaleString() + ' known ninja', 'secondary') + '</div></div></a>';
  };
  NS.imageCard = function (name, href, content, imageUrl) {
    return '<a class="ns-card-link power-image-card" href="' + href + '" aria-label="Open ' + esc(name) + '">' +
      '<span class="power-card-background" data-wiki-card-art data-wiki-card-name="' + esc(name) + '"' +
      (imageUrl ? ' data-wiki-card-source="' + esc(imageUrl) + '"' : '') + ' aria-hidden="true"></span>' +
      '<div class="power-card-content d-flex flex-column gap-md p-xl">' + content + '</div></a>';
  };
  NS.groupCard = function (g, href, blurb, icon) {
    return '<a class="ns-card-link d-flex flex-column gap-md p-xl" href="' + href + '" aria-label="Open ' + esc(g.name) + '">' +
      '<div class="d-flex align-items-center justify-content-between gap-md"><span class="ns-dot ns-dot-soft">' + NS.icon(icon || 'people') + '</span>' +
      NS.badge(g.total + (g.total === 1 ? ' member' : ' members'), 'secondary') + '</div>' +
      '<h3 class="text-brush">' + esc(g.name) + '</h3>' + (blurb ? '<p class="text-label-sm tx-secondary clamp-3">' + esc(blurb) + '</p>' : '') + '</a>';
  };
  NS.clanCard = function (g, href, blurb) {
    return '<a class="ns-card-link clan-card d-flex flex-column gap-md p-xl" href="' + href + '" aria-label="Open ' + esc(g.name) + '">' +
      '<div class="d-flex align-items-center justify-content-between gap-md"><span class="clan-symbol" data-clan-art data-clan-name="' + esc(g.name) + '" aria-hidden="true">' + NS.icon('flag') + '</span>' +
      NS.badge(g.total + (g.total === 1 ? ' member' : ' members'), 'secondary') + '</div>' +
      '<h3 class="text-brush">' + esc(g.name) + '</h3>' + (blurb ? '<p class="text-label-sm tx-secondary clamp-3">' + esc(blurb) + '</p>' : '') + '</a>';
  };
  NS.clanDetailSymbol = function (name) {
    return '<span class="clan-detail-symbol" data-clan-art data-clan-name="' + esc(name) + '" aria-hidden="true">' + NS.icon('flag') + '</span>';
  };
  NS.beastCard = function (c) {
    var tails = NS.lore.beastTails[c.name];
    return NS.imageCard(c.name, 'character.html?id=' + c.id + '&type=beast',
      '<div class="d-flex justify-content-end">' + (tails ? NS.badge(tails + '-Tailed', 'secondary') : '') + '</div>' +
      '<div class="d-flex flex-column gap-xs mt-auto"><h3 class="text-brush">' + esc(c.name) + '</h3>' +
      '<span class="text-label-sm">Tailed Beast</span></div>', c.imageUrl || c.thumbnailUrl);
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
      '<p>Character and group records load directly from the open Dattebayo Naruto API. Eye colour is looked up from the Naruto Wiki appearance text when it is explicitly stated, and clan symbols are loaded from clan-page image files when available; these supplementary fields can be incomplete. Hair colour, hair length, animal ears and filler flags are not included. Biographies and descriptive lore are hand-written additions; roles and tags are derived from API data.</p>' +
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
