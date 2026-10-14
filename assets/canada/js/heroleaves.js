/* Floating 3D maple leaves in the hero background.
 * They drift, sway and flip slowly; the pointer nudges them aside and a tap
 * sends the touched leaf spinning. Runs only while the hero is on screen. */
(function () {
  'use strict';
  var hero = document.querySelector('[data-hero]'), L = window.TCLeaf;
  if (!hero || !L) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cv = document.createElement('canvas'); cv.className = 'hx-leaves'; cv.setAttribute('aria-hidden', 'true');
  var bg = hero.querySelector('.hx-bg') || hero; bg.appendChild(cv);
  var ctx = cv.getContext('2d'), img = L.sprite(), W = 0, H = 0, dpr = 1, leaves = [], raf = 0, last = 0, visible = true;
  var px = -999, py = -999, pvx = 0, pvy = 0;

  /* A darker copy of the sprite for the leaf's underside. */
  var back = document.createElement('canvas'); back.width = back.height = img.width;
  (function () { var b = back.getContext('2d'); b.drawImage(img, 0, 0); b.globalCompositeOperation = 'source-atop'; b.fillStyle = 'rgba(70,10,20,.38)'; b.fillRect(0, 0, back.width, back.height); })();

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function make(i, n, spread) {
    var z = rnd(.25, 1);                                  // depth: far leaves are small, faint, slow
    return {
      x: rnd(.04, .96) * W, y: spread ? rnd(-.1, 1) * H : -60, z: z,
      s: 20 + z * 50, vx: 0, vy: 0, fall: (.12 + z * .22), sway: rnd(0, 6.28), swayF: rnd(.35, .7),
      rot: rnd(-1, 1), vr: rnd(-.0025, .0025), flip: rnd(0, 6.28), vf: rnd(.006, .014), spin: 0, hov: 0
    };
  }
  function resize() {
    var r = hero.getBoundingClientRect(); dpr = Math.min(matchMedia('(pointer:coarse)').matches ? 1.5 : 2, devicePixelRatio || 1, Math.sqrt(3e6 / Math.max(1, r.width * r.height)));
    W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = W < 700 ? 6 : 11;
    if (leaves.length !== n) { leaves = []; for (var i = 0; i < n; i++) leaves.push(make(i, n, true)); }
    leaves.sort(function (a, b) { return a.z - b.z; });
    if (reduce) draw(0);
  }

  function step(dt) {
    var k = dt / 16.7;
    leaves.forEach(function (l) {
      l.sway += .01 * l.swayF * k;
      var dx = l.x - px, dy = l.y - py, d = Math.hypot(dx, dy), R = 140 + l.s;
      if (d < R) {                                         // pointer nearby: gentle push + spin
        var f = (1 - d / R) * .35 * l.z;
        l.vx += (dx / (d || 1)) * f + pvx * .02 * f; l.vy += (dy / (d || 1)) * f + pvy * .02 * f;
        l.spin += f * .006; l.hov = Math.min(1, l.hov + .08 * k);
      } else l.hov = Math.max(0, l.hov - .04 * k);
      l.vx *= Math.pow(.95, k); l.vy *= Math.pow(.95, k); l.spin *= Math.pow(.97, k);
      l.x += (Math.sin(l.sway) * .35 * l.z + l.vx) * k;
      l.y += (l.fall + l.vy) * k;
      l.rot += (l.vr + l.spin) * k + Math.cos(l.sway) * .0015 * k;
      l.flip += (l.vf + l.spin * 3) * k;
      if (l.y > H + 80 || l.x < -120 || l.x > W + 120) { var n = make(); n.x = rnd(.04, .96) * W; Object.assign(l, n); }
    });
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    leaves.forEach(function (l) {
      var sx = Math.cos(l.flip), sy = .82 + .18 * Math.sin(l.flip * .6 + 1), S = l.s * (1 + l.hov * .12);
      ctx.save();
      ctx.globalAlpha = (.16 + l.z * .5) * (1 + l.hov * .6);
      ctx.translate(l.x, l.y); ctx.rotate(l.rot);
      ctx.scale(Math.max(.08, Math.abs(sx)), sy);
      if (l.hov > .05) { ctx.shadowColor = 'rgba(200,35,59,' + (.45 * l.hov) + ')'; ctx.shadowBlur = 22 * l.hov; }
      ctx.drawImage(sx < 0 ? back : img, -S / 2, -S / 2, S, S);
      ctx.restore();
    });
  }
  function loop(ts) {
    var dt = Math.min(48, last ? ts - last : 16.7); last = ts;
    step(dt); draw();
    raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
  }
  function start() { if (!raf && !reduce) { last = 0; raf = requestAnimationFrame(loop); } }

  hero.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    pvx = x - px; pvy = y - py; if (Math.abs(pvx) > 200) pvx = pvy = 0; px = x; py = y;
  }, { passive: true });
  hero.addEventListener('pointerleave', function () { px = py = -999; });
  /* Tap / click a leaf: it spins, flips and pops away. */
  hero.addEventListener('pointerdown', function (e) {
    if (e.target.closest('a,button,input,select,textarea')) return;
    var r = hero.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, hit = null, best = 1e9;
    leaves.forEach(function (l) { var d = Math.hypot(l.x - x, l.y - y); if (d < l.s * .9 + 20 && d < best) { best = d; hit = l; } });
    if (!hit) return;
    var a = Math.atan2(hit.y - y, hit.x - x) || rnd(0, 6.28);
    hit.vx += Math.cos(a) * 5; hit.vy += Math.sin(a) * 5 - 2.5; hit.spin += rnd(.05, .09) * (Math.random() < .5 ? -1 : 1); hit.hov = 1;
    if (reduce) { hit.rot += 1; draw(); }
    start();
  });

  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }, { threshold: 0 }).observe(hero);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && visible) start(); });
  window.addEventListener('resize', resize);
  resize(); if (reduce) draw(); else start();
})();
