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

  /* ============================================================
     Hero: window-opening parallax
     The .hero is pinned (CSS sticky) inside the tall .hero-stage. As the
     stage scrolls past, the glass panes slide apart and the lake view zooms
     out to "open the window". The open completes at OPEN_AT and then holds
     wide open for the remaining runway before the next section arrives.
     Disabled for reduced-motion / small screens (CSS shows it open there).
     ============================================================ */
  const stage = document.getElementById("hero-stage");
  const lake = document.querySelector(".hero__lake");
  const mullion = document.getElementById("hero-mullion");
  const scrollHint = document.getElementById("hero-scroll");
  const panes = Array.prototype.slice
    .call(document.querySelectorAll(".hero [data-slide]"))
    .map((el) => ({ el, amount: parseFloat(el.getAttribute("data-slide")) || 0 }));
  const zoomStart = lake ? parseFloat(lake.getAttribute("data-zoom")) || 1 : 1;

  // Fraction of the track over which the window opens; it holds the rest.
  const OPEN_AT = 0.6;

  const smallScreen = window.matchMedia("(max-width: 640px)").matches;
  const heroOn = !reduce && !smallScreen && !!stage;

  if (heroOn) {
    let ticking = false;
    const vh = () => window.innerHeight || document.documentElement.clientHeight;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const renderHero = () => {
      const rect = stage.getBoundingClientRect();
      const travel = stage.offsetHeight - vh() || vh();
      let raw = -rect.top / travel;
      raw = raw < 0 ? 0 : raw > 1 ? 1 : raw;

      const p = easeOutCubic(Math.min(raw / OPEN_AT, 1)); // open progress 0..1

      if (lake) {
        const scale = zoomStart + (1 - zoomStart) * p;
        lake.style.transform = "translate3d(0,0,0) scale(" + scale.toFixed(4) + ")";
      }
      for (let i = 0; i < panes.length; i++) {
        panes[i].el.style.transform =
          "translate3d(" + (panes[i].amount * p).toFixed(2) + "%,0,0)";
      }
      if (mullion) mullion.style.opacity = (1 - p).toFixed(3);
      if (scrollHint) scrollHint.style.opacity = p > 0.15 ? "0" : "1";

      ticking = false;
    };

    const tickHero = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(renderHero);
      }
    };

    window.addEventListener("scroll", tickHero, { passive: true });
    window.addEventListener("resize", tickHero, { passive: true });
    renderHero(); // set initial state
  }

  /* ============================================================
     Tipe Unit: image carousels + bedroom-type pills
     ============================================================ */

  // --- Carousels: arrows + auto-generated dots, with wrap-around. ---
  document.querySelectorAll("[data-carousel]").forEach((root) => {
    const track = root.querySelector(".carousel__track");
    const slides = Array.prototype.slice.call(root.querySelectorAll(".carousel__slide"));
    const dotsWrap = root.querySelector("[data-car-dots]");
    const prev = root.querySelector("[data-car-prev]");
    const next = root.querySelector("[data-car-next]");
    if (!track || slides.length === 0) return;

    let index = 0;

    // Build one dot per slide.
    const dots = slides.map((_, i) => {
      const b = document.createElement("button");
      b.className = "carousel__dot" + (i === 0 ? " is-active" : "");
      b.type = "button";
      b.setAttribute("aria-label", "Go to slide " + (i + 1));
      b.addEventListener("click", () => go(i));
      dotsWrap && dotsWrap.appendChild(b);
      return b;
    });

    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = "translateX(" + -index * 100 + "%)";
      dots.forEach((d, di) => d.classList.toggle("is-active", di === index));
    }

    prev && prev.addEventListener("click", () => go(index - 1));
    next && next.addEventListener("click", () => go(index + 1));
  });

  // --- Standard bedroom-type pills (tabs). ---
  // Swapping is data-driven: fill SPECS_BY_BEDS with real per-type values and
  // the grid updates on click. For now each type shows the same sample grid.
  const SPECS_BY_BEDS = {
    "4": null, // null => keep the markup's default (sample) grid
    "3": null,
    "2": null,
  };

  document.querySelectorAll(".tipe__pills").forEach((group) => {
    const pills = Array.prototype.slice.call(group.querySelectorAll(".tipe__pill"));
    const row = group.closest("[data-tipe]");
    const grid = row ? row.querySelector(".tipe__grid") : null;

    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        pills.forEach((p) => {
          const on = p === pill;
          p.classList.toggle("is-active", on);
          p.setAttribute("aria-selected", String(on));
        });
        const beds = pill.getAttribute("data-beds");
        const spec = SPECS_BY_BEDS[beds];
        if (grid && spec && Array.isArray(spec)) {
          // spec = [{icon:"#ic-bed", label:"2 Bedroom"}, ...]
          grid.innerHTML = spec
            .map(
              (s) =>
                '<li><svg class="tipe__ic" viewBox="0 0 24 24"><use href="' +
                s.icon +
                '"/></svg><span>' +
                s.label +
                "</span></li>"
            )
            .join("");
        }
      });
    });
  });
})();
