/* Tutee Connect — Canada · "Royal Canada" edition.
 * Dependency-free. Data: window.CA_UNIVERSITIES (IRCC DLI list). Lead form posts
 * to /api/enquiry with the same contract as every country page
 * (netlify/functions/enquiry.mjs). Every control on the page is wired here. */
(function () {
  'use strict';
  /* one paint per frame per handler, however many scroll events fire */
  function rafOnce(fn) { var q = 0; return function () { if (!q) q = requestAnimationFrame(function () { q = 0; fn(); }); }; }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var mqReduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var reduce = mqReduce.matches;
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fold = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var NF = window.Intl ? new Intl.NumberFormat('en-CA') : null; // one formatter, reused (counters call this every frame)
  var fmt = function (n) { return NF ? NF.format(Math.round(n)) : Math.round(n).toLocaleString('en-CA'); };
  var UNIS = window.CA_UNIVERSITIES || [];
  var provOf = function (u) { var p = u.location.split(','); return p[p.length - 1].trim(); };
  var cityOf = function (u) { return u.location.split(',')[0].trim(); };
  function goTo(id, focusSel) {
    var el = document.getElementById(id); if (!el) return;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    if (focusSel) setTimeout(function () { var f = $(focusSel); if (f) f.focus({ preventScroll: true }); }, reduce ? 0 : 800);
  }

  /* ================================================================ chrome */

  var hdr = $('[data-hdr]'), bar = $('[data-progress]'), lastY = 0, navLock = 0, userT = 0;
  // only hide the header for scrolls the visitor makes (not layout shifts from reveals)
  ['wheel', 'touchmove', 'keydown'].forEach(function (ev) { window.addEventListener(ev, function () { userT = Date.now(); }, { passive: true }); });
  // what is behind the header? (header itself has no background, so read the section underneath)
  var darkY = -999;
  function underDark() {
    var els = document.elementsFromPoint ? document.elementsFromPoint(Math.min(innerWidth * .1, 140), 38) : [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i]; if (hdr.contains(el)) continue;
      for (; el && el !== document.documentElement; el = el.parentElement) {
        if (el.tagName === 'IMG' || el.tagName === 'VIDEO') return true;
        var m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
        if (m && (m[3] === undefined || +m[3] > .5)) return (.299 * m[0] + .587 * m[1] + .114 * m[2]) / 255 < .5;
      }
    }
    return false;
  }
  /* Page and hero heights change rarely: measure them only when the layout resizes, never per frame */
  var docH = 0, heroH = 0, heroEl = document.querySelector('[data-hero]'), isEU = document.body.classList.contains('eu-page');
  function measureHdr() { docH = document.documentElement.scrollHeight - innerHeight; heroH = heroEl ? heroEl.offsetHeight : 0; }
  measureHdr();
  if ('ResizeObserver' in window) new ResizeObserver(function () { measureHdr(); }).observe(document.body); else addEventListener('resize', measureHdr);
  /* What is behind the header? Hit-testing is costly on phones, so sample it at most ~5x a second
   * while scrolling and once more when scrolling stops. */
  var darkT = 0, darkAt = 0;
  function checkDark() { darkT = 0; darkAt = Date.now(); darkY = window.scrollY; hdr.classList.toggle('on-dark', underDark()); }
  function onScroll() {
    var y = window.scrollY, h = docH;
    hdr.classList.toggle('solid', y > 40 || isEU);
    hdr.classList.toggle('past-hero', !heroEl || isEU || y > heroH - 90);
    if (y > 120 && y > lastY + 4 && !document.body.classList.contains('menu') && Date.now() > navLock) hdr.classList.add('hide');
    if (y < lastY - 4 || y <= 120) hdr.classList.remove('hide');
    if (Math.abs(y - darkY) > 40 || y < 50) {
      if (Date.now() - darkAt > 200 || y < 50) checkDark();
      else { clearTimeout(darkT); darkT = setTimeout(checkDark, 120); }
    }
    lastY = y;
    bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
  }
  window.addEventListener('scroll', rafOnce(onScroll), { passive: true });
  onScroll();
  // in-page links: always land below the sticky header (scroll-padding handles it), and reveal header
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]'); if (!a) return;
    var id = a.getAttribute('href').slice(1); if (!id) return;
    var t = document.getElementById(id); if (!t) return;
    e.preventDefault(); if (window.TCWarm) window.TCWarm(); hdr.classList.remove('hide'); navLock = Date.now() + 2600;
    t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#' + id);
  });

  var drawer = $('[data-drawer]'), opener = $('[data-open-drawer]');
  function setDrawer(open) {
    drawer.classList.toggle('open', open); drawer.setAttribute('aria-hidden', !open);
    opener.setAttribute('aria-expanded', open); document.body.classList.toggle('menu', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) setTimeout(function () { $('nav a', drawer).focus(); }, 300); else opener.focus({ preventScroll: true });
  }
  opener.addEventListener('click', function () { setDrawer(true); });
  $('[data-close-drawer]').addEventListener('click', function () { setDrawer(false); });
  $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('open')) setDrawer(false); });

  var navLinks = $$('.nav a');
  if ('IntersectionObserver' in window) {
    var navObs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) navLinks.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); }); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    navLinks.forEach(function (a) { var h = a.getAttribute('href'), t = h.charAt(0) === '#' ? $(h) : null; if (t) navObs.observe(t); });
  }

  /* reveals + counters */
  function countUp(el) {
    var to = +el.getAttribute('data-count'); if (reduce) { el.textContent = fmt(to); return; }
    var t0; requestAnimationFrame(function step(t) { t0 = t0 || t; var p = Math.min(1, (t - t0) / 1600); el.textContent = fmt(to * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(step); });
  }
  if ('IntersectionObserver' in window && !reduce) {
    var rv = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        $$('[data-count]', e.target).forEach(countUp);
        rv.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    $$('.rv, .clip, h2.display, h3.display, .fact').forEach(function (el) { rv.observe(el); });
  } else { $$('.rv, .clip, h2.display, h3.display').forEach(function (el) { el.classList.add('in'); }); }

  /* magnetic CTAs + ink-spot origin */
  $$('.btn').forEach(function (b) {
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty('--mx', (e.clientX - r.left) + 'px'); b.style.setProperty('--my', (e.clientY - r.top) + 'px');
      if (fine && !reduce && !b.closest('.hdr')) b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px)';
    });
    b.addEventListener('pointerleave', function () { b.style.transform = ''; });
  });

  if (document.querySelector('[data-hero]')) {
  /* ================================================================ hero
   * Light editorial hero: one maple leaf drifts in on a breeze and settles by the
   * destination card; hovering a city tab swaps the card photo (crossfade). */
  var hero = $('[data-hero]'), L = window.TCLeaf, loader = $('[data-loader]'), layer = $('[data-leaf-layer]'), engine = null;
  // The leaf's journey: one stop per section. x/y are viewport fractions where the leaf sits
  // when that section is centred on screen; s is its scale. Stops hug the margins so the leaf
  // guides the eye without covering copy, and it shrinks as the story goes on.
  var STOPS = [
    ['top', .45, .26, .62], ['manifesto', .92, .3, .38], ['destinations', .49, .86, .42], ['universities', .955, .34, .36],
    ['programmes', .045, .84, .32], ['admissions', .955, .2, .3], ['journey', .3, .5, .3], ['finance', .95, .24, .3], ['scholarships', .045, .9, .26],
    ['permit', .955, .7, .25], ['careers', .045, .2, .24], ['life', .52, .9, .3], ['faq', .04, .86, .22], ['testimonials', .95, .28, .18], ['contact', .5, .17, .4], ['site-footer', .9, .42, .24]
  ];
  // phones: the leaf keeps to the right edge (half off-screen), hopping between the top and the middle, so it never sits on the text
  var STOPS_M = { top: [.74, .15, 1], manifesto: [.9, .16, .5], destinations: [.92, .18, .46], universities: [.9, .16, .46], programmes: [.92, .18, .44], admissions: [.9, .16, .44], journey: [.92, .18, .44], finance: [.9, .16, .44], scholarships: [.92, .18, .42], permit: [.9, .16, .42], careers: [.92, .18, .42], life: [.9, .16, .42], faq: [.92, .18, .4], testimonials: [.9, .16, .4], contact: [.9, .14, .5], 'site-footer': [.9, .18, .44] };
  function leafWaypoints() {
    var mob = innerWidth < 760;
    return STOPS.map(function (w) {
      var el = document.getElementById(w[0]); if (!el) return null;
      var r = el.getBoundingClientRect(), top = r.top + scrollY, m = STOPS_M[w[0]];
      var c = w[0] === 'top' ? innerHeight * .5 : top + Math.min(r.height, innerHeight * 1.4) * .5;
      return { id: w[0], c: c, x: mob ? Math.min(.94, Math.max(.06, w[1])) : w[1], y: w[2], s: mob ? (w[0] === 'top' ? 1 : Math.max(.62, w[3] * 1.9)) : w[3] }; // phones follow the same flight path as desktop
    }).filter(Boolean);
  }  function showCopy() { document.body.classList.add('loaded'); $$('[data-hero-title] .ln').forEach(function (l) { l.classList.add('in'); }); if (hero) hero.classList.add('revealed'); }
  if (L && layer && !reduce) engine = L.hero({ canvas: layer, hero: hero, pointerTarget: window, waypoints: leafWaypoints });
  function boot() {
    if (loader) { loader.classList.add('gone'); setTimeout(function () { loader.hidden = true; }, 800); }
    showCopy(); if (engine) setTimeout(function () { engine.play(); }, 200);
  }
  (function () { var c = $('[data-loader-leaf]'); if (c && L) c.getContext('2d').drawImage(L.sprite(), 0, 0, 160, 160); })();
  if (reduce || !loader) { if (loader) loader.hidden = true; showCopy(); }
  else {
    var img0 = $('[data-h-img]'), t0 = Date.now(), booted = false;
    var go = function () { if (booted) return; booted = true; setTimeout(boot, Math.max(0, 120 - (Date.now() - t0))); };
    if (img0.complete) go(); else { img0.addEventListener('load', go); img0.addEventListener('error', go); }
    setTimeout(go, 650);
  }

  var HC = {
    toronto: { n: 'Toronto', p: 'Ontario', l: 'A global city on Lake Ontario.', u: ['University of Toronto', 'Toronto Metropolitan University'], cr: '' },
    vancouver: { n: 'Vancouver', p: 'British Columbia', l: 'Harbour, mountains and a Pacific outlook.', u: ['University of British Columbia', 'Simon Fraser University'], cr: '' },
    montreal: { n: 'Montréal', p: 'Québec', l: 'French-speaking, historic and creative.', u: ['McGill University', 'Concordia University'], cr: '' },
    calgary: { n: 'Calgary', p: 'Alberta', l: 'A modern skyline at the edge of the Rockies.', u: ['University of Calgary', 'Mount Royal University'], cr: '' },
    ottawa: { n: 'Ottawa', p: 'Ontario', l: 'Parliament Hill above the Ottawa River.', u: ['University of Ottawa', 'Carleton University'], cr: '' }
  };
  var IDS = Object.keys(HC), curHC = 'toronto', tabs = $$('[data-city]', hero), card = $('[data-hx-card]'), segs = $$('[data-hx-prog] i');
  function selectHeroCity(id, auto) {
    if (!HC[id] || id === curHC) return; curHC = id; var c = HC[id], k = IDS.indexOf(id);
    $$('img', card).forEach(function (im) { im.classList.toggle('on', im.getAttribute('data-c') === id); });
    var bl = $('[data-hx-blur]', card); if (bl) bl.style.backgroundImage = 'url(./assets/img/cities/' + id + '-blur.webp)';
    tabs.forEach(function (b) { var on = b.getAttribute('data-city') === id; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    segs.forEach(function (g, j) { g.classList.remove('on'); g.classList.toggle('done', j < k); });
    void card.offsetWidth; segs[k].classList.add('on');
    $('[data-hx-prov]').textContent = c.p; $('[data-hx-name]').textContent = c.n; $('[data-hx-line]').textContent = c.l; $('[data-hx-cred]').textContent = c.cr; $('[data-hx-n]').textContent = '0' + (k + 1);
    $('[data-hx-unis]').innerHTML = '<em>' + c.u.join('</em><em>') + '</em>';
    $('[data-hx-go]').setAttribute('aria-label', 'Explore ' + c.n + ' in the destinations atlas');
    var cap = $('.hx-cap', hero); cap.classList.remove('swap-in'); void cap.offsetWidth; cap.classList.add('swap-in');
    if (!auto) card.classList.add('user');
  }
  $('[data-hx-cred]').textContent = HC.toronto.cr;
  // autoplay: the active story segment's CSS fill drives the advance; hover/off-screen pauses it
  if (!reduce) {
    card.classList.add('auto');
    segs.forEach(function (g) { g.addEventListener('animationend', function () { if (g.classList.contains('on')) selectHeroCity(IDS[(IDS.indexOf(curHC) + 1) % IDS.length], true); }); });
    var stage = $('.hx-stage', hero);
    stage.addEventListener('pointerenter', function () { card.classList.add('paused'); });
    stage.addEventListener('pointerleave', function () { card.classList.remove('paused'); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { card.classList.toggle('off', !es[0].isIntersecting); }).observe(card);
  }
  var hovT;
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { selectHeroCity(b.getAttribute('data-city')); });
    if (fine) b.addEventListener('mouseenter', function () { clearTimeout(hovT); hovT = setTimeout(function () { selectHeroCity(b.getAttribute('data-city')); }, 60); });
    b.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; n.focus(); n.click(); } });
  });
  $('[data-hx-go]').addEventListener('click', function () { if (window.__selectCity) window.__selectCity(curHC); goTo('destinations'); });

  // 3D tilt + glare + inner parallax on the card; cursor aura across the hero
  if (fine && !reduce) {
    var tilt = $('[data-hx-tilt]'), aura = $('[data-hx-aura]'), tx = 0, ty = 0, cx = 0, cy = 0, ax = innerWidth * .62, ay = innerHeight * .45, aX = ax, aY = ay, tick = false, inCard = false;
    function frame() {
      cx += (tx - cx) * .12; cy += (ty - cy) * .12; aX += (ax - aX) * .08; aY += (ay - aY) * .08;
      // the card stays still (3D tilt and photo parallax removed — they shimmered on hover); only the glare follows the pointer
      card.style.setProperty('--gx', (50 + cx * 50).toFixed(1) + '%'); card.style.setProperty('--gy', (50 + cy * 50).toFixed(1) + '%');
      aura.style.transform = 'translate(' + (aX - 350).toFixed(0) + 'px,' + (aY - 350).toFixed(0) + 'px)';
      if (Math.abs(tx - cx) + Math.abs(ty - cy) + Math.abs(ax - aX) + Math.abs(ay - aY) > .002) requestAnimationFrame(frame); else tick = false;
    }
    function kick() { if (!tick) { tick = true; requestAnimationFrame(frame); } }
    tilt.addEventListener('pointermove', function (e) { var r = tilt.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - .5; ty = (e.clientY - r.top) / r.height - .5; inCard = true; card.classList.add('hot'); kick(); });
    tilt.addEventListener('pointerleave', function () { tx = ty = 0; card.classList.remove('hot'); kick(); });
    hero.addEventListener('pointermove', function (e) { var r = hero.getBoundingClientRect(); ax = e.clientX - r.left; ay = e.clientY - r.top; kick(); });
  }

  } else { document.body.classList.add('loaded'); } /* end hero guard */
  /* ======================================================== journey rail
   * A fixed progress rail of the leaf's route; click a stop to travel there. */
  (function () {
    /* Flight to Canada: a route that runs the full height of the screen, from the
     * hero (home) to the footer (arrival). A plane flies down it with the page,
     * leaving a contrail; each section is a waypoint you can jump to. */
    if (!document.querySelector('[data-hero]')) return;   // the route belongs to the home page
    var RAIL = [['top', 'Departure'], ['destinations', 'Destinations'], ['universities', 'Universities'], ['programmes', 'Programmes'], ['admissions', 'Admissions'], ['journey', 'Journey'], ['finance', 'Finance'], ['scholarships', 'Scholarships'], ['permit', 'Permits'], ['careers', 'Careers'], ['family', 'Family'], ['life', 'Life in Canada'], ['faq', 'FAQ'], ['testimonials', 'Testimonials'], ['contact', 'Counselling'], ['site-footer', 'Arrival']];
    var N = RAIL.length;
    var nav = document.createElement('nav'); nav.className = 'fl'; nav.setAttribute('aria-label', 'Page sections');
    nav.innerHTML =
      '<div class="fl-end top" aria-hidden="true"><b>HOME</b><small>Departure</small></div>' +
      '<div class="fl-track" data-fl-track>' +
        '<span class="fl-route" aria-hidden="true"></span><span class="fl-trail" data-fl-trail aria-hidden="true"></span>' +
        RAIL.map(function (r, i) { return '<a href="#' + r[0] + '" class="fl-wp" data-fl="' + i + '" style="--i:' + i + ';--n:' + (N - 1) + '"><i></i><span><em>' + ('0' + (i + 1)).slice(-2) + '</em>' + r[1] + '</span></a>'; }).join('') +
        '<span class="fl-plane" data-fl-plane aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg><em data-fl-hud>Departure</em></span>' +
      '</div>' +
      '<div class="fl-end bot" aria-hidden="true"><b>CANADA</b><small>Arrival</small></div>';
    document.body.appendChild(nav);
    nav.addEventListener('pointerenter', function () { nav.classList.add('expand'); });
    nav.addEventListener('pointerleave', function () { nav.classList.remove('expand'); });
    var track = $('[data-fl-track]', nav), plane = $('[data-fl-plane]', nav), trail = $('[data-fl-trail]', nav), hud = $('[data-fl-hud]', nav), wps = $$('[data-fl]', nav);
    var POS = [], posT = 0, last = -1, trackH = 0, planeY = -1;
    function docMax() { return Math.max(1, document.documentElement.scrollHeight - innerHeight); }
    function place() {
      var max = docMax();
      POS = RAIL.map(function (r, i) {
        var e = document.getElementById(r[0]); if (!e) return 0;
        if (i === 0) return 0; if (i === N - 1) return 1;
        return Math.min(1, Math.max(0, (e.getBoundingClientRect().top + scrollY - innerHeight * .35) / max));
      });
      wps.forEach(function (w, i) { var t = (POS[i] * 100).toFixed(1) + '%'; if (w.style.top !== t) w.style.top = t; });
      trackH = track.offsetHeight; posT = Date.now();
    }
    var litY = -999, litAt = 0, litT = 0, railMQ = matchMedia('(min-width:1180px)');
    function upd() {
      if (!railMQ.matches || document.body.classList.contains('eu-page')) return; // rail hidden at this size: nothing to do
      if (Date.now() - posT > 1500) place();
      var f = Math.min(1, Math.max(0, scrollY / docMax()));
      var py = Math.round(f * trackH); if (py !== planeY) { planeY = py; plane.style.transform = 'translate3d(0,' + py + 'px,0)'; } // compositor-only move
      trail.style.transform = 'scaleY(' + f + ')';
      var ai = 0; for (var i = 0; i < N; i++) if (POS[i] <= f + .002) ai = i;
      if (ai !== last) {
        last = ai;
        wps.forEach(function (w, i) { w.classList.toggle('on', i === ai); w.classList.toggle('past', i < ai); });
        hud.textContent = RAIL[ai][1]; nav.classList.remove('ping'); void nav.offsetWidth; nav.classList.add('ping');
      }
      nav.classList.toggle('landed', f > .985);
      if ((Math.abs(scrollY - litY) > 32 && Date.now() - litAt > 150) || f > .985 || f < .01) { litY = scrollY; litAt = Date.now(); nav.classList.toggle('on-light', isLight()); } // hit-testing is costly: sample, don't run every frame
      else if (Math.abs(scrollY - litY) > 32) { clearTimeout(litT); litT = setTimeout(function () { litAt = 0; upd(); }, 180); } // and once more when scrolling stops
      nav.classList.add('show');
    }
    function isLight() {
      var r = track.getBoundingClientRect(), el = document.elementFromPoint(Math.max(0, r.left - 40), Math.min(innerHeight - 2, Math.max(0, plane.getBoundingClientRect().top)));
      if (el && el.closest && el.closest('[data-hero]')) return true;
      while (el && el !== document.documentElement) {
        var m = getComputedStyle(el).backgroundColor.match(/\d+(\.\d+)?/g);
        if (m && (m.length < 4 || +m[3] > .5)) return (+m[0] * .299 + +m[1] * .587 + +m[2] * .114) > 150;
        el = el.parentElement;
      }
      return true;
    }
    window.addEventListener('scroll', rafOnce(upd), { passive: true });
    window.addEventListener('resize', function () { posT = 0; upd(); }); upd(); window.addEventListener('load', function () { setTimeout(upd, 600); setTimeout(upd, 2500); });
  })();

  /* ============================================================ manifesto v2
   * Scroll opens the campus image from a framed panel to full bleed, with depth
   * parallax; hotspots on the image and the stat rail highlight each other. */
  (function () {
    var sec = $('[data-mf2]'); if (!sec) return;
    var media = $('[data-mf2-media]'), img = $('[data-mf2-img]'), title = $('[data-mf2-title]'), stats = $$('.mf2-stat', sec), hots = $$('[data-hot]', sec);
    var mx = 0, my = 0, raf = 0, lastCp = '', lastTf = '';
    function paint() {
      raf = 0;
      var r = sec.getBoundingClientRect(), vh = innerHeight;
      var p = Math.max(0, Math.min(1, (vh - r.top) / (vh * 1.1)));       // 0 entering → 1 fully opened
      var e = p * p * (3 - 2 * p);
      var ix = (1 - e) * 9, iy = (1 - e) * 12, rad = (1 - e) * 28;
      var cp = 'inset(' + iy.toFixed(2) + '% ' + ix.toFixed(2) + '% ' + iy.toFixed(2) + '% ' + ix.toFixed(2) + '% round ' + rad.toFixed(1) + 'px)';
      if (!reduce && cp !== lastCp) { lastCp = cp; media.style.clipPath = cp; } // only repaint the clip when it actually changes
      var drift = (r.top / vh) * -40 * (1 - e), k = 1 - e;   // settles to the full, uncropped photo
      var tf = 'translate3d(' + (mx * -18 * k) + 'px,' + (drift + my * -12 * k) + 'px,0) scale(' + (1.22 - e * .22) + ') rotateX(' + (k * 8).toFixed(2) + 'deg)';
      if (!reduce && tf !== lastTf) { lastTf = tf; img.style.transform = tf; }
      sec.classList.toggle('open', e > .55);
      if (e > .35) title.classList.add('in');
    }
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
    window.addEventListener('resize', paint);
    if (fine && !reduce) sec.addEventListener('pointermove', function (ev) { var r = sec.getBoundingClientRect(); mx = (ev.clientX - r.left) / r.width - .5; my = (ev.clientY - r.top) / r.height - .5; if (!raf) raf = requestAnimationFrame(paint); });
    function focusStat(i) {
      stats.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      hots.forEach(function (h, k) { h.classList.toggle('on', k === i); h.setAttribute('aria-pressed', k === i); });
    }
    hots.forEach(function (h, i) { h.addEventListener('click', function () { focusStat(i); stats[i].focus({ preventScroll: true }); }); if (fine) h.addEventListener('mouseenter', function () { focusStat(i); }); });
    stats.forEach(function (s, i) { s.addEventListener('mouseenter', function () { focusStat(i); }); s.addEventListener('focus', function () { focusStat(i); }); s.addEventListener('click', function () { focusStat(i); }); });
    focusStat(0); paint();
  })();

  /* ============================================================ manifesto */
  var lit = $('[data-lit]');
  if (lit) {
    var html = '';
    lit.childNodes.forEach(function (n) {
      var isI = n.nodeType === 1 && n.tagName === 'I';
      (n.textContent).split(/(\s+)/).forEach(function (w) {
        if (!w) return; if (/^\s+$/.test(w)) { html += ' '; return; }
        html += '<span class="w' + (isI ? ' i' : '') + '">' + esc(w) + '</span>';
      });
    });
    lit.innerHTML = html;
    var words = $$('.w', lit);
    var litPaint = function () {
      var r = lit.getBoundingClientRect(), vh = innerHeight;
      var p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      var n = Math.round(p * words.length);
      words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    };
    if (reduce) words.forEach(function (w) { w.classList.add('on'); });
    else { window.addEventListener('scroll', rafOnce(litPaint), { passive: true }); litPaint(); }
  }

  /* ================================================================ maps */
  // Positions: % of the 1000×760 map, from the projection that drew royal-map.svg
  // (Lambert conformal conic, rotate −96°, parallels 49°/77°). See README.
  var CORRIDOR = { x: 59, y: 73.5, s: 3.75 }; // zoom origin (%), scale
  function makeMap(root) {
    var art = $('.map-art', root), view = 'all', markers = [];
    function place(m) {
      var x = m.x, y = m.y;
      if (view === 'corridor') { x = (x - CORRIDOR.x) * CORRIDOR.s; y = (y - CORRIDOR.y) * CORRIDOR.s; }
      m.el.style.left = x + '%'; m.el.style.top = y + '%';
      var out = x < 1 || x > 99 || y < 1 || y > 99;
      m.el.classList.toggle('hide', out); m.el.tabIndex = out ? -1 : 0;
    }
    /* Put a marker's label on the side (above, below, right, left) that covers no other marker. */
    function aim(m) {
      var tip = m.el.querySelector('.tip'); if (!tip) return;
      ['up', 'down', 'right', 'left'].forEach(function (d) { m.el.classList.remove('tip-' + d); });
      var mr = root.getBoundingClientRect(), r0 = m.el.getBoundingClientRect(), cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
      var w = tip.offsetWidth + 8, h = tip.offsetHeight + 8, G = 22;
      var boxes = { up: [cx - w / 2, cy - G - h, cx + w / 2, cy - G + 4], down: [cx - w / 2, cy + G - 4, cx + w / 2, cy + G + h], right: [cx + G - 4, cy - h / 2, cx + G + w, cy + h / 2], left: [cx - G - w, cy - h / 2, cx - G + 4, cy + h / 2] };
      var others = markers.filter(function (o) { return o !== m && !o.el.classList.contains('hide'); }).map(function (o) { var r = o.el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
      function score(d) {
        var b = boxes[d], hits = 0;
        others.forEach(function (p) { if (p[0] > b[0] - 10 && p[0] < b[2] + 10 && p[1] > b[1] - 10 && p[1] < b[3] + 10) hits++; });
        if (b[0] < mr.left || b[2] > mr.right || b[1] < mr.top || b[3] > mr.bottom) hits += 5;   // keep inside the map
        return hits;
      }
      var best = ['up', 'right', 'down', 'left'].sort(function (a, b) { return score(a) - score(b); })[0];
      m.el.classList.add('tip-' + best);
    }
    window.addEventListener('resize', function () { markers.forEach(function (m) { if (m.el.classList.contains('on')) aim(m); }); });
    return {
      add: function (o) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'mk' + (o.cls ? ' ' + o.cls : '');
        b.setAttribute('aria-label', o.label); b.innerHTML = '<i></i><span class="tip">' + esc(o.tip) + '</span>';
        b.addEventListener('click', o.onClick); root.appendChild(b);
        var m = { el: b, x: o.x, y: o.y, id: o.id }; markers.push(m); place(m); return m;
      },
      select: function (id) { markers.forEach(function (m) { var on = m.id === id; m.el.classList.toggle('on', on); m.el.setAttribute('aria-pressed', on); if (on) aim(m); }); },
      setView: function (v) {
        view = v;
        art.style.transform = v === 'corridor' ? 'translate(' + (-CORRIDOR.x * CORRIDOR.s) + '%,' + (-CORRIDOR.y * CORRIDOR.s) + '%) scale(' + CORRIDOR.s + ')' : '';
        markers.forEach(place);
        setTimeout(function () { markers.forEach(function (m) { if (m.el.classList.contains('on')) aim(m); }); }, 1350);
      },
      view: function () { return view; }
    };
  }
  function bindSeg(seg, map) {
    $$('button', seg).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', seg).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        map.setView(b.getAttribute('data-view'));
      });
    });
  }
  function setSeg(seg, v) { $$('button', seg).forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-view') === v); }); }
  var EAST = { toronto: 1, montreal: 1, ottawa: 1, waterloo: 1 };

  /* ========================================================= destinations */
  var CITIES = [
    { id: 'toronto', name: 'Toronto', prov: 'Ontario', match: 'Toronto, Ontario', x: 65.24, y: 91.42,
      atmos: "Canada's largest city and Ontario's capital, on the north shore of Lake Ontario. Busy, international and organised around distinct neighbourhoods, with a large international-student community and a major finance, technology, health-research and arts economy.",
      living: ['Toronto is consistently one of the most expensive rental markets in Canada — budget for housing first.', 'Shared off-campus housing is common; residence spaces for international students are limited.', 'The TTC runs subway, streetcar and bus services across the city.'],
      seasons: 'Four distinct seasons: humid, warm summers and cold winters with regular snow, moderated slightly by the lake.',
      distinct: 'Breadth — the range of universities, colleges, employers and communities in one metropolitan area.' },
    { id: 'vancouver', name: 'Vancouver', prov: 'British Columbia', match: 'Vancouver, British Columbia', x: 13.5, y: 73.3,
      atmos: 'A Pacific port city set between the Coast Mountains and the sea, with an outdoors culture that runs all year. Strong in technology, film and digital media, forestry and ocean sciences.',
      living: ['Vancouver is consistently among the most expensive rental markets in Canada.', 'Students at many institutions receive a U-Pass — at UBC it costs C$43.35 a month, included in student fees.', 'SkyTrain and buses link the city with Burnaby, Richmond and Surrey.'],
      seasons: "The mildest winters of Canada's major cities, with frequent rain from autumn to spring and little lasting snow at sea level.",
      distinct: 'Mountains and ocean in the same view — and the gentlest winter of any big Canadian city.' },
    { id: 'montreal', name: 'Montréal', prov: 'Quebec', match: 'Montréal, Quebec', x: 71.34, y: 84.29,
      atmos: "Québec's largest city — predominantly French-speaking, creative and full of festivals, with both English- and French-language universities. A centre for AI research, aerospace, gaming and the arts.",
      living: ['Rents have historically been lower than in Toronto and Vancouver.', 'Québec students need a Québec Acceptance Certificate (CAQ) as well as a study permit.', 'The STM métro and bus network serves the island.'],
      seasons: 'Warm summers and long, cold, snowy winters — the city lives through them with an underground network and winter festivals.',
      distinct: 'Studying in English while living in a French-speaking city.' },
    { id: 'ottawa', name: 'Ottawa', prov: 'Ontario', match: 'Ottawa, Ontario', x: 68.86, y: 85.63,
      atmos: "The national capital, on the Ottawa River at the Ontario–Québec border. Bilingual, green and compact, with institutions close to government, public policy, technology and research.",
      living: ['A smaller, quieter city than Toronto or Montréal, with Gatineau (Québec) just across the river.', 'OC Transpo runs the O-Train light rail and buses.', 'Many students live near campus in Sandy Hill, the Glebe or Centretown.'],
      seasons: "Cold, snowy winters — the Rideau Canal becomes a skateway when ice conditions allow — and warm summers.",
      distinct: 'A bilingual capital where English and French programmes sit side by side.' },
    { id: 'calgary', name: 'Calgary', prov: 'Alberta', match: 'Calgary, Alberta', x: 24.12, y: 74.15,
      atmos: "Alberta's largest city, where the prairie meets the Rocky Mountain foothills — about an hour and a half's drive from Banff. Known for energy, engineering and a growing technology sector.",
      living: ['Alberta has no provincial sales tax — only the 5% federal GST applies to most purchases.', 'Calgary Transit runs the CTrain light rail and buses.', 'Weekend access to the Rockies is part of student life.'],
      seasons: 'A sunny, dry climate with cold winters broken up by warm chinook winds that can raise temperatures quickly.',
      distinct: 'City life with the Rockies on the horizon.' },
    { id: 'edmonton', name: 'Edmonton', prov: 'Alberta', match: 'Edmonton, Alberta', x: 25.92, y: 68.85,
      atmos: "Alberta's capital, set along the wooded North Saskatchewan River valley. A research, government and energy centre.",
      living: ['Alberta has no provincial sales tax — only the 5% federal GST applies to most purchases.', 'Edmonton’s LRT serves the University of Alberta campus.', 'A smaller, more affordable feel than Canada’s largest cities.'],
      seasons: 'Cold, bright winters and long summer days thanks to its northern latitude.',
      distinct: 'A river-valley city with a big research university at its centre.' },
    { id: 'waterloo', name: 'Waterloo', prov: 'Ontario', match: 'Waterloo, Ontario', x: 63.88, y: 92.34,
      atmos: 'Part of Waterloo Region with Kitchener and Cambridge, about 100 km west of Toronto. Closely associated with technology, mathematics, engineering and co-operative education.',
      living: ['A university town where much of life revolves around two campuses.', 'Grand River Transit runs the ION light rail between Waterloo and Kitchener.', 'Co-op work terms can take students to other cities during their degree.'],
      seasons: 'Four seasons with snowy winters typical of southern Ontario.',
      distinct: 'Co-op culture — alternating study and paid work terms is the norm, not the exception.' },
    { id: 'halifax', name: 'Halifax', prov: 'Nova Scotia', match: 'Halifax, Nova Scotia', x: 83.47, y: 79.15,
      atmos: "Nova Scotia's capital and the largest city in Atlantic Canada, on a deep natural harbour. Walkable, maritime and friendly, with strengths in ocean science, health and the arts.",
      living: ['Several universities sit within a compact, walkable city.', 'Halifax Transit runs buses and harbour ferries to Dartmouth.', 'Each Atlantic province runs its own Provincial Nominee Program — eligibility varies and is never guaranteed.'],
      seasons: 'A maritime climate — milder winters than inland cities but changeable weather, with mixed snow and rain.',
      distinct: 'An ocean city with a close-knit student community.' }
  ];
  function cityData(c) {
    var all = UNIS.filter(function (u) { return fold(u.location) === fold(c.match); });
    var ranked = all.filter(function (u) { return u.ranked; });
    var areas = {};
    ranked.forEach(function (u) { String(u.programs).split(',').forEach(function (p) { p = p.trim(); if (p) areas[p] = (areas[p] || 0) + 1; }); });
    return { n: all.length, pg: all.filter(function (u) { return u.pgwp === 'Yes'; }).length, ranked: ranked,
      colleges: all.filter(function (u) { return u.type === 'College' && u.pgwp === 'Yes'; }).slice(0, 3),
      areas: Object.keys(areas).sort(function (a, b) { return areas[b] - areas[a]; }).slice(0, 8) };
  }
  var dossier = $('[data-dossier]'), cityMapEl = $('[data-map=cities]'), cityMap, cityTab = 'overview', curCity;
  function renderDossier(c) {
    var d = cityData(c), body = '';
    if (cityTab === 'overview') body = '<p>' + esc(c.atmos) + '</p><div class="duo"><div><b>' + d.n + '</b><small>institutions on the DLI list</small></div><div><b>' + d.pg + '</b><small>listed as PGWP-eligible</small></div></div><p style="color:var(--ice)"><em style="font-family:var(--serif)">Distinctive:</em> ' + esc(c.distinct) + '</p>';
    if (cityTab === 'unis') body = '<ul class="kv">' + d.ranked.concat(d.colleges).slice(0, 6).map(function (u) { return '<li><span>' + esc(u.name) + '</span><span>' + (u.type === 'U15' ? 'Research university' : esc(u.type)) + '</span></li>'; }).join('') + '</ul>' + (d.areas.length ? '<p class="dz-k" style="margin-bottom:10px">Known strengths</p><div class="tagset">' + d.areas.map(function (a) { return '<span>' + esc(a) + '</span>'; }).join('') + '</div>' : '');
    if (cityTab === 'living') body = '<ul class="kv">' + c.living.map(function (l) { return '<li><span>' + esc(l) + '</span></li>'; }).join('') + '</ul><p class="fine">Costs depend on housing type, lifestyle and timing. Use the cost estimator below with real quotes.</p>';
    if (cityTab === 'seasons') body = '<p style="font-family:var(--serif);font-size:24px;line-height:1.35;color:var(--ivory)">' + esc(c.seasons) + '</p><p class="fine">General climate pattern; conditions vary year to year.</p>';
    $('[data-dz-pane]', dossier).innerHTML = '<div class="pane">' + body + '</div>';
  }
  function selectCity(id) {
    var c = CITIES.filter(function (x) { return x.id === id; })[0]; if (!c) return; curCity = c;
    cityMap.select(id);
    $$('[data-city-chips] .chip').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-id') === id); });
    dossier.setAttribute('data-initial', c.name.charAt(0));
    dossier.innerHTML = '<div class="pane"><p class="dz-k">' + esc(c.prov) + '</p><h3>' + esc(c.name) + '</h3></div>' +
      '<div class="tabs" role="tablist" aria-label="' + esc(c.name) + ' details">' + [['overview', 'Atmosphere'], ['unis', 'Universities'], ['living', 'Living'], ['seasons', 'Seasons']].map(function (t) { return '<button type="button" role="tab" aria-selected="' + (t[0] === cityTab) + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<div data-dz-pane></div><div class="dz-foot"><button type="button" class="btn ice sm" data-city-go="' + esc(c.match) + '">Universities in ' + esc(c.name) + ' <span class="ar">→</span></button><button type="button" class="tlink" data-city-enquire>Ask about ' + esc(c.name) + '</button></div>';
    renderDossier(c);
  }
  if (dossier) {
    cityMap = makeMap(cityMapEl);
    CITIES.forEach(function (c) {
      cityMap.add({ id: c.id, x: c.x, y: c.y, tip: c.name, label: c.name + ', ' + c.prov, onClick: function () { selectCity(c.id); } });
      var ch = document.createElement('button'); ch.type = 'button'; ch.className = 'chip'; ch.textContent = c.name; ch.setAttribute('data-id', c.id);
      ch.addEventListener('click', function () { if (cityMap.view() === 'corridor' && !EAST[c.id]) { cityMap.setView('all'); setSeg($('.dests .seg'), 'all'); } selectCity(c.id); });
      $('[data-city-chips]').appendChild(ch);
    });
    bindSeg($('.dests .seg'), cityMap);
    selectCity('toronto');
    window.__selectCity = function (id) { if (cityMap.view() === 'corridor' && !EAST[id]) { cityMap.setView('all'); setSeg($('.dests .seg'), 'all'); } selectCity(id); };
    dossier.addEventListener('click', function (e) {
      var t = e.target.closest('[data-tab]');
      if (t) { cityTab = t.getAttribute('data-tab'); $$('[data-tab]', dossier).forEach(function (b) { b.setAttribute('aria-selected', b === t); }); renderDossier(curCity); return; }
      var g = e.target.closest('[data-city-go]');
      if (g) { uniState.q = curCity.name.replace('é', 'e'); $('[data-u-q]').value = curCity.name; renderUnis(true); goTo('universities'); return; }
      if (e.target.closest('[data-city-enquire]')) { setDestination('Canada — studying in ' + curCity.name); goTo('contact', '#l-name'); }
    });
    dossier.addEventListener('keydown', function (e) {
      var tabs = $$('[data-tab]', dossier), i = tabs.indexOf(document.activeElement); if (i < 0) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; n.focus(); n.click(); }
    });
  }

  /* ========================================================= universities */
  // Founding years and websites from each university's official site; positions from campus coordinates.
  var U = [
    { id: 'uoft', name: 'University of Toronto', city: 'Toronto', prov: 'Ontario', yr: 1827, web: 'https://www.utoronto.ca', data: 'University of Toronto', x: 65.22, y: 91.4, lang: 'English' },
    { id: 'york', name: 'York University', city: 'Toronto', prov: 'Ontario', yr: 1959, web: 'https://www.yorku.ca', data: 'York University', x: 65.04, y: 91.19, lang: 'English' },
    { id: 'tmu', name: 'Toronto Metropolitan University', city: 'Toronto', prov: 'Ontario', yr: 1948, web: 'https://www.torontomu.ca', data: 'Toronto Metropolitan University (TMU)', x: 65.25, y: 91.4, lang: 'English' },
    { id: 'ubc', name: 'University of British Columbia', city: 'Vancouver', prov: 'British Columbia', yr: 1908, web: 'https://www.ubc.ca', data: 'University of British Columbia (UBC)', x: 13.36, y: 73.27, lang: 'English' },
    { id: 'sfu', name: 'Simon Fraser University', city: 'Burnaby', prov: 'British Columbia', yr: 1965, web: 'https://www.sfu.ca', data: 'Simon Fraser University', x: 13.71, y: 73.43, lang: 'English' },
    { id: 'mcgill', name: 'McGill University', city: 'Montréal', prov: 'Quebec', yr: 1821, web: 'https://www.mcgill.ca', data: 'McGill University', x: 71.33, y: 84.28, lang: 'English' },
    { id: 'udem', name: 'Université de Montréal', city: 'Montréal', prov: 'Quebec', yr: 1878, web: 'https://www.umontreal.ca', data: 'Université de Montréal', x: 71.29, y: 84.31, lang: 'French' },
    { id: 'concordia', name: 'Concordia University', city: 'Montréal', prov: 'Quebec', yr: 1974, web: 'https://www.concordia.ca', data: 'Concordia University', x: 71.33, y: 84.3, lang: 'English' },
    { id: 'uwaterloo', name: 'University of Waterloo', city: 'Waterloo', prov: 'Ontario', yr: 1957, web: 'https://uwaterloo.ca', data: 'University of Waterloo', x: 63.85, y: 92.33, lang: 'English' },
    { id: 'ualberta', name: 'University of Alberta', city: 'Edmonton', prov: 'Alberta', yr: 1908, web: 'https://www.ualberta.ca', data: 'University of Alberta', x: 25.87, y: 68.89, lang: 'English' },
    { id: 'ucalgary', name: 'University of Calgary', city: 'Calgary', prov: 'Alberta', yr: 1966, web: 'https://www.ucalgary.ca', data: 'University of Calgary', x: 24.07, y: 74.05, lang: 'English' },
    { id: 'mcmaster', name: 'McMaster University', city: 'Hamilton', prov: 'Ontario', yr: 1887, web: 'https://www.mcmaster.ca', data: 'McMaster University', x: 64.74, y: 92.55, lang: 'English' },
    { id: 'queens', name: "Queen's University", city: 'Kingston', prov: 'Ontario', yr: 1841, web: 'https://www.queensu.ca', data: 'Queen’s University', x: 68.56, y: 88.73, lang: 'English' },
    { id: 'western', name: 'Western University', city: 'London', prov: 'Ontario', yr: 1878, web: 'https://www.uwo.ca', data: 'Western University', x: 63.11, y: 93.7, lang: 'English' },
    { id: 'uottawa', name: 'University of Ottawa', city: 'Ottawa', prov: 'Ontario', yr: 1848, web: 'https://www.uottawa.ca', data: 'Université d’Ottawa/University of Ottawa', x: 68.88, y: 85.61, lang: 'English & French' },
    { id: 'carleton', name: 'Carleton University', city: 'Ottawa', prov: 'Ontario', yr: 1942, web: 'https://carleton.ca', data: 'Carleton University', x: 68.88, y: 85.7, lang: 'English' },
    { id: 'dal', name: 'Dalhousie University', city: 'Halifax', prov: 'Nova Scotia', yr: 1818, web: 'https://www.dal.ca', data: 'Dalhousie University', x: 83.47, y: 79.19, lang: 'English' },
    { id: 'umanitoba', name: 'University of Manitoba', city: 'Winnipeg', prov: 'Manitoba', yr: 1877, web: 'https://umanitoba.ca', data: 'University of Manitoba', x: 42.47, y: 80.68, lang: 'English' },
    { id: 'usask', name: 'University of Saskatchewan', city: 'Saskatoon', prov: 'Saskatchewan', yr: 1907, web: 'https://www.usask.ca', data: 'University of Saskatchewan', x: 32.42, y: 74.09, lang: 'English' }
  ];
  var byName = {}; UNIS.forEach(function (u) { byName[u.name] = u; });
  U.forEach(function (u) { var d = byName[u.data] || {}; u.type = d.type || ''; u.pgwp = d.pgwp || '—'; u.programs = d.programs || ''; u.rank = d.ranked ? d.rank : null; });
  var AREAS = [
    { k: 'eng', l: 'Engineering', re: /engineering/i },
    { k: 'cs', l: 'Computer Science', re: /computer|computing|mathematics|co-op/i },
    { k: 'bus', l: 'Business', re: /business|management|commerce|economics/i },
    { k: 'health', l: 'Health & Medicine', re: /medicine|nursing|health|pharmacy|kinesiology|dentistry/i },
    { k: 'sci', l: 'Sciences', re: /science|biology|chemistry|physics|astronomy/i },
    { k: 'env', l: 'Environment & Resources', re: /environment|forestry|agricultur|marine|ocean|energy|earth|veterinary/i },
    { k: 'law', l: 'Law & Policy', re: /law|public|policy|journalism|social/i },
    { k: 'arts', l: 'Arts & Media', re: /arts|design|media|music|film|fine|communication|architecture/i }
  ];
  var uniState = { q: '', area: '', level: '', sel: 'uoft' }, uniMap, uniMarks = {};
  var uList = $('[data-u-list]'), profile = $('[data-profile]');
  /* counselling form: the University picker lists the same 19 top universities */
  var uPick = $('[data-uni-pick]');
  if (uPick) U.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).forEach(function (u) { var o = document.createElement('option'); o.textContent = u.name; uPick.appendChild(o); });
  function uniMatches(u) {
    var q = fold(uniState.q).trim();
    if (q && fold(u.name + ' ' + u.city + ' ' + u.prov).indexOf(q) < 0) return false;
    if (uniState.area) { var a = AREAS.filter(function (x) { return x.k === uniState.area; })[0]; if (!a.re.test(u.programs)) return false; }
    return true; // all listed universities award bachelor's, master's and doctoral degrees
  }
  function renderProfile(u) {
    var cls = u.pgwp;
    profile.innerHTML = '<div class="pane"><span class="yr-big" aria-hidden="true">' + u.yr + '</span><p class="dz-k">' + esc(u.city) + ' · ' + esc(u.prov) + '</p><h3>' + esc(u.name) + '</h3>' +
      '<div class="tagset">' + String(u.programs).split(',').map(function (p) { return p.trim() ? '<span>' + esc(p.trim()) + '</span>' : ''; }).join('') + '</div>' +
      '<div class="meta"><div><small>Founded</small><b>' + u.yr + '</b></div><div><small>Type</small><b>' + (u.type === 'U15' ? 'U15 research' : esc(u.type || 'University')) + '</b></div><div><small>Teaching</small><b>' + esc(u.lang) + '</b></div></div>' +
      '<p class="fine" style="margin:0 0 4px">IRCC PGWP status: <span class="pg ' + cls + '">' + esc(u.pgwp) + '</span>' + (u.rank && u.rank <= 17 ? ' · Listed in QS World University Rankings 2026' : '') + '</p>' +
      '<p class="fine" style="margin:0">Degree levels: bachelor’s, master’s and doctoral. Strengths shown are indicative.</p>' +
      '<div class="dz-foot"><button type="button" class="btn sm" data-u-enquire>Enquire about ' + esc(u.name.replace('University of ', 'U of ')) + ' <span class="ar">→</span></button></div></div>';
  }
  function selectUni(id, scrollList) {
    var u = U.filter(function (x) { return x.id === id; })[0]; if (!u) return;
    uniState.sel = id; uniMap.select(id);
    var east = u.x > 59 && u.y > 73.5;
    if (uniMap.view() === 'corridor' && !east) { uniMap.setView('all'); setSeg($('.u-map .seg'), 'all'); }
    $$('button', uList).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-id') === id); });
    if (scrollList) { var b = $('[data-id="' + id + '"]', uList); if (b) {
      var sideways = uList.scrollWidth > uList.clientWidth + 4; // phones: the list is a sideways slider
      if (sideways) uList.scrollTo({ left: uList.scrollLeft + b.getBoundingClientRect().left - uList.getBoundingClientRect().left - 20, behavior: reduce ? 'auto' : 'smooth' });
      else uList.scrollTo({ top: b.offsetTop - uList.offsetTop - 10, behavior: reduce ? 'auto' : 'smooth' });
    } }
    renderProfile(u);
  }
  function renderUnis(autoSelect) {
    var r = U.filter(uniMatches);
    $('[data-u-count]').textContent = r.length + ' of ' + U.length + ' top universities' + (uniState.level ? ' · all award ' + uniState.level.toLowerCase() + ' degrees' : '');
    uList.innerHTML = r.length ? r.map(function (u) {
      return '<li class="u-item"><button type="button" aria-pressed="' + (u.id === uniState.sel) + '" data-id="' + u.id + '"><b>' + esc(u.name) + '</b><span class="yr">est. ' + u.yr + '</span><small>' + esc(u.city) + ', ' + esc(u.prov) + '</small></button></li>';
    }).join('') : '<li class="fine" style="padding:20px 0">No universities match. Try another study area — or search all 1,135 institutions below.</li>';
    U.forEach(function (u) { uniMarks[u.id].el.classList.toggle('hide', r.indexOf(u) < 0); });
    if (autoSelect && r.length && r.indexOf(U.filter(function (x) { return x.id === uniState.sel; })[0]) < 0) selectUni(r[0].id);
  }
  if (uList) {
    uniMap = makeMap($('[data-map=unis]'));
    U.forEach(function (u) { uniMarks[u.id] = uniMap.add({ id: u.id, x: u.x, y: u.y, cls: 'uni', tip: u.name, label: u.name + ', ' + u.city, onClick: function () { selectUni(u.id, true); } }); });
    bindSeg($('.u-map .seg'), uniMap);
    var areaBox = $('[data-u-areas]');
    areaBox.innerHTML = '<button type="button" class="chip" aria-pressed="true" data-a="">All areas</button>' + AREAS.map(function (a) { return '<button type="button" class="chip" aria-pressed="false" data-a="' + a.k + '">' + a.l + '</button>'; }).join('');
    areaBox.addEventListener('click', function (e) { var b = e.target.closest('[data-a]'); if (!b) return; uniState.area = b.getAttribute('data-a'); $$('.chip', areaBox).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); renderUnis(true); });
    var qt; $('[data-u-q]').addEventListener('input', function (e) { clearTimeout(qt); qt = setTimeout(function () { uniState.q = e.target.value; renderUnis(true); }, 140); });
    $('[data-u-level]').addEventListener('change', function (e) { uniState.level = e.target.value; renderUnis(true); });
    uList.addEventListener('click', function (e) { var b = e.target.closest('[data-id]'); if (b) selectUni(b.getAttribute('data-id')); });
    profile.addEventListener('click', function (e) {
      if (!e.target.closest('[data-u-enquire]')) return;
      var u = U.filter(function (x) { return x.id === uniState.sel; })[0];
      setDestination('Canada — ' + u.name + (uniState.level ? ' (' + uniState.level + ')' : '')); if (uPick) { uPick.value = u.name; uPick.dispatchEvent(new Event('change')); } goTo('contact', '#l-name');
    });
    renderUnis(); selectUni('uoft');

    /* Phones: the list is a sideways slider, so show that it slides — arrow buttons, a
     * "Swipe" cue and a position counter. Hidden by CSS on wider screens. */
    var sw = document.createElement('div'); sw.className = 'u-swipe';
    sw.innerHTML = '<button type="button" class="u-sw-btn" data-sw="-1" aria-label="Previous universities"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>' +
      '<span class="u-sw-cue"><span class="u-sw-hand" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M14 7l5 5-5 5"/></svg></span><span data-sw-txt>Swipe to see more</span></span>' +
      '<button type="button" class="u-sw-btn" data-sw="1" aria-label="Next universities"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>';
    uList.parentNode.insertBefore(sw, uList.nextSibling);
    var swTxt = $('[data-sw-txt]', sw), swPrev = $('[data-sw="-1"]', sw), swNext = $('[data-sw="1"]', sw), swTouched = false;
    function swUpdate() {
      var cards = $$('.u-item', uList), n = cards.length, max = uList.scrollWidth - uList.clientWidth;
      sw.hidden = n < 2 || max < 4;
      if (sw.hidden) return;
      var first = 0, L = uList.getBoundingClientRect().left;
      cards.forEach(function (c, k) { if (c.getBoundingClientRect().left - L < 40) first = k; });
      swPrev.disabled = uList.scrollLeft < 4; swNext.disabled = uList.scrollLeft > max - 4;
      swTxt.textContent = swTouched ? (first + 1) + ' of ' + n + ' — swipe for more' : 'Swipe to see all ' + n;
    }
    sw.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sw]'); if (!b) return; swTouched = true;
      var c = $('.u-item', uList), step = c ? c.getBoundingClientRect().width + 10 : uList.clientWidth * .8;
      uList.scrollBy({ left: step * +b.getAttribute('data-sw'), behavior: reduce ? 'auto' : 'smooth' });
    });
    var swQ = 0; uList.addEventListener('scroll', function () { if (uList.scrollLeft > 4) { swTouched = true; sw.classList.add('used'); } if (!swQ) swQ = requestAnimationFrame(function () { swQ = 0; swUpdate(); }); }, { passive: true });
    new MutationObserver(function () { uList.scrollLeft = 0; swUpdate(); }).observe(uList, { childList: true });
    addEventListener('resize', swUpdate); swUpdate();
  }

  /* directory of all 1,135 */
  var dList = $('[data-d-list]'), dState = { q: '', prov: '', type: '', pgwp: '', n: 12 };
  if (dList) {
    var provs = {}; UNIS.forEach(function (u) { provs[provOf(u)] = (provs[provOf(u)] || 0) + 1; });
    $('[data-d=prov]').innerHTML = '<option value="">All provinces &amp; territories</option>' + Object.keys(provs).sort().map(function (p) { return '<option value="' + esc(p) + '">' + esc(p) + ' (' + provs[p] + ')</option>'; }).join('');
    var renderDir = function (more) {
      var q = fold(dState.q).trim();
      var r = UNIS.filter(function (u) {
        return (!q || fold(u.name + ' ' + u.location).indexOf(q) > -1) && (!dState.prov || provOf(u) === dState.prov) && (!dState.type || u.type === dState.type) && (!dState.pgwp || u.pgwp === dState.pgwp);
      });
      $('[data-d-count]').innerHTML = fmt(r.length) + '<small>institution' + (r.length === 1 ? '' : 's') + '</small>';
      var start = more ? dList.children.length : 0; if (!more) dList.innerHTML = '';
      dList.insertAdjacentHTML('beforeend', r.slice(start, dState.n).map(function (u, i) {
        return '<div class="d-row" style="animation-delay:' + (i * 0.025) + 's"><b>' + esc(u.name) + '<span class="pg ' + u.pgwp + '">PGWP: ' + u.pgwp + '</span></b><small>' + esc(u.location) + ' · ' + (u.type === 'U15' ? 'U15 research university' : esc(u.type)) + '</small><button type="button" class="btn line sm" data-d-enq="' + esc(u.name) + '">Enquire</button></div>';
      }).join(''));
      if (!r.length) dList.innerHTML = '<p class="fine">No institutions match. Try fewer filters.</p>';
      $('[data-d-more]').hidden = r.length <= dState.n;
    };
    var dt; $('[data-d=q]').addEventListener('input', function (e) { clearTimeout(dt); dt = setTimeout(function () { dState.q = e.target.value; dState.n = 12; renderDir(); }, 140); });
    ['prov', 'type', 'pgwp'].forEach(function (k) { $('[data-d=' + k + ']').addEventListener('change', function (e) { dState[k] = e.target.value; dState.n = 12; renderDir(); }); });
    $('[data-d-more]').addEventListener('click', function () { dState.n += 12; renderDir(true); });
    dList.addEventListener('click', function (e) { var b = e.target.closest('[data-d-enq]'); if (!b) return; setDestination('Canada — ' + b.getAttribute('data-d-enq')); goTo('contact', '#l-name'); });
    renderDir();
  }

  /* =========================================================== programmes */
  var LEVELS = [
    { k: 'dip', yrs: '1–3 yrs', bar: 45, l: 'Diploma / certificate', route: 'Usually one to three years at a public college or polytechnic, focused on applied, job-ready skills.', pg: 'Non-degree programmes must meet IRCC’s field-of-study requirement for PGWP eligibility, and the institution and programme must be PGWP-eligible.', types: ['College', 'Public'] },
    { k: 'ba', yrs: '3–4 yrs', bar: 75, l: "Bachelor's", route: 'Usually three to four years at a university; many include optional or built-in co-op work terms.', pg: 'PGWP length usually follows programme length; a programme of two years or more can lead to a PGWP of up to three years.', types: ['U15', 'Public'] },
    { k: 'pgc', yrs: '~1 yr', bar: 22, l: 'Postgraduate certificate', route: 'Typically one year at a college, after a degree or diploma — a common route to specialise quickly.', pg: 'A one-year programme usually leads to a PGWP of about the same length, and the field-of-study requirement applies.', types: ['College', 'Public'] },
    { k: 'ma', yrs: '1–2 yrs', bar: 38, l: "Master's", route: 'One to two years: course-based (often with co-op or a project) or research-based with a thesis.', pg: 'Graduates of eligible master’s programmes of at least eight months can receive a PGWP of up to three years. Master’s students at public DLIs don’t need a PAL/TAL from 1 Jan 2026.', types: ['U15', 'Public'] },
    { k: 'phd', yrs: '4+ yrs', bar: 100, l: 'Doctorate', route: 'Typically four or more years of research, usually with funding through assistantships or supervisor grants.', pg: 'Doctoral students at public DLIs don’t need a PAL/TAL from 1 Jan 2026. Funding is decided by the programme.', types: ['U15', 'Public'] }
  ];
  var FIELDS = [
    { k: 'eng', l: 'Engineering', d: 'Civil, mechanical, electrical, software, chemical and more. Accredited engineering degrees in Canada are reviewed by Engineers Canada’s accreditation board.', re: /engineering/i },
    { k: 'cs', l: 'Computer Science', d: 'Software, systems, AI and theory. Often paired with co-op work terms at universities and applied programming diplomas at colleges.', re: /computer|computing|mathematics/i },
    { k: 'bus', l: 'Business', d: 'Management, finance, accounting, marketing and analytics — from college diplomas to undergraduate commerce degrees and MBAs.', re: /business|management|commerce/i },
    { k: 'health', l: 'Healthcare', d: 'Nursing, public health and allied health. Regulated professions need provincial licensing after study — check the regulator early.', re: /medicine|nursing|health|pharmacy/i },
    { k: 'data', l: 'Data Science', d: 'Statistics, machine learning and analytics, offered as specialised degrees, master’s programmes and postgraduate certificates.', re: /computer|mathematics|statistic|data/i },
    { k: 'bio', l: 'Biotechnology', d: 'Molecular biology, biochemistry and bioprocessing, usually within science faculties or applied college programmes.', re: /science|biolog|health sciences/i },
    { k: 'env', l: 'Environmental Studies', d: 'Sustainability, resource management, forestry and ocean sciences — shaped by Canada’s geography.', re: /environment|forestry|marine|ocean|energy|agricultur/i },
    { k: 'hosp', l: 'Hospitality', d: 'Hotel, tourism and culinary management — mostly taught at colleges, often with industry placements.', re: /hospitality|tourism|culinary/i }
  ];
  var REGIONS = [
    { k: '', l: 'Anywhere', p: null }, { k: 'on', l: 'Ontario', p: ['Ontario'] }, { k: 'bc', l: 'British Columbia', p: ['British Columbia'] }, { k: 'qc', l: 'Québec', p: ['Quebec'] },
    { k: 'ab', l: 'Alberta', p: ['Alberta'] }, { k: 'pr', l: 'Prairies', p: ['Manitoba', 'Saskatchewan'] }, { k: 'at', l: 'Atlantic', p: ['Nova Scotia', 'New Brunswick', 'Prince Edward Island', 'Newfoundland and Labrador'] }
  ];
  var FICON = {
    eng: '<path d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    cs: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
    bus: '<path d="M3 7h18v12H3zM8 7V5h8v2M3 12h18"/>',
    health: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10zM9 11h6M12 8v6"/>',
    data: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    bio: '<path d="M7 3c0 6 10 6 10 12s-10 3-10 6M17 3c0 6-10 6-10 12M8 7h8M8 17h8"/>',
    env: '<path d="M5 19c8 0 14-6 14-14C11 5 5 11 5 19zM5 19l8-8"/>',
    hosp: '<path d="M4 18h16M6 18a6 6 0 0112 0M12 6v2M3 21h18"/>'
  };
  var B = { level: 'ma', area: 'cs', region: '' }, result = $('[data-result]');
  function pickRow(key, items) {
    var box = $('[data-b=' + key + ']');
    box.innerHTML = items.map(function (it) { return '<button type="button" aria-pressed="' + (B[key] === it.k) + '" data-v="' + it.k + '">' + (key === 'area' && FICON[it.k] ? '<svg viewBox="0 0 24 24" aria-hidden="true">' + FICON[it.k] + '</svg>' : '') + '<span>' + esc(it.l) + '</span>' + (it.yrs ? '<small>' + it.yrs + '</small>' : '') + '</button>'; }).join('');
    box.addEventListener('click', function (e) { var b = e.target.closest('[data-v]'); if (!b) return; B[key] = b.getAttribute('data-v'); $$('button', box).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); var st = box.closest('.b-step'); if (st) { st.classList.remove('ping'); void st.offsetWidth; st.classList.add('ping'); } renderResult(true); });
  }
  function renderResult(animate) {
    var L = LEVELS.filter(function (x) { return x.k === B.level; })[0], F = FIELDS.filter(function (x) { return x.k === B.area; })[0], R = REGIONS.filter(function (x) { return x.k === B.region; })[0];
    var pool = UNIS.filter(function (u) { return (!R.p || R.p.indexOf(provOf(u)) > -1) && u.pgwp !== 'No' && L.types.indexOf(u.type) > -1; });
    var strong = UNIS.filter(function (u) { return u.ranked && (!R.p || R.p.indexOf(provOf(u)) > -1) && F.re.test(u.programs) && L.types.indexOf(u.type) > -1; }).slice(0, 5);
    var collegeLevel = B.level === 'dip' || B.level === 'pgc';
    var place = R.l === 'Anywhere' ? 'Canada' : R.l, code = 'TC·' + B.level.toUpperCase() + '·' + F.k.toUpperCase() + (B.region ? '·' + B.region.toUpperCase() : '·CA');
    result.innerHTML = '<div class="tk" data-tk>' +
      '<div class="tk-top"><span>Pathway ticket</span><span class="tk-no">' + code + '</span></div>' +
      '<div class="tk-route"><div><small>Level</small><b>' + esc(L.l) + '</b></div><i aria-hidden="true"></i><div><small>Field</small><b>' + esc(F.l) + '</b></div><i aria-hidden="true"></i><div><small>Region</small><b>' + esc(R.l) + '</b></div></div>' +
      '<p class="big">' + esc(F.l) + ' at <em>' + esc(L.l.toLowerCase()) + '</em> level</p><p class="lede tk-d">' + esc(F.d) + '</p>' +
      '<div class="tk-stats"><div class="tk-num"><b data-tk-count="' + pool.length + '">' + fmt(pool.length) + '</b><small>institutions on IRCC’s DLI list in ' + esc(place) + ' offer this level and aren’t listed as PGWP-ineligible</small></div>' +
      '<div class="tk-dur"><small>Typical length</small><b>' + esc(L.yrs) + '</b><span class="tk-bar"><i style="--w:' + L.bar + '%"></i></span></div></div>' +
      '<div class="tk-tear" aria-hidden="true"></div>' +
      '<h5>What the route looks like</h5><p class="tk-p">' + esc(L.route) + '</p>' +
      '<h5>' + (collegeLevel ? 'Where to look' : 'Universities known for this area') + '</h5>' +
      (strong.length && !collegeLevel ? '<ul>' + strong.map(function (u, n) { return '<li style="--i:' + n + '"><span>' + esc(u.name) + '</span><span>' + esc(cityOf(u)) + '</span></li>'; }).join('') + '</ul>' :
        '<p class="tk-p">' + (collegeLevel ? 'Public colleges and polytechnics are the main providers at this level.' : 'We don’t hold curated strength data for this field in this region — a counsellor will search programme by programme.') + '</p>') +
      '<div class="tk-stamp"><b>PGWP check</b><span>' + esc(L.pg) + '</span></div>' +
      '<div class="dz-foot" style="margin-top:24px"><button type="button" class="btn" data-b-go>Get matched programmes <span class="ar">→</span></button><button type="button" class="tlink" data-b-unis>See matching universities</button></div></div>';
    if (animate && !reduce) {
      var tk = $('[data-tk]', result); tk.classList.add('reprint');
      var nEl = $('[data-tk-count]', result), to = +nEl.getAttribute('data-tk-count'), from = result._last || 0, t0 = 0;
      requestAnimationFrame(function step(t) { t0 = t0 || t; var p = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - p, 3); nEl.textContent = fmt(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); });
    }
    result._last = pool.length;
  }
  if (result) {
    pickRow('level', LEVELS); pickRow('area', FIELDS); pickRow('region', REGIONS); renderResult();
    result.addEventListener('click', function (e) {
      var L = LEVELS.filter(function (x) { return x.k === B.level; })[0], F = FIELDS.filter(function (x) { return x.k === B.area; })[0], R = REGIONS.filter(function (x) { return x.k === B.region; })[0];
      if (e.target.closest('[data-b-go]')) {
        setDestination('Canada pathway — ' + F.l + ' · ' + L.l + ' · ' + R.l);
        var lv = $('#l-level'); if (lv) $$('option', lv).forEach(function (o) { if (o.value && L.l.indexOf(o.value.split(' ')[0]) === 0) lv.value = o.value; });
        goTo('contact', '#l-name');
      }
      if (e.target.closest('[data-b-unis]')) {
        var map = { eng: 'eng', cs: 'cs', bus: 'bus', health: 'health', data: 'cs', bio: 'sci', env: 'env', hosp: '' };
        uniState.area = map[F.k] || ''; uniState.q = '';
        $('[data-u-q]').value = '';
        $$('[data-u-areas] .chip').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-a') === uniState.area); });
        renderUnis(true); goTo('universities');
      }
    });
  }

  /* ============================================================== journey */
  var jr = $('[data-jr]');
  if (jr) {
    var steps = $$('.jr-step', jr), line = $('[data-jr-line]'), ring = $('[data-jr-ring]'), names = ['Profile', 'Courses', 'Applications', 'Admission', 'Finance', 'Study permit', 'Departure', 'Arrival'];
    var jrCur = -1, jrFill = -1;
    var jrPaint = function () {
      var r = jr.getBoundingClientRect(), mid = innerHeight * 0.55, cur = 0;
      steps.forEach(function (s, i) { var t = s.getBoundingClientRect().top; if (t < mid) cur = i; });
      steps.forEach(function (s, i) { s.classList.toggle('on', i === cur); s.classList.toggle('past', i < cur); });
      var fill = Math.max(0, Math.min(r.height - 16, mid - r.top));
      if (fill !== jrFill) { jrFill = fill; line.style.height = fill + 'px'; }
      var p = Math.max(0, Math.min(1, fill / (r.height - 16)));
      ring.style.strokeDashoffset = (628.3 * (1 - Math.max(p, (cur + 1) / steps.length * 0.999))).toFixed(1);
      if (jrCur !== cur) { jrCur = cur; $('[data-jr-num]').textContent = '0' + (cur + 1); $('[data-jr-name]').textContent = names[cur]; }
    };
    window.addEventListener('scroll', rafOnce(jrPaint), { passive: true });
    window.addEventListener('resize', jrPaint); jrPaint();
  }

  /* ============================================================== finance */
  var finTabs = $$('[data-fin-tabs] [role=tab]');
  finTabs.forEach(function (t, i) {
    t.addEventListener('click', function () {
      finTabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute('aria-controls')).hidden = !on; });
    });
    t.tabIndex = i === 0 ? 0 : -1;
    t.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var n = finTabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + finTabs.length) % finTabs.length]; n.focus(); n.click(); } });
  });
  var lenders = $('[data-lenders]');
  if (lenders) lenders.innerHTML = [['icici.png', 'ICICI Bank'], ['hdfc-credila.jpg', 'HDFC Credila'], ['avanse.jpg', 'Avanse'], ['auxilo.jpg', 'Auxilo'], ['axis.jpg', 'Axis Bank'], ['idfc.jpg', 'IDFC FIRST Bank'], ['incred.jpg', 'InCred'], ['mpower.jpg', 'MPOWER Financing'], ['prodigy.jpg', 'Prodigy Finance'], ['union.jpg', 'Union Bank of India']].map(function (l) { return '<div><img src="./assets/img/loan-partner/' + l[0] + '" alt="' + l[1] + '" loading="lazy" decoding="async" decoding="async"></div>'; }).join('');

  var PRESETS = [['Computer Science', 73000], ['Software Engineering', 75000], ['Mathematics', 62000], ['Science', 54000], ['Health', 54000], ['Environment', 51000]];
  var IRCC_MIN = 23448, est = $('[data-est]');
  function calcEst() {
    var yrs = +$('[data-e-years]').value, t = 0, l = 0;
    $$('[data-e]', est).forEach(function (i) { var v = Math.max(0, parseFloat(i.value) || 0) * (i.hasAttribute('data-mo') ? 12 : 1); if (i.getAttribute('data-e') === 'tuition') t = v; else l += v; });
    $('[data-e-years-out]').textContent = yrs; $('[data-e-yrs-lbl]').textContent = yrs + (yrs === 1 ? ' year' : ' years');
    $('[data-e-total]').textContent = fmt((t + l) * yrs);
    $('[data-e-t]').textContent = 'C$' + fmt(t); $('[data-e-l]').textContent = 'C$' + fmt(l);
    $('[data-e-peryear]').textContent = 'C$' + fmt(t + l) + ' per year × ' + yrs;
    var max = Math.max(t + l, IRCC_MIN, 1), barsH = '';
    for (var y = 1; y <= 4; y++) barsH += '<div class="bar" style="opacity:' + (y <= yrs ? 1 : .18) + '"><i class="l" style="height:' + (l / max * 100) + '%"></i><i class="t" style="height:' + (t / max * 100) + '%"></i><small>Year ' + y + '</small></div>';
    $('[data-e-bars]').innerHTML = barsH;
    var b = $('[data-e-bench]');
    if ($('[data-e-loc]').value === 'qc') b.innerHTML = 'Living costs entered: <b style="color:var(--ivory)">C$' + fmt(l) + '/yr</b>. For Québec, proof-of-funds amounts are set by MIFI (Ministère de l’Immigration, de la Francisation et de l’Intégration) — check its current figures.';
    else b.innerHTML = 'Living costs entered: <b style="color:var(--ivory)">C$' + fmt(l) + '/yr</b> vs IRCC’s minimum of C$' + fmt(IRCC_MIN) + ' (1 person, outside Québec, applications from 1 Sep 2026).<div class="meter"><i class="' + (l >= IRCC_MIN ? 'ok' : '') + '" style="width:' + Math.min(100, l / IRCC_MIN * 100) + '%"></i></div>' + (l === 0 ? 'Enter your monthly estimates to compare.' : l >= IRCC_MIN ? 'Your plan meets the minimum. Real costs in large cities are often higher — budget honestly.' : 'You’ll need to show at least the IRCC minimum for living costs, whatever your own estimate.') + ' <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/financial-support.html" target="_blank" rel="noopener" style="color:var(--ice-2)">Source</a>';
  }
  if (est) {
    var ps = $('[data-e-preset]');
    ps.insertAdjacentHTML('beforeend', PRESETS.map(function (p) { return '<option value="' + p[1] + '">' + p[0] + ' — C$' + fmt(p[1]) + '</option>'; }).join(''));
    ps.addEventListener('change', function () { if (ps.value) $('[data-e=tuition]').value = ps.value; calcEst(); });
    est.addEventListener('input', function (e) { if (e.target.getAttribute('data-e') === 'tuition') ps.value = ''; calcEst(); });
    $('[data-e-loc]').addEventListener('change', calcEst);
    $('[data-e-cta]').addEventListener('click', function () {
      var tot = $('[data-e-total]').textContent;
      if (tot !== '0') setDestination('Canada — budget review (estimate C$' + tot + ' over ' + $('[data-e-yrs-lbl]').textContent + ')');
    });
    calcEst();
  }

  /* =============================================================== permit */
  var IR = 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/';
  var ST = [
    { t: 'Before you apply', h: 'Start with an acceptance from a designated institution', p: 'A study permit is tied to studying at a designated learning institution (DLI). Your first milestone is a letter of acceptance from one.', l: ['Confirm the institution is on IRCC’s DLI list', 'Check the programme’s own PGWP eligibility if you plan to work after', 'Get a PAL/TAL from the province — unless you’re exempt (e.g. master’s or doctoral students at public DLIs, from 1 Jan 2026)', 'Québec: apply for a CAQ instead of a PAL/TAL'], s: [IR + 'study-permit/get-documents/provincial-attestation-letter.html', 'Provincial attestation letter'] },
    { t: 'Documents', h: 'Gather what IRCC asks for — accurately', p: 'IRCC generates a personalised document checklist when you apply online. Commonly requested items include:', l: ['Valid passport', 'Letter of acceptance, plus PAL/TAL or CAQ', 'Proof of financial support — first-year tuition, living funds (C$23,448 for one person outside Québec, applications from 1 Sep 2026) and travel', 'Any additional documents on your checklist, which vary by country and situation'], s: [IR + 'study-permit/get-documents/financial-support.html', 'Proof of financial support'] },
    { t: 'Apply', h: 'Submit online, then biometrics', p: 'Most applicants apply online through their IRCC account, pay the fees and are asked to give biometrics. You may also be asked for a medical exam.', l: ['Apply as early as possible after your acceptance', 'Give biometrics when instructed', 'Complete a medical exam if requested', 'IRCC reviews and decides — processing times vary by country'], s: [IR + 'study-permit.html', 'Study permit: how to apply'] },
    { t: 'Arrival', h: 'Your permit is issued at the border', p: 'If approved, you receive a letter of introduction. A border services officer decides whether to let you enter and issues the study permit at the port of entry.', l: ['Carry your passport, letter of introduction, acceptance letter and proof of funds', 'Check every detail on your study permit before leaving the counter', 'Keep your permit valid and follow its conditions'], s: [IR + 'study-permit/prepare-arrival.html', 'Prepare for arrival'] },
    { t: 'While studying', h: 'Work within the rules of your permit', p: 'If your permit allows it, you can work off campus up to 24 hours a week during regular academic sessions, and without a weekly limit during scheduled breaks.', l: ['Stay enrolled and make progress in your programme', 'Get a Social Insurance Number before you start work', 'On-campus work has separate rules', 'Studying is the purpose of your stay — part-time work is not a funding plan'], s: [IR + 'work/work-off-campus.html', 'Work off campus'] },
    { t: 'After graduation', h: 'PGWP and longer-term options', p: 'Eligible graduates of eligible programmes may apply for a Post-Graduation Work Permit of up to three years. Its length usually follows your programme’s length; eligible master’s graduates can receive up to three years. Most applicants must give proof of language results.', l: ['Check programme eligibility and any field-of-study requirement before you enrol', 'Plan for language testing before you apply', 'Some graduates later qualify for permanent residence through Express Entry or a Provincial Nominee Program — this is never guaranteed', 'Policies change: always confirm current rules on canada.ca'], s: [IR + 'work/after-graduation/about.html', 'About the PGWP'] }
  ];
  var stList = $('[data-st-list]'), stBody = $('[data-st-body]'), stI = 0;
  function stShow(i, focus) {
    stI = i;
    $$('[role=tab]', stList).forEach(function (b, k) { b.setAttribute('aria-selected', k === i); b.tabIndex = k === i ? 0 : -1; });
    var s = ST[i];
    stBody.setAttribute('aria-labelledby', 'st-' + i);
    stBody.innerHTML = '<div class="pane"><p class="kicker">Step ' + (i + 1) + ' of ' + ST.length + '</p><h3>' + esc(s.h) + '</h3><p class="lede">' + esc(s.p) + '</p><ul>' + s.l.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<p class="src" style="margin-top:16px">Official guidance: <a href="' + s.s[0] + '" target="_blank" rel="noopener">canada.ca — ' + esc(s.s[1]) + '</a> · Eligibility depends on individual circumstances.</p>' +
      '<div class="st-nav"><button type="button" class="btn line sm" data-st-prev' + (i === 0 ? ' disabled' : '') + '>← Previous</button>' + (i < ST.length - 1 ? '<button type="button" class="btn sm" data-st-next>Next step <span class="ar">→</span></button>' : '<a class="btn sm" href="#contact">Talk to a counsellor <span class="ar">→</span></a>') + '</div></div>';
    $('[data-st-bar]').style.width = ((i + 1) / ST.length * 100) + '%';
    if (focus) $$('[role=tab]', stList)[i].focus();
  }
  if (stList) {
    stList.innerHTML = ST.map(function (s, i) { return '<li role="presentation"><button type="button" role="tab" id="st-' + i + '">' + esc(s.t) + '</button></li>'; }).join('');
    $$('[role=tab]', stList).forEach(function (b, i) {
      b.addEventListener('click', function () { stShow(i); });
      b.addEventListener('keydown', function (e) { if (/Arrow(Down|Up|Right|Left)/.test(e.key)) { e.preventDefault(); stShow((i + (/Down|Right/.test(e.key) ? 1 : -1) + ST.length) % ST.length, true); } });
    });
    stBody.addEventListener('click', function (e) { if (e.target.closest('[data-st-next]')) stShow(stI + 1); if (e.target.closest('[data-st-prev]')) stShow(stI - 1); });
    stShow(0);
  }

  /* ================================================================= life */
  var SEASONS = [
    { k: 'autumn', fx: 'leaves', img: './assets/img/photos/season-autumn.webp', alt: 'Autumn colour over a downtown skyline', cap: 'Autumn · photo supplied by Tutee Connect', l: 'Autumn', when: 'September – November', h: 'Autumn', p: 'Most students arrive for the September intake, as maple forests turn red and gold. Orientation, clubs and the first assignments all land at once.', li: ['Arrive in time for orientation — it’s where friendships start', 'Buy winter clothing locally, before the first cold snap', 'Set up a bank account, phone plan and transit pass'] },
    { k: 'winter', fx: 'snow', img: './assets/img/photos/season-winter.webp', alt: 'A snow-covered city park lit by street lamps at dusk', cap: 'Winter · photo supplied by Tutee Connect', l: 'Winter', when: 'December – March', h: 'Winter', p: 'Cold and snowy across most of the country — milder and wetter on the Pacific coast. Campuses, transit and cities are built to keep running.', li: ['Layer: thermal base, insulated coat, waterproof boots, hat and gloves', 'Expect short daylight hours — plan routines that keep you outside', 'Winter is the season of skating, skiing and festivals'] },
    { k: 'spring', fx: 'leaves', img: './assets/img/photos/season-spring.webp', alt: 'A blossoming tree beside a riverside park', cap: 'Spring · photo supplied by Tutee Connect', l: 'Spring', when: 'April – May', h: 'Spring', p: 'Snow melts, final exams arrive and many programmes end their winter term. Some students begin May intakes or summer co-op terms.', li: ['Final exams usually fall in April', 'Look for summer jobs or co-op placements early', 'Scheduled breaks allow work without a weekly hour limit, if eligible'] },
    { k: 'summer', fx: 'leaves', img: './assets/img/photos/season-summer.webp', alt: 'Canoes on a turquoise mountain lake below snow-capped peaks', cap: 'Summer · photo supplied by Tutee Connect', l: 'Summer', when: 'June – August', h: 'Summer', p: 'Long, warm days — lakes, parks, festivals and travel. A time for co-op terms, summer courses, work during the scheduled break, or exploring the country.', li: ['National and provincial parks are at their best', 'Many cities host free outdoor festivals', 'Plan housing for the next academic year early'] }
  ];
  var sBox = $('[data-seasons]');
  if (sBox) {
    sBox.insertAdjacentHTML('beforeend', SEASONS.map(function (s, i) {
      return '<div class="season' + (i === 0 ? ' on' : '') + '" data-k="' + s.k + '" role="tabpanel" id="sp-' + s.k + '" aria-labelledby="sb-' + s.k + '"' + (i ? ' hidden' : '') + '><img src="' + s.img + '"' + (/^data:/.test(s.img) ? '' : ' srcset="' + s.img.replace('.webp', '-m.webp') + ' 1200w, ' + s.img + ' 1920w" sizes="(max-width: 899px) 100vw, 90vw"') + ' alt="' + esc(s.alt) + '" loading="lazy" decoding="async"><p class="season-cap">' + esc(s.cap) + '</p><div class="season-copy"><div class="inner"><p class="kicker" style="color:var(--ice-2)">' + esc(s.when) + '</p><h3>' + esc(s.h) + '</h3><p>' + esc(s.p) + '</p><ul>' + s.li.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div></div></div>';
    }).join(''));
    var fxCv = document.createElement('canvas'); fxCv.className = 'season-fx'; fxCv.setAttribute('aria-hidden', 'true'); sBox.appendChild(fxCv);
    var fx = null;
    var FXD = { leaves: 22, snow: 120 };
    var sTabs = $('[data-season-tabs]');
    sTabs.innerHTML = SEASONS.map(function (s, i) { return '<button type="button" class="chip" role="tab" id="sb-' + s.k + '" aria-controls="sp-' + s.k + '" aria-selected="' + (i === 0) + '">' + s.l + '</button>'; }).join('');
    var sGo = function (i) {
      $$('.season', sBox).forEach(function (el, k) {
        if (k === i) { el.hidden = false; requestAnimationFrame(function () { el.classList.add('on'); }); }
        else { el.classList.remove('on'); setTimeout(function () { if (!el.classList.contains('on')) el.hidden = true; }, reduce ? 0 : 1200); }
      });
      $$('.chip', sTabs).forEach(function (b, k) { b.setAttribute('aria-selected', k === i); });
      if (fx) fx.set(SEASONS[i].fx, FXD[SEASONS[i].fx]);
    };
    var sCur = 0, sAuto = null, sHeld = false;
    $$('.chip', sTabs).forEach(function (b, i) { b.addEventListener('click', function () { sHeld = true; clearInterval(sAuto); sCur = i; sGo(i); }); });
    // seasons rotate every 3 s while in view; a click stops it
    if (!reduce && 'IntersectionObserver' in window) new IntersectionObserver(function (es) {
      clearInterval(sAuto);
      if (es[0].isIntersecting && !sHeld) sAuto = setInterval(function () { sCur = (sCur + 1) % SEASONS.length; sGo(sCur); }, 3000);
    }, { threshold: .3 }).observe(sBox);
  }
  var TOPICS = [
    { k: 'Accommodation', img: './assets/img/photos/life-accommodation.webp', cap: 'Victorian row houses on a tree-lined street', tag: 'Residence & housing', n: '01', p: ['First-year students often choose on-campus residence where available; others share apartments or rent rooms off campus.', 'Never pay a deposit for a place you haven’t verified — use your university’s off-campus housing service and read leases carefully.'] },
    { k: 'Public transit', img: './assets/img/photos/life-transit.webp', cap: 'Streetcars on a downtown street', tag: 'City transit networks', n: '02', p: ['Major cities run subway, light rail or bus networks — Toronto’s TTC, Vancouver’s SkyTrain, Montréal’s métro, Ottawa’s O-Train.', 'Many universities include a discounted transit pass in student fees — at UBC the U-Pass is C$43.35 a month.'] },
    { k: 'Campus life', img: './assets/img/photos/life-campus.webp', cap: 'Students walking across an autumn campus', tag: 'Clubs, libraries, sport', n: '03', p: ['Libraries, study spaces, clubs, varsity sport and student unions are the centre of most students’ social lives.', 'International student offices help with permits, orientation and wellbeing — use them early.'] },
    { k: 'Budgeting', img: './assets/img/photos/life-budget.webp', cap: 'Canadian banknotes and coins', tag: 'Rent, food, transit', n: '04', p: ['Rent is usually the largest monthly cost; groceries, phone, transit and winter clothing follow.', 'Build your budget in the cost estimator above, using quotes for your actual city and housing type.'] },
    { k: 'Community', img: './assets/img/photos/life-community.webp', cap: 'Students holding a Canadian flag', tag: 'Festivals & communities', n: '05', p: ['Canadian cities are home to large, diverse communities — including cultural and student associations from India, the Gulf and beyond.', 'Festivals, faith communities and volunteering are good ways to build a network beyond campus.'] }
  ];
  var tList = $('[data-topics]'), tCard = $('[data-topic-card]');
  function tShow(i) {
    $$('[role=tab]', tList).forEach(function (b, k) { b.setAttribute('aria-selected', k === i); b.tabIndex = k === i ? 0 : -1; b.classList.remove('run'); if (k === i && tAuto) { void b.offsetWidth; b.classList.add('run'); } });
    var sel = $$('[role=tab]', tList)[i];
    if (sel && tList.scrollWidth > tList.clientWidth + 4) tList.scrollTo({ left: tList.scrollLeft + sel.getBoundingClientRect().left - tList.getBoundingClientRect().left - 20, behavior: reduce ? 'auto' : 'smooth' }); // phones: keep the active topic pill in view
    var t = TOPICS[i];
    var media = t.img ? '<img src="' + t.img + '"' + (/^data:/.test(t.img) ? '' : ' srcset="' + t.img.replace('.webp', '-m.webp') + ' 1200w, ' + t.img + ' 1920w" sizes="(max-width: 979px) 100vw, 50vw"') + ' alt="' + esc(t.cap) + '" decoding="async">' : ''; // phones get the 900px photo
    tCard.innerHTML = '<figure class="topic-img" style="margin:0">' + media + '<span class="tp-n">' + t.n + ' / 05</span><span class="tp-tag">' + esc(t.tag) + '</span></figure><div class="topic-txt pane">' + t.p.map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') + '</div>';
  }
  if (tList) {
    tList.innerHTML = TOPICS.map(function (t, i) { return '<li role="presentation"><button type="button" role="tab">' + esc(t.k) + '</button></li>'; }).join('');
    var tCur = 0, tAuto = null, tStop = function () { clearInterval(tAuto); tAuto = null; };
    if (!reduce && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting && tAuto === null && tCur >= 0) tAuto = setInterval(function () { tCur = (tCur + 1) % TOPICS.length; tShow(tCur); }, 3000); else if (!es[0].isIntersecting) tStop(); }).observe(tList);
    tList.addEventListener('pointerenter', function () { tStop(); tCur = -1; });
    $$('[role=tab]', tList).forEach(function (b, i) {
      b.addEventListener('click', function () { tStop(); tCur = -1; tShow(i); });
      if (fine) b.addEventListener('mouseenter', function () { tShow(i); });
      b.addEventListener('keydown', function (e) { if (/Arrow(Down|Up)/.test(e.key)) { e.preventDefault(); var n = (i + (e.key === 'ArrowDown' ? 1 : -1) + TOPICS.length) % TOPICS.length; $$('[role=tab]', tList)[n].focus(); tShow(n); } });
    });
    tShow(0);
  }

  /* ======================================================== scholarships */
  $$('[data-ladder] .rung').forEach(function (r, i, all) {
    var b = $('button', r); if (i === 0) r.classList.add('open');
    b.addEventListener('click', function () {
      var open = !r.classList.contains('open');
      all.forEach(function (o) { o.classList.remove('open'); $('button', o).setAttribute('aria-expanded', 'false'); });
      r.classList.toggle('open', open); b.setAttribute('aria-expanded', open);
    });
  });
  

  /* ============================================================== stories */
  // Add approved testimonials here: { text, cite }. Only with the student's written consent.
  var STORIES = [
    { text: 'Reserved for an approved story from a Tutee Connect student now studying in Canada.', cite: 'Student name · Programme · Institution' },
    { text: 'Reserved for an approved story — published only with the student’s consent.', cite: 'Student name · Programme · Institution' },
    { text: 'Reserved for an approved story — outcomes stated exactly as they happened.', cite: 'Student name · Programme · Institution' }
  ];
  var qDots = $('[data-q-dots]');
  if (qDots) {
    qDots.innerHTML = STORIES.map(function (s, i) { return '<button type="button" aria-label="Story ' + (i + 1) + '" aria-pressed="' + (i === 0) + '"></button>'; }).join('');
    $$('button', qDots).forEach(function (b, i) {
      b.addEventListener('click', function () {
        $$('button', qDots).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        var q = $('[data-q-text]'); q.classList.remove('pane'); void q.offsetWidth; q.classList.add('pane');
        q.textContent = STORIES[i].text; $('[data-q-cite]').textContent = STORIES[i].cite;
      });
    });
  }

  /* ================================================================== FAQ */
  var faq = $('[data-faq]');
  if (faq) {
    var cats = ['All'];
    $$('.qa', faq).forEach(function (q, i) {
      var c = q.getAttribute('data-cat'); if (cats.indexOf(c) < 0) cats.push(c);
      var b = $('button', q), a = $('.ans', q); b.setAttribute('data-cat', q.getAttribute('data-cat'));
      b.id = 'fq' + i; a.id = 'fa' + i; b.setAttribute('aria-controls', a.id); a.setAttribute('role', 'region'); a.setAttribute('aria-labelledby', b.id);
      b.addEventListener('click', function () {
        var open = !q.classList.contains('open');
        $$('.qa.open', faq).forEach(function (o) { o.classList.remove('open'); $('button', o).setAttribute('aria-expanded', 'false'); });
        q.classList.toggle('open', open); b.setAttribute('aria-expanded', open);
      });
    });
    var cb = $('[data-faq-cats]');
    var ICON = { 'All': 'M4 6h16M4 12h16M4 18h10', 'Admissions': 'M3 9l9-5 9 5-9 5-9-5zM7 11v5c3 2 7 2 10 0v-5', 'Applications': 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
      'Tuition & funding': 'M12 3v18M16 7c0-2-2-3-4-3s-4 1-4 3 2 3 4 3 4 1 4 3-2 3-4 3-4-1-4-3', 'Study permits': 'M5 4h14v16H5zM9 9h6M9 13h6M9 17h3',
      'Working': 'M4 8h16v11H4zM9 8V5h6v3M4 13h16', 'Family': 'M8 8a3 3 0 1 0 0-.01M16 9a2.5 2.5 0 1 0 0-.01M3 20c0-3 2.5-5 5-5s5 2 5 5M13 20c0-2.5 1.5-4 3.5-4s3.5 1.5 3.5 4', 'After graduation': 'M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2 8 12.7 4 8.8 9.5 8z' };
    var count = function (c) { return c === 'All' ? $$('.qa', faq).length : $$('.qa[data-cat="' + c + '"]', faq).length; };
    cb.classList.add('fq-nav');
    cb.innerHTML = '<span class="fq-pill" aria-hidden="true"></span>' + cats.map(function (c, i) {
      return '<button type="button" class="chip fq" aria-pressed="' + (i === 0) + '" data-c="' + esc(c) + '" style="--i:' + i + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (ICON[c] || ICON.All) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '<span class="fq-l">' + esc(c) + '</span><span class="fq-n">' + count(c) + '</span></button>';
    }).join('');
    var pill = $('.fq-pill', cb);
    function movePill(b) { pill.style.transform = 'translate(' + b.offsetLeft + 'px,' + b.offsetTop + 'px)'; pill.style.width = b.offsetWidth + 'px'; pill.style.height = b.offsetHeight + 'px'; }
    cb.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return; var c = b.getAttribute('data-c');
      $$('.chip', cb).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      movePill(b);
      var k = 0;
      $$('.qa', faq).forEach(function (q) {
        var show = c === 'All' || q.getAttribute('data-cat') === c; q.hidden = !show;
        if (show) { q.classList.remove('fq-in'); void q.offsetWidth; q.style.setProperty('--k', k++); q.classList.add('fq-in'); }
      });
    });
    var first = $('.chip', cb); requestAnimationFrame(function () { movePill(first); });
    window.addEventListener('resize', function () { var on = $('.chip[aria-pressed=true]', cb); if (on) movePill(on); });
  }

  /* ============================================================ lead form */
  var DEFAULT_DEST = 'Canada — General enquiry';
  function setDestination(text) {
    text = String(text).slice(0, 520);
    $$('[data-dest-input]').forEach(function (i) { i.value = text; });
    $$('[data-dest-label]').forEach(function (l) { l.textContent = text; });
    $$('[data-dest-clear]').forEach(function (b) { b.hidden = text === DEFAULT_DEST; });
  }
  $$('[data-dest-clear]').forEach(function (b) { b.addEventListener('click', function () { setDestination(DEFAULT_DEST); }); });
  try { var picked = localStorage.getItem('selectedUniversity'); if (picked) { localStorage.removeItem('selectedUniversity'); setDestination('Canada — ' + picked); } } catch (err) { /* storage unavailable */ }

  $$('form[data-lead-form]').forEach(function (form) {
    var btn = $('[data-submit]', form), label = btn.innerHTML, ok = $('[data-ok]', form), err = $('[data-err]', form);
    function status(s, m, field) {
      ok.classList.toggle('show', s === 'ok'); err.classList.toggle('show', s === 'err'); if (m) err.textContent = m;
      $$('.field', form).forEach(function (f) { f.classList.remove('bad'); f.removeAttribute('aria-invalid'); });
      if (field) { field.classList.add('bad'); field.setAttribute('aria-invalid', 'true'); field.focus(); }
    }
    // inline validation: a clear alert under the field when an email or phone number is wrong
    var DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'live.com', 'rediffmail.com', 'yahoo.co.in', 'protonmail.com', 'aol.com'];
    function lev(a, b) { var m = [], i, j; for (i = 0; i <= b.length; i++) m[i] = [i]; for (j = 0; j <= a.length; j++) m[0][j] = j;
      for (i = 1; i <= b.length; i++) for (j = 1; j <= a.length; j++) m[i][j] = b[i - 1] === a[j - 1] ? m[i - 1][j - 1] : Math.min(m[i - 1][j - 1], m[i][j - 1], m[i - 1][j]) + 1; return m[b.length][a.length]; }
    function emailIssue(v) {
      v = v.trim(); if (!v) return 'Please enter your email address.';
      if (/\s/.test(v)) return 'Email addresses can’t contain spaces.';
      if (!/^[A-Za-z0-9._%+'-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(v) || /\.\./.test(v) || /^\.|\.@|@\./.test(v)) return 'That doesn’t look like a valid email — check it, e.g. name@gmail.com';
      var dom = v.split('@')[1].toLowerCase();
      if (DOMAINS.indexOf(dom) < 0) { var best = DOMAINS.filter(function (d) { return lev(dom, d) <= 2; })[0]; if (best) return { msg: 'Did you mean ' + v.split('@')[0] + '@' + best + '?', fix: v.split('@')[0] + '@' + best }; }
      return '';
    }
    // mobile number length by country code (national number, without the leading 0)
    var PH = { '+91': [10, /^[6-9]/, 'Indian mobile numbers have 10 digits and start with 6, 7, 8 or 9.'], '+971': [9, /^5/, 'UAE mobile numbers have 9 digits and start with 5 (e.g. 50 123 4567).'],
      '+1': [10, /^[2-9]/, 'Canada/US numbers have 10 digits.'], '+44': [10, /^7/, 'UK mobile numbers have 10 digits after +44 and start with 7.'], '+61': [9, /^4/, 'Australian mobile numbers have 9 digits after +61 and start with 4.'],
      '+966': [9, /^5/, 'Saudi mobile numbers have 9 digits and start with 5.'], '+974': [8, /^[3567]/, 'Qatar mobile numbers have 8 digits.'], '+965': [8, /^[569]/, 'Kuwait mobile numbers have 8 digits.'],
      '+968': [8, /^[79]/, 'Oman mobile numbers have 8 digits.'], '+973': [8, /^[36]/, 'Bahrain mobile numbers have 8 digits.'], '+977': [10, /^9/, 'Nepal mobile numbers have 10 digits and start with 9.'],
      '+94': [9, /^7/, 'Sri Lankan mobile numbers have 9 digits and start with 7.'], '+880': [10, /^1/, 'Bangladeshi mobile numbers have 10 digits and start with 1.'], '+92': [10, /^3/, 'Pakistani mobile numbers have 10 digits and start with 3.'] };
    function phoneIssue(v) {
      var raw = v.trim(); if (!raw) return 'Please enter your mobile number.';
      if (/[^0-9\s()+\-.]/.test(raw)) return 'Use digits only — no letters or symbols.';
      var cc = ($('[name=country_code]', form) || {}).value || '', d = raw.replace(/\D/g, '');
      if (cc && d.indexOf(cc.slice(1)) === 0 && d.length > (PH[cc] ? PH[cc][0] : 15)) d = d.slice(cc.length - 1); // typed the country code again
      d = d.replace(/^0+/, '');
      if (/^(\d)\1+$/.test(d)) return 'That number doesn’t look real — please check it.';
      var r = PH[cc];
      if (r) { if (d.length !== r[0] || !r[1].test(d)) return r[2]; }
      else if (d.length < 7 || d.length > 15) return 'Please enter a valid mobile number (7–15 digits).';
      return '';
    }
    var RULES = { 'l-name': function (v) { return v.trim().length >= 2 ? '' : 'Please enter your full name.'; }, 'l-email': emailIssue, 'l-phone': phoneIssue };
    var checks = {};
    Object.keys(RULES).forEach(function (id) {
      var f = $('#' + id, form); if (!f) return;
      var host = id === 'l-phone' ? (f.closest('.ph') || f).parentNode : f.parentNode;
      var m = document.createElement('div'); m.className = 'f-alert'; m.id = id + '-err'; m.setAttribute('role', 'alert'); m.hidden = true; host.appendChild(m);
      f.setAttribute('aria-describedby', m.id);
      function check(loud) {
        var r = RULES[id](f.value), msg = typeof r === 'object' ? r.msg : r, good = !msg;
        f.classList.toggle('bad', !good); if (good) f.removeAttribute('aria-invalid'); else f.setAttribute('aria-invalid', 'true');
        if (good) { m.hidden = true; m.innerHTML = ''; return true; }
        m.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l10 18H2zM12 10v5M12 18v.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span></span>' + (r && r.fix ? '<button type="button">Use it</button>' : '');
        m.querySelector('span').textContent = msg; m.hidden = false;
        if (r && r.fix) m.querySelector('button').addEventListener('click', function () { f.value = r.fix; check(); f.focus(); });
        if (loud) { var t = id === 'l-phone' ? (f.closest('.ph') || f) : f; t.classList.remove('shake'); void t.offsetWidth; t.classList.add('shake'); }
        return typeof r === 'object'; // a typo suggestion is a warning, not a blocker
      }
      checks[id] = check;
      f.addEventListener('blur', function () { if (f.value) check(true); });
      f.addEventListener('input', function () { if (f.classList.contains('bad') || !m.hidden) check(false); });
      if (id === 'l-phone') { var cc = $('[name=country_code]', form); if (cc) cc.addEventListener('change', function () { if (f.value) check(true); }); }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); status('');
      var data = {}; new FormData(form).forEach(function (v, k) { data[k] = v; });
      var firstBad = null;
      ['l-name', 'l-email', 'l-phone'].forEach(function (id) { if (checks[id] && !checks[id](true) && !firstBad) firstBad = $('#' + id, form); });
      if (firstBad) { status('err', 'Please correct the highlighted details before sending.'); firstBad.focus(); return; }
      data.phone = (data.country_code || '') + ' ' + (data.phone_number || '');
      delete data.country_code; delete data.phone_number;
      var extra = $$('[data-x]', form).filter(function (s) { return s.value; }).map(function (s) { return s.getAttribute('data-x') + ': ' + s.value; });
      if (extra.length) data.destination = (data.destination + ' · ' + extra.join(' · ')).slice(0, 600);
      try { data.page = location.host + location.pathname; } catch (x) { data.page = ''; }
      btn.disabled = true; btn.textContent = 'Sending…';
      fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return { success: false }; }); })
        .then(function (res) {
          if (res && res.success) { var d = $('[data-dest-input]', form).value; status('ok'); form.reset(); setDestination(d); }
          else status('err', (res && res.message) || 'Something went wrong. Please try again, or WhatsApp us on +91 735-836-4959.');
        })
        .catch(function () { status('err', 'Network error. Please check your connection, or WhatsApp us on +91 735-836-4959.'); })
        .then(function () { btn.disabled = false; btn.innerHTML = label; });
    });
  });
})();
/* ========================================================== luxury layer
 * Custom cursor ring (fine pointers only) and a soft spotlight that follows the
 * pointer across cards. Transform/opacity only; idle when the pointer is still. */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, fine = matchMedia('(pointer:fine)').matches;
  if (!fine) return;
  var SPOT = '.svc,.jr-step,.rung,.pick,.b-step,.topic-card,.qa';
  document.addEventListener('pointermove', function (e) {
    var c = e.target.closest && e.target.closest(SPOT); if (!c) return;
    var r = c.getBoundingClientRect(); c.style.setProperty('--sx', (e.clientX - r.left) + 'px'); c.style.setProperty('--sy', (e.clientY - r.top) + 'px');
  }, { passive: true });
  document.querySelectorAll(SPOT).forEach(function (c) { c.classList.add('spot'); });
  if (reduce) return;
  var cur = document.querySelector('[data-cur]'); if (!cur) return;
  var x = -100, y = -100, X = x, Y = y, run = false;
  function f() { X += (x - X) * .2; Y += (y - Y) * .2; cur.style.transform = 'translate(' + X.toFixed(1) + 'px,' + Y.toFixed(1) + 'px)'; if (Math.abs(x - X) + Math.abs(y - Y) > .3) requestAnimationFrame(f); else run = false; }
  document.addEventListener('pointermove', function (e) {
    x = e.clientX; y = e.clientY; document.body.classList.add('has-cur');
    var t = e.target.closest && e.target.closest('a,button,[role=tab],input,select,textarea,label');
    cur.classList.toggle('big', !!t && !/INPUT|TEXTAREA|SELECT/.test(t.tagName)); cur.classList.toggle('txt', !!t && /INPUT|TEXTAREA/.test(t.tagName));
    if (!run) { run = true; requestAnimationFrame(f); }
  }, { passive: true });
  document.addEventListener('pointerdown', function () { cur.classList.add('down'); });
  document.addEventListener('pointerup', function () { cur.classList.remove('down'); });
  document.documentElement.addEventListener('pointerleave', function () { document.body.classList.remove('has-cur'); });
})();


