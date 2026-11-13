/* Performance (royal.css v129): pause every looping CSS animation inside a section while that
 * section is off screen, so the page only animates what the visitor can see. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('anim-off', !e.isIntersecting); });
  }, { rootMargin: '150px 0px' });
  function watch() {
    document.querySelectorAll('main > section, main > div:not(.loader), body > footer, .proof, .cb, .mq').forEach(function (s) {
      if (!s.__aw) { s.__aw = 1; io.observe(s); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})();
