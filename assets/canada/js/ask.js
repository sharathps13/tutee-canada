/* Ask Tutee — FAQ chat.
 * Answers come only from the vetted FAQ answers on this page (single source of truth).
 * Free-typed questions with no good match go to /api/ask (AI, grounded on the same
 * answers) when that function is configured; otherwise the visitor is pointed to a counsellor. */
(function () {
  'use strict';
  var root = document.querySelector('[data-ask]');
  var faq = document.querySelector('[data-faq]');
  if (!root || !faq) return;

  var log = root.querySelector('[data-ask-log]'), sug = root.querySelector('[data-ask-sug]');
  var form = root.querySelector('[data-ask-form]'), input = root.querySelector('[data-ask-input]');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var busy = false, asked = {}, offset = 0;

  /* Synonyms widen matching so "fees" finds tuition, "job" finds work rights, etc. */
  var SYN = {
    tuition: 'fee fees cost costs price expensive tuition',
    money: 'funds fund proof bank balance financial show money gic living expenses',
    work: 'work job jobs part time parttime hours earn employment',
    pgwp: 'pgwp post graduation graduate work permit after stay',
    pr: 'pr permanent residence resident immigrate express entry settle citizenship',
    permit: 'visa permit study permit ircc approval refused rejection',
    intake: 'intake intakes when start september january may deadline dates',
    scholar: 'scholarship scholarships loan loans funding bursary award',
    req: 'requirement requirements documents ielts toefl english french transcript sop eligibility need apply',
    college: 'college university diploma degree difference better choose',
    pal: 'pal tal attestation letter provincial',
    gic: 'gic sds student direct stream',
    guarantee: 'guarantee guaranteed sure chance',
    family: 'family spouse wife husband partner children kids dependants',
    dli: 'dli designated recognised recognized accredited allowed list',
    arrive: 'arrive arrival land landing first weeks sin bank orientation',
    tutee: 'tutee consultation counselling counselor counsellor services help agency charge'
  };
  var STOP = 'a an the is are am i me my do does can to of in for on and or what how much many will be it you your with from about there any get canada canadian'.split(' ');

  function words(t) {
    return String(t).toLowerCase().replace(/[^a-z0-9/ ]+/g, ' ').split(/[\s/]+/).filter(function (w) { return w.length > 1 && STOP.indexOf(w) < 0; });
  }
  function expand(ws) {
    var out = ws.slice();
    ws.forEach(function (w) {
      Object.keys(SYN).forEach(function (k) { var list = SYN[k].split(' '); if (list.indexOf(w) >= 0) out = out.concat(list); });
    });
    return out;
  }

  /* Build the knowledge base from the FAQ markup. */
  var KB = Array.prototype.map.call(faq.querySelectorAll('.qa'), function (q, i) {
    var btn = q.querySelector('button'), ans = q.querySelector('.ans > div');
    var question = btn.textContent.trim(), badge = ans.querySelector('.badge');
    var body = ans.cloneNode(true); var b2 = body.querySelector('.badge'); if (b2) b2.remove();
    return {
      i: i, q: question, cat: q.getAttribute('data-cat'), html: body.innerHTML, text: body.textContent.trim(),
      badge: badge ? { cls: badge.className, label: badge.textContent } : null,
      qw: expand(words(question)), aw: words(body.textContent)
    };
  });


  /* Extra chat-only answers — every fact here is already stated elsewhere on this page. */
  var G = { cls: 'badge gen', label: 'General guidance' }, I = { cls: 'badge ind', label: 'Needs individual assessment' };
  var EXTRA = [
    ['Admissions', 'How do I know if an institution is allowed to accept international students?', '<p>A study permit is only valid at a designated learning institution (DLI). IRCC’s DLI list had 1,135 institutions in its 24 August 2026 snapshot. Always confirm both the institution and the programme on the official list before you apply — you can search all of them in our University explorer above.</p>', G],
    ['Admissions', 'How do I choose the right university and programme?', '<p>Start from entry requirements, total cost, location, co-op options and the programme’s PGWP eligibility. A Tutee Connect counsellor builds a shortlist with you — ambitious, target and safe options — with official links you can verify.</p>', I],
    ['Applications', 'When should I start preparing my application?', '<p>Work back from your intake: September is the main one, January is common and May is offered by some programmes. Scholarship deadlines are often months before admission deadlines, and study permit processing times vary by country — check IRCC’s processing-times tool. Our Intake planner above gives suggested lead times.</p>', G],
    ['Applications', 'What happens after I receive an offer letter?', '<p>Read its conditions, deadlines and deposits carefully. Then you usually request a PAL/TAL (or a CAQ for Québec), plan your finances and prepare the study permit application. Tutee Connect helps you review the offer at each step.</p>', G],
    ['Study permits', 'How does the study permit application work?', '<p>You apply online with IRCC, give biometrics and complete any medical exam requested. IRCC alone decides. If approved, a border services officer issues the actual study permit when you arrive at the port of entry.</p>', G],
    ['Study permits', 'Can my family come with me?', '<p>Family members need their own permits, and you must show funds for everyone who comes with you. Open work permits for spouses or common-law partners of students are limited to certain programme types, so it depends on your exact programme.</p>', I],
    ['Tuition & funding', 'Can part-time work pay for my tuition?', '<p>You shouldn’t count on it. Part-time income can’t be used to meet proof-of-funds requirements, and it shouldn’t be relied on to cover tuition. Plan your budget around savings, scholarships or an education loan.</p>', G],
    ['Tuition & funding', 'How do education loans work for Canada?', '<p>Lenders in your home country decide eligibility, rates and Canada coverage case by case. We help you prepare the documents they ask for and understand collateral, moratorium periods and disbursement — and how a sanction letter can support proof of funds.</p>', I],
    ['After graduation', 'What should I do in my first weeks in Canada?', '<p>Attend orientation, open a bank account, and apply for a Social Insurance Number (SIN) if you plan to work. Read the conditions printed on your study permit — they set what you can and can’t do.</p>', G],
    ['About Tutee Connect', 'What does Tutee Connect help with?', '<p>Everything from profile evaluation and course shortlisting to applications, financial planning, study permit preparation and pre-departure support — one counsellor from start to arrival. Institutions decide admission and IRCC decides permits; we help you prepare well.</p>', G],
    ['About Tutee Connect', 'Is the first consultation really free?', '<p>Yes — your first consultation is free, with no obligation. You can meet us at our offices in Chennai and Dubai, or online.</p>', G]
  ];
  EXTRA.forEach(function (x) {
    var tmp = document.createElement('div'); tmp.innerHTML = x[2];
    KB.push({ i: KB.length, q: x[1], cat: x[0], html: x[2], text: tmp.textContent, badge: x[3], qw: expand(words(x[1])), aw: words(tmp.textContent) });
  });

  function score(entry, ws) {
    var s = 0;
    ws.forEach(function (w) {
      if (entry.qw.indexOf(w) >= 0) s += 3;
      else if (entry.aw.indexOf(w) >= 0) s += 1;
    });
    return s;
  }
  function best(text) {
    var ws = expand(words(text)); if (!ws.length) return null;
    var ranked = KB.map(function (e) { return { e: e, s: score(e, ws) }; }).sort(function (a, b) { return b.s - a.s; });
    return ranked[0].s >= 3 ? ranked : null;
  }

  /* ----------------------------------------------------------- rendering */
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function scrollDown() { log.scrollTo({ top: log.scrollHeight, behavior: reduce ? 'auto' : 'smooth' }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function userMsg(text) {
    var m = el('div', 'am me'); m.appendChild(el('p', null, esc(text)));
    log.appendChild(m); scrollDown();
  }
  function typing() {
    var t = el('div', 'am bot typing', '<span></span><span></span><span></span>');
    t.setAttribute('aria-label', 'Tutee Connect is typing'); log.appendChild(t); scrollDown(); return t;
  }
  /* Reveal an answer word by word without breaking its links. */
  function stream(container, html, done) {
    container.innerHTML = html;
    if (reduce) { done(); return; }
    var nodes = [], walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) nodes.push(walker.currentNode);
    var spans = [];
    nodes.forEach(function (n) {
      var frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var s = el('span', 'w'); s.textContent = part; frag.appendChild(s); spans.push(s);
      });
      n.parentNode.replaceChild(frag, n);
    });
    var k = 0;
    (function tick() {
      for (var j = 0; j < 3 && k < spans.length; j++, k++) spans[k].classList.add('on');
      scrollDown();
      if (k < spans.length) setTimeout(tick, 28); else done();
    })();
  }

  function botMsg(opts) {
    var t = typing();
    setTimeout(function () {
      t.remove();
      var m = el('div', 'am bot'), body = el('div', 'body');
      m.appendChild(body); log.appendChild(m);
      stream(body, opts.html, function () {
        var meta = el('div', 'meta');
        if (opts.badge) meta.appendChild(el('span', opts.badge.cls, esc(opts.badge.label)));
        if (opts.ai) meta.appendChild(el('span', 'badge ai', 'AI summary'));
        if (meta.children.length) m.appendChild(meta);
        if (opts.related && opts.related.length) {
          var r = el('div', 'rel'); r.appendChild(el('small', null, 'Related'));
          opts.related.forEach(function (e) { r.appendChild(chip(e.q)); });
          m.appendChild(r);
        }
        if (opts.cta) m.appendChild(el('div', 'cta',
          '<a class="ask-cta" href="#contact">Book free counselling</a><a class="ask-cta ghost" href="https://wa.me/917010902329" target="_blank" rel="noopener">WhatsApp a counsellor</a>'));
        scrollDown(); busy = false; refreshSuggestions();
      });
    }, reduce ? 0 : 520 + Math.min(opts.html.length, 400));
  }

  function chip(text) {
    var b = el('button', 'ask-chip'); b.type = 'button'; b.textContent = text;
    b.addEventListener('click', function () { ask(text); });
    return b;
  }

  function refreshSuggestions() {
    sug.innerHTML = ''; sug.classList.remove('wait');
    var left = KB.filter(function (e) { return !asked[e.i]; });
    if (left.length) { var o = offset % left.length; left = left.slice(o).concat(left.slice(0, o)); }
    var seen = {}, pick = [];
    left.forEach(function (e) { if (!seen[e.cat] && pick.length < 6) { seen[e.cat] = 1; pick.push(e); } });
    pick.forEach(function (e, n) { var c = chip(e.q); c.style.setProperty('--d', n * 70 + 'ms'); sug.appendChild(c); });
    if (left.length > pick.length) {
      var more = el('button', 'ask-chip more', '\u21bb More questions'); more.type = 'button'; more.style.setProperty('--d', pick.length * 70 + 'ms');
      more.addEventListener('click', function () { offset += 6; refreshSuggestions(); });
      sug.appendChild(more);
    }
  }

  /* ---------------------------------------------------------- answering */
  function answerFromKB(ranked) {
    var top = ranked[0].e; asked[top.i] = 1;
    var related = ranked.slice(1).filter(function (r) { return r.s >= 3 && r.e.cat === top.cat || r.s >= 5; }).slice(0, 2).map(function (r) { return r.e; });
    if (!related.length) related = KB.filter(function (e) { return e.cat === top.cat && e !== top && !asked[e.i]; }).slice(0, 2);
    botMsg({ html: top.html, badge: top.badge, related: related, cta: top.badge && /ind/.test(top.badge.cls) });
  }

  function askAI(text) {
    var ctx = KB.map(function (e) { return 'Q: ' + e.q + '\nA: ' + e.text; }).join('\n\n');
    var ctl = new AbortController(); setTimeout(function () { ctl.abort(); }, 15000);
    return fetch('/api/ask', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl.signal,
      body: JSON.stringify({ question: text, context: ctx })
    }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { if (!d || !d.answer) throw new Error('empty'); return d.answer; });
  }

  function fallback() {
    botMsg({
      html: '<p>That one needs a person who can look at your situation — I only answer from checked, general guidance. A Tutee counsellor can help, free of charge.</p>',
      cta: true, related: KB.filter(function (e) { return !asked[e.i]; }).slice(0, 2)
    });
  }

  function ask(text) {
    text = String(text || '').trim().slice(0, 400);
    if (!text || busy) return;
    busy = true; sug.innerHTML = ''; input.value = '';
    userMsg(text);
    var exact = KB.filter(function (e) { return e.q === text; })[0];
    if (exact) { answerFromKB([{ e: exact, s: 99 }]); return; }
    var ranked = best(text);
    if (ranked && ranked[0].s >= 6) { answerFromKB(ranked); return; }
    var t = typing();
    askAI(text).then(function (a) {
      t.remove();
      var html = a.split(/\n{2,}/).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
      botMsg({ html: html, ai: true, cta: true });
    }).catch(function () {
      t.remove();
      if (ranked) answerFromKB(ranked); else fallback();
    });
  }

  function greet() {
    log.innerHTML = ''; asked = {}; busy = true;
    botMsg({ html: '<p>Hi! I’m <b>Ask Tutee</b>. Ask me about studying in Canada — costs, intakes, study permits, working while you study, or life after graduation. Pick a question below or type your own.</p>' });
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
  root.querySelector('[data-ask-reset]').addEventListener('click', greet);

  /* Lay the chips out (hidden) straight away so the panel never grows when the chat starts. */
  refreshSuggestions(); sug.classList.add('wait');

  /* Start the conversation when the chat first scrolls into view. */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { io.disconnect(); root.classList.add('live'); greet(); }
    }, { threshold: .25 });
    io.observe(root);
  } else { root.classList.add('live'); greet(); }

  /* Cursor-follow glow on the panel. */
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    root.addEventListener('pointermove', function (e) {
      var r = root.getBoundingClientRect();
      root.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      root.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }
})();