/* ===================================================== admissions & careers
 * Level requirements (general guidance), an intake timeline planner and the
 * post-graduation pathway. Facts link to the canada.ca page they come from. */
(function () {
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  var IR = 'https://www.canada.ca/en/immigration-refugees-citizenship/services/';
  var LANG = 'Proof of English (or French) proficiency. Commonly accepted tests include IELTS Academic, TOEFL iBT, PTE Academic and CAEL &mdash; which tests count, and the minimum scores, vary by institution.';
  var LV = {
    dip: { t: 'Diploma or certificate', d: 'Applied, career-focused programmes at colleges and polytechnics, usually one to three years.', l: ['Secondary school completion (Grade 12 or equivalent) with transcripts', 'Subject prerequisites for some programmes, such as maths or sciences', LANG, 'For some programmes: a portfolio, interview or relevant experience'], w: 'If you plan to work after graduating, college programmes need to be in an eligible field of study for a PGWP (study permit applications from 1 Nov 2024).' },
    ba: { t: "Bachelor's degree", d: 'Usually four years at a university; some colleges and polytechnics also award degrees.', l: ['Secondary school transcripts and graduation certificate', 'Minimum averages and prerequisite subjects set by each faculty', LANG, 'For some programmes: a supplementary application, essay, portfolio or audition'], w: 'Competitive programmes can require much higher grades than the published minimum.' },
    pg: { t: 'Postgraduate certificate', d: 'College programmes for diploma or degree holders, often one year and focused on a specific field.', l: ['A completed diploma or degree, often in a related field', 'Transcripts and graduation documents', LANG, 'A CV and sometimes a statement of purpose'], w: 'Check the programme’s PGWP field-of-study eligibility before applying &mdash; it applies to college programmes.' },
    ma: { t: "Master's degree", d: 'Course-based or thesis-based, typically one to two years at a university.', l: ["A bachelor's degree the university accepts as equivalent to its own &mdash; often a four-year degree", 'A minimum grade average set by the programme', LANG, 'Statement of purpose, references and CV', 'For some programmes: GRE/GMAT, work experience, or a confirmed supervisor (thesis routes)'], w: 'Three-year bachelor’s degrees are assessed case by case &mdash; some programmes accept them, others don’t.' },
    phd: { t: 'Doctorate', d: 'Research degrees, usually four years or more, built around a supervisor and a research project.', l: ["A master's degree (some programmes admit outstanding bachelor's graduates directly)", 'A research proposal or statement of research interests', 'Contact with, or agreement from, a potential supervisor &mdash; often expected', 'References, plus publications or a writing sample where relevant', LANG], w: 'Funding is usually arranged through the department or supervisor &mdash; ask about it before you apply.' }
  };
  var panel = $('[data-adm-panel]');
  if (panel) {
    var tabs = $$('[data-adm-tabs] button');
    function showLv(k) {
      var v = LV[k];
      tabs.forEach(function (b) { var on = b.getAttribute('data-lv') === k; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
      panel.innerHTML = '<h3>' + v.t + '</h3><p class="adm-d">' + v.d + '</p><p class="adm-k">Institutions typically ask for</p><ul>' + v.l.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul><p class="adm-w"><b>Watch for</b> ' + v.w + '</p>';
      panel.classList.remove('swap-in'); void panel.offsetWidth; panel.classList.add('swap-in');
    }
    tabs.forEach(function (b, i) {
      b.addEventListener('click', function () { showLv(b.getAttribute('data-lv')); });
      b.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; n.focus(); n.click(); } });
    });
    showLv('dip');
  }
  // intake planner: milestones counted back from the intake month
  var tl = $('[data-adm-tl]');
  if (tl) {
    var MS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var STEPS = [
      [-14, 'Profile & budget', 'Free counselling: goals, academics, budget and the right level for you.'],
      [-12, 'Shortlist & language test', 'Choose programmes; book IELTS, TOEFL, PTE or CAEL with time for a retake.'],
      [-10, 'Applications', 'Submit to each institution. Many deadlines fall 6&ndash;9 months before the start &mdash; popular programmes close earlier.'],
      [-6, 'Offer & deposit', 'Read the offer conditions, pay any deposit, and request your PAL/TAL &mdash; or CAQ for Québec &mdash; if required.'],
      [-5, 'Study permit', 'Apply online with proof of funds, then give biometrics. Apply as early as you can.'],
      [-2, 'Housing & travel', 'Book accommodation and flights once your permit is approved; plan health coverage.'],
      [0, 'Arrive & orientation', 'Port-of-entry checks, then orientation week at your institution.']
    ];
    var m = 8, intakeBtns = $$('[data-adm-intake] button'), yearSel = $('[data-adm-year]'), note = $('[data-adm-note]');
    function draw() {
      var y = +yearSel.value, now = new Date(), nowIdx = now.getFullYear() * 12 + now.getMonth(), start = y * 12 + m, prev = -1, fast = false;
      // every intake still ahead is open: steps whose suggested month has passed are scheduled from this month instead (fast-track)
      var rows = STEPS.map(function (st, i) {
        var idx = start + st[0]; if (idx < nowIdx) { idx = nowIdx; fast = true; } if (idx < prev) idx = prev; prev = idx;
        var lock = i >= 4;
        return '<li class="' + (lock ? 'lock' : '') + (idx === nowIdx ? ' now' : '') + '"><time>' + (idx === nowIdx ? 'Now' : lock ? 'Step ' + (i + 1) : 'Next') + '</time><b>' + st[1] + '</b></li>';
      });
      tl.innerHTML = rows.join('') + '<li class="unl"><a href="#contact" data-adm-unlock><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>Unlock my full intake plan — free</a></li>';
      var name = MS[m] === 'Sep' ? 'September' : MS[m] === 'Jan' ? 'January' : 'May';
      note.innerHTML = fast ? '<b>' + name + ' ' + y + ' is still open.</b> We can start your application this month and fast-track every step &mdash; contact us today to secure your seat.' : '<b>Great timing for ' + name + ' ' + y + '.</b> Start early for the widest choice of programmes and scholarships.';
      note.classList.remove('warn'); note.classList.add('go');
    }
    tl.addEventListener('click', function (e) {
      if (!e.target.closest('[data-adm-unlock]')) return;
      var name = MS[m] === 'Sep' ? 'September' : MS[m] === 'Jan' ? 'January' : 'May', v = 'Canada — Intake plan: ' + name + ' ' + yearSel.value;
      $$('[data-dest-input]').forEach(function (i) { i.value = v; }); $$('[data-dest-label]').forEach(function (l) { l.textContent = v; }); $$('[data-dest-clear]').forEach(function (c) { c.hidden = false; });
    });
    intakeBtns.forEach(function (b) { b.addEventListener('click', function () { m = +b.getAttribute('data-m'); intakeBtns.forEach(function (x) { x.setAttribute('aria-checked', x === b); }); draw(); }); });
    yearSel.addEventListener('change', draw);
    draw();
  }
  // careers pathway
  var cr = $('[data-cr]');
  if (cr) {
    var CR = [
      { h: 'Study, and work within your permit conditions', p: 'Eligible full-time students can work off campus while they study. Mandatory co-op or internship placements need a co-op work permit.', l: ['Up to 24 hours a week off campus during regular academic sessions, if your study permit allows it', 'No weekly limit during scheduled breaks such as winter and summer holidays', 'Work done while studying full time, including co-op terms, doesn’t count as Canadian experience for permanent residence'], s: [IR + 'study-canada/work/work-off-campus.html', 'canada.ca — Work off campus'] },
      { h: 'A Post-Graduation Work Permit (PGWP)', p: 'Graduates of eligible programmes at eligible institutions may apply for an open work permit. It is not automatic.', l: ['Programme of at least 8 months; permit length usually follows programme length, up to 3 years', 'Language results in all four skills: CLB 7 for university degrees, CLB 5 for college programmes', 'College and non-degree programmes must be in an eligible field of study (study permit applications from 1 Nov 2024)', 'At least half the programme must be completed in class in Canada'], s: [IR + 'study-canada/work/after-graduation/eligibility.html', 'canada.ca — PGWP: who can apply (modified 24 Jun 2026)'] },
      { h: 'Build skilled Canadian work experience', p: 'Many permanent-residence routes value skilled work experience gained in Canada after you graduate.', l: ['Canadian Experience Class: at least 1 year (1,560 hours) of skilled work in the 3 years before you apply', 'The job must be in TEER category 0, 1, 2 or 3 and done while authorised to work', 'Student work and co-op terms don’t count'], s: [IR + 'immigrate-canada/express-entry/who-can-apply/canadian-experience-class.html', 'canada.ca — Canadian Experience Class (modified 24 Sep 2026)'] },
      { h: 'Permanent residence &mdash; a possibility, not a promise', p: 'Eligible candidates can create an Express Entry profile. Profiles are ranked, and IRCC invites candidates to apply through periodic draws.', l: ['Express Entry manages the Canadian Experience Class and other federal programmes', 'Some provinces run nominee streams for graduates and workers, each with its own criteria', 'An invitation depends on your score and on each draw &mdash; no one can guarantee it'], s: [IR + 'immigrate-canada/express-entry.html', 'canada.ca — Express Entry'] }
    ];
    var crB = $$('[data-cr-i]', cr), crP = $('[data-cr-panel]'), fill = $('[data-cr-fill]');
    var crCur = -1;
    function showCr(i) {
      if (i === crCur) return; crCur = i;
      var c = CR[i];
      crB.forEach(function (b, j) { b.setAttribute('aria-selected', j === i); b.tabIndex = j === i ? 0 : -1; b.parentNode.classList.toggle('done', j < i); });
      fill.style.transform = 'scaleX(' + (i / (CR.length - 1)) + ')';
      crP.innerHTML = '<div><h3>' + c.h + '</h3><p>' + c.p + '</p></div><ul>' + c.l.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul><a class="src" href="' + c.s[0] + '" target="_blank" rel="noopener">Source: ' + c.s[1] + ' &#8599;</a>';
      crP.classList.remove('swap-in'); void crP.offsetWidth; crP.classList.add('swap-in');
    }
    crB.forEach(function (b, i) {
      var cur = -1;
      b.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') showCr(i); });
      b.addEventListener('focus', function () { showCr(i); });
      b.addEventListener('click', function () { showCr(i); });   // touch screens have no hover
      b.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var n = crB[(i + (e.key === 'ArrowRight' ? 1 : -1) + crB.length) % crB.length]; n.focus(); n.click(); } });
    });
    showCr(0);
  }
})();


