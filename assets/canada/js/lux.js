/* Luxury pass (royal.css v117): photo bands, city postcards, the "Find my Canada path" quiz,
 * the callback band and the phone action bar. No invented facts: the quiz result is read from
 * the page's own programme-discovery data. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- city postcards ---------- */
  var cpc = $('[data-cpc]');
  if (cpc) cpc.addEventListener('click', function (e) {
    var b = e.target.closest('[data-c]'); if (!b) return;
    var chip = $('[data-city-chips] .chip[data-id="' + b.getAttribute('data-c') + '"]'); if (chip) chip.click();
    var d = $('[data-dossier]'); if (d) d.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  });

  /* ---------- quiz ---------- */
  var qz = $('[data-qz]');
  if (qz) (function () {
    var body = $('[data-qz-body]', qz), bar = $$('.qz-bar i', qz), back = $('[data-qz-back]', qz), lastFocus = null;
    var STEPS = [
      { key: 'level', q: 'What do you want to <em>study next?</em>', hint: 'Pick the level you are aiming for.' },
      { key: 'area', q: 'Which <em>field</em> interests you?', hint: 'Choose the closest match — a counsellor refines it with you.' },
      { key: 'region', q: 'Where in <em>Canada?</em>', hint: 'No preference is fine.' },
      { key: 'intake', q: 'When would you like to <em>start?</em>', hint: 'September is the main intake; January and May are offered by some programmes.' }
    ];
    var INTAKES = ['September', 'January', 'May', 'Not sure yet'];
    var pick = {}, step = 0;
    function opts(key) {
      if (key === 'intake') return INTAKES.map(function (t) { return { v: t, l: t, s: '' }; });
      return $$('[data-b="' + key + '"] button[data-v]').map(function (b) { var sp = $('span', b), sm = $('small', b); return { v: b.getAttribute('data-v'), l: (sp ? sp.textContent : b.textContent).trim(), s: sm ? sm.textContent.trim() : '' }; });
    }
    function show() {
      bar.forEach(function (i, k) { i.classList.toggle('on', k < step + (step >= STEPS.length ? 0 : 0) || k < step); });
      back.hidden = step === 0;
      if (step >= STEPS.length) return result();
      var s = STEPS[step], o = opts(s.key);
      if (!o.length) { close(); var p = document.getElementById('programmes'); if (p) p.scrollIntoView(); return; }
      body.innerHTML = '<h3 class="qz-q" id="qz-q">' + s.q + '</h3><p class="qz-hint">' + s.hint + '</p><div class="qz-opts">' +
        o.map(function (x, k) { return '<button type="button" data-v="' + esc(x.v) + '" data-l="' + esc(x.l) + '" style="--i:' + k + '"><span>' + esc(x.l) + '</span>' + (x.s ? '<small>' + esc(x.s) + '</small>' : '') + '</button>'; }).join('') + '</div>';
      var f = $('.qz-opts button', body); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 60);
    }
    function result() {
      bar.forEach(function (i) { i.classList.add('on'); });
      ['level', 'area', 'region'].forEach(function (k) { var b = $('[data-b="' + k + '"] button[data-v="' + pick[k].v + '"]'); if (b) b.click(); });
      var r = $('[data-result]'), big = $('.big', r), cnt = $('[data-tk-count]', r), cs = $('.tk-num small', r), dur = $('.tk-dur b', r), st = $('.tk-stamp span', r);
      var unis = $$('.tk li', r).slice(0, 3).map(function (li) { var s = $$('span', li); return '<li><span>' + esc(s[0].textContent) + '</span><span>' + esc(s[1] ? s[1].textContent : '') + '</span></li>'; }).join('');
      var n = cnt ? +cnt.getAttribute('data-tk-count') : 0;
      body.innerHTML = '<div class="qz-res"><h3 id="qz-q">' + (big ? big.innerHTML : 'Your Canada path') + '</h3>' +
        '<div class="qz-tags"><span>' + esc(pick.level.l) + '</span><span>' + esc(pick.area.l) + '</span><span>' + esc(pick.region.l) + '</span><span>' + esc(pick.intake.l === 'Not sure yet' ? 'Intake open' : pick.intake.l + ' intake') + '</span></div>' +
        '<div class="qz-stats"><div><b data-qz-n>' + (reduce ? n.toLocaleString('en-CA') : '0') + '</b><small>' + esc(cs ? cs.textContent : 'matching institutions') + '</small></div><div><b>' + esc(dur ? dur.textContent : '—') + '</b><small>Typical length</small></div></div>' +
        (unis ? '<p class="qz-list-h">Universities known for this area</p><ul class="qz-list">' + unis + '</ul>' : '') +
        (st ? '<p class="qz-note"><b>PGWP check · </b>' + esc(st.textContent) + '</p>' : '') +
        '<div class="qz-act"><button type="button" class="btn" data-qz-send>Send this to a counsellor <span class="ar">→</span></button><button type="button" class="qz-link" data-qz-full>See the full pathway</button><button type="button" class="qz-link" data-qz-again>Start again</button></div>' +
        '<p class="qz-fine">General guidance from IRCC’s designated learning institutions list. Requirements, fees and eligibility are set by each institution and by the Government of Canada.</p></div>';
      var el = $('[data-qz-n]', body);
      if (el && !reduce) { var t0 = 0; requestAnimationFrame(function tick(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 900), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(n * e).toLocaleString('en-CA'); if (p < 1) requestAnimationFrame(tick); }); }
      var s = $('[data-qz-send]', body); if (s) setTimeout(function () { s.focus({ preventScroll: true }); }, 60);
    }
    function open() { lastFocus = document.activeElement; pick = {}; step = 0; qz.classList.add('open'); qz.setAttribute('aria-hidden', 'false'); document.documentElement.style.overflow = 'hidden'; show(); }
    function close() { qz.classList.remove('open'); qz.setAttribute('aria-hidden', 'true'); document.documentElement.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }
    document.addEventListener('click', function (e) { if (e.target.closest('[data-qz-open]')) { e.preventDefault(); open(); } });
    qz.addEventListener('click', function (e) {
      if (e.target === qz || e.target.closest('[data-qz-close]')) return close();
      if (e.target.closest('[data-qz-back]')) { step = Math.max(0, step - 1); return show(); }
      if (e.target.closest('[data-qz-again]')) { pick = {}; step = 0; return show(); }
      if (e.target.closest('[data-qz-full]')) { close(); var p = document.getElementById('programmes'); if (p) p.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); return; }
      if (e.target.closest('[data-qz-send]')) {
        close(); var go = $('[data-b-go]'); if (go) go.click();
        if (pick.intake && pick.intake.l !== 'Not sure yet') {
          var inp = $('[data-dest-input]'), v = inp ? (inp.value + ' · Intake: ' + pick.intake.l).slice(0, 520) : '';
          if (v) { $$('[data-dest-input]').forEach(function (i) { i.value = v; }); $$('[data-dest-label]').forEach(function (l) { l.textContent = v; }); }
        }
        return;
      }
      var o = e.target.closest('.qz-opts button'); if (!o) return;
      pick[STEPS[step].key] = { v: o.getAttribute('data-v'), l: o.getAttribute('data-l') }; step++; show();
    });
    document.addEventListener('keydown', function (e) {
      if (!qz.classList.contains('open')) return;
      if (e.key === 'Escape') return close();
      if (e.key === 'Tab') { var f = $$('button', qz).filter(function (b) { return !b.hidden && b.offsetParent !== null; }); if (!f.length) return; var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    });
  })();

  /* ---------- callback band ---------- */
  var cb = $('[data-cb]');
  if (cb) (function () {
    var nm = $('[name=name]', cb), em = $('[name=email]', cb), ph = $('[name=phone_number]', cb), cc = $('[name=country_code]', cb), msg = $('[data-cb-msg]', cb), btn = $('button[type=submit]', cb), label = btn.innerHTML;
    var src = $('[data-lead-form] [name=country_code]'); function ccSet() { if (!cc) return; cc.value = (src && src.value) || '+91'; cc.dispatchEvent(new Event('change', { bubbles: true })); }
    if (src && cc) { cc.innerHTML = src.innerHTML; setTimeout(ccSet, 0); }
    function say(kind, t) { msg.className = 'cb-msg ' + kind; msg.textContent = t || ''; }
    [nm, em, ph].forEach(function (f) { f.addEventListener('input', function () { f.classList.remove('bad'); }); });
    cb.addEventListener('submit', function (e) {
      e.preventDefault(); say('', '');
      var bad = null, digits = ph.value.replace(/\D/g, '');
      if (nm.value.trim().length < 2) bad = bad || nm, nm.classList.add('bad');
      if (digits.length < 7 || digits.length > 15) bad = bad || ph, ph.classList.add('bad');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.value.trim())) bad = bad || em, em.classList.add('bad');
      if (bad) { say('err', bad === nm ? 'Please enter your full name.' : bad === ph ? 'Please enter a valid mobile number.' : 'Please enter a valid email address.'); bad.focus(); return; }
      var dest = $('[data-dest-input]'), data = { name: nm.value.trim(), email: em.value.trim(), phone: (cc ? cc.value : '') + ' ' + ph.value.trim(), destination: 'Callback request — ' + (dest ? dest.value : 'Canada — General enquiry'), from_name: 'Tutee Connect Canada website', botcheck: $('[name=botcheck]', cb).value };
      try { data.page = location.host + location.pathname; } catch (x) { data.page = ''; }
      btn.disabled = true; btn.textContent = 'Sending…';
      fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return { success: false }; }); })
        .then(function (res) { if (res && res.success) { say('ok', 'Thank you — a counsellor will call you soon.'); cb.reset(); ccSet(); } else say('err', (res && res.message) || 'Something went wrong. Please try again, or WhatsApp us on +91 735-836-4959.'); })
        .catch(function () { say('err', 'Network error. Please check your connection, or WhatsApp us on +91 735-836-4959.'); })
        .then(function () { btn.disabled = false; btn.innerHTML = label; });
    });
  })();

  /* ---------- phone action bar ---------- */
  var mb = $('[data-mbar]');
  if (mb) (function () {
    var contact = document.getElementById('contact'), q = 0;
    function upd() {
      q = 0; var r = contact ? contact.getBoundingClientRect() : null;
      var on = scrollY > innerHeight * .7 && !(r && r.top < innerHeight * .75 && r.bottom > 80) && !document.querySelector('.drawer.open');
      mb.classList.toggle('show', on); document.body.classList.toggle('has-mbar', on && innerWidth <= 760);
    }
    addEventListener('scroll', function () { if (!q) q = requestAnimationFrame(upd); }, { passive: true }); addEventListener('resize', upd); upd();
  })();
})();
