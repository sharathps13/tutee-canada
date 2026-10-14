/* Student testimonials as an airport departures board with split-flap letters.
 * Click (or arrow through) a flight to open its "gate" card with the student's story.
 *
 * HOW TO ADD A REAL STORY — only with the student's written consent to their words,
 * name and photo. Replace a `reserved` entry with:
 *   { name: 'First Last', from: 'Chennai', fromCode: 'MAA', to: 'Toronto', toCode: 'YYZ',
 *     programme: 'MSc Computer Science', institution: 'University name', intake: 'Sep 2026',
 *     photo: './assets/img/students/first-last.webp',   // optional
 *     quote: 'The student\'s own words, exactly as approved.' }
 */
(function () {
  'use strict';

  var STORIES = [
    { reserved: true, from: 'Chennai', fromCode: 'MAA', to: 'Toronto', toCode: 'YYZ' },
    { reserved: true, from: 'Dubai', fromCode: 'DXB', to: 'Vancouver', toCode: 'YVR' },
    { reserved: true, from: 'Bengaluru', fromCode: 'BLR', to: 'Montréal', toCode: 'YUL' },
    { reserved: true, from: 'Hyderabad', fromCode: 'HYD', to: 'Calgary', toCode: 'YYC' },
    { reserved: true, from: 'Abu Dhabi', fromCode: 'AUH', to: 'Ottawa', toCode: 'YOW' },
    { reserved: true, from: 'Kochi', fromCode: 'COK', to: 'Halifax', toCode: 'YHZ' }
  ];
  var RESERVED = 'This seat is reserved for a Tutee Connect student now studying in Canada. Their story boards here only once they approve every word.';

  /* sealed promises below the board */
  document.querySelectorAll('[data-seals] .seal').forEach(function (s) {
    s.addEventListener('click', function () {
      var open = s.getAttribute('aria-expanded') !== 'true';
      s.setAttribute('aria-expanded', open); s.classList.toggle('open', open);
    });
  });

  var root = document.querySelector('[data-fb]');
  if (!root || !STORIES.length) return;
  var rowsEl = root.querySelector('[data-fb-rows]'), gate = root.querySelector('[data-fb-gate]'), q = root.querySelector('[data-fb-q]');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CH = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·', cur = -1, typer = 0, auto = 0, interacted = false;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function plain(s) { return String(s || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function cells(text, len) { text = plain(text).slice(0, len); while (text.length < len) text += ' '; return text.split('').map(function (c) { return '<b data-c="' + esc(c) + '"> </b>'; }).join(''); }

  rowsEl.innerHTML = STORIES.map(function (s, i) {
    var r = !!s.reserved;
    return '<button type="button" class="fb-row' + (r ? ' reserved' : '') + '" role="listitem" data-i="' + i + '" aria-label="' + esc(s.from) + ' to ' + esc(s.to) + (r ? ', reserved' : ', ' + esc(s.name)) + '">' +
      '<span class="fb-c">' + cells(s.fromCode, 3) + '</span>' +
      '<span class="fb-c">' + cells(s.toCode, 3) + '</span>' +
      '<span class="fb-c">' + cells(r ? '—' : s.name.split(' ')[0], 6) + '</span>' +
      '<span class="fb-c hide-s">' + cells(r ? '—' : s.programme, 8) + '</span>' +
      '<span class="fb-st"><i></i>' + (r ? 'Reserved' : 'Boarded') + '</span></button>';
  }).join('');
  var rows = rowsEl.querySelectorAll('.fb-row');

  /* Split-flap: each tile cycles through letters before landing on its own. */
  function flap(row, delay) {
    row.querySelectorAll('b[data-c]').forEach(function (t, k) {
      var target = t.getAttribute('data-c');
      if (reduce) { t.textContent = target; return; }
      var spins = 4 + Math.floor(Math.random() * 6), n = 0;
      setTimeout(function step() {
        t.classList.remove('flip'); void t.offsetWidth; t.classList.add('flip');
        t.textContent = n < spins ? CH[Math.floor(Math.random() * CH.length)] : target;
        if (n++ < spins) setTimeout(step, 55);
      }, delay + k * 22);
    });
  }

  /* Gate details: filled straight away for the first flight so the board never changes height. */
  function details(i) {
    var s = STORIES[i], r = !!s.reserved;
    gate.classList.toggle('reserved', r);
    root.querySelector('[data-fb-gate-no]').textContent = 'Gate ' + (i < 9 ? '0' : '') + (i + 1);
    root.querySelector('[data-fb-route]').innerHTML = '<div><b>' + esc(s.fromCode) + '</b><small>' + esc(s.from) + '</small></div><i aria-hidden="true"><span>✈</span></i><div><b>' + esc(s.toCode) + '</b><small>' + esc(s.to) + '</small></div>';
    var av = root.querySelector('[data-fb-av]');
    av.innerHTML = s.photo ? '<img src="' + esc(s.photo) + '" alt="">' : (r ? '?' : esc(s.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2)));
    root.querySelector('[data-fb-name]').textContent = r ? 'Awaiting approval' : s.name;
    root.querySelector('[data-fb-meta]').textContent = r ? 'Student name · Programme · Institution' : [s.programme, s.institution, s.intake].filter(Boolean).join(' · ');
    root.querySelector('[data-fb-stamp]').textContent = r ? 'Reserved' : 'Approved by student';
  }
  details(0);
  function open(i) {
    if (i === cur) return; cur = i; var s = STORIES[i], r = !!s.reserved;
    rows.forEach(function (row, k) { row.classList.toggle('on', k === i); row.setAttribute('aria-pressed', k === i); });
    gate.classList.remove('swap'); void gate.offsetWidth; gate.classList.add('swap');
    details(i);
    var text = r ? RESERVED : s.quote; clearTimeout(typer);
    if (reduce) { q.textContent = text; return; }
    q.textContent = ''; q.classList.remove('done'); var k = 0;
    (function t() { k += 2; q.textContent = text.slice(0, k); if (k < text.length) typer = setTimeout(t, 15); else q.classList.add('done'); })();
  }
  function stop() { interacted = true; clearInterval(auto); }
  rows.forEach(function (row, i) {
    row.addEventListener('click', function () { stop(); open(i); });
    row.addEventListener('mouseenter', function () { if (!reduce) flap(row, 0); });
  });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); stop(); open((cur + 1) % rows.length); rows[cur].focus(); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); stop(); open((cur - 1 + rows.length) % rows.length); rows[cur].focus(); }
  });

  /* Live clock in the board's corner (visitor's local time). */
  var clock = root.querySelector('[data-fb-clock]');
  function tick() { var d = new Date(); clock.textContent = ('0' + d.getHours()).slice(-2) + (d.getSeconds() % 2 ? ' ' : ':') + ('0' + d.getMinutes()).slice(-2); }
  tick(); setInterval(tick, 1000);

  /* When the board comes into view: flap every row in, then cycle the flights. */
  var started = false;
  function start() {
    if (started) return; started = true;
    rows.forEach(function (row, i) { flap(row, i * 160); });
    setTimeout(function () { open(0); }, reduce ? 0 : 900);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      clearInterval(auto);
      if (en[0].isIntersecting) {
        start();
        if (!interacted && !reduce) auto = setInterval(function () { open((cur + 1) % rows.length); flap(rows[cur], 0); }, 5500);
      }
    }, { threshold: .3 }).observe(root);
  } else start();
  root.addEventListener('pointerenter', function () { clearInterval(auto); });
})();
