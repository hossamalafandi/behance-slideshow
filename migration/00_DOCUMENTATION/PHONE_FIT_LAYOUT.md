# Phone fit layout — all 48 slideshows

Status: **approved on the `P030-S01` pilot and rolled out to all 48 slideshows
as version 10 on 2026-11-22. Version 10 keeps the approved layout and makes the
fullscreen fallback quiet.**

## 1. Why

Behance keeps the iframe width and height attributes and wraps the embed in
its own fixed-height container. On a phone the available width shrinks but the
height stays fixed, so the slideshow viewport becomes much taller than it is
wide. The original slideshow uses:

```css
.slide img { width: 100%; height: 100%; object-fit: cover; }
```

With a 16:9 image in a tall phone viewport, `cover` scales the image until it
fills the height and crops most of the left and right sides. P030-S01 was the
pilot because its four images are 16:9 while the Behance frame is tall. The
owner approved that pilot and requested the same behavior everywhere.

## 2. What the layout does

The fix is entirely inside the existing iframe. The outer Behance embed code,
the deployment URL, the iframe width/height, and the image URLs and order are
unchanged.

Every slideshow is opted in through `01_AUDIT/layout.config.json`. The shared
template adds `data-layout="fit"` and a generated `--fit-aspect` value taken
from the first image's width/height. When the iframe viewport is
portrait/taller than wide (`max-aspect-ratio: 1/1`):

- the slideshow card is sized to the image's aspect ratio: full iframe width,
  height derived from `--fit-aspect`, and centered vertically;
- the image uses `object-fit: contain` and fills the card, so the complete
  image is visible with no cropping;
- there is **no blurred backdrop**. The iframe remains transparent, so the
  Behance page background shows above and below the card;
- the 50 px control strip is removed in fit mode; dots and controls overlay the
  card;
- native fullscreen and theater mode still fill the screen and keep the whole
  image visible with black bars. When the browser or Behance app denies native
  fullscreen, theater mode activates quietly without a technical message;
- navigation, dots, counter, hover-reveal, side shadows, the single fullscreen
  button, and the theater-mode fallback are unchanged.

If an image is narrower than a tall frame, the card height is capped at the
iframe height and the image is contained with transparent space at the sides.
This affects only the two `P004-S06` / `P004-S07` fixed-width frames. The whole
image stays visible; nothing is cropped.

On a wide landscape frame the original `cover` behavior is preserved exactly.
For example, at the 987 px Behance column P030-S01 is 987 x 1107 (portrait), so
the card is 987 x 555. At the audited 1335 x 1107 Google Sites frame P030-S01
stays `cover`.

### Tradeoff

Behance's iframe itself stays the fixed audited height (for example 1107 px for
P030-S01). On a 390 px phone the 16:9 card is 390 x 219 and is centered, so
there is empty transparent space above and below it. That empty space is the
unavoidable result of keeping the embed untouched while showing the whole 16:9
image with no blur and no crop. If the owner prefers filling that space, the
previous version 7 used a blurred copy of the same image; version 6 is the
original full-frame `cover` layout.

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
  "fit": "all"
}
```

An explicit array of slideshow IDs is also supported (the pilot used
`["P030-S01"]`), and an empty array disables the fit layout everywhere.
`generate.js` writes `"layout": "fit"` into the generated data and
`SlidesData.gs`. `Code.gs` reads the generated flag, computes the
`--fit-aspect` style from the first image, and passes both to the template; it
does not hardcode slideshow IDs.

## 4. Verification

Local suites:

- `node tools/validate.js` — **3405/3405**, all 48 slideshows, frozen URL hash
  unchanged.
- `node tools/test-all.js` — **347/347**, 48/48 slideshows at their audited
  dimensions; 339 image requests blocked; no image downloads. Tall frames are
  checked as centered image-ratio cards; wide frames keep `cover`.
- `node tools/test-pilot.js` — **37/37**, P001-S01 regression suite.
- `node tools/test-fit-layout.js` — **89/89**, phone 390 x 1107, Behance
  column 987 x 1107, wide 1335 x 1107, a second slideshow (P020-S01) on a phone
  frame, card ratio, centering, no blur or backdrop, no overflow, navigation,
  fullscreen fill and restore. Synthetic 16:9 SVG placeholders are used; no
  original image is downloaded or viewed.

Live deployment (version 15; version 10 introduced the fit layout):

- `node tools/test-live-all.js <deployment-url>` — **339/339**, 48/48
  slideshows; no banner; exact URLs; fullscreen.
- `node tools/test-live-fit.js <deployment-url>` — **64/64**, P030-S01 at
  phone, Behance column, and wide sizes through Behance-like outer iframes,
  plus a second slideshow (P020-S01) on a phone frame.

The layout runs on the same deployment:

```
https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec
```

Existing published embeds load the new version automatically because the
deployment ID did not change. No Behance code needs to be replaced.

## 5. Rollout history

1. Version 7 deployed the pilot with a blurred backdrop for `P030-S01`.
2. The owner rejected the blur. Version 8 replaced it with the image-ratio card
   and kept the pilot on `P030-S01`.
3. The owner reviewed the card on a phone and approved a full rollout.
4. `layout.config.json` was set to `"fit": "all"`, all artifacts were
   regenerated, the suites above passed, and version 9 was deployed under the
   same deployment ID. The Behance codes remain unchanged.
5. Version 10 removed the technical fullscreen fallback note. On browsers that
   deny native fullscreen, the button now enters theater mode quietly. Native
   fullscreen is still used wherever the browser and embedding page allow it.

## 6. Revert

The deployment ID and Behance codes stay stable, so reverting never requires
editing Behance.

- **Disable the fit layout everywhere, keep the current code:** set
  `"fit": []` in `01_AUDIT/layout.config.json`, regenerate, validate, push,
  create the next version, and update the same deployment ID. Every slideshow
  returns to `data-layout=""` and the original `cover` behavior.
- **Return to the single-slideshow pilot:** select version 8 in **Deploy →
  Manage deployments** on the existing deployment (image-ratio card on
  `P030-S01` only).
- **Return to the blurred pilot:** select version 7 (blurred backdrop on
  `P030-S01` only).
- **Full rollback to the pre-layout code:** select version 6
  (`Add P024 slideshow and TOOLS USED strip`). The deployment ID and all
  Behance embeds stay unchanged.
- **Source rollback:** revert the fit-layout commits in Git. The generated
  artifacts and `SlidesData.gs` return to their earlier state.

## 7. Files touched

- `01_AUDIT/layout.config.json` — the global gate (now `"all"`).
- `04_APPS_SCRIPT/Slideshow.html` — image-ratio card CSS.
- `04_APPS_SCRIPT/Code.gs` — passes the layout flag and first-image aspect to
  the template.
- `04_APPS_SCRIPT/SlidesData.gs` — generated `layout` flag for all 48.
- `03_REBUILT_SLIDESHOWS/data/*.json` — generated flags and aspects.
- `03_REBUILT_SLIDESHOWS/preview/*.html` — regenerated from the shared
  template.
- `tools/generate.js`, `tools/validate.js` — gate, aspect style, and checks.
- `tools/test-all.js` — fit-aware full local suite.
- `tools/test-fit-layout.js`, `tools/test-live-fit.js` — focused tests.
- `05_BEHANCE_OUTPUT/*` — unchanged; the outer embed codes are identical.
