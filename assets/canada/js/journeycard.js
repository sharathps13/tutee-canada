/* Counselling form styled as a Tutee Connect "journey card" (not a government ID).
 * Live initials, card number and a machine-readable-style strip that echo the inputs. */
(function () {
  'use strict';
  var form = document.querySelector('[data-jc]');
  if (!form) return;
  var card = form.querySelector('[data-jc-card]');
  var name = form.querySelector('#l-name'), level = form.querySelector('#l-level'), intake = form.querySelector('#l-intake');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LV = { "Diploma / certificate": 'DIPL', "Bachelor's": 'BACH', 'Postgraduate certificate': 'PGCERT', "Master's": 'MSTR', 'Doctorate': 'PHD' };

  function clean(t) { return String(t || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z ]/g, '').trim(); }
  function fill(t, len) { t = t.slice(0, len); while (t.length < len) t += '<'; return t; }
  function hash(t) { var h = 7; for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 9000; return 1000 + h; }

  function update() {
    var n = clean(name.value), parts = n.split(/\s+/).filter(Boolean);
    form.querySelector('[data-jc-ini]').textContent = parts.length ? (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')) : '?';
    form.querySelector('[data-jc-no]').textContent = 'TC-' + (n ? hash(n) : '0000');
    var surname = parts.length > 1 ? parts[parts.length - 1] : (parts[0] || 'YOUR');
    var given = parts.length > 1 ? parts.slice(0, -1).join('<') : (parts.length ? '' : 'NAME');
    form.querySelector('[data-jc-m1]').textContent = fill('TC<CAN<<' + surname + '<<' + given, 36);
    var it = intake.value ? intake.value.toUpperCase().replace(/^(\w{3})\w*\s/, '$1') : 'OPEN';
    var lv = LV[level.value] || 'ANY';
    form.querySelector('[data-jc-m2]').textContent = fill('FREE<COUNSELLING<<' + lv + '<' + it, 36);
    card.classList.toggle('filled', !!n);
  }
  ['input', 'change'].forEach(function (ev) { form.addEventListener(ev, update); });
  form.addEventListener('reset', function () { setTimeout(update, 0); });

  /* When the enquiry is accepted, stamp the card. */
  var ok = form.querySelector('[data-ok]');
  new MutationObserver(function () {
    var done = ok.classList.contains('show');
    card.classList.remove('issued'); if (done) { void card.offsetWidth; card.classList.add('issued'); }
  }).observe(ok, { attributes: true, attributeFilter: ['class'] });

  /* Holographic sheen + tilt that follow the pointer. */
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    card.addEventListener('pointermove', function (e) {
      if (e.target.closest('input,select')) return;
      var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--hx', (x * 100) + '%'); card.style.setProperty('--hy', (y * 100) + '%');
      card.style.setProperty('--rx', ((.5 - y) * 5).toFixed(2) + 'deg'); card.style.setProperty('--ry', ((x - .5) * 7).toFixed(2) + 'deg');
    });
    card.addEventListener('pointerleave', function () { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
  }
  update();
})();

/* Front face → flip to the form; "Free counselling" links centre the card on screen. */
(function () {
  'use strict';
  var wrap = document.querySelector('[data-jc-3d]'), form = document.querySelector('[data-jc]');
  if (!wrap || !form) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var front = wrap.querySelector('[data-jc-open]');

  function open() {
    if (form.classList.contains('open')) return;
    form.classList.add('open');
    setTimeout(function () { var n = form.querySelector('#l-name'); if (n) n.focus({ preventScroll: true }); }, reduce ? 0 : 900);
  }
  front.addEventListener('click', open);
  /* Anything that writes into the form (postcard, programme picks…) opens it too. */
  form.addEventListener('focusin', function (e) { if (e.target !== front) open(); });

  function centre() {
    var r = wrap.getBoundingClientRect(), hdr = 92;
    var y = window.scrollY + r.top - Math.max(hdr, (innerHeight - r.height) / 2);
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    wrap.classList.remove('call'); void wrap.offsetWidth; wrap.classList.add('call');
  }
  window.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#contact"]'); if (!a) return;
    setTimeout(centre, 30);          // runs after the site's own anchor scroll and replaces it
    setTimeout(function () {         // settle: correct any drift from content revealed on the way
      var r = wrap.getBoundingClientRect(), want = Math.max(92, (innerHeight - r.height) / 2);
      if (Math.abs(r.top - want) > 8) window.scrollBy({ top: r.top - want, behavior: reduce ? 'auto' : 'smooth' });
    }, 1300);
  }, true);
  if (location.hash === '#contact') setTimeout(centre, 400);
})();
