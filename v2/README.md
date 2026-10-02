# CondoVilla — Parallax edition (v2)

A second version of the CondoVilla landing page with layered **scroll
parallax**, built on the same "Lake Sunset" design system as the original.

## What's different from v1

- **Parallax hero** — the key-visual background sits on its own layer and
  drifts slower than the page as you scroll, with the headline block easing
  the opposite way for depth.
- **New parallax banner** — a full-bleed lakeside section with the pull quote
  *“Every evening, the lake turns to gold.”* The image glides behind the text.
- **Subtle depth on cards & gallery** — residence cards and gallery tiles
  shift by small per-element amounts so the grid feels layered on scroll.
- **Lightweight engine** — a single `requestAnimationFrame`-throttled scroll
  handler drives everything via a `data-parallax="<speed>"` attribute. No
  libraries.

## Motion & accessibility

- Honours `prefers-reduced-motion`: parallax and reveal transforms are fully
  disabled for users who ask for reduced motion.
- Parallax is also switched off on very small screens (≤640px) for feel and
  performance; content still reveals normally.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Markup (adds `data-parallax` hooks + the banner) |
| `styles.css` | Lake Sunset tokens + parallax layer styling |
| `script.js`  | Nav, reveal, and the parallax engine |

The hero/banner reuse the shared key visual at `../kv/hero.jpg`.

## Preview

Open `v2/index.html`, or when deployed: `/<site>/v2/`.
