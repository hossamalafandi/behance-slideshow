# Phone fit layout — P030-S01 pilot

Status: **pilot deployed as version 8 on 2026-11-22; awaiting the owner's
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
shared template adds a `data-layout="fit"` attribute and a generated
`--fit-aspect` value taken from the first image's width/height. When the
iframe viewport is portrait/taller than wide (`max-aspect-ratio: 1/1`):

- the slideshow card is sized to the image's aspect ratio: full iframe width,
  height derived from `--fit-aspect`, and centered vertically;
- the image uses `object-fit: contain` and fills the card, so the complete
  image is visible with no cropping;
- there is **no blurred backdrop**. The iframe remains transparent, so the
  Behance page background shows above and below the card;
- the 50 px control strip is removed in fit mode; dots and controls overlay the
  card;
- native fullscreen and theater mode still fill the screen and keep the whole
  image visible with black bars;
- navigation, dots, counter, hover-reveal, side shadows, the single fullscreen
  button, and the theater-mode fallback are unchanged.

On a wide landscape frame the original `cover` behavior is preserved exactly.
At the 987 px Behance column, P030-S01 is 987 x 1107 (portrait), so the card is
987 x 555. At the audited 1335 x 1107 Google Sites frame it stays `cover`.

### Tradeoff

Behance's iframe itself stays the fixed audited height (1107 px for P030-S01).
On a 390 px phone the 16:9 card is 390 x 219 and is centered, so there is empty
transparent space above and below it. That empty space is the unavoidable
result of keeping the embed untouched while showing the whole 16:9 image with
no blur and no crop. If the owner prefers filling that space, the previous
version 7 used a blurred copy of the same image; version 6 is the original
full-frame `cover` layout.

### No image duplication or rehosting

- The HTML still contains exactly one `<img>` per image slot and one copy of
  each remote URL.
- The fit layout uses no CSS background image and no second copy of any URL;
  it only sizes the card and uses `object-fit: contain`.
- No image is downloaded, copied, resized, proxied, or rehosted.

## 3. The gate

`01_AUDIT/layout.config.json` is the single source of truth:

```json
{
  "fit": ["P030-S01"]
}
```

`generate.js` writes `"layout": "fit"` into that slideshow's generated data and
`SlidesData.gs`. `Code.gs` reads the generated flag, computes the
`--fit-aspect` style from the first image, and passes both to the template; it
does not hardcode slideshow IDs. Classic slides have no `layout` field, no
style attribute, and render `data-layout=""`, so the new CSS stays inert.

## 4. Pilot verification

Local suites:

- `node tools/validate.js` — **3313/3313**, all 48 slideshows, frozen URL hash
  unchanged.
- `node tools/test-all.js` — **347/347**, 48/48 slideshows at their audited
  dimensions; 339 image requests blocked; no image downloads.
- `node tools/test-pilot.js` — **37/37**, P001-S01 regression suite.
- `node tools/test-fit-layout.js` — **75/75**, phone 390 x 1107, Behance
  column 987 x 1107, wide 1335 x 1107, non-gated P020-S01, card ratio,
  centering, no blur or backdrop, no overflow, navigation, fullscreen fill and
  restore. Synthetic 16:9 SVG placeholders are used; no original image is
  downloaded or viewed.

Live deployment (version 8):

- `node tools/test-live-all.js <deployment-url>` — **339/339**, 48/48
  slideshows; no banner; exact URLs; fullscreen.
- `node tools/test-live-fit.js <deployment-url>` — **56/56**, P030-S01 at
  phone, Behance column, and wide sizes through Behance-like outer iframes,
  plus non-gated P020-S01.

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
   clasp deploy -V <next-version> -i <same-deployment-id> -d "Enable phone fit layout on all slideshows"
   ```
4. Re-run `test-live-all.js` and `test-live-fit.js`.

## 6. Revert

The deployment ID and Behance codes stay stable, so reverting never requires
editing Behance.

- **Disable the fit layout everywhere, keep the current code:** set
  `"fit": []` in `01_AUDIT/layout.config.json`, regenerate, validate, push,
  create the next version, and update the same deployment ID. Every slideshow
  returns to `data-layout=""` and the original `cover` behavior.
- **Return to the blurred pilot:** select version 7 in **Deploy → Manage
  deployments** on the existing deployment.
- **Full rollback to the pre-pilot code:** select version 6
  (`Add P024 slideshow and TOOLS USED strip`). The deployment ID and all
  Behance embeds stay unchanged.
- **Source rollback:** revert the pilot commits in Git. The generated
  artifacts and `SlidesData.gs` return to their earlier state.

## 7. Files touched

- `01_AUDIT/layout.config.json` — the opt-in gate (new).
- `04_APPS_SCRIPT/Slideshow.html` — opt-in image-ratio card CSS.
- `04_APPS_SCRIPT/Code.gs` — passes the layout flag and first-image aspect to
  the template.
- `04_APPS_SCRIPT/SlidesData.gs` — generated `layout` flag for P030-S01 only.
- `03_REBUILT_SLIDESHOWS/data/P030-S01.json` — generated flag.
- `03_REBUILT_SLIDESHOWS/preview/*.html` — regenerated from the shared
  template; only P030-S01 activates the layout.
- `tools/generate.js`, `tools/validate.js` — gate, aspect style, and checks.
- `tools/test-fit-layout.js`, `tools/test-live-fit.js` — focused tests.
- `05_BEHANCE_OUTPUT/*` — unchanged; the outer embed codes are identical.
