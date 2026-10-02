# CondoVilla — Luxury Property Landing Page

A single-page site for the fictional **CondoVilla** oceanfront residences, built by
applying the direction from the
[Claude Code Frontend Design Toolkit](https://github.com/wilwaldon/Claude-Code-Frontend-Design-Toolkit).

## Design decisions (from the toolkit)

The toolkit's #1 rule is **pick a real aesthetic before coding** instead of defaulting
to "Inter + purple gradient + rounded cards." The aesthetic here is tuned directly to
the brand key visual (lakeside sunset, French-style residences, *"Voilà, Your Finest
Lake Living Awaits"*):

- **Aesthetic:** *Lake Sunset luxury* — warm cream background, lake-teal primary
  (matching the "Voilà" wordmark), sunset coral/gold accents, serif headlines.
- **Design tokens:** the palette derives in **OKLCH** from a `--brand-hue` (lake teal)
  plus an `--accent-hue` (sunset) — the toolkit's "Design Tokens" approach. Adjust
  those two numbers in `styles.css` to re-tune the whole page.
- **Typography pairing:** Cormorant Garamond (serif display) + Jost (geometric sans).
- **Considered motion:** scroll-reveal via `IntersectionObserver`, full
  `prefers-reduced-motion` support.
- **Responsive & accessible:** mobile nav, semantic landmarks, aria labels.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Markup & content |
| `styles.css` | Design tokens + all styling |
| `script.js`  | Nav, mobile menu, scroll-reveal |

## Adding your KV (key visual) images

Image slots are already wired up — just drop files into a `kv/` folder and point the
CSS at them. No markup changes needed.

The `kv/` folder already exists. The **hero already points at `kv/hero.jpg`** — just
drop the key visual there with that exact name and it appears (a sunset gradient shows
as a fallback until then).

1. Save the key visual as `condovilla/kv/hero.jpg`.
2. (Optional) In `styles.css`, point the other slots at real photos:

   ```css
   /* Residence cards */
   .card__media--one   { background-image: url("kv/garden-villa.jpg"); }
   .card__media--two   { background-image: url("kv/sky-villa.jpg"); }
   .card__media--three { background-image: url("kv/penthouse.jpg"); }

   /* Gallery tiles — set per nth-child or add a modifier class */
   .gallery__item:nth-child(1) { background-image: url("kv/g1.jpg"); }
   ```

The gallery tiles currently show a small "KV" marker so empty slots are obvious; it
disappears visually once a real image covers the tile.

## Preview

Open `index.html` in a browser, or serve the folder:

```bash
cd condovilla && python3 -m http.server 8000
```
