/* Footer sign-off words (royal.css v115): fill them in the first time the footer is seen */
(function () {
  var s = document.querySelector('[data-sky]'); if (!s) return;
  if (!('IntersectionObserver' in window)) { s.classList.add('in'); return; }
  new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { s.classList.add('in'); o.disconnect(); } }, { threshold: .3 }).observe(s);
})();
