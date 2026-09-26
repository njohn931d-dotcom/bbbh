/*!
 * Affiliate Income Lab — site behaviour
 * Vanilla JS, no dependencies, deferred. ~7 KB unminified.
 * Everything degrades gracefully with JS disabled.
 */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------- 1. Mobile nav ---------------- */
  function initNav() {
    var toggle = $('.nav-toggle');
    var nav = $('#primary-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      var open = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', String(!open));
      toggle.setAttribute('aria-expanded', String(!open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && window.innerWidth <= 860) {
        nav.setAttribute('data-open', 'false');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------------- 2. Reading progress bar ---------------- */
  function initProgress() {
    var bar = $('.progress');
    if (!bar) return;
    var ticking = false;
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop || document.body.scrollTop) / max * 100 : 0;
      bar.style.width = Math.max(0, Math.min(100, pct)).toFixed(1) + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------------- 3. Table-of-contents scrollspy ---------------- */
  function initScrollSpy() {
    var links = $$('.toc a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    var targets = [];
    links.forEach(function (a) {
      var el = document.getElementById(a.getAttribute('href').slice(1));
      if (el) { map[el.id] = a; targets.push(el); }
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) { a.style.fontWeight = ''; a.setAttribute('aria-current', 'false'); });
          var active = map[en.target.id];
          if (active) { active.style.fontWeight = '800'; active.setAttribute('aria-current', 'true'); }
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------------- 4. FAQ deep-links (open the target FAQ) ---------------- */
  function initFaqHash() {
    function openFromHash() {
      if (!location.hash) return;
      var el = document.getElementById(location.hash.slice(1));
      if (el && el.tagName === 'DETAILS') { el.open = true; el.scrollIntoView({ block: 'center' }); }
    }
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    $$('.faq summary').forEach(function (s) {
      s.addEventListener('click', function () {
        var d = s.parentElement;
        if (!d.open) return; // it is about to open
        if (history.replaceState) history.replaceState(null, '', d.id ? '#' + d.id : location.pathname);
      });
    });
  }

  /* ---------------- 5. Affiliate income calculator ---------------- */
  function initCalculator() {
    var root = $('#calc');
    if (!root) return;

    var fmtUSD = function (n) {
      return '$' + Math.round(n).toLocaleString('en-US');
    };
    var fmtNum = function (n) {
      return Math.round(n).toLocaleString('en-US');
    };

    var fields = {};
    $$('[data-calc]', root).forEach(function (input) { fields[input.getAttribute('data-calc')] = input; });
    var outputs = $$('[data-out]', root).reduce(function (acc, el) {
      acc[el.getAttribute('data-out')] = el; return acc;
    }, {});

    function read(name, fallback) {
      var el = fields[name];
      if (!el) return fallback;
      var v = parseFloat(el.value);
      return isNaN(v) ? fallback : v;
    }

    function render() {
      var visitors = read('visitors', 10000);
      var ctr = read('ctr', 3) / 100;
      var cvr = read('cvr', 2.5) / 100;
      var commission = read('commission', 45);
      var recurringShare = read('recurring', 0) / 100;
      var growth = read('growth', 8) / 100;
      var epc = read('epc', 0);

      var clicks = visitors * ctr;
      var sales = clicks * cvr;
      var monthly = sales * commission + clicks * epc;

      // Recurring layer: commissions stack every month from month 2 onward.
      // Average paying cohort over a 12-month window with steady growth ~ 6.5 stacked months.
      var recurringMRR = recurringShare > 0 ? sales * commission * recurringShare * 6.5 : 0;

      // Compound traffic growth over 12 months.
      var m12Visitors = visitors * Math.pow(1 + growth, 11);
      var m12Sales = m12Visitors * ctr * cvr;
      var m12 = m12Sales * commission + m12Visitors * ctr * epc + recurringMRR;

      var set = function (key, value) { if (outputs[key]) outputs[key].textContent = value; };
      set('monthly', fmtUSD(monthly));
      set('annual', fmtUSD(monthly * 12) + '/yr');
      set('clicks', fmtNum(clicks));
      set('sales', fmtNum(sales));
      set('per1k', '$' + (monthly / (visitors / 1000)).toFixed(2));
      set('m12', fmtUSD(m12) + '/mo');
      set('m12visitors', fmtNum(m12Visitors));
      set('recurring', recurringMRR > 0 ? '+' + fmtUSD(recurringMRR) : '—');
      set('m12annual', fmtUSD(m12 * 12) + ' per year');
    }

    Object.keys(fields).forEach(function (name) {
      var el = fields[name];
      var out = root.querySelector('[data-mirror="' + name + '"]');
      var sync = function () {
        if (out) {
          var isPct = out.hasAttribute('data-pct');
          var isUsd = out.hasAttribute('data-usd');
          out.textContent = isUsd ? '$' + fmtNum(el.value) : (isPct ? el.value + '%' : fmtNum(el.value));
        }
        render();
      };
      el.addEventListener('input', sync);
      el.addEventListener('change', sync);
      sync();
    });
  }

  /* ---------------- 6. Table of contents smooth offset for reduced motion ---------------- */
  function initSmoothAnchors() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var el = document.getElementById(id.slice(1));
      if (!el) return;
      e.preventDefault();
      var top = el.getBoundingClientRect().top + window.pageYOffset - 84;
      window.scrollTo({ top: top, behavior: 'smooth' });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  }

  /* ---------------- 7. Newsletter form (progressive enhancement) ---------------- */
  function initForms() {
    $$('form[data-enhance]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        // No backend in this repo: hand off to the configured provider endpoint,
        // otherwise confirm locally so the UX is honest and the page stays static.
        var action = form.getAttribute('action');
        if (!action || action === '#' || action === '') {
          e.preventDefault();
          var note = form.querySelector('[data-form-status]');
          if (note) {
            note.textContent = 'Thanks — connect this form to your email provider to start collecting leads.';
            note.removeAttribute('hidden');
          }
          form.reset();
        }
      });
    });
  }

  function boot() {
    initNav();
    initProgress();
    initScrollSpy();
    initFaqHash();
    initCalculator();
    initSmoothAnchors();
    initForms();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
