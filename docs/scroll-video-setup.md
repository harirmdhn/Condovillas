# Hero scroll-scrubbed video — encode & deploy guide

The hero video is **scroll-scrubbed**: scroll position drives the video frames
(it does not autoplay). For this to feel smooth, the file must be (1) small and
(2) encoded with **very frequent keyframes**, and (3) served from a real host
(not raw.githack). This guide covers all three.

---

## 1. Re-encode the MP4 with ffmpeg (keyframe-dense + small)

Scrubbing seeks to arbitrary timestamps constantly. A normal MP4 has sparse
keyframes (every ~2–10s), so the browser can only snap to those — causing
stutter/jumping. We fix this by making **every frame a keyframe** (`-g 1`) and
shrinking the file.

### Install ffmpeg
- **macOS:** `brew install ffmpeg`
- **Windows:** `winget install Gyan.FFmpeg` (or download from ffmpeg.org)
- **Linux (Debian/Ubuntu):** `sudo apt install ffmpeg`

### Recommended command (1280px wide, no audio, all-keyframe)

```bash
ffmpeg -i Parallax-lowres.mp4 \
  -an \
  -vf "scale=1280:-2,fps=25" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -g 1 -keyint_min 1 -sc_threshold 0 \
  -crf 28 \
  -movflags +faststart \
  Parallax-scrub.mp4
```

What each part does:
- `-an` — drop the audio track (not needed for a muted background).
- `scale=1280:-2` — cap width at 1280px (height auto, kept even). Use `1920:-2`
  only if you really need full HD; it will be a bigger file.
- `fps=25` — cap frame rate. Fewer frames = smaller file and less to seek.
- `-g 1 -keyint_min 1 -sc_threshold 0` — **every frame is a keyframe** (the key
  to smooth scrubbing).
- `-crf 28` — quality/size knob. Lower = better quality + bigger file. Try
  23–30. For a background video, 28 is usually fine.
- `-movflags +faststart` — moves the index to the front so it can start before
  fully downloaded.

### Target size
Aim for **~2–8 MB**. Check the result:

```bash
ls -lh Parallax-scrub.mp4
# or get duration/bitrate:
ffprobe -v error -show_entries format=duration,size,bit_rate -of default=noprint_wrappers=1 Parallax-scrub.mp4
```

If it's still too big, raise `-crf` (e.g. 30–32), lower `fps` (e.g. 20), or
reduce `scale` (e.g. 960). All-keyframe files are inherently larger than normal
MP4s, which is the trade-off for smooth seeking — a short loop (5–12s) helps a
lot.

### (Optional) A WebM/VP9 variant can be smaller
```bash
ffmpeg -i Parallax-lowres.mp4 -an -vf "scale=1280:-2,fps=25" \
  -c:v libvpx-vp9 -g 1 -keyint_min 1 -crf 34 -b:v 0 Parallax-scrub.webm
```
If you make both, tell me and I'll add a second `<source>` so the browser picks
the smaller one it supports.

---

## 2. Put the encoded file in the repo

Replace the existing file (keep the same name so no code change is needed):

```bash
# from the repo root
mv Parallax-scrub.mp4 kv/Parallax-lowres.mp4
git add kv/Parallax-lowres.mp4
git commit -m "chore: smaller, all-keyframe hero video for smooth scrubbing"
git push
```

(Or upload it via the GitHub web UI into `kv/`, overwriting the old one.)

> If you'd rather use a **new filename**, tell me and I'll point the `<video>`
> `<source>` at it.

---

## 3. Deploy to a real host (so the video actually streams)

raw.githack can't stream/seek a large video well — you need a proper static
host. All three below are free for this and deploy straight from GitHub.

### Option A — Netlify (simplest, no build needed)
1. Go to <https://app.netlify.com> → sign in with GitHub.
2. **Add new site → Import an existing project → GitHub** → pick `Condovillas`.
3. Build settings: this is a plain static site, so leave **Build command empty**
   and set **Publish directory** to the repo root (`.`), or `/` .
4. Choose the branch to deploy (e.g. `feat/tipe-unit` for preview, or `main`
   after merge).
5. Deploy. You get a URL like `https://<name>.netlify.app`.

> Drag-and-drop alternative: zip the repo folder and drop it onto the Netlify
> dashboard — instant deploy, no GitHub connection needed.

### Option B — Vercel
1. Go to <https://vercel.com> → sign in with GitHub.
2. **Add New → Project** → import `Condovillas`.
3. Framework preset: **Other**. No build command. Output/root = repo root.
4. Pick the branch, deploy. URL like `https://<name>.vercel.app`.
   Vercel also auto-builds a **preview URL for every branch/PR**, which is handy
   for exactly this review workflow.

### Option C — Cloudflare Pages
1. <https://dash.cloudflare.com> → **Workers & Pages → Create → Pages →
   Connect to Git** → pick `Condovillas`.
2. Build command: *(none)*. Build output directory: `/` (root).
3. Deploy. URL like `https://<name>.pages.dev`.

### Option D — GitHub Pages (free only for public repos)
1. Repo **Settings → Pages**.
2. Source: **Deploy from a branch**, pick the branch and `/ (root)`.
3. Save; site appears at `https://<user>.github.io/Condovillas/`.
   - Requires the repo to be **public** on the free plan.

---

## 4. Verify it's working

On the deployed URL (not githack):
- The hero shows the **poster** first, then the video frame updates **as you
  scroll** (down = forward, up = back).
- Scrubbing should be smooth, not steppy. If it's steppy, the keyframes aren't
  dense enough — re-encode with `-g 1` as above.
- If it only shows the poster, the file is likely still too large to buffer, or
  the host is gzipping/erroring the MP4 — check the browser Network tab.

---

## Tuning knobs (in the code)

- **Scrub smoothing:** in `script.js`, the hero loop eases `currentTime` toward
  the scroll target by `0.2` per frame — raise toward `1` for a more immediate
  (snappier) response, lower for a more floaty feel.
- **Scroll length:** `--hero-track` in `styles.css` (currently `520vh`) controls
  how much scrolling plays the whole video. Longer track = slower playback.
- **Scroll hint:** fades out once you start scrolling (3% in).

Ping me to adjust any of these, add a WebM source, or wire a specific host.
