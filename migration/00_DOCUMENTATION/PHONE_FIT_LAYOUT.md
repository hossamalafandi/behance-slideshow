# Phone fit layout — P030-S01 pilot

Status: **pilot deployed as version 7 on 2026-11-22; awaiting the owner's
phone review before any rollout.**

## 1. Why

Behance keeps the iframe width and height attributes and wraps the embed in
its own fixed-height container. On a phone the available width shrinks but the
height stays fixed, so the slideshow viewport becomes much taller than it is
wide. The original slideshow uses:

```css
.slide img { width: 100%; height: 100%; object-fit: cover; }
```

With a 16:9 image in a tall phone viewport, `cover` scales the image until it
fills the height and crops most of the left and right sides. P030-S01 is the
pilot because its four images are 16:9 while the Behance frame is tall.

## 2. What the pilot does

The fix is entirely inside the existing iframe. The outer Behance embed code,
the deployment URL, the iframe width/height, and the image URLs and order are
unchanged.

For slideshows explicitly opted in through `01_AUDIT/layout.config.json`, the
shared template adds a `data-layout="fit"` attribute. When that attribute is
present **and** the iframe viewport is portrait/taller than wide
(`max-aspect-ratio: 1/1`):

- the main image switches from `object-fit: cover` to `object-fit: contain`,
  so the complete image is visible;
- a `::before` backdrop fills the letterbox with the same remote image,
  blurred and darkened;
- only the active slide and its two neighbors keep a backdrop, so a phone does
  not rasterize a blur layer for every image at once;
- navigation, dots, counter, hover-reveal, side shadows, the single fullscreen
  button, and the theater-mode fallback are unchanged.

On a wide landscape frame the original `cover` behavior is preserved exactly.
At the 987 px Behance column, P030-S01 is 987 x 1107 (portrait), so the fit
layout is active there too. At the audited 1335 x 1107 Google Sites frame it
stays `cover`.

### No image duplication or rehosting

- The HTML still contains exactly one `<img>` per image slot and one copy of
  each remote URL.
- The backdrop is a CSS pseudo-element. Script copies the existing `<img>`
  `src` into the `--slide-image` custom property; the browser serves that URL
  from the same cache entry.
- No image is downloaded, copied, resized, proxied, or rehosted.

## 3. The gate

`01_AUDIT/layout.config.json` is the single source of truth:

```json
{
  "fit": ["P030-S01"]
}
```

`generate.js` writes `"layout": "fit"` into that slideshow's generated data and
`SlidesData.gs`. `Code.gs` reads the generated flag and passes it to the
template; it does not hardcode slideshow IDs. Classic slides have no `layout`
field and render `data-layout=""`, so the new CSS and script stay inert.

## 4. Pilot verification

Local suites:

- `node tools/validate.js` — **3264/3264**, all 48 slideshows, frozen URL hash
  unchanged.
- `node tools/test-all.js` — **347/347**, 48/48 slideshows at their audited
  dimensions; 339 image requests blocked; no image downloads.
- `node tools/test-pilot.js` — **37/37**, P001-S01 regression suite.
- `node tools/test-fit-layout.js` — **37/37**, phone 390 x 1107, Behance
  column 987 x 1107, wide 1335 x 1107, non-gated P020-S01, navigation,
  backdrop reuse, no overflow, fullscreen. Synthetic 16:9 SVG placeholders are
  used; no original image is downloaded or viewed.

Live deployment:

- `node tools/test-live-all.js <deployment-url>` — **339/339**, 48/48
  slideshows; no banner; exact URLs; fullscreen.
- `node tools/test-live-fit.js <deployment-url>` — **24/24**, P030-S01 at
  phone and wide sizes through Behance-like outer iframes, plus non-gated
  P020-S01.

Pilot URL:

```
https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec?slide=P030-S01
```

To review, open the P030 Behance project on a phone. The outer embed code must
not be replaced. If the old embed code is already published, it will load the
new version automatically because the deployment ID did not change.

## 5. Rollout after owner approval

1. Edit `01_AUDIT/layout.config.json`:

   ```json
   {
     "fit": "all"
   }
   ```

   An explicit array of all 48 IDs also works.
2. Regenerate the complete artifact set:

   ```
   node tools/generate.js --all --deployment-id <same-deployment-id>
   node tools/validate.js
   node tools/test-all.js
   node tools/test-fit-layout.js
   ```

   With `"fit": "all"`, the fit-layout test's non-gated check must be updated
   or skipped; the gate is intentionally global at that point.
3. Push and deploy a new immutable version under the **same** deployment ID:

   ```
   cd 04_APPS_SCRIPT
   clasp push -f
   clasp version "Enable phone fit layout on all slideshows"
   clasp deploy -V <new-version> -i <same-deployment-id> -d "Enable phone fit layout on all slideshows"
   ```
4. Re-run `test-live-all.js` and `test-live-fit.js`.

## 6. Revert

The deployment ID and Behance codes stay stable, so reverting never requires
editing Behance.

- **Disable the fit layout everywhere, keep the rest of version 7:**
  set `"fit": []` in `01_AUDIT/layout.config.json`, regenerate, validate, push,
  create the next version, and update the same deployment ID. Every slideshow
  returns to `data-layout=""` and the original `cover` behavior.
- **Full rollback to the pre-pilot code:** in the Apps Script editor, open
  **Deploy → Manage deployments**, edit the existing deployment, and select
  **version 6** (`Add P024 slideshow and TOOLS USED strip`). The deployment ID
  and all Behance embeds stay unchanged.
- **Source rollback:** revert the pilot commit in Git. The generated artifacts
  and `SlidesData.gs` return to their version-6 state.

## 7. Files touched

- `01_AUDIT/layout.config.json` — the opt-in gate (new).
- `04_APPS_SCRIPT/Slideshow.html` — opt-in CSS and backdrop script.
- `04_APPS_SCRIPT/Code.gs` — passes the generated layout flag to the template.
- `04_APPS_SCRIPT/SlidesData.gs` — generated `layout` flag for P030-S01 only.
- `03_REBUILT_SLIDESHOWS/data/P030-S01.json` — generated flag.
- `03_REBUILT_SLIDESHOWS/preview/*.html` — regenerated from the shared
  template; only P030-S01 activates the layout.
- `tools/generate.js`, `tools/validate.js` — gate support and checks.
- `tools/test-fit-layout.js`, `tools/test-live-fit.js` — focused tests.
- `05_BEHANCE_OUTPUT/*` — unchanged; the outer embed codes are identical.
