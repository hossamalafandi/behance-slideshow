# Cellphone Store — standalone Behance embed

Status: **ready for manual copy/paste. Nothing has been published or replaced.**
Built 2026-11-25 and deployed as version 24 under the existing deployment ID.
This page is independent of the 48 slideshow embeds, the 38 TOOLS USED strips,
and the Al-Rashed page.

The page is a clean standalone version of the Cellphone Store Google Sites
project page without the Google Sites header, navigation, logo, or footer. It
uses the original content, images, videos, map, and typography, and it is
responsive for the Behance desktop column and phone.

## Copy/paste code

Paste this whole block into the Cellphone Store Behance project as one embed.
Do not combine it with a slideshow code.

```html
<iframe
  src="https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec?page=cellphone-store"
  width="100%"
  height="13320"
  style="border:0;overflow:hidden"
  loading="lazy"
  allowfullscreen
  allow="autoplay; fullscreen; picture-in-picture; encrypted-media">
</iframe>
```

Keep `width="100%"` and `height="13320"`. The height is sized to the full
desktop and phone layouts; the page does not use an internal scrollbar.

## What is on the page

| Section | Content |
|---|---|
| Hero | Original hero image, `CELLPHONE STORE`, `SYRIA, HAMA`, `- 2026 -` |
| Overview | The original 13 m² store description |
| Work development stages | 7 numbered stages with their original text, videos, and photos |
| Renders | The original 11-render slideshow in the planning stage, with arrows, dots, counter, keyboard, swipe, and an in-page fullscreen viewer on phones |
| Render VS Reality | The 4 original render/reality comparisons |
| Location | The original Google Maps embed |
| Tools used | 3ds Max, AutoCAD, Corona, Photoshop |
| Footer | Subtle `© 2025 HOSSAM ALAFANDI. All rights reserved.` line |

The page has no Google Sites header, logo, navigation, cookie banner, or
footer. It contains no links to the Google Sites portfolio and no gallery or
index of the 48 slideshows.

## Images and hosting

- The **21 stage/render-reality photos** are copied from Google Sites because
  Google Sites serves them with cross-site blocking headers. They are stored as
  44 optimized JPEG derivatives under `assets/cellphone-store/`:
  - 768 px phone versions
  - 1280 px desktop versions
  - 1920/768 px hero versions
  They are served from the public repository through jsDelivr:
  `https://cdn.jsdelivr.net/gh/hossamalafandi/behance-slideshow@main/assets/cellphone-store/`.
- The **11 RENDERS slideshow images** keep their exact Imgur IDs and order.
  Desktop visitors receive the original JPGs; phone visitors receive the
  existing 1024 px `h` JPGs through `<picture>`.
- The **4 tool logos** keep their exact Imgur PNG URLs.
- The **9 videos** use the owner's Vimeo player embeds, not Google Drive. The
  Drive previews were tested inside the Behance-like sandbox and stayed blank
  or stuck loading, so they are not used.

## Videos

Each video is embedded by its Vimeo ID with a 9:16 frame:

| Stage | Video | Vimeo ID |
|---|---|---|
| 1-Inspecting | IMG_3040 | 1245908917 |
| 3-Site Preperation | IMG_3208 | 1245909044 |
| 3-Site Preperation | IMG_3211 | 1245909094 |
| 4-Electricty | IMG_3219 3 | 1245909398 |
| 4-Electricty | IMG_3231 | 1245912603 |
| 5-Flooring | IMG_3314 | 1245912647 |
| 5-Flooring | IMG_3823 | 1245912852 |
| 6-Cabinetry Works | IMG_4098 | 1245913033 |
| 6-Cabinetry Works | IMG_4100 | 1245913587 |

The videos should remain public or unlisted-but-embeddable in Vimeo. The
Vimeo profile itself does not need to stay public after the links are in the
page.

## Deployment

The page uses the existing standalone Apps Script deployment under the same
deployment ID, with the new `?page=cellphone-store` route. It is live as
version 24:

```
https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec?page=cellphone-store
```

The existing routes are unchanged:

- `?page=al-rashed` still returns the Al-Rashed page.
- `?slide=P002-S01` still returns exactly that slideshow.
- `?tools=P002` still returns exactly that TOOLS USED strip.
- Missing, repeated, mixed, or unknown parameters still return the neutral
  error page.

## How to verify

From `migration/tools`:

```powershell
node generate-cellphone-store.js
node test-cellphone-store.js
```

`test-cellphone-store.js` loads the page inside Behance-like sandboxed frames
at 987×13320 and 390×13320, checks the exact stage order, all 9 Vimeo IDs, the
21 copied shots, the 11-slide slideshow, the map, the 4 tools, the 44 local
assets, and the slideshow navigation. It stubs Imgur, Vimeo, the map, and the
fonts, so no original media is downloaded.

The live deployment is covered by:

```powershell
node test-live-cellphone-store.js https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec
```

It verifies the 44 jsDelivr files, the new page route, the unchanged
Al-Rashed/slide/tools routes, both Behance-like frames, and the slideshow.
Result: **102/102**. The local page suite passes **76/76**.

## Rollback

- **Remove the embed only:** delete the iframe block from the Behance project.
  The page remains deployed but unreferenced.
- **Revert the page:** revert the Cellphone Store commit and deploy the
  previous Apps Script version (version 15) under the same deployment ID. The
  48 `?slide=`, 38 `?tools=`, and Al-Rashed routes are unaffected because their
  data and image URLs are untouched.
- **Keep the slideshows:** do not replace, reorder, or edit the existing 48
  slideshow codes or the Al-Rashed page embed.

## Notes

- The RENDERS slideshow has a fullscreen button. On phones it opens an
  in-page viewer that uses the phone's vertical space, shows the portrait
  render whole, and uses a blurred version of the same render as the backdrop.
  Arrows, swipe, the counter, and Escape all work in that viewer.
- On phones, stages with two videos stack the videos one per row instead of
  forcing them side by side.
- The videos are portrait phone recordings. Two-video stages are stacked on
  phones so each video gets the full content width.
- The map is the original `maps-api-ssl.google.com` embed. If a network or
  regional policy blocks Google Maps, only the map frame stays blank.
- The page is static HTML served by Apps Script; it uses no cookies, storage,
  messaging, or external scripts of its own. Apps Script injects its standard
  `jsapi` bootstrap script into the served frame.