/* ===================================================== interaction layer v21
 * Button label roll (text wrapped once), 3D tilt on content cards, number
 * kickers. All pointer-only and skipped under reduced motion. */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, fine = matchMedia('(pointer:fine)').matches;
  // wrap each button's leading text so CSS can roll a duplicate label in on hover
  document.querySelectorAll('.btn').forEach(function (b) {
    var t = null; b.childNodes.forEach(function (n) { if (!t && n.nodeType === 3 && n.textContent.trim()) t = n; });
    if (!t) return;
    var label = t.textContent.trim(), w = document.createElement('span'), inner = document.createElement('span');
    w.className = 'bt'; inner.textContent = label; inner.setAttribute('data-t', label); w.appendChild(inner);
    t.parentNode.replaceChild(w, t); b.insertBefore(document.createTextNode(''), w.nextSibling);
    if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', label);
  });
  if (reduce || !fine) return;
  var SEL = '';
  (SEL ? document.querySelectorAll(SEL) : []).forEach(function (el) {
    el.classList.add('tilt');
    var raf = 0;
    el.addEventListener('pointermove', function (e) {
      if (el.classList.contains('rv') && !el.classList.contains('in')) return;
      var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      var k = Math.min(1, 520 / Math.max(r.width, r.height)) * 4; // big cards tilt less
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () { el.classList.add('tilting'); el.style.transform = 'perspective(1100px) rotateX(' + (-y * k).toFixed(2) + 'deg) rotateY(' + (x * k).toFixed(2) + 'deg) translateY(-2px)'; });
    });
    el.addEventListener('pointerleave', function () { cancelAnimationFrame(raf); el.classList.remove('tilting'); el.style.transform = ''; });
  });
})();


