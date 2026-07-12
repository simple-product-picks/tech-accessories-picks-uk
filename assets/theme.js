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

  // Sticky table of contents - long posts, wide screens only (built from content h2s)
  var content = document.getElementById("content");
  if (content) {
    var heads = Array.prototype.slice.call(content.querySelectorAll("h2"));
    if (heads.length >= 3 && window.innerWidth >= 1240) {
      heads.forEach(function (h, i) {
        if (!h.id) h.id = "s-" + (h.textContent || "sec").toLowerCase()
          .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "s" + i;
      });
      var toc = document.createElement("nav");
      toc.className = "toc";
      toc.setAttribute("aria-label", "On this page");
      toc.innerHTML = "<div class='toc-title'>On this page</div>";
      var links = heads.map(function (h) {
        var a = document.createElement("a");
        a.href = "#" + h.id;
        a.textContent = h.textContent;
        toc.appendChild(a);
        return a;
      });
      document.body.appendChild(toc);
      if ("IntersectionObserver" in window) {
        var current = null;
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              if (current) current.classList.remove("active");
              current = links[heads.indexOf(en.target)];
              if (current) current.classList.add("active");
            }
          });
        }, { rootMargin: "-15% 0px -70% 0px" });
        heads.forEach(function (h) { io.observe(h); });
      }
    }

    // Estimated read time pill in the trust bar
    var words = (content.textContent || "").trim().split(/\s+/).length;
    var mins = Math.max(1, Math.round(words / 220));
    var bar = document.querySelector(".trust-bar");
    if (bar && words > 100) {
      var pill = document.createElement("span");
      pill.className = "trust-item read-time";
      pill.textContent = mins + " min read";
      bar.appendChild(pill);
    }
  }

  // Hover preview cards on related-guide links (pointer devices only)
  if (window.matchMedia && matchMedia("(hover: hover)").matches) {
    var rel = document.getElementById("related_list");
    if (rel) {
      var card = document.createElement("div");
      card.className = "related-preview";
      card.innerHTML = "<img alt=''><span></span>";
      document.body.appendChild(card);
      var img = card.querySelector("img"), cap = card.querySelector("span");
      rel.addEventListener("mouseover", function (e) {
        var a = e.target.closest ? e.target.closest("a") : null;
        if (!a || !rel.contains(a)) return;
        var m = (a.getAttribute("href") || "").match(/([a-z0-9-]+)\.html/);
        if (!m) return;
        img.src = "../assets/img/hero/posts/" + m[1] + ".jpg";
        cap.textContent = a.textContent;
        var r = a.getBoundingClientRect();
        card.style.top = (window.scrollY + r.top - 8) + "px";
        card.style.left = Math.min(window.innerWidth - 260, r.right + 16) + "px";
        card.classList.add("show");
      });
      rel.addEventListener("mouseout", function () { card.classList.remove("show"); });
      img.addEventListener("error", function () { card.classList.remove("show"); });
    }
  }

  // Sticky bar: dismiss (X) - per browsing session
  var sticky = document.getElementById("sticky-cta");
  if (sticky) {
    var dismissed = false;
    try { dismissed = sessionStorage.getItem("sppStickyClosed") === "1"; } catch (e) {}
    if (dismissed) {
      document.body.classList.add("sticky-dismissed");
    } else {
      var x = document.createElement("button");
      x.className = "sticky-close";
      x.type = "button";
      x.setAttribute("aria-label", "Dismiss price bar");
      x.innerHTML = "&times;";
      x.addEventListener("click", function () {
        document.body.classList.add("sticky-dismissed");
        try { sessionStorage.setItem("sppStickyClosed", "1"); } catch (e) {}
        var b2 = document.querySelector(".back-to-top");
        if (b2) b2.classList.remove("above-sticky");
      });
      sticky.querySelector(".sticky-cta-inner").appendChild(x);
    }
  }

  // Skip link (a11y) - first focusable element
  var skip = document.createElement("a");
  skip.className = "skip-link";
  skip.href = "#content";
  skip.textContent = "Skip to content";
  if (!document.getElementById("content")) skip.href = "#hero";
  document.body.insertBefore(skip, document.body.firstChild);

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
