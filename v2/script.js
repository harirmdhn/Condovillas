// CondoVilla — Parallax edition. Lightweight, no libraries.
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  /* ---------- Nav: solidify on scroll ---------- */
  const nav = document.querySelector(".nav");
  const onNav = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
  onNav();

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector(".nav__toggle");
  const links = document.querySelector(".nav__links");
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );

  /* ---------- Scroll-reveal via IntersectionObserver ---------- */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const items = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            setTimeout(() => e.target.classList.add("is-in"), (i % 4) * 80);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach((el) => io.observe(el));
    setTimeout(() => items.forEach((el) => el.classList.add("is-in")), 2500);
  }

  /* ============================================================
     Parallax engine
     Any element with data-parallax="<speed>" is translated on the
     Y axis as it passes through the viewport. Positive values move
     the element slower than scroll (recedes); negative values move
     it faster (comes toward you).
     ============================================================ */
  const parallaxEls = Array.prototype.slice.call(
    document.querySelectorAll("[data-parallax]")
  ).map((el) => ({
    el,
    speed: parseFloat(el.getAttribute("data-parallax")) || 0,
    // data-zoom="startScale" -> element scales from startScale (zoomed in)
    // down to 1 (zoomed out) as it scrolls out through the top of the view.
    zoom: parseFloat(el.getAttribute("data-zoom")) || 0,
  }));

  // Disable parallax for reduced-motion or very narrow screens (perf/feel).
  const smallScreen = window.matchMedia("(max-width: 640px)").matches;
  const parallaxOn = !reduce && !smallScreen && parallaxEls.length > 0;

  let ticking = false;
  const vh = () => window.innerHeight || document.documentElement.clientHeight;

  function update() {
    const viewH = vh();
    for (let i = 0; i < parallaxEls.length; i++) {
      const { el, speed, zoom } = parallaxEls[i];
      const rect = el.getBoundingClientRect();
      // Skip elements far outside the viewport
      if (rect.bottom < -viewH || rect.top > viewH * 2) continue;

      // --- vertical parallax drift ---
      const centre = rect.top + rect.height / 2 - viewH / 2;
      const shift = -(centre * speed);

      let transform = "translate3d(0," + shift.toFixed(2) + "px,0)";

      // --- scroll-driven zoom (zoom in at top, zoom out as you scroll) ---
      if (zoom > 1) {
        // progress 0 at hero top-of-page, 1 when the section's host has
        // scrolled up by one viewport. Clamp to [0,1].
        const host = el.parentElement || el;
        const scrolled = -host.getBoundingClientRect().top;
        const span = host.offsetHeight || viewH;
        let p = scrolled / span;
        p = p < 0 ? 0 : p > 1 ? 1 : p;
        const scale = zoom + (1 - zoom) * p; // zoom -> 1
        transform += " scale(" + scale.toFixed(4) + ")";
      }

      el.style.transform = transform;
    }
    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  function onScroll() {
    onNav();
    if (parallaxOn) requestTick();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    if (parallaxOn) requestTick();
  }, { passive: true });

  if (parallaxOn) update(); // set initial positions
})();
