/* "The next story could be yours" — postcard builder + sealed promises. */
(function () {
  'use strict';
  var root = document.querySelector('[data-pc]');
  if (!root) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s) { return root.querySelector(s); };
  var card = $('[data-pc-card]'), msg = $('[data-pc-msg]'), img = $('[data-pc-img]'), nameIn = $('[data-pc-name]');
  var PROV = { Toronto: 'ON', Vancouver: 'BC', 'Montréal': 'QC', Calgary: 'AB', Ottawa: 'ON' };
  var IMG = { Toronto: 'toronto', Vancouver: 'vancouver', 'Montréal': 'montreal', Calgary: 'calgary', Ottawa: 'ottawa' };
  var LINE = {
    Toronto: 'The CN Tower lights up every night, and the streetcar takes me straight to campus.',
    Vancouver: 'The mountains are right behind the city and the sea is ten minutes away.',
    'Montréal': 'I am learning a little French every day, and the old city is beautiful.',
    Calgary: 'The Rockies are close enough for a weekend trip, and the sky here is huge.',
    Ottawa: 'Parliament Hill is a short walk away, and the canal is lovely in every season.'
  };
  var SEASON = { September: 'The leaves are turning red already.', January: 'It snowed this morning — I finally bought proper boots!', May: 'Spring is here and the days are getting long.' };
  var state = { city: 'Toronto', field: 'Computer Science', intake: 'September 2027' };
  var typer = 0;

  function text() {
    var month = state.intake.split(' ')[0];
    return 'Dear family, it’s ' + state.intake + ' and I’ve just started ' + state.field + ' in ' + state.city + '. ' +
      LINE[state.city] + ' ' + SEASON[month] + ' Miss you all — more soon.';
  }
  function type(t) {
    clearTimeout(typer);
    if (reduce) { msg.textContent = t; return; }
    msg.textContent = ''; var i = 0;
    (function step() { i += 2; msg.textContent = t.slice(0, i); if (i < t.length) typer = setTimeout(step, 14); })();
  }
  function render(flipBack) {
    var n = nameIn.value.trim();
    $('[data-pc-name-out]').textContent = n || 'future you';
    $('[data-pc-from]').textContent = n || 'you';
    $('[data-pc-city-out]').textContent = state.city;
    $('[data-pc-post]').textContent = state.city.toUpperCase() + ' · ' + PROV[state.city];
    if (flipBack) { card.classList.add('back'); type(text()); }
  }

  function pills(sel, key) {
    var box = $(sel);
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      box.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      state[key] = b.getAttribute('data-v');
      if (key === 'city') {
        /* Show the new city on the front, then turn the card over. */
        card.classList.remove('back');
        img.classList.add('swap');
        setTimeout(function () {
          img.src = './assets/img/cities/pc-' + IMG[state.city] + '.webp';
          img.onload = function () { img.classList.remove('swap'); };
          render(false);
        }, reduce ? 0 : 220);
        setTimeout(function () { render(true); }, reduce ? 0 : 1300);
      } else render(true);
    });
  }
  pills('[data-pc-city]', 'city'); pills('[data-pc-field]', 'field'); pills('[data-pc-intake]', 'intake');
  nameIn.addEventListener('input', function () { render(false); if (!card.classList.contains('back')) { card.classList.add('back'); type(text()); } });
  $('[data-pc-form]').addEventListener('submit', function (e) { e.preventDefault(); });
  $('[data-pc-flip]').addEventListener('click', function () {
    var b = card.classList.toggle('back'); if (b && !msg.textContent) type(text());
  });

  /* Send: postmark the card, pre-fill the enquiry, go to the form. */
  $('[data-pc-send]').addEventListener('click', function () {
    if (!card.classList.contains('back')) { card.classList.add('back'); msg.textContent = text(); }
    card.classList.remove('sent'); void card.offsetWidth; card.classList.add('sent');
    var n = nameIn.value.trim();
    var dest = ('Canada — ' + state.field + ' in ' + state.city + ', ' + state.intake).slice(0, 200);
    document.querySelectorAll('[data-dest-input]').forEach(function (i) { i.value = dest; });
    document.querySelectorAll('[data-dest-label]').forEach(function (l) { l.textContent = dest; });
    var clr = document.querySelector('[data-dest-clear]'); if (clr) clr.hidden = false;
    var nf = document.querySelector('[data-lead-form] input[name="name"]'); if (nf && n && !nf.value) nf.value = n;
    setTimeout(function () {
      var c = document.getElementById('contact'); if (c) c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    }, reduce ? 0 : 1100);
  });

  /* 3D tilt toward the pointer. */
  var tilt = $('[data-pc-tilt]');
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    tilt.addEventListener('pointermove', function (e) {
      var r = tilt.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      tilt.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg'); tilt.style.setProperty('--ry', (x * 12).toFixed(2) + 'deg');
      tilt.style.setProperty('--gx', (x * 100 + 50) + '%'); tilt.style.setProperty('--gy', (y * 100 + 50) + '%');
    });
    tilt.addEventListener('pointerleave', function () { tilt.style.setProperty('--rx', '0deg'); tilt.style.setProperty('--ry', '0deg'); });
  }

  /* Turn the card over by itself the first time it scrolls into view. */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { io.disconnect(); setTimeout(function () { if (!card.classList.contains('back')) render(true); }, reduce ? 0 : 1600); }
    }, { threshold: .5 });
    io.observe(card);
  }

  /* Sealed promises. */
  document.querySelectorAll('[data-seals] .seal').forEach(function (s) {
    s.addEventListener('click', function () {
      var open = s.getAttribute('aria-expanded') !== 'true';
      s.setAttribute('aria-expanded', open); s.classList.toggle('open', open);
    });
  });
})();
