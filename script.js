// CondoVilla — light interactions (considered motion, no heavy libs)
(function () {
  "use strict";

  // Mark that JS is available — enables the reveal animation.
  // (CSS keeps content visible when this class is absent.)
  document.documentElement.classList.add("js");

  // Nav: solidify on scroll + smart hide/show (hide on scroll down, show on up)
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav__toggle");
  const links = document.querySelector(".nav__links");

  let lastY = window.scrollY;
  const HIDE_AFTER = 120; // don't hide until scrolled past the nav's own height
  const DELTA = 6;        // ignore tiny jitter

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 40);

    const diff = y - lastY;
    if (Math.abs(diff) > DELTA) {
      // Never hide while the mobile menu is open or near the very top.
      const menuOpen = links.classList.contains("is-open");
      if (diff > 0 && y > HIDE_AFTER && !menuOpen) {
        nav.classList.add("nav--hidden");   // scrolling down → hide
      } else if (diff < 0 || y <= HIDE_AFTER) {
        nav.classList.remove("nav--hidden"); // scrolling up (or at top) → show
      }
      lastY = y;
    }
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile menu
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
  const scrollHint = document.getElementById("hero-scroll");
  const heroVideo = document.querySelector(".hero__video");

  const smallScreen = window.matchMedia("(max-width: 640px)").matches;
  const heroOn = !reduce && !smallScreen && !!stage && !!heroVideo;

  // On reduced-motion / small screens we don't scrub; CSS hides the video and
  // shows the poster still, so just make sure it isn't playing.
  if (heroVideo && (reduce || smallScreen)) {
    try { heroVideo.pause(); } catch (e) {}
  }

  if (heroOn) {
    // The video is driven by scroll position ("scrubbed"): scrolling down
    // advances the frames, scrolling up rewinds. We never call play(); we set
    // currentTime from how far the pinned stage has scrolled. A short lerp
    // smooths seeking so it doesn't look stepped.
    let targetTime = 0;   // where scroll says the video should be
    let rafId = null;
    const vh = () => window.innerHeight || document.documentElement.clientHeight;

    const progress = () => {
      const rect = stage.getBoundingClientRect();
      const travel = stage.offsetHeight - vh() || vh();
      let p = -rect.top / travel;
      return p < 0 ? 0 : p > 1 ? 1 : p;
    };

    // Seeking exactly to `duration` is unreliable (some browsers clamp/loop),
    // so cap targets just shy of the end.
    const END_EPS = 0.05;
    const endTime = () => Math.max(0, (heroVideo.duration || 0) - END_EPS);

    const computeTarget = () => {
      const d = heroVideo.duration;
      if (!isFinite(d) || d <= 0) return;
      const p = progress();
      // Reversed: top of page = end of clip; scrolling down rewinds to start.
      targetTime = (1 - p) * (d - END_EPS);
      if (scrollHint) scrollHint.style.opacity = p > 0.03 ? "0" : "1";
      startLoop();
    };

    // Ease currentTime toward the scroll target for smooth scrubbing.
    // Don't issue a new seek while the previous one is still resolving — piling
    // up seeks the decoder can't service is a major cause of stutter.
    const EASE = 0.18;        // 0..1; higher = snappier, lower = floatier
    const loop = () => {
      if (heroVideo.seeking) { rafId = window.requestAnimationFrame(loop); return; }
      const current = heroVideo.currentTime || 0;
      const diff = targetTime - current;
      if (Math.abs(diff) < 0.02) {
        try { heroVideo.currentTime = targetTime; } catch (e) {}
        rafId = null;
        return; // settled — stop until next scroll
      }
      try { heroVideo.currentTime = current + diff * EASE; } catch (e) {}
      rafId = window.requestAnimationFrame(loop);
    };

    const startLoop = () => { if (rafId === null) rafId = window.requestAnimationFrame(loop); };

    const onScrollOrResize = () => computeTarget();

    const init = () => {
      // Reversed scrub starts at the END of the clip (top of page = last frame).
      try {
        heroVideo.pause();
        heroVideo.currentTime = endTime();
      } catch (e) {}
      computeTarget();
    };

    if (heroVideo.readyState >= 1 && isFinite(heroVideo.duration)) {
      init();
    } else {
      heroVideo.addEventListener("loadedmetadata", init, { once: true });
    }

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
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
  // Full spec grid per Standard bedroom type. Floor/Living/Dining/Kitchen are
  // the same across types; Bedrooms/Bathrooms/Balconies/Parking vary.
  const LIVING = { icon: "#ic-living", label: "1 (Open Plan) Living Room" };
  const DINING = { icon: "#ic-dining", label: "1 (Compact / Integrated) Dining Room" };
  const KITCHEN = { icon: "#ic-kitchen", label: "1 (Pantry) Kitchen" };
  const FLOOR = { icon: "#ic-floor", label: "1 Floor" };
  const SPECS_BY_BEDS = {
    "4": [
      FLOOR,
      { icon: "#ic-bed", label: "4+1 Bedrooms" },
      { icon: "#ic-bath", label: "2+1 Bathrooms" },
      LIVING, DINING, KITCHEN,
      { icon: "#ic-balcony", label: "2 Balconies" },
      { icon: "#ic-parking", label: "2 Parking Slots" },
    ],
    "3": [
      FLOOR,
      { icon: "#ic-bed", label: "3+1 Bedrooms" },
      { icon: "#ic-bath", label: "2+1 Bathrooms" },
      LIVING, DINING, KITCHEN,
      { icon: "#ic-balcony", label: "1 Balcony" },
      { icon: "#ic-parking", label: "1 Parking Slot" },
    ],
    "2": [
      FLOOR,
      { icon: "#ic-bed", label: "2+1 Bedrooms" },
      { icon: "#ic-bath", label: "2+1 Bathrooms" },
      LIVING, DINING, KITCHEN,
      { icon: "#ic-balcony", label: "1 Balcony" },
      { icon: "#ic-parking", label: "1 Parking Slot" },
    ],
  };

  // Area figures per bedroom type for the Standard unit. Updates #standard-area.
  const AREA_BY_BEDS = {
    "4": "Nett Area 337.54 Sqm<br>Semigross Area 293.57 Sqm",
    "3": "Nett Area 121.77 Sqm<br>Semigross Area 105.91 Sqm",
    "2": "Nett Area 100.58 Sqm<br>Semigross Area 87.48 Sqm",
  };

  document.querySelectorAll(".tipe__pills").forEach((group) => {
    const pills = Array.prototype.slice.call(group.querySelectorAll(".tipe__pill"));
    const row = group.closest("[data-tipe]");
    const grid = row ? row.querySelector(".tipe__grid") : null;
    const areaEl = row ? row.querySelector(".tipe__area") : null;

    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        pills.forEach((p) => {
          const on = p === pill;
          p.classList.toggle("is-active", on);
          p.setAttribute("aria-selected", String(on));
        });
        const beds = pill.getAttribute("data-beds");

        // Update the area line for this bedroom type.
        if (areaEl && AREA_BY_BEDS[beds]) {
          areaEl.innerHTML = AREA_BY_BEDS[beds];
        }

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

  /* ============================================================
     Enquire form: front-end only. On a valid submit, show a thank-you
     message and reset the fields. No data is sent anywhere.
     ============================================================ */
  const enquireForm = document.querySelector(".enquire__form");
  const enquireThanks = document.querySelector(".enquire__thanks");
  if (enquireForm) {
    enquireForm.addEventListener("submit", (e) => {
      e.preventDefault();
      // Let the browser enforce required fields + email format first.
      if (!enquireForm.checkValidity()) {
        enquireForm.reportValidity();
        return;
      }
      const name = (enquireForm.querySelector('input[type="text"]') || {}).value || "";
      const first = name.trim().split(/\s+/)[0];
      if (enquireThanks) {
        enquireThanks.textContent = first
          ? "Thank you, " + first + " — we'll be in touch shortly to confirm your appointment."
          : "Thank you — we'll be in touch shortly to confirm your appointment.";
        enquireThanks.hidden = false;
      }
      enquireForm.reset();
    });
  }
})();
