// theme.js - theme toggle + reading progress + back-to-top. Loaded deferred on every page.
// The pre-paint inline snippet in <head> sets html[data-theme] before first render;
// this file adds the interactive bits.
(function () {
  var html = document.documentElement;
  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.3 14.6A8.6 8.6 0 0 1 9.4 3.7a8.6 8.6 0 1 0 10.9 10.9z"/></svg>';

  function metaTheme() {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", html.getAttribute("data-theme") === "dark" ? "#0b1220" : "#172554");
  }
  function icon(btn) {
    btn.innerHTML = html.getAttribute("data-theme") === "dark" ? SUN : MOON;
    btn.setAttribute("aria-label", html.getAttribute("data-theme") === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }

  // Toggle button, appended to the nav on every page
  var nav = document.querySelector(".site-nav");
  if (nav) {
    var btn = document.createElement("button");
    btn.className = "theme-toggle";
    btn.type = "button";
    icon(btn);
    btn.addEventListener("click", function () {
      var next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
      html.setAttribute("data-theme", next);
      try { localStorage.setItem("sppTheme", next); } catch (e) {}
      icon(btn); metaTheme();
    });
    nav.appendChild(btn);
  }
  metaTheme();

  // Follow system changes only while the user has not made an explicit choice
  if (window.matchMedia) {
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
      var stored = null;
      try { stored = localStorage.getItem("sppTheme"); } catch (err) {}
      if (!stored) {
        html.setAttribute("data-theme", e.matches ? "dark" : "light");
        var t = document.querySelector(".theme-toggle");
        if (t) icon(t);
        metaTheme();
      }
    });
  }

  // Reading progress bar - article pages only
  if (document.getElementById("content")) {
    var bar = document.createElement("div");
    bar.className = "progress-bar";
    document.body.appendChild(bar);
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0) + "%";
        ticking = false;
      });
    }, { passive: true });
  }

  // Back to top
  var btt = document.createElement("button");
  btt.className = "back-to-top";
  btt.type = "button";
  btt.setAttribute("aria-label", "Back to top");
  btt.innerHTML = "↑";
  if (document.getElementById("sticky-cta")) btt.classList.add("above-sticky");
  btt.addEventListener("click", function () {
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });
  document.body.appendChild(btt);
  window.addEventListener("scroll", function () {
    btt.classList.toggle("show", window.scrollY > 600);
  }, { passive: true });
})();
