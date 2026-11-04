(function () {
  'use strict';
  var NS = (window.NS = window.NS || {});
  var BASE = 'https://dattebayo-api.onrender.com';

  var lore = null;
  var status = 'live';
  var memo = {};
  var charCache = new Map();
  var byName = new Map();
  var allCharactersPromise = null;

  var readyPromise = fetch('data/lore.json').then(function (response) {
    if (!response.ok) throw new Error('Could not load site descriptions (HTTP ' + response.status + ')');
    return response.json();
  }).then(function (data) {
    lore = data;
    NS.lore = lore;
    return true;
  });
  NS.ready = function () { return readyPromise; };

  function setStatus(next) {
    if (status === next) return;
    status = next;
    document.dispatchEvent(new CustomEvent('naruseeki:status', { detail: next }));
  }
  NS.status = function () { return status; };

  function request(path, timeout) {
    if (memo[path]) return memo[path];
    var p = new Promise(function (resolve, reject) {
      var ctrl = new AbortController();
      var receivedResponse = false;
      var t = setTimeout(function () { ctrl.abort(); }, timeout || 8000);
      fetch(BASE + path, { signal: ctrl.signal })
        .then(function (res) {
          receivedResponse = true;
          if (!res.ok) {
            setStatus(res.status >= 500 || res.status === 429 ? 'unavailable' : 'live');
            var error = new Error('HTTP ' + res.status);
            error.status = res.status;
            throw error;
          }
          setStatus('live');
          return res.json();
        })
        .then(function (json) { clearTimeout(t); resolve(json); })
        .catch(function (e) {
          clearTimeout(t);
          if (!receivedResponse) setStatus('unavailable');
          reject(e);
        });
    });
    memo[path] = p;
    p.catch(function () { delete memo[path]; });
    return p;
  }

  function clean(s) {
    return String(s == null ? '' : s)
      .replace(/\s*\((?:anime|manga|novel|movie|game|video game|ova|part [^)]*)[^)]*only\)/gi, '')
      .replace(/\s*\((?:affinity|forms)\)/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  function arr(v) {
    var list = Array.isArray(v) ? v : v == null || v === '' ? [] : [v];
    return list.map(clean).filter(Boolean).filter(function (x, i, a) { return a.indexOf(x) === i; });
  }
  var MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  var SIGNS = [['Capricorn', 1, 19], ['Aquarius', 2, 18], ['Pisces', 3, 20], ['Aries', 4, 19], ['Taurus', 5, 20], ['Gemini', 6, 20], ['Cancer', 7, 22], ['Leo', 8, 22], ['Virgo', 9, 22], ['Libra', 10, 22], ['Scorpio', 11, 21], ['Sagittarius', 12, 21]];
  function zodiac(birthday) {
    if (!birthday) return null;
    var m = birthday.toLowerCase().match(/([a-z]+)\s+(\d{1,2})/);
    if (!m) return null;
    var month = MONTHS.indexOf(m[1]) + 1, day = Number(m[2]);
    if (!month) return null;
    for (var i = 0; i < SIGNS.length; i++) if (month < SIGNS[i][1] || (month === SIGNS[i][1] && day <= SIGNS[i][2])) return SIGNS[i][0];
    return 'Capricorn';
  }
  var JP = /^[\u3000-\u30ff\u3400-\u9fff\uff00-\uffef・ー]+/;
  function japaneseName(titles) {
    for (var i = 0; i < titles.length; i++) { var m = titles[i].match(JP); if (m && m[0].length > 1) return m[0]; }
    return null;
  }
  function epithets(titles) {
    return titles
      .map(function (t) { return t.split('(')[0].trim(); })
      .filter(function (t) { return /^[a-z][A-Za-z']+$/.test(t) && t.length < 40 && /[A-Z]/.test(t); })
      .map(function (t) { return t.replace(/([A-Z])/g, ' $1').replace(/^./, function (c) { return c.toUpperCase(); }).trim(); })
      .slice(0, 4);
  }
  function pickPart(map) {
    if (map == null) return { primary: null, all: {} };
    if (typeof map === 'string' || typeof map === 'number') return { primary: clean(map), all: {} };
    var all = {}, first = null;
    Object.keys(map).forEach(function (k) { all[k] = clean(map[k]); if (first == null) first = all[k]; });
    var prefer = ['Part II', 'Part 2', 'Blank Period', 'Gaiden', 'Part I'];
    for (var i = 0; i < prefer.length; i++) if (all[prefer[i]]) return { primary: all[prefer[i]], all: all };
    return { primary: first, all: all };
  }
  function apparentAge(age, rankText) {
    var m = (age || '').match(/\d+/);
    var n = m ? Number(m[0]) : 0;
    if (!n) return rankText && /academy/i.test(rankText) ? 'child' : null;
    return n < 13 ? 'child' : n < 20 ? 'teen' : n < 60 ? 'adult' : 'elder';
  }

  function normalizeCharacter(raw) {
    var p = raw.personal || {};
    var titles = arr(p.titles);
    var affiliations = arr(p.affiliation);
    var village = affiliations.filter(function (a) { return /gakure$/i.test(a); })[0] || affiliations[0] || null;
    var clan = arr(p.clan)[0] || null;
    var age = pickPart(p.age);
    var rank = pickPart(raw.rank && raw.rank.ninjaRank);
    var team = arr(p.team);
    var jutsu = arr(raw.jutsu);
    var d = raw.debut || {};
    var debut = [['Anime', d.anime], ['Manga', d.manga], ['Movie', d.movie], ['Game', d.game], ['Novel', d.novel], ['OVA', d.ova]]
      .filter(function (x) { return x[1]; })
      .map(function (x) { return { label: x[0], value: clean(x[1]) }; });
    var epMatch = String(d.anime || '').match(/#(\d+)/);

    var relations = [];
    Object.keys(raw.family || {}).forEach(function (rel) {
      arr(raw.family[rel]).forEach(function (name) {
        relations.push({ relationship: rel.replace(/^./, function (c) { return c.toUpperCase(); }), name: name, characterId: byName.get(name.toLowerCase()) });
      });
    });
    arr(p.partner).forEach(function (name) {
      if (!relations.some(function (r) { return r.name === name; })) relations.push({ relationship: 'Partner', name: name, characterId: byName.get(name.toLowerCase()) });
    });

    var images = (raw.images || []).filter(Boolean);
    var birthday = p.birthdate ? clean(p.birthdate) : null;
    var isAkatsuki = affiliations.some(function (a) { return /akatsuki/i.test(a); });
    var role = lore.mainIds.indexOf(raw.id) >= 0 ? 'main'
      : lore.antagonistIds.indexOf(raw.id) >= 0 || isAkatsuki ? 'antagonist'
        : jutsu.length >= 6 || team.length > 0 ? 'supporting' : 'background';
    var tools = arr(raw.tools);
    var tags = ['ninja'].concat(rank.primary ? [rank.primary.toLowerCase()] : [], arr(p.classification).map(function (c) { return c.toLowerCase(); }),
      isAkatsuki ? ['akatsuki'] : [], clan ? [clan.toLowerCase() + ' clan'] : [],
      tools.some(function (t) { return /sword|blade/i.test(t); }) ? ['swordsman'] : [])
      .filter(function (x, i, a) { return a.indexOf(x) === i; }).slice(0, 7);

    var c = {
      id: raw.id, name: clean(raw.name), nameJapanese: japaneseName(titles), aliases: epithets(titles), role: role,
      mediaType: 'anime', primarySeries: /shipp/i.test(String(d.anime)) ? 'Naruto Shippuden' : 'Naruto', tags: tags,
      gender: p.sex ? String(p.sex).toLowerCase() : null, apparentAge: apparentAge(age.primary, rank.primary),
      ageExact: age.primary, birthday: birthday, zodiac: zodiac(birthday), bloodType: p.bloodType ? clean(p.bloodType) : null,
      height: pickPart(p.height).primary, weight: pickPart(p.weight).primary, status: p.status ? clean(p.status) : null,
      village: village, clan: clan, rank: rank.primary, registration: (raw.rank && raw.rank.ninjaRegistration) || null,
      team: team, occupation: arr(p.occupation), classification: arr(p.classification), species: p.species ? clean(p.species) : null,
      kekkeiGenkai: arr(p.kekkeiGenkai).concat(arr(p['kekkeiMōra']), arr(p['kekkeiTōta'])),
      natureTypes: arr(raw.natureType), jutsu: jutsu, weapons: tools, affiliations: affiliations,
      tailedBeast: p.tailedBeast ? clean(p.tailedBeast) : null, jinchuriki: arr(p['jinchūriki']),
      relations: relations, biography: '',
      imageUrl: images[1] || images[0] || null, thumbnailUrl: images[0] || null, gallery: images,
      voiceJp: arr(raw.voiceActors && raw.voiceActors.japanese).slice(0, 3), voiceEn: arr(raw.voiceActors && raw.voiceActors.english).slice(0, 3),
      debut: debut, firstAppearanceEpisode: epMatch ? Number(epMatch[1]) : null,
    };
    c.biography = lore.bios[c.id] || generateBio(c);
    return c;
  }
  function generateBio(c) {
    var skills = c.jutsu.slice(0, 3);
    var debut = c.debut.filter(function (x) { return x.label === 'Anime'; })[0];
    return c.name + ' is ' + (c.rank ? 'a ' + c.rank : 'a shinobi') + (c.village ? ' of ' + c.village : '') + (c.clan ? ', belonging to the ' + c.clan + ' clan' : '') + '.' +
      (skills.length ? ' Known techniques include ' + skills.join(', ') + '.' : '') + (debut ? ' First seen in ' + debut.value + '.' : '');
  }

  function remember(list) {
    list.forEach(function (r) { byName.set(clean(r.name).toLowerCase(), r.id); });
    return list.map(function (r) {
      var c = normalizeCharacter(r);
      charCache.set(c.id, c);
      byName.set(c.name.toLowerCase(), c.id);
      return c;
    });
  }

  NS.listCharacters = function (opts) {
    opts = opts || {};
    var page = opts.page || 1, limit = opts.limit || 20, name = opts.name;
    var q = name ? '/characters?name=' + encodeURIComponent(name) + '&page=' + page + '&limit=' + limit : '/characters?page=' + page + '&limit=' + limit;
    return request(q).then(function (d) {
      return { items: remember(d.characters), total: d.total, source: 'live' };
    });
  };

  NS.getCharactersByIds = function (ids) {
    var missing = ids.filter(function (i) { return !charCache.has(i); });
    var load = Promise.resolve();
    if (missing.length) {
      load = request('/characters/' + missing.join(',')).then(function (d) { remember(Array.isArray(d) ? d : [d]); });
    }
    return load.then(function () { return ids.map(function (i) { return charCache.get(i); }).filter(Boolean); });
  };

  NS.getCharacter = function (id, kind) {
    kind = kind || 'character';
    if (charCache.has(id) && kind === 'character') return Promise.resolve(charCache.get(id));
    return request(kind === 'beast' ? '/tailed-beasts/' + id : '/characters/' + id).then(function (d) {
      if (!d || d.error) return null;
      return remember([d])[0];
    }).catch(function (err) {
      if (err.status === 404) return null;
      throw err;
    });
  };

  var GROUPS = {
    villages: { limit: 100, key: 'villages' },
    clans: { limit: 100, key: 'clans' },
    teams: { limit: 200, key: 'teams' },
    'kekkei-genkai': { limit: 100, key: 'kekkei-genkai' },
  };
  NS.listGroups = function (kind) {
    var g = GROUPS[kind];
    if (!g) return Promise.reject(new Error('Unsupported group type: ' + kind));
    return request('/' + kind + '?limit=' + g.limit).then(function (d) {
      var raw = d[g.key];
      var merged = new Map();
      raw.forEach(function (x) {
        var name = clean(x.name), ids = x.characters || [], prev = merged.get(name);
        if (prev) {
          prev.characters = Array.from(new Set(prev.characters.concat(ids)));
          prev.total = Math.max(prev.total, x.total || 0, prev.characters.length);
        } else merged.set(name, { id: x.id, name: name, characters: ids, total: x.total || ids.length });
      });
      return Array.from(merged.values()).sort(function (a, b) { return b.total - a.total || a.name.localeCompare(b.name); });
    });
  };
  NS.getGroup = function (kind, id) {
    return NS.listGroups(kind).then(function (all) { return all.filter(function (g) { return g.id === id; })[0] || null; });
  };

  NS.listBeasts = function () {
    return request('/tailed-beasts?limit=30').then(function (d) { return remember(d['tailed-beasts']); });
  };
  NS.listAkatsuki = function () {
    return request('/akatsuki?limit=60').then(function (d) { return remember(d.akatsuki); });
  };

  NS.allCharacters = function () {
    if (allCharactersPromise) return allCharactersPromise;
    var limit = 100;
    allCharactersPromise = NS.listCharacters({ page: 1, limit: limit }).then(function (first) {
      var pages = [];
      var pageCount = Math.ceil(first.total / limit);
      for (var page = 2; page <= pageCount; page++) pages.push(page);
      var chain = Promise.resolve([first]);
      for (var i = 0; i < pages.length; i += 4) {
        var batchPages = pages.slice(i, i + 4);
        chain = chain.then((function (batch) {
          return function (results) {
            return Promise.all(batch.map(function (pageNumber) {
              return NS.listCharacters({ page: pageNumber, limit: limit });
            })).then(function (pageResults) { return results.concat(pageResults); });
          };
        })(batchPages));
      }
      return chain.then(function (results) {
        return results.reduce(function (items, result) { return items.concat(result.items); }, []);
      });
    }).catch(function (err) {
      allCharactersPromise = null;
      throw err;
    });
    return allCharactersPromise;
  };

  NS.knownCharacters = function () {
    return Array.from(charCache.values());
  };
  NS.natureOf = function (name) {
    var m = name.match(/^(Fire|Water|Wind|Earth|Lightning|Lava|Boil|Wood|Ice|Magnet|Storm|Yin|Yang|Scorch|Steel|Dust|Explosion|Crystal)\s+Release/i);
    return m ? m[1] + ' Release' : null;
  };
  NS.jutsuIndex = function () {
    var map = new Map();
    NS.knownCharacters().forEach(function (c) {
      c.jutsu.forEach(function (j) {
        if (j.length > 70 || /wiki|article/i.test(j)) return;
        var e = map.get(j) || { name: j, nature: NS.natureOf(j), users: [] };
        e.users.push({ id: c.id, name: c.name });
        map.set(j, e);
      });
    });
    return Array.from(map.values()).sort(function (a, b) { return b.users.length - a.users.length || a.name.localeCompare(b.name); });
  };
  NS.clean = clean;
})();
