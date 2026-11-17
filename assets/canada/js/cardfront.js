/* Card front (royal.css v130): a serial number per visitor and the holder's name, live */
(function () {
  var f = document.querySelector('.jc-front.cx'); if (!f) return;
  var s = f.querySelector('[data-cx-serial]'), nm = f.querySelector('[data-cx-name]'), inp = document.getElementById('l-name');
  if (s) s.textContent = 'TC 26 ' + String(Math.floor(100000 + Math.random() * 900000)) + ' CA';
  function upd() { var v = (inp && inp.value || '').trim(); nm.textContent = v ? v.toUpperCase() : 'Your name here'; f.classList.toggle('named', !!v); }
  if (inp && nm) { inp.addEventListener('input', upd); upd(); }
})();
