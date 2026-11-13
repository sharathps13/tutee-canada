/* AI chat bar (royal.css v112): a live glowing sound wave along the bottom of the input
 * and a microphone button for spoken questions. The wave idles softly, swells while the
 * visitor types, rises while Tutee Connect is answering, and follows the voice while the
 * mic listens. Paused off-screen; a still line for reduced motion. */
(function () {
  'use strict';
  var form = document.querySelector('[data-ask-form]'); if (!form) return;
  var cv = form.querySelector('[data-ask-wave]'), input = form.querySelector('[data-ask-input]'), mic = form.querySelector('[data-ask-mic]');
  var log = document.querySelector('[data-ask-log]');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- wave ---------- */
  var ctx = cv && cv.getContext('2d'), W = 0, H = 0, dpr = 1, raf = 0, on = false, t = 0, last = 0;
  var energy = .5, target = .5, pulse = 0, level = 0, listening = false, thinking = false;
  // hue layers: pink → magenta → orange → violet, each its own speed and frequency
  var L = [
    { c: '255,92,140', f: 1.6, s: .9, a: 1, p: 0 },
    { c: '255,150,70', f: 2.3, s: -1.2, a: .85, p: 1.7 },
    { c: '190,90,255', f: 1.1, s: .6, a: .8, p: 3.1 },
    { c: '255,70,95', f: 3.1, s: 1.6, a: .55, p: 4.4 },
    { c: '255,200,120', f: 4.2, s: -2.1, a: .4, p: 2.2 }
  ];
  function size() {
    if (!cv) return; var r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function env(x) { var u = x / W; return Math.pow(Math.sin(Math.PI * u), 1.6); } // tapers to nothing at both ends
  function draw(ts) {
    raf = 0; if (!on) return;
    var dt = last ? Math.min(50, ts - last) : 16; last = ts; t += dt / 1000;
    target = listening ? .55 + level * 1.4 : thinking ? .95 : document.activeElement === input ? (input.value ? .8 : .6) : .5;
    energy += (Math.min(1.6, target + pulse) - energy) * (1 - Math.exp(-dt / 220)); pulse *= Math.exp(-dt / 260);
    ctx.clearRect(0, 0, W, H);
    var mid = H * .62, amp = H * .4 * energy;
    ctx.globalCompositeOperation = 'lighter';
    for (var k = 0; k < L.length; k++) {
      var l = L[k];
      ctx.beginPath();
      for (var x = 0; x <= W; x += 3) {
        var u = x / W * Math.PI * 2;
        var y = Math.sin(u * l.f + t * l.s * 2.2 + l.p) * .6 + Math.sin(u * l.f * 2.7 - t * l.s * 1.4 + l.p * 2) * .4;
        y = mid - Math.abs(y) * amp * env(x) * l.a - env(x) * 1.2;
        if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      var lg = ctx.createLinearGradient(0, 0, W, 0), la = .55 * l.a; // fade out before the bar's rounded ends
      lg.addColorStop(0, 'rgba(' + l.c + ',0)'); lg.addColorStop(.18, 'rgba(' + l.c + ',' + la + ')'); lg.addColorStop(.82, 'rgba(' + l.c + ',' + la + ')'); lg.addColorStop(1, 'rgba(' + l.c + ',0)');
      ctx.strokeStyle = lg; ctx.lineWidth = 1.4;
      ctx.shadowColor = 'rgba(' + l.c + ',.6)'; ctx.shadowBlur = 10;
      ctx.stroke();
    }
    // the bright base line the waves rise from
    var g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, 'rgba(160,80,255,0)'); g.addColorStop(.08, 'rgba(170,85,255,.12)'); g.addColorStop(.25, 'rgba(190,90,255,.6)'); g.addColorStop(.45, 'rgba(255,92,140,.9)');
    g.addColorStop(.6, 'rgba(255,150,70,.85)'); g.addColorStop(.75, 'rgba(190,90,255,.6)'); g.addColorStop(.92, 'rgba(170,85,255,.12)'); g.addColorStop(1, 'rgba(160,80,255,0)');
    ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(255,92,140,.9)'; ctx.strokeStyle = g; ctx.lineWidth = 1.6;
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, mid);
    for (var q = 0; q <= W; q += 4) ctx.lineTo(q, mid - .9 * env(q) - .15);
    for (q = W; q >= 0; q -= 4) ctx.lineTo(q, mid + .9 * env(q) + .15);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over';
    if (!reduce) raf = requestAnimationFrame(draw);
  }
  function start() { if (!cv || on) return; on = true; last = 0; size(); raf = requestAnimationFrame(draw); }
  function stop() { on = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  if (cv) {
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }).observe(form);
    else start();
    addEventListener('resize', function () { if (on) { size(); if (reduce) draw(performance.now()); } });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (form.getBoundingClientRect().top < innerHeight) start(); });
    input.addEventListener('input', function () { pulse = Math.min(.6, pulse + .22); form.classList.toggle('has-text', !!input.value.trim()); });
    input.addEventListener('focus', function () { pulse = .3; if (reduce && on) draw(performance.now()); });
    if (log) new MutationObserver(function () { thinking = !!log.querySelector('.typing'); form.classList.toggle('thinking', thinking); if (thinking) pulse = .4; }).observe(log, { childList: true, subtree: true });
    form.addEventListener('submit', function () { pulse = .7; setTimeout(function () { form.classList.remove('has-text'); }, 0); });
  }

  /* ---------- microphone ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!mic) return;
  if (!SR) { mic.hidden = true; return; }
  var rec = null, ac = null, stream = null, an = null, buf = null, meterRaf = 0;
  function meter() { // follow the voice level so the wave dances with it
    if (!an) return; an.getByteTimeDomainData(buf); var s = 0;
    for (var i = 0; i < buf.length; i++) { var v = (buf[i] - 128) / 128; s += v * v; }
    level = Math.min(1, Math.sqrt(s / buf.length) * 4); meterRaf = requestAnimationFrame(meter);
  }
  function stopListening() {
    listening = false; level = 0; mic.classList.remove('on'); mic.setAttribute('aria-pressed', 'false'); form.classList.remove('listening');
    if (meterRaf) cancelAnimationFrame(meterRaf); meterRaf = 0;
    if (stream) { stream.getTracks().forEach(function (tr) { tr.stop(); }); stream = null; } an = null; if (ac) { ac.close(); ac = null; }
    input.placeholder = input.getAttribute('data-ph') || input.placeholder;
  }
  mic.addEventListener('click', function () {
    if (listening && rec) { rec.stop(); return; }
    rec = new SR(); rec.lang = 'en-IN'; rec.interimResults = true; rec.maxAlternatives = 1;
    var finalText = '';
    rec.onresult = function (e) {
      var txt = ''; for (var i = e.resultIndex; i < e.results.length; i++) { if (e.results[i].isFinal) finalText += e.results[i][0].transcript; else txt += e.results[i][0].transcript; }
      input.value = (finalText + txt).trim(); form.classList.toggle('has-text', !!input.value); pulse = .3;
    };
    rec.onerror = function (e) { stopListening(); if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { input.placeholder = 'Microphone is blocked — type your question instead'; } };
    rec.onend = function () { var q = input.value.trim(); stopListening(); if (q) { if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true })); } };
    input.setAttribute('data-ph', input.getAttribute('data-ph') || input.placeholder); input.value = ''; input.placeholder = 'Listening… ask your question';
    listening = true; mic.classList.add('on'); mic.setAttribute('aria-pressed', 'true'); form.classList.add('listening'); pulse = .5; start();
    try { rec.start(); } catch (err) { stopListening(); return; }
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (window.AudioContext || window.webkitAudioContext)) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
        if (!listening) { s.getTracks().forEach(function (tr) { tr.stop(); }); return; }
        stream = s; ac = new (window.AudioContext || window.webkitAudioContext)(); an = ac.createAnalyser(); an.fftSize = 512;
        buf = new Uint8Array(an.fftSize); ac.createMediaStreamSource(s).connect(an); meter();
      }).catch(function () {});
    }
  });
})();
