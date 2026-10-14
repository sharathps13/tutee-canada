/* Modern dropdowns: every <select> on the page gets a custom trigger + floating
 * list. The native <select> stays in the DOM (hidden) and remains the source of
 * truth, so forms, filters and existing scripts keep working unchanged. */
(function () {
  'use strict';
  var openSel = null, panel = null, active = -1, typed = '', typeT = 0;

  function label(sel) { var o = sel.options[sel.selectedIndex]; return o ? o.text : ''; }

  function enhance(sel) {
    if (sel.dataset.ux) return; sel.dataset.ux = '1';
    var wrap = document.createElement('div'); wrap.className = 'ux-sel';
    if (sel.getAttribute('style')) wrap.setAttribute('style', sel.getAttribute('style'));
    sel.parentNode.insertBefore(wrap, sel); wrap.appendChild(sel);
    sel.classList.add('ux-native'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'ux-btn';
    btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    var lab = sel.id && document.querySelector('label[for="' + sel.id + '"]');
    btn.setAttribute('aria-label', (lab ? lab.textContent : sel.getAttribute('aria-label') || 'Choose') + ': ' + label(sel));
    if (lab) lab.addEventListener('click', function (e) { e.preventDefault(); btn.focus(); });
    btn.innerHTML = '<span class="ux-val"></span><svg class="ux-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    wrap.appendChild(btn);
    function sync() { btn.querySelector('.ux-val').textContent = label(sel); wrap.classList.toggle('ux-empty', !sel.value); }
    sync(); sel._uxSync = sync; sel._uxBtn = btn;
    sel.addEventListener('change', sync);
    new MutationObserver(sync).observe(sel, { childList: true, subtree: true });
    if (sel.form) sel.form.addEventListener('reset', function () { setTimeout(sync, 0); });
    btn.addEventListener('click', function () { openSel === sel ? close() : open(sel); });
    btn.addEventListener('keydown', function (e) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].indexOf(e.key) >= 0 && openSel !== sel) { e.preventDefault(); open(sel); }
    });
  }

  function place() {
    if (!openSel) return;
    var r = openSel._uxBtn.getBoundingClientRect(), h = Math.min(320, panel.scrollHeight), below = innerHeight - r.bottom - 12;
    var up = below < Math.min(h, 200) && r.top > below;
    panel.style.left = Math.max(8, Math.min(r.left, innerWidth - Math.max(r.width, 200) - 8)) + 'px';
    panel.style.minWidth = r.width + 'px';
    panel.style.top = up ? '' : (r.bottom + 8) + 'px';
    panel.style.bottom = up ? (innerHeight - r.top + 8) + 'px' : '';
    panel.classList.toggle('up', up);
  }

  function open(sel) {
    close(); openSel = sel;
    panel = document.createElement('div'); panel.className = 'ux-panel'; panel.setAttribute('role', 'listbox');
    var opts = Array.prototype.slice.call(sel.options);
    panel.innerHTML = opts.map(function (o, i) {
      return '<div class="ux-opt' + (o.selected ? ' sel' : '') + (o.disabled ? ' dis' : '') + '" role="option" data-i="' + i + '" aria-selected="' + o.selected + '" style="--d:' + Math.min(i, 12) * 18 + 'ms"><span></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
    }).join('');
    panel.querySelectorAll('.ux-opt span').forEach(function (s, i) { s.textContent = opts[i].text; });
    document.body.appendChild(panel);
    sel._uxBtn.setAttribute('aria-expanded', 'true'); sel.parentNode.classList.add('open');
    place();
    active = sel.selectedIndex; mark(true);
    requestAnimationFrame(function () { panel && panel.classList.add('in'); });
    panel.addEventListener('mousedown', function (e) { e.preventDefault(); });
    panel.addEventListener('click', function (e) { var o = e.target.closest('.ux-opt'); if (o && !o.classList.contains('dis')) choose(+o.dataset.i); });
    panel.addEventListener('mousemove', function (e) { var o = e.target.closest('.ux-opt'); if (o) { active = +o.dataset.i; mark(false); } });
  }

  function mark(scroll) {
    if (!panel) return;
    panel.querySelectorAll('.ux-opt').forEach(function (o, i) { o.classList.toggle('act', i === active); });
    var a = panel.querySelector('.ux-opt.act'); if (a && scroll) a.scrollIntoView({ block: 'nearest' });
  }

  function choose(i) {
    var sel = openSel; if (!sel) return;
    if (sel.selectedIndex !== i) { sel.selectedIndex = i; sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); }
    sel._uxSync(); var b = sel._uxBtn; close(); b.focus();
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  }

  function close() {
    if (!openSel) return;
    openSel._uxBtn.setAttribute('aria-expanded', 'false'); openSel.parentNode.classList.remove('open');
    var p = panel; p.classList.remove('in'); p.classList.add('out'); setTimeout(function () { p.remove(); }, 180);
    openSel = null; panel = null;
  }

  document.addEventListener('keydown', function (e) {
    if (!openSel) return; var n = openSel.options.length;
    if (e.key === 'Escape') { e.preventDefault(); var b = openSel._uxBtn; close(); b.focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(n - 1, active + 1); mark(true); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); mark(true); }
    else if (e.key === 'Home') { e.preventDefault(); active = 0; mark(true); }
    else if (e.key === 'End') { e.preventDefault(); active = n - 1; mark(true); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (active >= 0) choose(active); }
    else if (e.key === 'Tab') close();
    else if (e.key.length === 1) {                      // type-ahead
      clearTimeout(typeT); typed += e.key.toLowerCase(); typeT = setTimeout(function () { typed = ''; }, 600);
      for (var i = 0; i < n; i++) if (openSel.options[i].text.toLowerCase().indexOf(typed) === 0) { active = i; mark(true); break; }
    }
  });
  document.addEventListener('mousedown', function (e) { if (openSel && !e.target.closest('.ux-panel') && !openSel.parentNode.contains(e.target)) close(); });
  window.addEventListener('resize', place);
  window.addEventListener('scroll', function (e) { if (panel && !panel.contains(e.target)) place(); }, true);

  function all() { document.querySelectorAll('select').forEach(enhance); }
  all();
  var q = 0; new MutationObserver(function (ms) {
    for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) { var n = ms[i].addedNodes[j];
      if (n.nodeType === 1 && (n.tagName === 'SELECT' || n.querySelector('select'))) { if (!q) q = requestAnimationFrame(function () { q = 0; all(); }); return; } }
  }).observe(document.body, { childList: true, subtree: true });
})();
