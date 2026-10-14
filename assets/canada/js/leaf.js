/* Tutee Connect — Canada · maple-leaf engine.
 * A procedurally drawn, lit sugar-maple leaf (no image assets) rendered once to an
 * offscreen sprite, then animated on <canvas> with wind-driven motion, 3D flutter
 * and a short particle trail. Also provides light particle fields (falling leaves,
 * snow, motes, sun dust) for the seasons and final sections.
 * Exposes window.TCLeaf. Respects prefers-reduced-motion. No dependencies. */
(function () {
  'use strict';
  /* scroll position cached from a passive listener so the canvas loop never forces layout */
  var SY = window.scrollY; window.addEventListener('scroll', function () { SY = window.scrollY; }, { passive: true });
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  /* ---------- leaf outline: polar function with 5 lobes + serrations ---------- */
  // Hand-authored sugar-maple outline (right half, top tip → stem); mirrored for the left.
  var HALF = [[0,-1],[.1,-.78],[.22,-.83],[.18,-.58],[.31,-.57],[.2,-.3],[.4,-.42],[.49,-.63],[.57,-.4],[.81,-.53],[.71,-.3],[.99,-.26],[.71,-.12],[.77,.03],[.5,.04],[.63,.2],[.71,.37],[.45,.27],[.37,.41],[.25,.27],[.08,.3],[.03,.33]];
  function leafPath(ctx, R) {
    var base = HALF.concat(HALF.slice(1).reverse().map(function (p) { return [-p[0], p[1]]; })), pts = [base[0]];
    for (var i = 1; i < base.length; i++) {
      var a = base[i - 1], b = base[i], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
      if (L > .12 && Math.abs(b[1]) < .9 && b[1] < .3) { // serrate the margins, not the stem notch
        var nx = dy / L, ny = -dx / L; if (a[0] < 0 || b[0] < 0) { nx = -nx; ny = -ny; }
        var teeth = Math.max(1, Math.round(L / .075));
        for (var t = 1; t <= teeth; t++) {
          var f0 = (t - .15) / teeth, f1 = (t - .05) / teeth;
          pts.push([a[0] + dx * f0 + nx * .016, a[1] + dy * f0 + ny * .016]);
          if (t < teeth) pts.push([a[0] + dx * f1, a[1] + dy * f1]);
        }
      }
      pts.push(b);
    }
    ctx.beginPath();
    pts.forEach(function (p, i) {
      var x = p[0] * R, y = p[1] * R;
      if (!i) { ctx.moveTo(x, y); return; }
      var q = pts[i - 1], mx = (q[0] + p[0]) / 2 * R, my = (q[1] + p[1]) / 2 * R;
      // slight outward bulge for an organic, non-geometric edge
      ctx.lineTo(x, y);
    });
    ctx.closePath();
  }

  // seeded RNG so every sprite looks the same on every load
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  var VEINS = [[0, .98], [-1.31, .99], [1.31, .99], [-2.1, .78], [2.1, .78]];
  function veinPath(x, R, ang, len, base, tip) { // tapered vein as a filled sliver
    var ex = Math.sin(ang) * len * R * .93, ey = -Math.cos(ang) * len * R * .93, sx = 0, sy = R * .14;
    var nx = -(ey - sy), ny = ex - sx, l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    var cx = ex * .4, cy = ey * .5;
    x.beginPath();
    x.moveTo(sx + nx * base, sy + ny * base);
    x.quadraticCurveTo(cx + nx * base * .6, cy + ny * base * .6, ex + nx * tip, ey + ny * tip);
    x.lineTo(ex - nx * tip, ey - ny * tip);
    x.quadraticCurveTo(cx - nx * base * .6, cy - ny * base * .6, sx - nx * base, sy - ny * base);
    x.closePath();
  }
  // back: render the underside (paler, matte) — used when the leaf flips in 3D
  function makeSprite(size, tone, back) {
    var c = document.createElement('canvas'); c.width = c.height = size;
    var x = c.getContext('2d'), R = size * 0.43, rnd = rng(7 + size);
    tone = tone || { a: '#e0302a', b: '#a8101f', c: '#4a0310', v: 'rgba(255,150,110,.22)' };
    if (back) tone = { a: '#a8323d', b: '#76182a', c: '#3c0712', v: 'rgba(255,200,190,.38)' };
    x.translate(size / 2, size * 0.5);
    // body
    x.save(); x.shadowColor = 'rgba(120,8,20,.55)'; x.shadowBlur = size * .03;
    leafPath(x, R);
    var g = x.createRadialGradient(-R * .1, -R * .22, R * .02, 0, 0, R * 1.08);
    g.addColorStop(0, tone.a); g.addColorStop(.5, tone.b); g.addColorStop(1, tone.c);
    x.fillStyle = g; x.fill(); x.restore();
    x.save(); leafPath(x, R); x.clip();
    // translucency: warm light bleeding through the centre of each lobe
    VEINS.forEach(function (v) {
      var px = Math.sin(v[0]) * v[1] * R * .55, py = -Math.cos(v[0]) * v[1] * R * .55;
      var t = x.createRadialGradient(px, py, 0, px, py, R * .42 * v[1]);
      t.addColorStop(0, back ? 'rgba(255,190,180,.18)' : 'rgba(255,110,40,.34)'); t.addColorStop(1, 'rgba(255,90,70,0)');
      x.fillStyle = t; x.fillRect(-R * 1.2, -R * 1.2, R * 2.4, R * 2.4);
    });
    // cellular texture: areoles between veinlets
    for (var i = 0; i < size * 7; i++) {
      var tx = (rnd() - .5) * R * 2.2, ty = (rnd() - .5) * R * 2.2, rr = rnd() * size * .006 + size * .002;
      x.fillStyle = rnd() < .55 ? 'rgba(70,0,12,' + (rnd() * .1) + ')' : 'rgba(255,200,180,' + (rnd() * .07) + ')';
      x.beginPath(); x.arc(tx, ty, rr, 0, 6.283); x.fill();
    }
    // fine reticulate veinlets
    x.strokeStyle = back ? 'rgba(255,225,215,.12)' : 'rgba(255,170,150,.05)'; x.lineWidth = Math.max(.5, size * .0016);
    for (i = 0; i < size * .9; i++) {
      var ax = (rnd() - .5) * R * 2, ay = (rnd() - .5) * R * 2, an = rnd() * 6.283, ln = R * (.03 + rnd() * .06);
      x.beginPath(); x.moveTo(ax, ay); x.lineTo(ax + Math.cos(an) * ln, ay + Math.sin(an) * ln); x.stroke();
    }
    // main + secondary veins, tapered, with a dark groove beside each for relief
    VEINS.forEach(function (v, k) {
      x.fillStyle = 'rgba(60,0,10,.35)'; x.save(); x.translate(size * .004, size * .004); veinPath(x, R, v[0], v[1], size * (k ? .008 : .011), size * .0012); x.fill(); x.restore();
      x.fillStyle = tone.v; veinPath(x, R, v[0], v[1], size * (k ? .007 : .010), size * .001); x.fill();
      var ex = Math.sin(v[0]) * v[1] * R * .93, ey = -Math.cos(v[0]) * v[1] * R * .93;
      for (var s = .2 + rnd() * .06; s < .9; s += .12 + rnd() * .06) {
        var px = ex * s, py = ey * s + R * .14 * (1 - s);
        [-1, 1].forEach(function (sg) {
          var a2 = v[0] + sg * (0.65 + rnd() * .3 - s * .25), ln2 = R * (.18 + rnd() * .12) * (1 - s * .7);
          x.strokeStyle = tone.v; x.lineWidth = Math.max(.6, size * .0035 * (1 - s * .6));
          x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.sin(a2) * ln2 * .5, py - Math.cos(a2) * ln2 * .5 - R * .01, px + Math.sin(a2) * ln2, py - Math.cos(a2) * ln2); x.stroke();
        });
      }
    });
    // sheen + shading for curvature
    var lg = x.createLinearGradient(-R, -R, R * .8, R);
    lg.addColorStop(0, back ? 'rgba(255,240,235,.14)' : 'rgba(255,215,190,.16)'); lg.addColorStop(.42, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(10,0,5,.38)');
    x.fillStyle = lg; x.fillRect(-R * 1.3, -R * 1.3, R * 2.6, R * 2.6);
    // glossy cuticle highlight along the upper lobes
    if (!back) { var gl = x.createLinearGradient(-R * .6, -R * .9, R * .3, R * .1); gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(.45, 'rgba(255,235,220,.16)'); gl.addColorStop(.55, 'rgba(255,255,255,0)'); x.fillStyle = gl; x.fillRect(-R * 1.2, -R * 1.2, R * 2.4, R * 2.4); }
    // a few natural blemishes
    for (i = 0; i < 5; i++) { var bx = (rnd() - .5) * R * 1.2, by = (rnd() - .6) * R * 1.1, br = R * (.015 + rnd() * .03); var bg = x.createRadialGradient(bx, by, 0, bx, by, br); bg.addColorStop(0, 'rgba(70,10,10,.35)'); bg.addColorStop(1, 'rgba(70,10,10,0)'); x.fillStyle = bg; x.fillRect(bx - br, by - br, br * 2, br * 2); }
    x.restore();
    // edge: darker serrated rim + thin rim light on the upper edges
    x.save(); leafPath(x, R); x.lineWidth = size * .006; x.strokeStyle = 'rgba(60,0,10,.55)'; x.stroke();
    x.clip(); x.lineWidth = size * .008; x.strokeStyle = back ? 'rgba(255,220,210,.22)' : 'rgba(255,150,110,.32)'; x.translate(-size * .003, -size * .004); leafPath(x, R); x.stroke(); x.restore();
    // petiole
    x.strokeStyle = tone.c; x.lineCap = 'round'; x.lineWidth = size * .016; x.beginPath(); x.moveTo(0, R * .14); x.quadraticCurveTo(R * .03, R * .55, R * .14, R * .8); x.stroke();
    x.strokeStyle = 'rgba(255,170,150,.35)'; x.lineWidth = size * .004; x.beginPath(); x.moveTo(-size * .003, R * .16); x.quadraticCurveTo(R * .02, R * .55, R * .12, R * .78); x.stroke();
    return c;
  }
  function blurred(src, px) { var c = document.createElement('canvas'); c.width = src.width; c.height = src.height; var x = c.getContext('2d'); x.filter = 'blur(' + px + 'px)'; x.drawImage(src, 0, 0); return c; }

  var SPRITE = null, SPRITE_AUTUMN = [];
  function sprite() { return SPRITE || (SPRITE = makeSprite(256)); }
  var BIG = null, BIGBACK = null;
  function shadowed(src) { var c = document.createElement('canvas'); c.width = src.width; c.height = src.height; var x = c.getContext('2d'); x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = src.width * .05; x.shadowOffsetY = src.width * .03; x.drawImage(src, src.width * .04, src.width * .04, src.width * .92, src.height * .92); return c; }
  // sprite resolution follows the largest size the leaf is ever drawn at (was a fixed 900px: slow to build on phones)
  function big(n) { n = n || 900; if (!BIG || BIG.width < n) { BIG = shadowed(makeSprite(n)); BIGBACK = shadowed(makeSprite(n, null, true)); } return [BIG, BIGBACK]; }
  function autumnSprites() {
    if (!SPRITE_AUTUMN.length) [
      { a: '#d4253a', b: '#951326', c: '#5a0a17', v: 'rgba(255,190,170,.5)' },
      { a: '#e8742a', b: '#b8431a', c: '#6e2410', v: 'rgba(255,220,170,.5)' },
      { a: '#e3a72f', b: '#b0701a', c: '#6a4210', v: 'rgba(255,240,190,.5)' }
    ].forEach(function (t) { SPRITE_AUTUMN.push(makeSprite(128, t)); });
    return SPRITE_AUTUMN;
  }

  function fit(canvas) {
    var r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * DPR)); canvas.height = Math.max(1, Math.round(r.height * DPR));
    var ctx = canvas.getContext('2d'); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    return { ctx: ctx, w: r.width, h: r.height };
  }

  /* ---------- the hero leaf: path from sky to landing point ---------- */
  // opts: canvas, from {x,y} (fractions), to {x,y}, duration ms, size px, onLand(x,y)
  function flight(opts) {
    var cv = opts.canvas, F = fit(cv), ctx = F.ctx, img = sprite(), trail = [], t0 = null, landed = false, done = false, rafId;
    var D = opts.duration || 4200, S = opts.size || 74;
    function pos(p) { // eased descent with wind sway
      var e = 1 - Math.pow(1 - p, 2.2);
      var x = opts.from.x + (opts.to.x - opts.from.x) * e + Math.sin(p * Math.PI * 2.6) * 0.07 * (1 - p);
      var y = opts.from.y + (opts.to.y - opts.from.y) * (p * p * (3 - 2 * p));
      return [x * F.w, y * F.h];
    }
    function frame(ts) {
      if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / D);
      ctx.clearRect(0, 0, F.w, F.h);
      var P = pos(p), rot = Math.sin(p * 9) * 0.6 + p * 1.4, flip = Math.cos(p * 11);
      if (p < 1 && Math.random() < .9) trail.push({ x: P[0] + (Math.random() - .5) * 8, y: P[1] + (Math.random() - .5) * 8, life: 1, r: Math.random() * 1.8 + .6, vx: (Math.random() - .5) * .3, vy: Math.random() * .25 });
      // trail particles
      ctx.globalCompositeOperation = 'lighter';
      trail.forEach(function (q) {
        q.life -= 0.012; q.x += q.vx; q.y += q.vy;
        if (q.life > 0) { ctx.fillStyle = 'rgba(255,' + Math.round(120 + 80 * q.life) + ',110,' + (q.life * .55) + ')'; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * q.life, 0, 6.283); ctx.fill(); }
      });
      trail = trail.filter(function (q) { return q.life > 0; });
      ctx.globalCompositeOperation = 'source-over';
      // leaf
      var fade = landed ? Math.max(0, 1 - (ts - landed) / 900) : 1;
      if (fade > 0) {
        ctx.save(); ctx.globalAlpha = fade; ctx.translate(P[0], P[1]); ctx.rotate(rot); ctx.scale(Math.max(.18, Math.abs(flip)) * (flip < 0 ? -1 : 1), 1);
        ctx.shadowColor = 'rgba(255,90,70,.45)'; ctx.shadowBlur = 24;
        ctx.drawImage(img, -S / 2, -S / 2, S, S); ctx.restore();
      }
      if (p >= 1 && !landed) { landed = ts; if (opts.onLand) opts.onLand(P[0], P[1]); burst(P); }
      if (landed && ts - landed > 1400 && !trail.length) { ctx.clearRect(0, 0, F.w, F.h); done = true; if (opts.onDone) opts.onDone(); return; }
      rafId = requestAnimationFrame(frame);
    }
    function burst(P) { for (var i = 0; i < 46; i++) { var a = Math.random() * 6.283, v = Math.random() * 2.4 + .4; trail.push({ x: P[0], y: P[1], life: 1, r: Math.random() * 2 + .6, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .6 }); } }
    rafId = requestAnimationFrame(frame);
    return { stop: function () { cancelAnimationFrame(rafId); ctx.clearRect(0, 0, F.w, F.h); } };
  }

  /* ---------- particle fields (seasons / final) ---------- */
  // kind: 'leaves' | 'snow' | 'motes' | 'sun' | 'embers'
  function field(canvas, kind, density) {
    var F, ctx, parts = [], running = false, rafId, kindNow = kind;
    function spawn(initial) {
      var w = F.w, h = F.h, k = kindNow;
      var q = { x: Math.random() * w, y: initial ? Math.random() * h : -20, ph: Math.random() * 6.28 };
      if (k === 'leaves') { q.s = 14 + Math.random() * 18; q.vy = .5 + Math.random() * .7; q.vx = -.2 + Math.random() * .5; q.img = autumnSprites()[Math.floor(Math.random() * 3)]; q.rot = Math.random() * 6; }
      if (k === 'snow') { q.s = .8 + Math.random() * 2.4; q.vy = .4 + Math.random() * .9; q.vx = -.15 + Math.random() * .3; }
      if (k === 'motes' || k === 'sun') { q.s = .6 + Math.random() * 1.6; q.vy = -.05 - Math.random() * .2; q.vx = -.1 + Math.random() * .2; if (initial) q.y = Math.random() * h; else q.y = h + 10; }
      if (k === 'embers') { q.s = .6 + Math.random() * 1.8; q.vy = -.2 - Math.random() * .5; q.vx = -.15 + Math.random() * .3; q.y = initial ? Math.random() * h : h + 10; }
      return q;
    }
    function reset() { F = fit(canvas); ctx = F.ctx; var n = Math.round((F.w * F.h) / 1e6 * (density || 60)); parts = []; for (var i = 0; i < n; i++) parts.push(spawn(true)); }
    function frame(ts) {
      ctx.clearRect(0, 0, F.w, F.h);
      parts.forEach(function (q, i) {
        q.ph += .01; q.x += q.vx + Math.sin(q.ph) * (kindNow === 'leaves' ? .6 : .25); q.y += q.vy;
        if (kindNow === 'leaves') {
          q.rot += .012; var f = Math.cos(q.ph * 3);
          ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.scale(Math.max(.2, Math.abs(f)), 1); ctx.globalAlpha = .9; ctx.drawImage(q.img, -q.s / 2, -q.s / 2, q.s, q.s); ctx.restore();
        } else {
          var col = kindNow === 'snow' ? '255,255,255' : kindNow === 'embers' ? '255,140,110' : kindNow === 'sun' ? '255,230,180' : '210,232,241';
          var a = kindNow === 'snow' ? .85 : .55 * (.5 + .5 * Math.sin(q.ph * 4));
          ctx.fillStyle = 'rgba(' + col + ',' + a + ')'; ctx.beginPath(); ctx.arc(q.x, q.y, q.s, 0, 6.283); ctx.fill();
        }
        if (q.y > F.h + 30 || q.y < -40 || q.x < -40 || q.x > F.w + 40) parts[i] = spawn(false);
      });
      rafId = requestAnimationFrame(frame);
    }
    function start() { if (running || reduce) return; running = true; rafId = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(rafId); }
    reset();
    var ro; if ('ResizeObserver' in window) { ro = new ResizeObserver(function () { reset(); }); ro.observe(canvas); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting) start(); else stop(); }, { threshold: 0.05 }).observe(canvas);
    else start();
    return { set: function (k, d) { kindNow = k; if (d) density = d; reset(); }, start: start, stop: stop };
  }


  /* =====================================================================
   * HERO ENGINE — one large lit leaf with a designed path, 3D flutter,
   * ember trail, depth leaves, cursor parallax and a scroll continuation.
   * opts: { canvas (position:fixed, full viewport), hero (element), onProgress(p,x,y), onLanded() }
   * ===================================================================== */
  function hero(opts) {
    var cv = opts.canvas, heroEl = opts.hero, F, ctx, mobile;
    var faces = big((innerWidth < 760 || matchMedia('(pointer:coarse)').matches) ? 360 : 600), small = makeSprite(160), soft = blurred(makeSprite(220), 3), bokeh = blurred(makeSprite(260), 9);
    var trail = [], depth = [], t0 = 0, phase = 'wait', mx = 0, my = 0, emx = 0, emy = 0, gust = 0, raf = 0, visible = true, lastTs = 0;
    var D = 4800, BLUR = null;
    /* Fairy dust: tiny gold specks in a soft gold glow — no hard edges, no beads. */
    var DOT = [[212, 160, 60], [236, 190, 90], [255, 214, 130]].map(function (c) {
      var S = 64, h = S / 2, d = document.createElement('canvas'); d.width = d.height = S; var x = d.getContext('2d');
      var g = x.createRadialGradient(h, h, 0, h, h, h);
      g.addColorStop(0, 'rgba(255,246,214,1)'); g.addColorStop(.06, 'rgba(255,236,180,.95)');
      g.addColorStop(.16, 'rgba(' + c + ',.55)'); g.addColorStop(.4, 'rgba(' + c + ',.14)'); g.addColorStop(1, 'rgba(' + c + ',0)');
      x.fillStyle = g; x.fillRect(0, 0, S, S);
      return d;
    });
    function size() { return mobile ? Math.min(F.w * .32, 130) : Math.max(170, Math.min(270, Math.min(F.w * .16, F.h * .3))); }
    function rest() { return mobile ? [F.w * .8, F.h * .1] : F.w < 1100 ? [F.w * .8, F.h * .14] : [F.w * .45, F.h * .26]; }
    function bez(p, a, b, c, d) { var u = 1 - p; return u * u * u * a + 3 * u * u * p * b + 3 * u * p * p * c + p * p * p * d; }
    function path(p) { // designed flight: enters top-right, sweeps across the upper sky, banks down, settles
      var R = rest(), W = F.w, H = F.h;
      // carried by a breeze: rises from the lower-left foreground, arcs through the light, drifts down to rest
      var P = mobile ? [[-W * .35, H * .7], [W * .1, H * -.05], [W * 1.05, H * .05], R] : [[-W * .18, H * .82], [W * .22, H * .02], [W * .88, H * -.02], R];
      return [bez(p, P[0][0], P[1][0], P[2][0], P[3][0]), bez(p, P[0][1], P[1][1], P[2][1], P[3][1])];
    }
    function ease(p) { return p * p * p * (p * (p * 6 - 15) + 10); } // smootherstep: no velocity jump at either end
    function resize() {
      var r = cv.getBoundingClientRect(); var dpr = Math.min(window.devicePixelRatio || 1, (r.width < 760 || matchMedia('(pointer:coarse)').matches) ? 1 : 1.5, Math.sqrt(2.4e6 / Math.max(1, r.width * r.height))); // pixel budget keeps big screens at 60fps
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
      ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      F = { w: r.width, h: r.height }; mobile = F.w < 760;
      depth = []; AMB = []; refreshWP();
      var n = 0;
      for (var i = 0; i < n; i++) depth.push(newDepth(true, i));
    }
    function newDepth(initial, i) {
      var near = (i % 4 === 3); // every 4th leaf is close to the camera, large and out of focus
      return { near: near, x: initial ? Math.random() * F.w : F.w + 80, y: initial ? Math.random() * F.h * .9 : Math.random() * F.h * .6,
        s: near ? 120 + Math.random() * 90 : 30 + Math.random() * 30, vx: -(near ? .5 : .18) - Math.random() * .25, vy: (near ? .22 : .1) + Math.random() * .15,
        r: Math.random() * 6, ph: Math.random() * 6, img: near ? bokeh : (Math.random() < .5 ? soft : small), a: near ? .45 : .5 + Math.random() * .35 };
    }
    var WP = [], arrived = {}, wpStamp = 0, AMB = [], lastP = null, sP = null, sS = 0, hov = 0, px = null, py = null;
    function refreshWP() { WP = (opts.waypoints ? opts.waypoints() : []); wpStamp = performance.now(); }
    function wpPos(w) { return [w.x * F.w, w.y * F.h]; }
    function journey() {
      if (!WP.length || performance.now() - wpStamp > 2500) refreshWP();
      var c = SY + F.h * .5, res = { seg: 0, t: 0, a: WP[0], b: WP[0] || { x: .5, y: .5, s: 1 }, travel: 0, arrive: false };
      if (WP.length < 2) return res;
      for (var i = 0; i < WP.length - 1; i++) {
        var a = WP[i], b = WP[i + 1];
        if (c <= b.c || i === WP.length - 2) {
          var t = Math.max(0, Math.min(1, (c - a.c) / Math.max(1, b.c - a.c)));
          t = t * t * (3 - 2 * t);
          res = { seg: i, t: t, a: a, b: b, travel: i + t, arrive: t > .97 };
          break;
        }
      }
      return res;
    }
    function burstAt(P, n) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = Math.random() * 2.2 + .3; trail.push({ x: P[0], y: P[1], vx: Math.cos(a) * v, vy: Math.sin(a) * v * .7, life: 1, r: .8 + Math.random() * 2.4, ci: Math.random() < .7 ? 0 : 1 }); } }
    // ambient floating red particles (the signature dots), dense in the hero and lighter below
    function seedAmbient() {
      AMB = []; var n = mobile ? 26 : 60;
      for (var i = 0; i < n; i++) AMB.push({ x: Math.random() * F.w, y: Math.random() * F.h, r: .6 + Math.random() * (Math.random() < .12 ? 2.4 : 1.2), vy: -.08 - Math.random() * .25, vx: (Math.random() - .5) * .15, ph: Math.random() * 6.28, ci: Math.random() < .6 ? 0 : Math.random() < .5 ? 1 : 2 });
    }
    function drawAmbient(dt, heroFade) {
      if (!AMB.length) seedAmbient();
      var k = dt / 16, base = .35 + .65 * heroFade; // stays visible down the page, brighter in the hero
      AMB.forEach(function (q) {
        q.ph += .02 * k; q.x += (q.vx + Math.sin(q.ph) * .12) * k - emx * .3; q.y += q.vy * k;
        if (q.y < -10) { q.y = F.h + 10; q.x = Math.random() * F.w; }
        if (q.x < -10) q.x = F.w + 10; if (q.x > F.w + 10) q.x = -10;
        ctx.globalAlpha = (.35 + .5 * (.5 + .5 * Math.sin(q.ph * 1.3))) * base;
        var R = q.r * 4.5; ctx.drawImage(DOT[q.ci], q.x - R, q.y - R, R * 2, R * 2);
      });
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    function scrollP() { var y = SY, h = F.h; return Math.max(0, Math.min(1.35, y / (h * 1.05))); }
    function draw(ts) {
      raf = 0; if (!lastTs) lastTs = ts; var dt = Math.min(48, ts - lastTs); lastTs = ts;
      var sp = scrollP();
      ctx.clearRect(0, 0, F.w, F.h);
      var heroFade = Math.max(0, 1 - sp * 1.1);
      emx += (mx - emx) * .06; emy += (my - emy) * .06;
      // depth leaves (behind the hero leaf)
      if (heroFade > 0) depth.forEach(function (q, i) {
        q.ph += .012 * dt / 16; q.x += (q.vx + Math.sin(q.ph) * .25) * dt / 16; q.y += (q.vy + Math.cos(q.ph * .7) * .08) * dt / 16; q.r += .006 * dt / 16;
        if (q.x < -q.s * 2 || q.y > F.h + q.s) depth[i] = newDepth(false, i);
        var par = q.near ? 40 : 10;
        ctx.save(); ctx.globalAlpha = q.a * heroFade; ctx.translate(q.x - emx * par, q.y - emy * par - sp * F.h * (q.near ? .5 : .2)); ctx.rotate(q.r);
        ctx.scale(Math.max(.25, Math.abs(Math.cos(q.ph * 1.6))), 1); ctx.drawImage(q.img, -q.s / 2, -q.s / 2, q.s, q.s); ctx.restore();
      });
      // main leaf position
      var p = 1, P, S = size(), rotZ, flipA, now = ts - t0;
      if (phase === 'flight' && SY > 30) { t0 -= dt * 2.5; now = ts - t0; } // visitor scrolls: finish the entrance faster, never jump
      if (phase === 'flight') { p = Math.min(1, now / D); P = path(ease(p)); if (p >= 1) { phase = 'idle'; if (opts.onLanded) opts.onLanded(); } }
      else P = rest();
      var idleT = ts / 1000;
      if (phase !== 'flight') { P = [P[0] + Math.sin(idleT * .6) * S * .06, P[1] + Math.sin(idleT * .9) * S * .05]; }
      var g = gust ? Math.max(0, 1 - (ts - gust) / 1400) : 0;
      if (g > 0) { var gp = 1 - g; P = [P[0] - Math.sin(gp * Math.PI) * S * .25, P[1] - Math.sin(gp * Math.PI * 2) * S * .08]; }
      // cursor parallax (leaf is the nearest layer)
      P = [P[0] - emx * 46, P[1] - emy * 30];
      // scroll journey: the leaf travels a path of waypoints, one per section, down the whole page
      var J = journey(), se = J.travel;
      if (J.seg > 0 || J.t > 0) {
        var from = J.seg === 0 ? P : wpPos(J.a), to = wpPos(J.b), t = J.t;
        var sw = Math.sin(t * Math.PI) * (J.seg % 2 ? -1 : 1) * F.w * (mobile ? .06 : .09); // curved path between stops
        P = [from[0] + (to[0] - from[0]) * t + sw, from[1] + (to[1] - from[1]) * t + Math.sin(t * Math.PI * 2) * F.h * .03];
        var sa = J.seg === 0 ? 1 : J.a.s, sb = J.b.s;
        S = S * (sa + (sb - sa) * t);
        if (J.seg > 0 || t > .02) P = [P[0] + Math.sin(idleT * .7) * S * .1, P[1] + Math.sin(idleT * 1.1) * S * .08];
      }
      // never teleport: ease the drawn position/size toward the computed target
      var kk = 1 - Math.exp(-dt / 110);
      if (!sP || phase === 'flight') { sP = [P[0], P[1]]; sS = S; } else { sP[0] += (P[0] - sP[0]) * kk; sP[1] += (P[1] - sP[1]) * kk; sS += (S - sS) * kk; }
      P = [sP[0], sP[1]]; S = sS;
      // hover: tactile tilt + lift when the cursor is over the leaf
      var over = px != null && Math.hypot(px - P[0], py - P[1]) < S * .45 && phase !== 'flight';
      hov += ((over ? 1 : 0) - hov) * (1 - Math.exp(-dt / 140));
      S = S * (1 + hov * .07);
      var alpha = 1;
      // rotation + 3D flutter: faster in flight, gentle at rest
      var spin = phase === 'flight' ? (1 - p) : 0;
      rotZ = Math.sin(idleT * .8) * .14 + spin * spin * Math.sin(now / 700) * 1.1 - .25 + se * 2.2 + g * 1.5;
      var idleA = idleT * 1.1 + g * 6, restSx = .78 + .22 * Math.cos(idleA), sx, sy, ep = ease(p);
      if (phase === 'flight') {
        flipA = now / 620; var tum = Math.cos(flipA) * (1 - ep) + restSx * ep; // tumble eases into the resting tilt
        sx = tum; sy = .9 + .1 * Math.sin(flipA * .7 + 1) * (1 - ep) + .1 * Math.sin(idleA * .7 + 1) * ep;
        S = S * (1 + 1.25 * Math.pow(1 - ep, 2)); // big in the foreground, settling to its hero size
      } else { flipA = idleA; sx = restSx; sy = .9 + .1 * Math.sin(flipA * .7 + 1); }
      var face = sx < 0 ? faces[1] : faces[0];
      // trail
      var mv = lastP ? Math.hypot(P[0] - lastP[0], P[1] - lastP[1]) : 0; lastP = [P[0], P[1]];
      var speed = phase === 'flight' ? 1 : g * .6;
      if (phase === 'flight') for (var k = 0; k < 3; k++) {
        var hue = Math.random();
        trail.push({ x: P[0] + (Math.random() - .5) * S * .3, y: P[1] + (Math.random() - .5) * S * .3, vx: (Math.random() - .5) * .35, vy: .05 + Math.random() * .3, life: .6 + Math.random() * .4, tw: Math.random() * 6.28, r: .35 + Math.random() * (Math.random() < .15 ? 1.3 : .7), ci: hue < .55 ? 0 : hue < .85 ? 1 : 2 });
      }
      for (var i = trail.length - 1; i >= 0; i--) {
        var q = trail[i]; q.life -= .016 * dt / 16; q.x += q.vx * dt / 16; q.y += q.vy * dt / 16;
        if (q.life <= 0) { trail.splice(i, 1); continue; }
        q.tw += .35 * dt / 16; ctx.globalAlpha = Math.min(1, q.life * 1.6) * (.55 + .45 * Math.sin(q.tw)) * alpha;
        ctx.drawImage(DOT[q.ci], q.x - q.r * 9, q.y - q.r * 9, q.r * 18, q.r * 18);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      // glow halo behind the leaf
      if (alpha > 0 && isFinite(P[0]) && isFinite(P[1]) && isFinite(S) && S > 0) {
        var halo = ctx.createRadialGradient(P[0], P[1], S * .1, P[0], P[1], S * .95);
        halo.addColorStop(0, 'rgba(230,60,50,' + ((.06 + hov * .14) * alpha) + ')'); halo.addColorStop(1, 'rgba(230,60,50,0)');
        ctx.fillStyle = halo; ctx.fillRect(P[0] - S, P[1] - S, S * 2, S * 2);
        ctx.save(); ctx.globalAlpha = alpha; ctx.translate(P[0], P[1]); ctx.rotate(rotZ + hov * .22 + (px != null ? (px - P[0]) / S * hov * .15 : 0));
        ctx.scale(Math.max(.06, Math.abs(sx)), sy);
        var focus = phase === 'flight' ? Math.min(1, ep * 2.2) : 1; // starts out of focus, sharpens as it nears
        if (focus < 1) { if (!BLUR) BLUR = blurred(faces[0], Math.max(4, Math.round(16 * faces[0].width / 900))); ctx.globalAlpha = alpha * (1 - focus); ctx.drawImage(BLUR, -S / 2, -S / 2, S, S); ctx.globalAlpha = alpha * focus; }
        ctx.drawImage(face, -S / 2, -S / 2, S, S);
        if (phase === 'flight') { // catches the light as it crosses the beam
          var lit = Math.max(0, 1 - Math.abs(ep - .45) / .2);
          if (lit > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = lit * .35; ctx.drawImage(face, -S / 2, -S / 2, S, S); ctx.globalCompositeOperation = 'source-over'; }
        }
        ctx.restore();
      }
      if (opts.onProgress) opts.onProgress(phase === 'flight' ? p : 1, P[0], P[1], alpha * heroFade, phase === 'flight');
      raf = requestAnimationFrame(draw);
    }
    resize();
    window.addEventListener('resize', resize);
    if (opts.pointerTarget) opts.pointerTarget.addEventListener('pointermove', function (e) { mx = (e.clientX / F.w - .5) * .4; my = (e.clientY / F.h - .5) * .4; if (e.pointerType === 'mouse') { px = e.clientX; py = e.clientY; } });
    window.addEventListener('pointerdown', function (e) { if (sP && Math.hypot(e.clientX - sP[0], e.clientY - sP[1]) < sS * .5) gust = performance.now(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) { lastTs = 0; raf = requestAnimationFrame(draw); } });
    return {
      play: function () { phase = 'flight'; t0 = performance.now(); trail = []; if (!raf) raf = requestAnimationFrame(draw); },
      settle: function () { phase = 'idle'; if (!raf) raf = requestAnimationFrame(draw); },
      gust: function () { gust = performance.now(); },
      flying: function () { return phase === 'flight'; },
      refresh: refreshWP
    };
  }

  window.TCLeaf = { hero: hero, sprite: sprite, makeSprite: makeSprite, flight: flight, field: field, reduce: reduce };
})();