/* ===================================================== loan partner marquee
 * Same partner list as the Germany page; a second, hidden copy makes the loop seamless. */
(function () {
  var t = document.querySelector('[data-loan-marq]'); if (!t) return;
  var L = [['hdfc-credila.jpg', 'HDFC Credila'], ['icici.png', 'ICICI Bank'], ['axis.jpg', 'Axis Bank'], ['avanse.jpg', 'Avanse'], ['auxilo.jpg', 'Auxilo'], ['idfc.jpg', 'IDFC FIRST Bank'], ['incred.jpg', 'InCred'], ['union.jpg', 'Union Bank of India'], ['mpower.jpg', 'MPOWER Financing'], ['prodigy.jpg', 'Prodigy Finance']];
  var logos = L.map(function (l) { return '<img src="./assets/img/loan-partner/' + l[0] + '" alt="' + l[1] + '" width="150" height="62" loading="lazy" decoding="async">'; }).join('');
  t.innerHTML = logos + logos.replace(/alt="[^"]*"/g, 'alt="" aria-hidden="true"');
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { t.classList.toggle('is-off', !es[0].isIntersecting); }).observe(t);
})();


/* ================================================= React Bits effects (ported)
 * Vanilla ports of BlurText, ScrollVelocity and StarBorder from React Bits
 * (https://github.com/DavidHDev/react-bits) — Copyright (c) 2026 David Haz,
 * MIT + Commons Clause. Used here as part of this website only.
 * All three switch off under prefers-reduced-motion. */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  // BlurText: section intro paragraphs resolve word by word from a soft blur
  document.querySelectorAll('.head .lede').forEach(function (p) {
    if (p.querySelector('a,b,em,strong,span') || p.dataset.blur) return; // keep rich text untouched
    var words = p.textContent.trim().split(/\s+/); p.dataset.blur = '1';
    p.setAttribute('aria-label', p.textContent.trim());
    p.innerHTML = words.map(function (w, i) { return '<span class="bw" aria-hidden="true" style="--i:' + Math.min(i, 40) + '">' + w.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>'; }).join(' ');
    p.classList.add('blur-text');
    new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { p.classList.add('blur-in'); o.disconnect(); } }, { threshold: .2 }).observe(p);
  });

  // ScrollVelocity: the city band drifts on its own and speeds up / reverses with scrolling
  var mq = document.querySelector('.mq'), track = mq && mq.querySelector('.mq-track');
  if (track) {
    track.style.animation = 'none';
    var x = 0, base = -40, vel = 0, lastY = scrollY, lastT = performance.now(), dir = 1, on = false, hover = false, half = 0;
    function measure() { half = track.scrollWidth / 2; }
    measure(); addEventListener('resize', measure);
    mq.addEventListener('pointerenter', function () { hover = true; }); mq.addEventListener('pointerleave', function () { hover = false; });
    function tick(t) {
      if (!on) return;
      var dt = Math.min(64, t - lastT) / 1000; lastT = t;
      var y = scrollY, dy = y - lastY; lastY = y;
      vel += ((dy / Math.max(dt, .001)) - vel) * .12;              // smoothed px/s
      if (Math.abs(vel) > 20) dir = vel > 0 ? 1 : -1;
      var speed = hover ? 0 : (base * dir) - Math.max(-900, Math.min(900, vel)) * .35;
      x += speed * dt; if (half) { x %= half; if (x > 0) x -= half; }
      var skew = Math.max(-8, Math.min(8, -vel / 120));
      track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0) skewX(' + skew.toFixed(2) + 'deg)';
      requestAnimationFrame(tick);
    }
    new IntersectionObserver(function (es) { var v = es[0].isIntersecting; if (v && !on) { on = true; lastT = performance.now(); lastY = scrollY; requestAnimationFrame(tick); } on = v; }).observe(mq);
  }

  // StarBorder: a point of light travels around the primary call-to-action buttons
  document.querySelectorAll('.btn-hero, .final [data-submit], .hdr-cta').forEach(function (b) {
    if (b.classList.contains('cta2')) return; var s = document.createElement('span'); s.className = 'star-ring'; s.setAttribute('aria-hidden', 'true'); b.appendChild(s);
  });
})();

