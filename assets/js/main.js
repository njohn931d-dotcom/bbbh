/* ==========================================================================
   RevenueKit — progressive enhancement only.
   Every feature degrades gracefully: with JS disabled the page is still
   fully readable, navigable and indexable (FAQ uses native <details>).
   No dependencies. No external requests. ~4 KB uncompressed.
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme: follow OS by default, remember explicit choice ---------- */
  var KEY = "rk-theme";
  function applyTheme(t) {
    if (t === "light" || t === "dark") doc.documentElement.setAttribute("data-theme", t);
    else doc.documentElement.removeAttribute("data-theme");
  }
  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
  applyTheme(stored);

  function initThemeToggle() {
    var btn = doc.querySelector("[data-theme-toggle]");
    if (!btn) return;
    var sun = btn.querySelector("[data-icon-sun]");
    var moon = btn.querySelector("[data-icon-moon]");

    function paint() {
      var cs = getComputedStyle(doc.body);
      var isDark = (doc.documentElement.getAttribute("data-theme") === "dark") ||
        (!doc.documentElement.getAttribute("data-theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      if (sun) sun.hidden = isDark;
      if (moon) moon.hidden = !isDark;
      btn.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
      btn.setAttribute("title", btn.getAttribute("aria-label"));
      // keep --fg resolved for anything reading it later
      void cs;
    }
    btn.addEventListener("click", function () {
      var isDark = (doc.documentElement.getAttribute("data-theme") === "dark") ||
        (!doc.documentElement.getAttribute("data-theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      var next = isDark ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ }
      paint();
    });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      if (!stored) paint();
    });
    paint();
  }

  /* ---------- Mobile navigation ---------- */
  function initNav() {
    var toggle = doc.querySelector(".nav-toggle");
    var nav = doc.getElementById("site-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!open));
      toggle.setAttribute("aria-expanded", String(!open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { nav.setAttribute("data-open", "false"); toggle.setAttribute("aria-expanded", "false"); }
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.getAttribute("data-open") === "true") {
        nav.setAttribute("data-open", "false");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* ---------- Reading progress + back to top (single rAF loop) ---------- */
  function initScrollUI() {
    var bar = doc.getElementById("progress");
    var top = doc.querySelector(".back-top");
    if (!bar && !top) return;
    var ticking = false;

    function frame() {
      ticking = false;
      var h = doc.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var y = h.scrollTop || doc.body.scrollTop || 0;
      if (bar) bar.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + "%";
      if (top) top.setAttribute("data-show", String(y > 900));
    }
    window.addEventListener("scroll", function () {
      if (!ticking && !prefersReduced) { ticking = true; window.requestAnimationFrame(frame); }
      else if (prefersReduced) { frame(); }
    }, { passive: true });
    frame();

    if (top) top.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
      doc.body.setAttribute("tabindex", "-1");
      doc.body.focus({ preventScroll: true });
      doc.body.removeAttribute("tabindex");
    });
  }

  /* ---------- Table of contents: scroll-spy ---------- */
  function initTOC() {
    var links = Array.prototype.slice.call(doc.querySelectorAll(".toc a[href^='#']"));
    if (!links.length) return;

    var map = [];
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var el = doc.getElementById(id);
      if (el) map.push({ link: a, el: el });
    });
    if (!map.length) return;

    var current = null;
    function setActive(link) {
      if (current === link) return;
      if (current) current.removeAttribute("aria-current");
      current = link;
      if (link) link.setAttribute("aria-current", "true");
    }

    if ("IntersectionObserver" in window) {
      var visible = new Set();
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var entry = map.filter(function (m) { return m.el === en.target; })[0];
          if (!entry) return;
          if (en.isIntersecting) visible.add(entry); else visible.delete(entry);
        });
        if (visible.size) {
          var first = map.filter(function (m) { return visible.has(m); })[0];
          setActive(first ? first.link : null);
        }
      }, { rootMargin: "-88px 0px -66% 0px", threshold: [0, 1] });
      map.forEach(function (m) { io.observe(m.el); });
    } else {
      window.addEventListener("scroll", function () {
        var y = (doc.documentElement.scrollTop || 0) + 120;
        var pick = null;
        map.forEach(function (m) { if (m.el.offsetTop <= y) pick = m; });
        setActive(pick ? pick.link : null);
      }, { passive: true });
    }

    // Smooth-scroll with correct sticky-header offset + shareable hash
    links.forEach(function (a) {
      a.addEventListener("click", function (e) {
        var el = doc.getElementById(a.getAttribute("href").slice(1));
        if (!el) return;
        e.preventDefault();
        var y = el.getBoundingClientRect().top + window.pageYOffset - 84;
        window.scrollTo({ top: y, behavior: prefersReduced ? "auto" : "smooth" });
        if (history.replaceState) history.replaceState(null, "", a.getAttribute("href"));
        el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
      });
    });
  }

  /* ---------- Copyable heading anchors ---------- */
  function initAnchors() {
    doc.querySelectorAll(".prose h2[id], .prose h3[id]").forEach(function (h) {
      if (h.querySelector(".hanchor")) return;
      var a = doc.createElement("a");
      a.className = "hanchor";
      a.href = "#" + h.id;
      a.textContent = "#";
      a.setAttribute("aria-label", "Copy link to section: " + h.textContent.replace(/#$/, "").trim());
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var url = location.origin + location.pathname + "#" + h.id;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () { flash(a, "Copied"); }, function () { location.hash = h.id; });
        } else { location.hash = h.id; }
      });
      h.appendChild(a);
    });

    function flash(node, text) {
      var old = node.textContent;
      node.textContent = text;
      node.style.opacity = "1";
      node.style.fontSize = ".6em";
      window.setTimeout(function () { node.textContent = old; node.style.fontSize = ""; node.style.opacity = ""; }, 1400);
    }
  }

  /* ---------- Expand / collapse all FAQs ---------- */
  function initFaqTools() {
    doc.querySelectorAll("[data-faq-all]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var scope = doc.querySelector(btn.getAttribute("data-faq-all")) || doc;
        var items = Array.prototype.slice.call(scope.querySelectorAll("details"));
        var anyClosed = items.some(function (d) { return !d.open; });
        items.forEach(function (d) { d.open = anyClosed; });
        btn.textContent = anyClosed ? "Collapse all" : "Expand all";
      });
    });
  }

  /* ---------- Newsletter forms: graceful client-side confirmation ----------
     No backend in a static deploy; confirm inline instead of a dead submit.
     (Point the form's action at your ESP endpoint to make it live.)          */
  function initNewsletter() {
    doc.querySelectorAll("form.nl-form").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = form.querySelector('input[type="email"]');
        if (!input || !input.checkValidity()) {
          if (input) { input.reportValidity(); }
          return;
        }
        var note = doc.createElement("p");
        note.className = "nl-note";
        note.setAttribute("role", "status");
        var kit = doc.querySelector('a[href*="launch-kit"]');
        note.innerHTML =
          "<strong>You\u2019re on the list.</strong> On a live deploy this form posts to your " +
          "email provider; on this static build we confirm here. Meanwhile the kit itself is " +
          'free at <a href="' + (kit ? kit.getAttribute("href") : "launch-kit/") +
          '" style="color:#fff;text-decoration:underline">the Launch Kit page</a>.';
        form.replaceWith(note);
      });
    });
  }

  /* ---------- Year stamp ---------- */
  function initYear() {
    doc.querySelectorAll("[data-year]").forEach(function (n) { n.textContent = String(new Date().getFullYear()); });
  }

  function boot() {
    initThemeToggle();
    initNav();
    initScrollUI();
    initTOC();
    initAnchors();
    initFaqTools();
    initNewsletter();
    initYear();
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
