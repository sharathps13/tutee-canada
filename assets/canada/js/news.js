/* "Canada today" — live headline wire. Data: GET /api/news (netlify/functions/news.mjs),
 * which merges IRCC (canada.ca) and CBC News · Canada feeds. Loads only when the section
 * is near the screen, refreshes every 15 minutes while the tab is visible, and falls back
 * to links to the sources when the feed can't be reached (e.g. a local preview). */
(function () {
  'use strict';
  var root = document.querySelector('[data-news]'); if (!root) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s) { return root.querySelector(s); };
  var lead = $('[data-nw-lead]'), wire = $('[data-nw-wire]'), crawl = $('[data-nw-crawl]'), upd = $('[data-nw-upd]'), clock = $('[data-nw-clock]');
  var isSnap = false, all = [], view = [], filter = 'ircc', cur = 0, rot = 0, updated = null, loaded = false, visible = false;
  var LABEL = { ircc: 'Immigration', canada: 'Canada' };
  /* Built-in snapshot of real Government of Canada releases (canada.ca news API, 2 Nov 2026).
   * Shown instantly so the wire and crawl always run; the live feed replaces it when reachable. */
  var SNAPSHOT = {"updated": "2026-11-02T09:00:00-05:00", "snapshot": true, "items": [{"title": "Government of Canada to promote trade and investment with Sweden and northern Europe", "date": "2026-11-01T10:00:00-05:00", "link": "https://www.canada.ca/en/innovation-science-economic-development/news/2026/10/government-of-canada-to-promote-trade-and-investment-with-sweden-and-northern-europe.html", "source": "Innovation, Science and Economic Development Canada", "kind": "canada"}, {"title": "Roberts Bank Terminal 2 listed as a project of national interest to strengthen Canada's trade sovereignty", "date": "2026-10-30T15:49:47-04:00", "link": "https://www.canada.ca/en/transport-canada/news/2026/10/roberts-bank-terminal-2-listed-as-a-project-of-national-interest-to-strengthen-canadas-trade-sovereignty.html", "source": "Transport Canada", "kind": "canada"}, {"title": "Minister McGuinty strengthens Canada-EU defence and industrial cooperation at Summit", "date": "2026-10-30T15:07:12-04:00", "link": "https://www.canada.ca/en/department-national-defence/news/2026/10/minister-mcguinty-strengthens-canada-eu-defence-and-industrial-cooperation-at-summit.html", "source": "National Defence", "kind": "canada"}, {"title": "Operation BOXTOP Marks Successful Resupply Mission to Canadian Forces Station Alert", "date": "2026-10-30T14:46:10-04:00", "link": "https://www.canada.ca/en/department-national-defence/news/2026/10/operation-boxtop-marks-successful-resupply-mission-to-canadian-forces-station-alert.html", "source": "National Defence", "kind": "canada"}, {"title": "Canada launches new task force to make trade faster, simpler and more efficient", "date": "2026-10-30T14:30:22-04:00", "link": "https://www.canada.ca/en/transport-canada/news/2026/10/canada-launches-new-task-force-to-make-trade-faster-simpler-and-more-efficient.html", "source": "Transport Canada", "kind": "canada"}, {"title": "CBSA and Frontex sign new arrangement on border security", "date": "2026-10-30T14:30:21-04:00", "link": "https://www.canada.ca/en/border-services-agency/news/2026/10/cbsa-and-frontex-sign-new-arrangement-on-border-security.html", "source": "Canada Border Services Agency", "kind": "canada"}, {"title": "Canada invests in one of the nation's largest community and recreation centres", "date": "2026-10-30T14:30:00-04:00", "link": "https://www.canada.ca/en/housing-infrastructure-communities/news/2026/10/canada-invests-in-one-of-the-nations-largest-community-and-recreation-centres.html", "source": "Housing, Infrastructure and Communities Canada", "kind": "canada"}, {"title": "Government of Canada invests an additional $130 million to improve housing conditions and affordability in Inuit communities", "date": "2026-10-30T13:28:49-04:00", "link": "https://www.canada.ca/en/crown-indigenous-relations-northern-affairs/news/2026/10/government-of-canada-invests-an-additional-130-million-to-improve-housing-conditions-and-affordability-in-inuit-communities.html", "source": "Crown-Indigenous Relations and Northern Affairs Canada", "kind": "canada"}, {"title": "Canada and New Brunswick invest in a new wastewater treatment facility in Rothesay", "date": "2026-10-30T13:06:09-04:00", "link": "https://www.canada.ca/en/housing-infrastructure-communities/news/2026/10/canada-and-new-brunswick-invest-in-a-new-wastewater-treatment-facility-in-rothesay.html", "source": "Housing, Infrastructure and Communities Canada", "kind": "canada"}, {"title": "Government of Canada invests $4.5 million to support the growth and evolution of NORCAT's underground innovation centre", "date": "2026-10-30T12:18:23-04:00", "link": "https://www.canada.ca/en/fednor/news/2026/10/government-of-canada-invests-45-million-to-support-the-growth-and-evolution-of-norcats-underground-innovation-centre.html", "source": "FedNor", "kind": "canada"}, {"title": "New penalties for fraudulent and unauthorized immigration and citizenship representatives", "date": "2026-10-28T16:17:00-04:00", "link": "https://www.canada.ca/en/immigration-refugees-citizenship/news/2026/10/new-penalties-for-fraudulent-and-unauthorized-immigration-and-citizenship-representatives.html", "source": "IRCC · canada.ca", "kind": "ircc"}, {"title": "Canada refocusing Express Entry on top talent that drives economic growth", "date": "2026-10-16T11:02:27-04:00", "link": "https://www.canada.ca/en/immigration-refugees-citizenship/news/2026/10/canada-refocusing-express-entry-on-top-talent-that-drives-economic-growth.html", "source": "IRCC · canada.ca", "kind": "ircc"}, {"title": "Canada is supporting new projects to promote Francophone immigration and strengthen Francophone minority communities", "date": "2026-09-29T08:33:00-04:00", "link": "https://www.canada.ca/en/immigration-refugees-citizenship/news/2026/09/canada-is-supporting-new-projects-to-promote-francophone-immigration-and-strengthen-francophone-minority-communities.html", "source": "IRCC · canada.ca", "kind": "ircc"}, {"title": "Canada expands online passport renewal to all eligible adults", "date": "2026-07-28T13:18:00-04:00", "link": "https://www.canada.ca/en/immigration-refugees-citizenship/news/2026/07/canada-expands-online-passport-renewal-to-all-eligible-adults.html", "source": "IRCC · canada.ca", "kind": "ircc"}]};

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ago(iso) {
    if (!iso) return '';
    var m = Math.round((Date.now() - Date.parse(iso)) / 60000);
    if (m < 1) return 'just now'; if (m < 60) return m + ' min ago';
    var h = Math.round(m / 60); if (h < 24) return h + ' h ago';
    var d = Math.round(h / 24); if (d === 1) return 'yesterday'; if (d < 7) return d + ' days ago';
    return new Date(iso).toLocaleDateString('en-CA', { day: 'numeric', month: 'short' });
  }
  function hhmm(iso) { if (iso && Date.now() - Date.parse(iso) > 864e5) return new Date(iso).toLocaleDateString('en-CA', { day: 'numeric', month: 'short' }); return iso ? new Date(iso).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Toronto' }) : '—'; }

  /* Ottawa clock */
  function tick() { var lc = root.querySelector('[data-lt-clock]'); if (lc) lc.textContent = 'Ottawa ' + new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Toronto' }) + ' ET'; clock.textContent = new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Toronto' }); }
  tick(); setInterval(tick, 30000);

  function showLead(i, instant) {
    if (!view.length) return; cur = (i + view.length) % view.length; var n = view[cur], top = Math.min(5, view.length);
    lead.innerHTML = '<div class="nw-lead-in' + (instant || reduce ? '' : ' swap') + '">' +
      '<div class="nw-lead-top"><span class="nw-chip k-' + n.kind + '">' + esc(LABEL[n.kind] || 'News') + '</span><span class="nw-src-n">' + esc(n.source) + '</span><span class="nw-time">' + esc(ago(n.date)) + '</span></div>' +
      '<h3><a href="' + esc(n.link) + '" target="_blank" rel="noopener">' + esc(n.title) + '</a></h3>' +
      '<a class="nw-read" href="' + esc(n.link) + '" target="_blank" rel="noopener">Read the story <span aria-hidden="true">↗</span></a>' +
      '<div class="nw-dots" role="tablist" aria-label="Top stories">' + Array.apply(null, Array(top)).map(function (_, k) { return '<button type="button" role="tab" aria-label="Story ' + (k + 1) + '" aria-selected="' + (k === cur) + '" data-go="' + k + '"><i></i></button>'; }).join('') + '</div></div>';
    $$(wire, 'li').forEach(function (li, k) { li.classList.toggle('on', k === cur); });
    if (view.length > 1 && ltIdx % view.length === cur) ltNext(); // never repeat the lead card's story in the banner
  }
  function $$(el, s) { return Array.prototype.slice.call(el.querySelectorAll(s)); }
  function auto() { clearInterval(rot); if (reduce || !visible || view.length < 2) return; rot = setInterval(function () { showLead(cur + 1 >= Math.min(5, view.length) ? 0 : cur + 1); }, 7000); }

  /* Banner headline: its own rotation through the stories the lead card is NOT showing
   * (6th story onwards when there are enough, otherwise the next one after the lead). */
  var ltIdx = -1, ltRot = 0;
  function ltNext() {
    var lh = root.querySelector('[data-lt-head]'); if (!lh || !view.length) return;
    var top = Math.min(5, view.length), n = view.length, k = ltIdx;
    for (var tries = 0; tries < n; tries++) { k = (k + 1) % n; if (k !== cur && (n <= top || k >= top)) break; }
    if (k === cur && n > 1) k = (cur + 1) % n;
    ltIdx = k; lh.textContent = view[k].title; lh.classList.remove('in'); void lh.offsetWidth; lh.classList.add('in');
  }
  function render() {
    view = all.filter(function (n) { return !filter || n.kind === filter; });
    if (!view.length && filter === 'ircc' && all.length) view = all; // nothing from IRCC right now: show the wider wire instead of an empty panel
    if (!view.length) { lead.innerHTML = '<div class="nw-empty">No headlines in this filter right now.</div>'; wire.innerHTML = ''; return; }
    wire.innerHTML = view.slice(0, 9).map(function (n, k) {
      return '<li style="--i:' + k + '"><a href="' + esc(n.link) + '" target="_blank" rel="noopener"><time>' + hhmm(n.date) + '</time><span class="nw-w-b"><b>' + esc(n.title) + '</b><small><i class="k-' + n.kind + '"></i>' + esc(n.source) + ' · ' + esc(ago(n.date)) + '</small></span></a></li>';
    }).join('');
    var row = view.slice(0, 14).map(function (n) { return '<span><i class="k-' + n.kind + '"></i>' + esc(n.title) + '</span>'; }).join('');
    crawl.innerHTML = row + row; // doubled for a seamless loop
    crawl.style.setProperty('--dur', Math.max(40, view.slice(0, 14).length * 7) + 's');
    ltIdx = -1; showLead(0, true); ltNext(); clearInterval(ltRot); if (!reduce) ltRot = setInterval(ltNext, 5500); auto(); stamp();
  }
  function stamp() { if (updated) upd.textContent = isSnap ? 'Latest Government of Canada releases · ' + new Date(updated).toLocaleDateString('en-CA', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Updated ' + ago(updated) + ' · refreshes every 15 min'; }
  setInterval(stamp, 60000);

  function liveTag(t) { var l = root.querySelector('.nw-live'), c = root.querySelector('.nw-crawl-tag'); if (l) l.lastChild.textContent = t; var lv = root.querySelector('[data-lt-live]'); if (lv) lv.textContent = t; if (c) c.textContent = t === 'Live' ? 'Breaking' : 'Latest'; }
  function useSnapshot() { all = SNAPSHOT.items; updated = SNAPSHOT.updated; isSnap = true; root.classList.add('is-live', 'is-snap'); liveTag('Latest'); render(); }
  function load() {
    var ctl = window.AbortController ? new AbortController() : null, t = setTimeout(function () { if (ctl) ctl.abort(); }, 9000);
    fetch('/api/news', { signal: ctl ? ctl.signal : undefined, headers: { accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { clearTimeout(t); if (!d || !d.items || !d.items.length) throw new Error('empty'); all = d.items; updated = d.updated; isSnap = false; root.classList.remove('is-snap'); liveTag('Live'); root.classList.remove('is-off-wire'); root.classList.add('is-live'); render(); })
      .catch(function () { clearTimeout(t); if (!isSnap && !all.length) useSnapshot(); });
  }

  lead.addEventListener('click', function (e) { var g = e.target.closest('[data-go]'); if (g) { showLead(+g.getAttribute('data-go')); auto(); } });
  lead.addEventListener('pointerenter', function () { clearInterval(rot); });
  lead.addEventListener('pointerleave', auto);
  $('[data-nw-filter]').addEventListener('click', function (e) {
    var b = e.target.closest('[data-k]'); if (!b) return; filter = b.getAttribute('data-k');
    $$(this, '[data-k]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); if (all.length) render();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible && !loaded) { loaded = true; useSnapshot(); load(); } auto(); }, { rootMargin: '700px 0px' }).observe(root);
  } else { loaded = true; visible = true; useSnapshot(); load(); }
  setInterval(function () { if (loaded && !document.hidden) load(); }, 15 * 60 * 1000);
})();