/* Clean CTAs: a soft light follows the pointer inside the button. */
document.querySelectorAll('.cta2').forEach(function (b) {
  b.addEventListener('pointermove', function (e) {
    var r = b.getBoundingClientRect();
    b.style.setProperty('--x', (e.clientX - r.left) + 'px'); b.style.setProperty('--y', (e.clientY - r.top) + 'px');
  });
});

/* Performance: pause every CSS animation inside sections that are off screen, so looping
 * decorations never cost a frame while the visitor is reading something else. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('is-off', !e.isIntersecting); });
  }, { rootMargin: '200px 0px' });
  document.querySelectorAll('main > section, main > .mq, body > footer').forEach(function (s) { io.observe(s); });
})();

/* Performance: sections below the fold skip rendering (content-visibility in royal.css) until
 * they near the screen. To keep anchors, the scroll bar and the flight rail exact, measure each
 * section's real height once, a little at a time while the browser is idle, and reserve it. */
(function () {
  var secs = [].slice.call(document.querySelectorAll('main > .sec, main > .final, body > .ftr'));
  if (!secs.length || !('contentVisibility' in document.documentElement.style)) return;
  var idle = window.requestIdleCallback || function (f) { return setTimeout(function () { f({ timeRemaining: function () { return 8; } }); }, 40); };
  var i = 0, lastW = innerWidth, t = 0;
  function measure(s) {
    s.style.contentVisibility = 'visible';
    var cs = getComputedStyle(s), h = s.offsetHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - parseFloat(cs.borderTopWidth) - parseFloat(cs.borderBottomWidth);
    s.style.containIntrinsicSize = 'auto ' + Math.max(0, Math.round(h)) + 'px'; // content-box size; padding adds on top
    s.style.contentVisibility = '';
  }
  function step(d) {
    if (d.didTimeout && i < secs.length) measure(secs[i++]); // busy page: still make steady progress
    while (i < secs.length && d.timeRemaining() > 4) measure(secs[i++]);
    if (i < secs.length) idle(step, { timeout: 300 });
  }
  function start() { i = 0; idle(step, { timeout: 300 }); }
  window.TCWarm = function () { while (i < secs.length) measure(secs[i++]); }; // called before jumping to an anchor
  if (document.readyState === 'complete') setTimeout(start, 200); else addEventListener('load', function () { setTimeout(start, 200); });
  addEventListener('resize', function () { if (Math.abs(innerWidth - lastW) < 40) return; lastW = innerWidth; clearTimeout(t); t = setTimeout(start, 400); });
})();

