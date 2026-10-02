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
  }));

  // Disable parallax for reduced-motion or very narrow screens (perf/feel).
  const smallScreen = window.matchMedia("(max-width: 640px)").matches;
  const parallaxOn = !reduce && !smallScreen && parallaxEls.length > 0;

  let ticking = false;
  const vh = () => window.innerHeight || document.documentElement.clientHeight;

  function update() {
    const viewH = vh();
    for (let i = 0; i < parallaxEls.length; i++) {
      const { el, speed } = parallaxEls[i];
      const rect = el.getBoundingClientRect();
      // Skip elements far outside the viewport
      if (rect.bottom < -viewH || rect.top > viewH * 2) continue;
      // Distance of the element's centre from the viewport centre
      const centre = rect.top + rect.height / 2 - viewH / 2;
      const shift = -(centre * speed);
      el.style.transform = "translate3d(0," + shift.toFixed(2) + "px,0)";
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
