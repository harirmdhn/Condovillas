// CondoVilla — light interactions (considered motion, no heavy libs)
(function () {
  "use strict";

  // Mark that JS is available — enables the reveal animation.
  // (CSS keeps content visible when this class is absent.)
  document.documentElement.classList.add("js");

  // Nav: solidify on scroll
  const nav = document.querySelector(".nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile menu
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

  // Scroll-reveal via IntersectionObserver
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

    // Failsafe: never leave content hidden if the observer misses anything
    // (e.g. no scroll event, print, or edge-case layouts).
    setTimeout(() => items.forEach((el) => el.classList.add("is-in")), 2500);
  }

  /* ---------- Hero parallax (lightweight) ----------
     The hero background image drifts slower than the page as you scroll,
     giving a sense of depth. Disabled for reduced-motion and small screens
     (where fixed/parallax backgrounds feel janky and cost battery). */
  const heroBg = document.querySelector(".hero__bg");
  const smallScreen = window.matchMedia("(max-width: 640px)").matches;
  const parallaxOn = heroBg && !reduce && !smallScreen;

  if (parallaxOn) {
    const SPEED = 0.35; // 0 = fixed to page, 1 = scrolls with page
    let ticking = false;

    const render = () => {
      // Positive offset moves the image down as the page scrolls up,
      // so it appears to lag behind — the classic parallax feel.
      const shift = window.scrollY * SPEED;
      heroBg.style.transform = "translate3d(0," + shift.toFixed(2) + "px,0)";
      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(render);
      }
    };

    window.addEventListener("scroll", requestTick, { passive: true });
    render(); // set initial position
  }
})();