/* Glow CTAs: add the running rim light to every primary call-to-action (styles: royal.css v90).
 * Buttons created later (forms, profiles) get it too. */
(function () {
  var SEL = '.btn:not(.line):not(.ice):not(.ghost):not(.light), .cta2, .eu2';
  function rim(b) {
    if (b.querySelector(':scope > .glow-rim')) return;
    var g = document.createElement('span'); g.className = 'glow-rim'; g.setAttribute('aria-hidden', 'true');
    g.innerHTML = '<span class="gr-ring"><i></i><i></i></span><span class="gr-spill"><i></i></span>';
    var sh = document.createElement('span'); sh.className = 'cta-shine'; sh.setAttribute('aria-hidden', 'true'); sh.innerHTML = '<i></i>';
    b.appendChild(sh); b.appendChild(g);
  }
  function all(root) { (root || document).querySelectorAll(SEL).forEach(rim); }
  all();
  var q = 0;
  new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) {
      var n = ms[i].addedNodes[j];
      if (n.nodeType === 1 && !n.classList.contains('glow-rim') && (n.matches(SEL) || n.querySelector(SEL))) { if (!q) q = requestAnimationFrame(function () { q = 0; all(); }); return; }
    }
  }).observe(document.body, { childList: true, subtree: true });
})();

