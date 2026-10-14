/* Tutee Connect — Canada landing page ("Your Next Chapter Is North").
 * Dependency-free. Reads window.CA_UNIVERSITIES (IRCC DLI data) for the map
 * panels and the explorer. Lead form posts to /api/enquiry exactly like the
 * other country pages (see netlify/functions/enquiry.mjs). */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.remove('no-js');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fold = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var fmt = function (n) { return Math.round(n).toLocaleString('en-CA'); };
  var UNIS = window.CA_UNIVERSITIES || [];

  /* ---------- header, drawer ---------- */
  var hdr = $('[data-hdr]');
  function onScroll() { hdr.classList.toggle('scrolled', window.scrollY > 40); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  var drawer = $('[data-drawer]'), opener = $('[data-open-drawer]');
  function setDrawer(open) {
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    opener.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) $('a', drawer).focus(); else opener.focus({ preventScroll: true });
  }
  opener.addEventListener('click', function () { setDrawer(true); });
  $('[data-close-drawer]').addEventListener('click', function () { setDrawer(false); });
  $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('open')) setDrawer(false); });

  // active nav link
  var navLinks = $$('.nav a');
  if ('IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) { var t = $(a.getAttribute('href')); if (t) secObs.observe(t); });
  }

  /* ---------- hero headline split ---------- */
  $$('[data-split]').forEach(function (h) {
    var i = 0;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var inner = document.createElement('span'); inner.textContent = part;
            inner.style.animationDelay = (0.55 + i++ * 0.08) + 's';
            w.appendChild(inner); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    }
    h.setAttribute('aria-label', h.textContent);
    walk(h);
    $$('.w', h).forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
  });

  /* ---------- reveal + counters ---------- */
  function countUp(el) {
    var to = +el.getAttribute('data-count'); if (reduce) { el.textContent = fmt(to); return; }
    var t0 = null;
    function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1400); el.textContent = fmt(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var rvObs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        $$('[data-count]', e.target).forEach(countUp);
        rvObs.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.rv, .photo, .mask-reveal').forEach(function (el) { rvObs.observe(el); });
  } else { $$('.rv,.photo').forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- parallax (transform only, rAF-throttled) ---------- */
  var px = $$('[data-parallax]');
  if (!reduce && px.length) {
    var ticking = false;
    var run = function () {
      var vh = window.innerHeight;
      px.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var k = +el.getAttribute('data-parallax');
        el.style.transform = 'translate3d(0,' + ((r.top + r.height / 2 - vh / 2) * -k).toFixed(1) + 'px,0)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    run();
  }

  /* =====================================================================
   * MAP — positions are percentages of the 1000×760 SVG, produced by the
   * same Lambert conformal conic projection (rotate -96°, parallels 49°/77°)
   * that drew the Natural Earth outline. See README "Canada page".
   * ===================================================================== */
  var CITIES = [
    { id: 'toronto', name: 'Toronto', prov: 'Ontario', match: 'Toronto, Ontario', x: 65.24, y: 91.42, lbl: 'b', lat: '43.65° N · 79.38° W',
      intro: "Canada's largest city and Ontario's capital, on the shore of Lake Ontario. A major centre for finance, technology, health research and the arts, with a large international student community." },
    { id: 'vancouver', name: 'Vancouver', prov: 'British Columbia', match: 'Vancouver, British Columbia', x: 13.5, y: 73.3, lbl: 'l', lat: '49.28° N · 123.12° W',
      intro: "A Pacific port city between the Coast Mountains and the Strait of Georgia, with the mildest winters of Canada's major cities. Strong in technology, film, forestry and ocean sciences." },
    { id: 'montreal', name: 'Montréal', prov: 'Quebec', match: 'Montréal, Quebec', x: 71.34, y: 84.29, lbl: 't', lat: '45.50° N · 73.57° W',
      intro: "Quebec's largest city and a predominantly French-speaking metropolis, home to English- and French-language universities. Quebec students need a CAQ in addition to a study permit." },
    { id: 'ottawa', name: 'Ottawa', prov: 'Ontario', match: 'Ottawa, Ontario', x: 68.86, y: 85.63, lbl: 'l', lat: '45.42° N · 75.70° W',
      intro: "The national capital, on the Ottawa River at the Ontario–Quebec border. A bilingual city with institutions close to government, public policy and research." },
    { id: 'calgary', name: 'Calgary', prov: 'Alberta', match: 'Calgary, Alberta', x: 24.12, y: 74.15, lbl: 'b', lat: '51.04° N · 114.07° W',
      intro: "Alberta's largest city, on the prairie at the edge of the Rocky Mountain foothills, about an hour and a half from Banff. Known for energy, engineering and a growing technology sector." },
    { id: 'edmonton', name: 'Edmonton', prov: 'Alberta', match: 'Edmonton, Alberta', x: 25.92, y: 68.85, lbl: 't', lat: '53.55° N · 113.49° W',
      intro: "Alberta's capital, along the North Saskatchewan River valley. A research and government centre with cold, sunny winters." },
    { id: 'waterloo', name: 'Waterloo', prov: 'Ontario', match: 'Waterloo, Ontario', x: 63.88, y: 92.34, lbl: 'l', lat: '43.46° N · 80.52° W',
      intro: "Part of Waterloo Region with Kitchener and Cambridge, about 100 km west of Toronto. Closely associated with technology, mathematics and co-operative education." },
    { id: 'halifax', name: 'Halifax', prov: 'Nova Scotia', match: 'Halifax, Nova Scotia', x: 83.47, y: 79.15, lbl: 't', lat: '44.65° N · 63.58° W',
      intro: "Nova Scotia's capital and the largest city in Atlantic Canada, on one of the world's largest natural harbours. Strong in ocean and marine sciences, health and the arts." }
  ];
  function inCity(u, c) { return fold(u.location) === fold(c.match); }
  function cityStats(c) {
    var all = UNIS.filter(function (u) { return inCity(u, c); });
    var ranked = all.filter(function (u) { return u.ranked; });
    var pg = all.filter(function (u) { return u.pgwp === 'Yes'; }).length;
    var areas = {};
    ranked.forEach(function (u) { String(u.programs).split(',').forEach(function (p) { p = p.trim(); if (p) areas[p] = (areas[p] || 0) + 1; }); });
    var top = Object.keys(areas).sort(function (a, b) { return areas[b] - areas[a]; }).slice(0, 7);
    var publics = all.filter(function (u) { return /U15|Public|College/.test(u.type) && !u.ranked; }).filter(function (u) { return u.pgwp === 'Yes'; }).slice(0, Math.max(0, 4 - ranked.length));
    return { all: all.length, pg: pg, ranked: ranked, extra: publics, areas: top };
  }
  var mapStage = $('[data-map]'), cityPanel = $('[data-city-panel]'), cityChips = $('[data-city-chips]');
  function selectCity(id, focus) {
    var c = CITIES.filter(function (x) { return x.id === id; })[0]; if (!c) return;
    $$('.mk', mapStage).forEach(function (m) { var on = m.getAttribute('data-id') === id; m.classList.toggle('on', on); m.setAttribute('aria-pressed', on); });
    $$('.chip', cityChips).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-id') === id); });
    var s = cityStats(c);
    var list = s.ranked.concat(s.extra).slice(0, 5).map(function (u) {
      return '<li><span>' + esc(u.name) + '</span><span>' + esc(u.type === 'U15' ? 'Research university' : u.type) + '</span></li>';
    }).join('');
    cityPanel.innerHTML = '<div class="swap"><p class="cp-k">' + esc(c.prov) + ' · ' + esc(c.lat) + '</p><h3>' + esc(c.name) + '</h3><p>' + esc(c.intro) + '</p>' +
      '<div class="stat-row"><div><b>' + s.all + '</b><small>institutions on the DLI list</small></div><div><b>' + s.pg + '</b><small>listed as PGWP-eligible</small></div></div>' +
      (list ? '<ul class="cp-list">' + list + '</ul>' : '') +
      (s.areas.length ? '<p class="cp-k" style="margin-bottom:8px">Known strengths</p><div class="cp-tags">' + s.areas.map(function (a) { return '<span>' + esc(a) + '</span>'; }).join('') + '</div>' : '') +
      '<button type="button" class="btn light" data-explore-city="' + esc(c.match) + '">Explore ' + esc(c.name) + ' <span class="arr">→</span></button></div>';
    if (focus) cityPanel.focus && cityPanel.setAttribute('tabindex', '-1');
  }
  if (mapStage) {
    CITIES.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'mk'; b.setAttribute('data-id', c.id);
      b.style.left = c.x + '%'; b.style.top = c.y + '%';
      b.setAttribute('aria-label', c.name + ', ' + c.prov);
      b.innerHTML = '<i></i><span class="lbl ' + c.lbl + '" aria-hidden="true">' + esc(c.name) + '</span>';
      b.addEventListener('click', function () { selectCity(c.id); });
      mapStage.appendChild(b);
      var ch = document.createElement('button');
      ch.type = 'button'; ch.className = 'chip'; ch.textContent = c.name; ch.setAttribute('data-id', c.id);
      ch.addEventListener('click', function () { selectCity(c.id); });
      cityChips.appendChild(ch);
    });
    selectCity('toronto');
    cityPanel.addEventListener('click', function (e) {
      var b = e.target.closest('[data-explore-city]'); if (!b) return;
      exploreCity(b.getAttribute('data-explore-city'));
    });
  }

  /* =====================================================================
   * EXPLORER
   * ===================================================================== */
  var SUBJECTS = [
    { k: 'cs', label: 'Computer Science', re: /computer|computing|software|mathematics|co-op/i },
    { k: 'eng', label: 'Engineering', re: /engineering/i },
    { k: 'bus', label: 'Business', re: /business|management|commerce|economics/i },
    { k: 'health', label: 'Health & Medicine', re: /medicine|nursing|health|pharmacy|kinesiology|dentistry/i },
    { k: 'sci', label: 'Sciences', re: /science|biology|chemistry|physics|astronomy/i },
    { k: 'env', label: 'Environment', re: /environment|forestry|agricultur|marine|ocean|energy|earth/i },
    { k: 'law', label: 'Law & Policy', re: /law|public|policy|journalism|social/i },
    { k: 'arts', label: 'Arts & Media', re: /arts|design|media|music|film|fine|communication|architecture/i }
  ];
  var TYPES = [{ k: 'U15', l: 'U15 research' }, { k: 'Public', l: 'Public university' }, { k: 'College', l: 'College' }, { k: 'Specialist', l: 'Specialist' }, { k: 'Private', l: 'Private' }];
  var PGWP = [{ k: 'Yes', l: 'Yes' }, { k: 'Varies', l: 'Varies' }, { k: 'No', l: 'No' }];
  var st = { q: '', prov: '', city: '', type: {}, subj: {}, pgwp: {}, shown: 12 };
  var exList = $('[data-ex-list]');
  function provOf(u) { var p = u.location.split(','); return p[p.length - 1].trim(); }
  function cityOf(u) { return u.location.split(',')[0].trim(); }

  if (exList) {
    var provSel = $('[data-f=prov]'), citySel = $('[data-f=city]');
    var provs = {}; UNIS.forEach(function (u) { var p = provOf(u); provs[p] = (provs[p] || 0) + 1; });
    provSel.innerHTML = '<option value="">All provinces &amp; territories</option>' + Object.keys(provs).sort().map(function (p) { return '<option value="' + esc(p) + '">' + esc(p) + ' (' + provs[p] + ')</option>'; }).join('');
    function fillCities() {
      var cs = {};
      UNIS.forEach(function (u) { if (!st.prov || provOf(u) === st.prov) { var c = cityOf(u); cs[c] = (cs[c] || 0) + 1; } });
      citySel.innerHTML = '<option value="">All cities</option>' + Object.keys(cs).sort(function (a, b) { return a.localeCompare(b); }).map(function (c) { return '<option value="' + esc(c) + '"' + (c === st.city ? ' selected' : '') + '>' + esc(c) + ' (' + cs[c] + ')</option>'; }).join('');
    }
    fillCities();
    function chipGroup(name, items) {
      var box = $('[data-f-chips=' + name + ']');
      box.innerHTML = items.map(function (it) { return '<button type="button" class="chip" aria-pressed="false" data-v="' + it.k + '">' + esc(it.l || it.label) + '</button>'; }).join('');
      box.addEventListener('click', function (e) {
        var b = e.target.closest('.chip'); if (!b) return;
        var v = b.getAttribute('data-v'); st[name][v] = !st[name][v];
        b.setAttribute('aria-pressed', !!st[name][v]); st.shown = 12; render();
      });
    }
    chipGroup('type', TYPES); chipGroup('subj', SUBJECTS.map(function (s) { return { k: s.k, l: s.label }; })); chipGroup('pgwp', PGWP);
    var qIn = $('[data-f=q]'), qt;
    qIn.addEventListener('input', function () { clearTimeout(qt); qt = setTimeout(function () { st.q = qIn.value; st.shown = 12; render(); }, 150); });
    provSel.addEventListener('change', function () { st.prov = provSel.value; st.city = ''; fillCities(); st.shown = 12; render(); });
    citySel.addEventListener('change', function () { st.city = citySel.value; st.shown = 12; render(); });
    $('[data-f-reset]').addEventListener('click', function () {
      st = { q: '', prov: '', city: '', type: {}, subj: {}, pgwp: {}, shown: 12 };
      qIn.value = ''; provSel.value = ''; fillCities();
      $$('[data-f-chips] .chip').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      render();
    });
    var fBox = $('[data-filters]'), fT = $('[data-f-toggle]');
    fT.addEventListener('click', function () {
      var c = fBox.getAttribute('data-collapsed') === 'true';
      fBox.setAttribute('data-collapsed', c ? 'false' : 'true'); fT.setAttribute('aria-expanded', c); fT.textContent = c ? 'Hide filters' : 'Show filters';
    });
    $('[data-ex-more]').addEventListener('click', function () { st.shown += 12; render(true); });
    exList.addEventListener('click', function (e) {
      var b = e.target.closest('[data-enquire]'); if (!b) return;
      setDestination('Canada — ' + b.getAttribute('data-enquire'));
      document.getElementById('contact').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      setTimeout(function () { $('#l-name').focus({ preventScroll: true }); }, reduce ? 0 : 700);
    });
    render();
  }
  function on(o) { return Object.keys(o).filter(function (k) { return o[k]; }); }
  function filtered() {
    var q = fold(st.q).trim(), types = on(st.type), subs = on(st.subj), pg = on(st.pgwp);
    var res = SUBJECTS.filter(function (s) { return subs.indexOf(s.k) > -1; });
    return UNIS.filter(function (u) {
      if (q && fold(u.name + ' ' + u.location + ' ' + u.type).indexOf(q) < 0) return false;
      if (st.prov && provOf(u) !== st.prov) return false;
      if (st.city && cityOf(u) !== st.city) return false;
      if (types.length && types.indexOf(u.type) < 0) return false;
      if (pg.length && pg.indexOf(u.pgwp) < 0) return false;
      if (res.length) { if (!u.ranked) return false; if (!res.some(function (s) { return s.re.test(u.programs); })) return false; }
      return true;
    });
  }
  function render(append) {
    var r = filtered(), cnt = $('[data-ex-count]');
    cnt.innerHTML = fmt(r.length) + '<small>institution' + (r.length === 1 ? '' : 's') + ' match</small>';
    var start = append ? exList.children.length : 0;
    if (!append) exList.innerHTML = '';
    if (!r.length) { exList.innerHTML = '<p class="empty">No institutions match those filters. Try removing one — or ask a counsellor to search for you.</p>'; }
    var html = r.slice(start, st.shown).map(function (u, i) {
      var cls = u.pgwp === 'Yes' ? 'yes' : u.pgwp === 'No' ? 'no' : 'var';
      return '<article class="uni" style="animation-delay:' + (i * 0.03) + 's"><span class="uni-n">' + (u.ranked ? String(u.rank).padStart(2, '0') : '—') + '</span><div><h3>' + esc(u.name) + '</h3><div class="uni-meta"><span>' + esc(u.location) + '</span><span>' + esc(u.type === 'U15' ? 'U15 research university' : u.type) + '</span><span class="tag ' + cls + '">PGWP: ' + esc(u.pgwp) + '</span>' + (u.ranked ? '<span>' + esc(u.programs) + '</span>' : '') + '</div></div>' +
        '<div class="uni-acts"><button type="button" class="btn ghost" data-enquire="' + esc(u.name) + '">Enquire</button></div></article>';
    }).join('');
    exList.insertAdjacentHTML('beforeend', html);
    $('[data-ex-more]').parentElement.style.display = r.length > st.shown ? '' : 'none';
  }
  function exploreCity(match) {
    if (!exList) return;
    var c = match.split(',')[0].trim(), p = match.split(',')[1].trim();
    st.prov = p; st.city = c; st.shown = 12;
    var provSel = $('[data-f=prov]');
    provSel.value = p;
    provSel.dispatchEvent(new Event('change')); // refills the city list (and clears city)
    st.city = c; $('[data-f=city]').value = c; render();
    document.getElementById('explore').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }

  /* =====================================================================
   * PATH FINDER
   * ===================================================================== */
  var STEPS = [
    { k: 'subject', t: 'Subject', q: 'What would you like to study?', o: [
      ['Computer Science', 'Software, AI, systems'], ['Engineering', 'Civil, mechanical, electrical…'], ['Business', 'Management, finance, marketing'], ['Data Science', 'Analytics, statistics, ML'],
      ['Healthcare', 'Nursing, public health, allied'], ['Life Sciences', 'Biology, biotech, pharma'], ['Hospitality', 'Hotel, tourism, culinary'], ['Environmental Studies', 'Sustainability, resources'], ['Not sure yet', "We'll help you decide"]] },
    { k: 'level', t: 'Level', q: 'Which level of study?', o: [
      ["Bachelor's degree", '3–4 years, university'], ['College diploma', '1–3 years, applied'], ['Postgraduate certificate', 'Usually 1 year, after a degree'], ["Master's degree", '1–2 years'], ['Doctorate (PhD)', 'Research'], ['Not sure yet', 'Compare options']] },
    { k: 'location', t: 'Location', q: 'Where in Canada?', o: [
      ['Ontario', 'Toronto, Ottawa, Waterloo…'], ['British Columbia', 'Vancouver, Victoria…'], ['Quebec', 'Montréal, Quebec City…'], ['Alberta', 'Calgary, Edmonton…'], ['Atlantic Canada', 'Halifax and the Maritimes'], ['Prairies', 'Manitoba, Saskatchewan'], ['Open to anywhere', 'Best fit first']] },
    { k: 'budget', t: 'Budget', q: 'Approximate tuition budget per year?', note: 'In Canadian dollars, before living costs. This only guides the shortlist — fees are confirmed per programme.', o: [
      ['Under C$20,000', ''], ['C$20,000 – 30,000', ''], ['C$30,000 – 45,000', ''], ['Above C$45,000', ''], ['Not sure yet', 'We can estimate together']] },
    { k: 'intake', t: 'Intake', q: 'When would you like to start?', note: 'Intakes vary by institution and programme.', o: [
      ['January 2027', 'Winter'], ['May 2027', 'Summer — limited programmes'], ['September 2027', 'Fall — main intake'], ['January 2028', 'Winter'], ['September 2028', 'Fall'], ['Not sure yet', '']] }
  ];
  var pf = { i: 0, a: {} }, card = $('[data-pf-card]'), ring = $('[data-ring]');
  function pfDone() { return STEPS.filter(function (s) { return pf.a[s.k]; }).length; }
  function pfProgress() {
    var p = pfDone() / STEPS.length;
    ring.style.strokeDashoffset = (339.3 * (1 - p)).toFixed(1);
    $('[data-pf-pct]').textContent = Math.round(p * 100) + '%';
    $('[data-pf-steps]').innerHTML = STEPS.map(function (s, i) {
      return '<li class="' + (pf.a[s.k] ? 'done ' : '') + (i === pf.i ? 'cur' : '') + '"><button type="button" data-go="' + i + '">' + s.t + (pf.a[s.k] ? ' · ' + esc(pf.a[s.k]) : '') + '</button></li>';
    }).join('') + '<li class="' + (pf.i === STEPS.length ? 'cur' : '') + '"><button type="button" data-go="' + STEPS.length + '"' + (pfDone() < STEPS.length ? ' disabled' : '') + '>Your summary</button></li>';
    $('[data-pf-steptext]').textContent = pf.i < STEPS.length ? 'Step ' + (pf.i + 1) + ' of ' + STEPS.length : 'All steps complete';
  }
  function pfRender() {
    pfProgress();
    if (pf.i >= STEPS.length) return pfSummary();
    var s = STEPS[pf.i];
    card.innerHTML = '<div class="swap" style="display:flex;flex-direction:column;flex:1"><p class="pf-k">Step ' + (pf.i + 1) + ' · ' + s.t + '</p><h3 class="pf-q">' + s.q + '</h3>' + (s.note ? '<p class="fine" style="margin:-14px 0 18px">' + s.note + '</p>' : '') +
      '<div class="opts" role="radiogroup" aria-label="' + esc(s.q) + '">' + s.o.map(function (o) {
        var sel = pf.a[s.k] === o[0];
        return '<button type="button" class="opt" role="radio" aria-checked="' + sel + '" data-v="' + esc(o[0]) + '"><b>' + esc(o[0]) + '</b>' + (o[1] ? '<small>' + esc(o[1]) + '</small>' : '') + '</button>';
      }).join('') + '</div><div class="pf-nav"><button type="button" class="btn ghost" data-pf-back' + (pf.i === 0 ? ' disabled' : '') + '>← Back</button><button type="button" class="btn" data-pf-next' + (pf.a[s.k] ? '' : ' disabled') + '>' + (pf.i === STEPS.length - 1 ? 'See my summary' : 'Next') + ' <span class="arr">→</span></button></div></div>';
  }
  function matchCount() {
    var provMap = { 'Ontario': ['Ontario'], 'British Columbia': ['British Columbia'], 'Quebec': ['Quebec'], 'Alberta': ['Alberta'], 'Atlantic Canada': ['Nova Scotia', 'New Brunswick', 'Prince Edward Island', 'Newfoundland and Labrador'], 'Prairies': ['Manitoba', 'Saskatchewan'] };
    var ps = provMap[pf.a.location];
    var lvl = pf.a.level || '';
    return UNIS.filter(function (u) {
      if (ps && ps.indexOf(provOf(u)) < 0) return false;
      if (u.pgwp === 'No') return false;
      if (/Master|Doctor|Bachelor/.test(lvl)) return /U15|Public/.test(u.type);
      if (/diploma|certificate/i.test(lvl)) return /College|Public|U15/.test(u.type);
      return true;
    }).length;
  }
  function pfSummary() {
    var n = matchCount();
    card.innerHTML = '<div class="swap" style="display:flex;flex-direction:column;flex:1"><p class="pf-k">Your Canada study path</p><h3 class="pf-q">Here’s what you told us.</h3><dl class="pf-sum">' +
      STEPS.map(function (s) { return '<div><dt>' + s.t + '</dt><dd>' + esc(pf.a[s.k]) + '</dd></div>'; }).join('') + '</dl>' +
      '<p class="pf-match"><b>' + fmt(n) + '</b> institutions on IRCC’s DLI list are in your chosen region, offer your level of study by institution type, and aren’t listed as PGWP-ineligible. A counsellor narrows this to programmes that fit your profile. This is not an eligibility or admission assessment.</p>' +
      '<div class="pf-nav" style="flex-wrap:wrap"><button type="button" class="btn ghost" data-pf-restart>Start again</button><button type="button" class="btn" data-pf-cta>Get my personalised study plan <span class="arr">→</span></button></div></div>';
  }
  if (card) {
    pfRender();
    card.addEventListener('click', function (e) {
      var o = e.target.closest('.opt');
      if (o) {
        pf.a[STEPS[pf.i].k] = o.getAttribute('data-v'); pfRender();
        if (!reduce) setTimeout(function () { if (pf.i < STEPS.length) { pf.i++; pfRender(); } }, 380);
        return;
      }
      if (e.target.closest('[data-pf-next]')) { pf.i++; pfRender(); }
      else if (e.target.closest('[data-pf-back]')) { pf.i = Math.max(0, pf.i - 1); pfRender(); }
      else if (e.target.closest('[data-pf-restart]')) { pf = { i: 0, a: {} }; pfRender(); }
      else if (e.target.closest('[data-pf-cta]')) {
        setDestination('Canada study plan — ' + STEPS.map(function (s) { return s.t + ': ' + pf.a[s.k]; }).join(' · '));
        document.getElementById('contact').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
        setTimeout(function () { $('#l-name').focus({ preventScroll: true }); }, reduce ? 0 : 700);
      }
    });
    // keyboard: arrow keys within the radiogroup
    card.addEventListener('keydown', function (e) {
      if (!/Arrow(Right|Down|Left|Up)/.test(e.key)) return;
      var opts = $$('.opt', card), i = opts.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault(); var n = /Right|Down/.test(e.key) ? 1 : -1;
      opts[(i + n + opts.length) % opts.length].focus();
    });
    $('[data-pf-steps]').addEventListener('click', function (e) {
      var b = e.target.closest('[data-go]'); if (!b || b.disabled) return;
      var g = +b.getAttribute('data-go');
      // may only jump to answered steps or the first unanswered one
      var firstOpen = STEPS.findIndex(function (s) { return !pf.a[s.k]; }); if (firstOpen < 0) firstOpen = STEPS.length;
      if (g <= firstOpen) { pf.i = g; pfRender(); }
    });
  }

  /* =====================================================================
   * COST PLANNER
   * ===================================================================== */
  var PRESETS = [['Computer Science', 73000], ['Software Engineering', 75000], ['Mathematics', 62000], ['Science', 54000], ['Health', 54000], ['Environment', 51000]];
  var COLORS = { tuition: '#d52b1e', rent: '#e8e2d4', food: '#9fb7ad', transit: '#5f8b7d', ins: '#c9a96e', other: '#7d8a86' };
  var LABELS = { tuition: 'Tuition & fees', rent: 'Accommodation', food: 'Food', transit: 'Transport', ins: 'Health coverage', other: 'Other' };
  var IRCC_MIN = 23448;
  var cost = $('[data-cost]');
  function calc() {
    var v = {}, total = 0, living = 0;
    $$('[data-c]', cost).forEach(function (i) {
      var n = Math.max(0, parseFloat(i.value) || 0) * (i.hasAttribute('data-monthly') ? 12 : 1);
      v[i.getAttribute('data-c')] = n; total += n; if (i.getAttribute('data-c') !== 'tuition') living += n;
    });
    $('[data-c-total]').textContent = fmt(total);
    $('[data-c-stack]').innerHTML = Object.keys(v).map(function (k) { return '<i style="width:' + (total ? v[k] / total * 100 : 0) + '%;background:' + COLORS[k] + '" title="' + LABELS[k] + '"></i>'; }).join('');
    $('[data-c-legend]').innerHTML = Object.keys(v).map(function (k) { return '<li style="--c:' + COLORS[k] + '"><span>' + LABELS[k] + '</span><span>C$' + fmt(v[k]) + '</span></li>'; }).join('');
    var qc = $('[data-c-loc]').value === 'qc', b = $('[data-c-bench]');
    if (qc) {
      b.innerHTML = 'Living costs you entered: <b style="color:var(--ivory)">C$' + fmt(living) + '</b>. For Quebec, proof-of-funds amounts are set by the Ministère de l’Immigration, de la Francisation et de l’Intégration (MIFI) — check its current figures.';
    } else {
      var p = Math.min(1, living / IRCC_MIN);
      b.innerHTML = 'Living costs you entered: <b style="color:var(--ivory)">C$' + fmt(living) + '</b> of IRCC’s C$' + fmt(IRCC_MIN) + ' minimum (1 person, outside Quebec, applications from 1 Sep 2026).<div class="meter"><i class="' + (living >= IRCC_MIN ? 'ok' : '') + '" style="width:' + (p * 100) + '%"></i></div>' +
        (living === 0 ? 'Enter your estimates to compare.' : living >= IRCC_MIN ? 'Your plan meets the minimum. Real costs in many cities are higher — budget honestly.' : 'You’ll need to show at least the IRCC minimum for living expenses, whatever your own estimate.');
    }
  }
  if (cost) {
    var pr = $('[data-presets]');
    pr.innerHTML = PRESETS.map(function (p) { return '<button type="button" class="chip" data-amt="' + p[1] + '">' + p[0] + ' · C$' + fmt(p[1]) + '</button>'; }).join('');
    pr.addEventListener('click', function (e) {
      var b = e.target.closest('[data-amt]'); if (!b) return;
      $('[data-c=tuition]').value = b.getAttribute('data-amt');
      $$('.chip', pr).forEach(function (c) { c.classList.toggle('on', c === b); }); calc();
    });
    cost.addEventListener('input', function (e) { if (e.target.getAttribute('data-c') === 'tuition') $$('.chip', pr).forEach(function (c) { c.classList.remove('on'); }); calc(); });
    $('[data-c-loc]').addEventListener('change', calc);
    calc();
  }

  /* =====================================================================
   * JOURNEY
   * ===================================================================== */
  var IR = 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/';
  var JR = [
    { t: 'Profile evaluation', h: 'Start with an honest look at your profile', p: 'We review your academics, test scores, work experience, budget and goals, and talk about whether Canada — and which kind of programme — fits.', l: ['Transcripts and marksheets', 'English or French test plans', 'Budget range and funding sources', 'Career goals and timelines'] },
    { t: 'Programme selection', h: 'Shortlist programmes for fit, not hype', p: 'We compare programmes at designated learning institutions on entry requirements, cost, co-op, location and PGWP eligibility, and share the official pages.', l: ['Check the institution is on the DLI list', 'Confirm programme-level PGWP eligibility', 'Compare full first-year cost', 'Note deadlines for your intake'], src: [IR + 'study-permit/prepare/designated-learning-institutions-list.html', 'IRCC — DLI list'] },
    { t: 'Application prep', h: 'Applications in your own words', p: 'Statements of purpose, CVs and references are prepared with you and reflect your real experience. Each institution’s portal and documents differ.', l: ['Statement of purpose / letter of intent', 'Academic and professional references', 'Language test results', 'Application fees and portal submission'] },
    { t: 'Admission', h: 'Offers, conditions and acceptance', p: 'Institutions make admission decisions. When an offer arrives, we help you understand its conditions, deadlines and deposits before you accept.', l: ['Read conditional vs. unconditional offers', 'Meet any conditions on time', 'Accept and pay a deposit if required', 'Request the PAL/TAL, or apply for a CAQ in Quebec'] },
    { t: 'Financial planning', h: 'Show funds — and plan real costs', p: 'For applications from 1 September 2026, IRCC requires at least C$23,448 for one person’s living costs outside Quebec, plus first-year tuition and travel. A GIC is optional; the Student Direct Stream closed in November 2024.', l: ['First-year tuition (paid or provable)', 'Living funds at or above IRCC’s minimum', 'Travel to Canada', 'Education loan documents if applicable'], src: [IR + 'study-permit/get-documents/financial-support.html', 'IRCC — Financial support'] },
    { t: 'Study permit', h: 'Prepare a complete, truthful application', p: 'You apply online with IRCC. Most applicants need a letter of acceptance, a PAL/TAL (or CAQ in Quebec), proof of funds, biometrics and possibly a medical exam. IRCC makes the decision — no one can guarantee it.', l: ['Letter of acceptance from a DLI', 'PAL/TAL — master’s & doctoral students at public DLIs exempt from 1 Jan 2026', 'Proof of financial support', 'Biometrics and any requested medical exam'], src: [IR + 'study-permit.html', 'IRCC — Study permit'] },
    { t: 'Pre-departure', h: 'Get ready to land well', p: 'Housing, health coverage, travel and what to bring, plus a clear understanding of the conditions printed on your permit.', l: ['Confirm housing before you fly', 'Arrange health coverage for your province', 'Carry originals of key documents', 'Book travel to arrive before orientation'] },
    { t: 'Arrival', h: 'Your first weeks in Canada', p: 'A border services officer issues your study permit at the port of entry. Then: orientation, a bank account, a SIN if you plan to work, and settling in.', l: ['Present your documents at the border', 'Check the details on your permit', 'Attend orientation', 'Work only within your permit conditions — 24 hrs/week off campus during terms'], src: [IR + 'work/work-off-campus.html', 'IRCC — Work off campus'] }
  ];
  var jrTabs = $('[data-jr-tabs]'), jrBody = $('[data-jr-body]');
  function jrShow(i, focus, noScroll) {
    $$('.jr-tab', jrTabs).forEach(function (t, k) { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; });
    var s = JR[i];
    $('[data-jr-bar]').style.width = ((i + 1) / JR.length * 100) + '%';
    jrBody.setAttribute('aria-labelledby', 'jr-t' + i);
    jrBody.innerHTML = '<div class="swap"><p class="pf-k">Stage ' + (i + 1) + ' of ' + JR.length + '</p><h3>' + esc(s.h) + '</h3><p class="lede" style="margin-top:16px">' + esc(s.p) + '</p></div>' +
      '<div class="swap"><ul>' + s.l.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      (s.src ? '<p class="src" style="margin-top:14px">Official guidance: <a href="' + s.src[0] + '" target="_blank" rel="noopener">' + esc(s.src[1]) + '</a></p>' : '') +
      '<div class="note">Rules checked October 2026 and subject to change. We never promise a visa, admission, job or permanent residency.</div></div>';
    var tab = $$('.jr-tab', jrTabs)[i];
    if (focus) tab.focus();
    if (!noScroll) jrTabs.scrollTo({ left: tab.offsetLeft - 20, behavior: reduce ? 'auto' : 'smooth' });
  }
  if (jrTabs) {
    jrTabs.innerHTML = JR.map(function (s, i) { return '<button type="button" role="tab" class="jr-tab" id="jr-t' + i + '"><small>0' + (i + 1) + '</small><span>' + esc(s.t) + '</span></button>'; }).join('');
    $$('.jr-tab', jrTabs).forEach(function (t, i) { t.addEventListener('click', function () { jrShow(i); }); });
    jrTabs.addEventListener('keydown', function (e) {
      var tabs = $$('.jr-tab', jrTabs), i = tabs.indexOf(document.activeElement); if (i < 0) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); jrShow((i + 1) % tabs.length, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); jrShow((i - 1 + tabs.length) % tabs.length, true); }
    });
    jrShow(0, false, true);
  }

  /* =====================================================================
   * LIFE IN CANADA — photos where we hold a licence, illustrations elsewhere
   * ===================================================================== */
  function scene(kind) {
    // Lightweight vector landscapes (no external assets). Clearly labelled as illustrations.
    var sky = { coast: ['#2b4a5a', '#c98f6e'], rockies: ['#20383a', '#d9a86c'], river: ['#1e3333', '#b9907a'], harbour: ['#1b2f3c', '#9fb2b8'] }[kind];
    var body = {
      coast: '<path d="M0 470 L120 330 L210 400 L330 250 L450 380 L560 300 L700 420 L820 310 L960 400 L1100 280 L1200 360 L1200 800 L0 800Z" fill="#2c4a4a"/><path d="M0 540 L160 450 L300 520 L460 430 L620 520 L780 450 L960 530 L1200 460 L1200 800 L0 800Z" fill="#1f3836"/><rect y="600" width="1200" height="200" fill="#16302f"/><g fill="#0d1b18"><rect x="760" y="470" width="26" height="130"/><rect x="792" y="430" width="34" height="170"/><rect x="832" y="490" width="22" height="110"/><rect x="860" y="450" width="30" height="150"/><rect x="896" y="500" width="40" height="100"/></g><g stroke="#e8e2d4" stroke-opacity=".25"><path d="M0 640 H1200"/><path d="M100 680 H500"/><path d="M640 700 H1100"/></g>',
      rockies: '<path d="M0 520 L140 300 L220 380 L340 180 L470 400 L560 260 L680 420 L800 220 L930 410 L1040 280 L1200 450 L1200 800 L0 800Z" fill="#344f4c"/><path d="M340 180 L380 250 L350 240 L320 260Z M800 220 L835 280 L800 270 L770 285Z M140 300 L170 350 L130 345Z" fill="#f6f1e7" fill-opacity=".85"/><path d="M0 600 C300 560 600 620 1200 570 L1200 800 L0 800Z" fill="#7d6a45"/><path d="M0 660 C400 630 800 690 1200 650 L1200 800 L0 800Z" fill="#5d5034"/><g fill="#0d1b18"><rect x="180" y="560" width="18" height="70"/><rect x="204" y="530" width="26" height="100"/><rect x="236" y="575" width="16" height="55"/></g>',
      river: '<path d="M0 420 C200 400 300 440 520 410 C760 380 900 430 1200 400 L1200 800 L0 800Z" fill="#2d4743"/><path d="M0 470 L1200 470 L1200 800 L0 800Z" fill="#1d3a3a"/><path d="M0 470 L300 470 L360 380 L420 380 L470 470 Z" fill="#33504a"/><g fill="#0d1b18"><rect x="560" y="330" width="80" height="140"/><path d="M590 330 L600 230 L610 330Z"/><rect x="650" y="370" width="120" height="100"/><rect x="520" y="380" width="40" height="90"/></g><g stroke="#e8e2d4" stroke-opacity=".22"><path d="M0 520 H1200"/><path d="M200 570 H700"/></g>',
      harbour: '<path d="M0 480 C250 450 500 500 700 460 C900 430 1050 470 1200 450 L1200 800 L0 800Z" fill="#2a4448"/><rect y="560" width="1200" height="240" fill="#1a3138"/><g fill="#0d1b18"><rect x="880" y="380" width="20" height="180"/><path d="M872 380 L908 380 L900 350 L880 350Z"/><circle cx="890" cy="340" r="9" fill="#f6d68b"/></g><g fill="#0d1b18"><rect x="140" y="470" width="40" height="90"/><rect x="186" y="440" width="30" height="120"/><rect x="222" y="480" width="50" height="80"/><rect x="278" y="455" width="26" height="105"/></g><g stroke="#e8e2d4" stroke-opacity=".25"><path d="M0 600 H1200"/><path d="M300 650 H900"/></g>'
    }[kind];
    return '<svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustration"><defs><linearGradient id="g-' + kind + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sky[0] + '"/><stop offset="1" stop-color="' + sky[1] + '"/></linearGradient></defs><rect width="1200" height="800" fill="url(#g-' + kind + ')"/><circle cx="980" cy="200" r="60" fill="#f6f1e7" fill-opacity=".18"/>' + body + '</svg>';
  }
  var LIFE = [
    { id: 'Toronto', k: 'Ontario · On Lake Ontario', p: 'Neighbourhoods with their own character, a long lakefront and a highly diverse population. Busy, international and well connected by transit.', img: './assets/img/photos/family.jpg', alt: 'Cabbagetown, Toronto', cap: 'Cabbagetown, Toronto · © Jay Woodworth, CC BY 2.0', city: 'Toronto, Ontario' },
    { id: 'Vancouver', k: 'British Columbia · Pacific coast', p: 'Sea and mountains within the same view, rain more often than snow, and an outdoors culture that runs all year.', svg: 'coast', city: 'Vancouver, British Columbia' },
    { id: 'Montréal', k: 'Quebec · On the St. Lawrence', p: 'French-speaking, creative and full of festivals, with English- and French-language universities. Winters are cold and snowy; the city lives through them.', img: './assets/img/photos/canada-city.jpg', alt: 'Downtown Montréal', cap: 'Downtown Montréal · Andrew Welch, CC0', city: 'Montréal, Quebec' },
    { id: 'Calgary', k: 'Alberta · Rockies foothills', p: 'Prairie sky to the east, the Rocky Mountains to the west. A sunny climate, an energy and engineering economy, and weekend trips to Banff.', svg: 'rockies', city: 'Calgary, Alberta' },
    { id: 'Ottawa', k: 'Ontario · National capital', p: 'Bilingual, green and compact, with the Rideau Canal at its centre — skated on in winter — and Gatineau just across the river.', svg: 'river', city: 'Ottawa, Ontario' },
    { id: 'Halifax', k: 'Nova Scotia · Atlantic coast', p: 'A walkable harbour city with a maritime history, a friendly pace and close links to ocean research.', svg: 'harbour', city: 'Halifax, Nova Scotia' }
  ];
  var lifeTabs = $('[data-life-tabs]'), lifeStage = $('[data-life-stage]');
  if (lifeStage) {
    lifeTabs.innerHTML = LIFE.map(function (c, i) { return '<button type="button" class="chip" role="tab" aria-selected="' + (i === 0) + '" aria-pressed="' + (i === 0) + '" data-i="' + i + '">' + esc(c.id) + '</button>'; }).join('');
    lifeStage.innerHTML = LIFE.map(function (c, i) {
      var bg = c.img ? '<img src="' + c.img + '" alt="' + esc(c.alt) + '" loading="lazy">' : scene(c.svg);
      return '<div class="life-slide' + (i === 0 ? ' on' : '') + '" role="tabpanel" aria-label="' + esc(c.id) + '"><div class="bg">' + bg + '</div><div class="life-copy"><div><p class="k">' + esc(c.k) + '</p><h3>' + esc(c.id) + '</h3><p>' + esc(c.p) + '</p><button type="button" class="btn ghost" data-explore-city="' + esc(c.city) + '">Study options in ' + esc(c.id) + ' <span class="arr">→</span></button></div></div><p class="cap">' + esc(c.cap || 'Illustration') + '</p></div>';
    }).join('');
    var lifeI = 0, slides = $$('.life-slide', lifeStage), auto;
    function lifeGo(i) {
      lifeI = i;
      slides.forEach(function (s, k) { s.classList.toggle('on', k === i); s.setAttribute('aria-hidden', k !== i); $$('button', s).forEach(function (b) { b.tabIndex = k === i ? 0 : -1; }); });
      $$('.chip', lifeTabs).forEach(function (b, k) { b.setAttribute('aria-pressed', k === i); b.setAttribute('aria-selected', k === i); });
    }
    lifeGo(0);
    lifeTabs.addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; clearInterval(auto); lifeGo(+b.getAttribute('data-i')); });
    lifeStage.addEventListener('click', function (e) { var b = e.target.closest('[data-explore-city]'); if (b) exploreCity(b.getAttribute('data-explore-city')); });
    // gentle auto-advance only while visible, and never with reduced motion
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        clearInterval(auto);
        if (es[0].isIntersecting) auto = setInterval(function () { lifeGo((lifeI + 1) % LIFE.length); }, 7000);
      }, { threshold: 0.5 }).observe(lifeStage);
      lifeStage.addEventListener('pointerenter', function () { clearInterval(auto); });
    }
  }

  /* =====================================================================
   * FAQ
   * ===================================================================== */
  var faqList = $('[data-faq-list]');
  if (faqList) {
    var cats = ['All'];
    $$('.qa', faqList).forEach(function (q, i) {
      var c = q.getAttribute('data-cat'); if (cats.indexOf(c) < 0) cats.push(c);
      var b = $('button', q), a = $('.ans', q);
      b.id = 'faq-q' + i; a.id = 'faq-a' + i; b.setAttribute('aria-controls', a.id); a.setAttribute('role', 'region'); a.setAttribute('aria-labelledby', b.id);
      b.addEventListener('click', function () {
        var open = !q.classList.contains('open');
        $$('.qa.open', faqList).forEach(function (o) { o.classList.remove('open'); $('button', o).setAttribute('aria-expanded', 'false'); });
        q.classList.toggle('open', open); b.setAttribute('aria-expanded', open);
      });
    });
    var catBox = $('[data-faq-cats]');
    catBox.innerHTML = cats.map(function (c, i) { return '<button type="button" class="chip" aria-pressed="' + (i === 0) + '" data-c="' + esc(c) + '">' + esc(c) + '</button>'; }).join('');
    catBox.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return; var c = b.getAttribute('data-c');
      $$('.chip', catBox).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      $$('.qa', faqList).forEach(function (q) { q.hidden = !(c === 'All' || q.getAttribute('data-cat') === c); });
    });
  }

  /* =====================================================================
   * LEAD FORM → /api/enquiry (same contract as every country page)
   * ===================================================================== */
  function setDestination(text) {
    text = String(text).slice(0, 580);
    $$('[data-dest-input]').forEach(function (i) { i.value = text; });
    $$('[data-dest-label]').forEach(function (l) { l.innerHTML = 'Enquiry: <b>' + esc(text) + '</b>'; });
  }
  try { // a university picked on the directory page pre-fills the enquiry
    var picked = localStorage.getItem('selectedUniversity');
    if (picked) { localStorage.removeItem('selectedUniversity'); setDestination('Canada — ' + picked); }
  } catch (err) { /* storage unavailable */ }

  $$('form[data-lead-form]').forEach(function (form) {
    var btn = $('[data-submit]', form), label = btn.innerHTML, ok = $('[data-ok]', form), err = $('[data-err]', form);
    function status(s, m) { ok.classList.toggle('show', s === 'ok'); err.classList.toggle('show', s === 'err'); if (m) err.textContent = m; }
    form.addEventListener('submit', function (e) {
      e.preventDefault(); status('');
      var data = {}; new FormData(form).forEach(function (v, k) { data[k] = v; });
      if (String(data.name || '').trim().length < 2) return status('err', 'Please enter your full name.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email || '')) return status('err', 'Please enter a valid email address.');
      if (!/^[0-9]{7,15}$/.test(String(data.phone_number || '').replace(/\D/g, ''))) return status('err', 'Please enter a valid phone number (7-15 digits).');
      data.phone = (data.country_code || '') + ' ' + (data.phone_number || '');
      delete data.country_code; delete data.phone_number;
      try { data.page = location.host + location.pathname; } catch (x) { data.page = ''; }
      btn.disabled = true; btn.textContent = 'Sending…';
      fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return { success: false }; }); })
        .then(function (res) {
          if (res && res.success) { var d = data.destination; status('ok'); form.reset(); setDestination(d); }
          else status('err', (res && res.message) || 'Something went wrong. Please try again, or WhatsApp us on +91 701-090-2329.');
        })
        .catch(function () { status('err', 'Network error. Please check your connection and try again.'); })
        .then(function () { btn.disabled = false; btn.innerHTML = label; });
    });
  });
})();
