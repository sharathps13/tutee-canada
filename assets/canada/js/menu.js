/* Mobile menu (royal.css v116): light the tile for the section on screen when the menu opens,
   and let a soft glow follow the finger/pointer across each tile */
(function () {
  var dr = document.querySelector('[data-drawer]'), nav = document.querySelector('[data-dn]'); if (!dr || !nav) return;
  var tiles = [].slice.call(nav.querySelectorAll('.dt'));
  function current() {
    var mid = innerHeight * .4, best = null;
    tiles.forEach(function (t) { var s = document.querySelector(t.getAttribute('href')); if (!s) return; var r = s.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) best = t; });
    tiles.forEach(function (t) { t.classList.toggle('cur', t === best); if (t === best) t.setAttribute('aria-current', 'location'); else t.removeAttribute('aria-current'); });
  }
  new MutationObserver(function () { if (dr.classList.contains('open')) current(); }).observe(dr, { attributes: true, attributeFilter: ['class'] });
  tiles.forEach(function (t) {
    t.addEventListener('pointermove', function (e) { var r = t.getBoundingClientRect(); t.style.setProperty('--px', (e.clientX - r.left) + 'px'); t.style.setProperty('--py', (e.clientY - r.top) + 'px'); });
  });
})();