/* Hero city switcher: a glass pill slides under the chosen city (styles: royal.css v94) */
(function () {
  var bar = document.querySelector('[data-hx-tabs]'); if (!bar) return;
  var pill = document.createElement('span'); pill.className = 'hx-pill'; pill.setAttribute('aria-hidden', 'true');
  bar.insertBefore(pill, bar.firstChild);
  function move() {
    var b = bar.querySelector('[aria-selected="true"]'); if (!b) return;
    pill.style.width = b.offsetWidth + 'px'; pill.style.transform = 'translateX(' + b.offsetLeft + 'px)';
    bar.classList.add('pill-on');
  }
  new MutationObserver(move).observe(bar, { attributes: true, subtree: true, attributeFilter: ['aria-selected'] });
  addEventListener('resize', move); if (document.fonts && document.fonts.ready) document.fonts.ready.then(move);
  move();
})();

/* Promise cards (royal.css v101): animate in when the strip is seen; spotlight follows the pointer */
(function () {
  var sec = document.querySelector('[data-proof]'); if (!sec) return;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { sec.classList.add('in'); o.disconnect(); } }, { threshold: .25 }).observe(sec);
  else sec.classList.add('in');
  sec.querySelectorAll('.pf').forEach(function (c) {
    c.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
  });
})();

/* Phones: sideways rows show a "Swipe" cue + position bar (royal.css v109); the hero city
   track keeps the chosen city in view and fades the edge that has more cities behind it */
(function () {
  var rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function cue(row, o) {
    if (!row || row._cue) return; row._cue = 1; o = o || {};
    var c = document.createElement('div'); c.className = 'sw-cue' + (o.dark ? ' dark' : ''); c.setAttribute('aria-hidden', 'true'); c.hidden = true;
    c.innerHTML = '<span class="sw-ar"><svg viewBox="0 0 24 24"><path d="M5 12h14M14 7l5 5-5 5"/></svg></span><span class="sw-t">' + (o.text || 'Swipe for more') + '</span><span class="sw-bar"><i></i></span>';
    (o.after || row).insertAdjacentElement('afterend', c);
    var q = 0;
    function upd() {
      q = 0; var max = row.scrollWidth - row.clientWidth;
      c.hidden = max < 6 || !row.clientWidth; if (c.hidden) return;
      var p = Math.min(1, Math.max(0, row.scrollLeft / max));
      c.style.setProperty('--w', Math.max(.12, row.clientWidth / row.scrollWidth).toFixed(3)); c.style.setProperty('--p', p.toFixed(3));
      c.classList.toggle('end', p > .97);
    }
    function later() { if (!q) q = requestAnimationFrame(upd); }
    row.addEventListener('scroll', function () { if (row.scrollLeft > 6) c.classList.add('used'); later(); }, { passive: true });
    addEventListener('resize', later);
    new MutationObserver(later).observe(row, { childList: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting) later(); }).observe(row);
    if (o.sel) { // start with the chosen item in view
      var s = row.querySelector(o.sel); if (s && innerWidth <= 760) row.scrollLeft = Math.max(0, s.offsetLeft - 3);
    }
    upd();
  }
  function init() {
    cue(document.querySelector('.proof-list'), { text: 'Swipe for all four' });
    cue(document.querySelector('#universities .chips-row'), { text: 'Swipe for more areas' });
    cue(document.querySelector('.topic-list'), { text: 'Swipe for more topics', dark: true });
    document.querySelectorAll('#programmes .pick').forEach(function (p) { cue(p, { dark: true, sel: '[aria-pressed="true"]' }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  setTimeout(init, 1500); // rows rendered late (pickers, chips) get their cue too

  var bar = document.querySelector('[data-hx-tabs]'); if (!bar) return;
  function edges() {
    var max = bar.scrollWidth - bar.clientWidth;
    bar.classList.toggle('ov', max > 4); bar.classList.toggle('at-start', bar.scrollLeft < 4); bar.classList.toggle('at-end', bar.scrollLeft > max - 4);
  }
  function centre() {
    var b = bar.querySelector('[aria-selected="true"]'); if (!b || bar.scrollWidth - bar.clientWidth < 4) return edges();
    var left = b.offsetLeft - (bar.clientWidth - b.offsetWidth) / 2;
    bar.scrollTo({ left: left, behavior: rm ? 'auto' : 'smooth' }); setTimeout(edges, 450);
  }
  bar.addEventListener('scroll', edges, { passive: true });
  new MutationObserver(centre).observe(bar, { attributes: true, subtree: true, attributeFilter: ['aria-selected'] });
  addEventListener('resize', edges); if (document.fonts && document.fonts.ready) document.fonts.ready.then(edges);
  edges();
})();
