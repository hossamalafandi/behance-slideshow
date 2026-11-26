# DK-Apartment — standalone Behance embed

Status: **ready for manual copy/paste. Nothing has been published or replaced.**
Built 2026-11-26 and deployed as version 21 under the existing deployment ID.
This page is independent of the 48 slideshow embeds, the 38 TOOLS USED strips,
the Al-Rashed page, and the Cellphone Store page.

The page is a clean standalone version of the DK-Apartment Google Sites project
page without the Google Sites header, navigation, logo, or footer.

## Copy/paste code

Paste this whole block into the DK-Apartment Behance project as one embed.

```html
<iframe
  src="https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec?page=dk-apartment"
  width="100%"
  height="4400"
  style="border:0;overflow:hidden"
  loading="lazy"
  allowfullscreen
  allow="autoplay; fullscreen; picture-in-picture; encrypted-media">
</iframe>
```

Keep `width="100%"` and `height="4400"`.

## What is on the page

| Section | Content |
|---|---|
| Hero | Original hero image, `DK-APARTMENT`, `SYRIA, HAMA`, `- 2026 -` |
| Overview | The original apartment description |
| Presentation | The original 38-image slideshow, with arrows, dots, counter, keyboard, and swipe |
| Images | The original IMAGES masonry grid: three on-site photos plus the two videos, `IMG_3011` and `IMG_3045`, and the red caption |
| Tools used | 3ds Max, AutoCAD, Corona, Photoshop |
| Footer | Subtle `© 2025 HOSSAM ALAFANDI. All rights reserved.` line |

The page has no Google Sites header, logo, navigation, cookie banner, or footer.
It contains no links to the Google Sites portfolio and no gallery or index of
the 48 slideshows.

## Images, videos, and hosting

- The **38 presentation images** keep their exact Imgur IDs and order. Desktop
  visitors receive the original JPGs; phone visitors receive the 1024 px `h`
  JPGs through `<picture>`.
- The **hero image and 3 on-site photos** are copied from Google Sites because
  Google Sites blocks cross-site hotlinking. Eight optimized derivatives are
  stored under `assets/dk-apartment/` and served through jsDelivr:
  `https://cdn.jsdelivr.net/gh/hossamalafandi/behance-slideshow@main/assets/dk-apartment/`.
- The IMAGES section keeps the original three-column masonry arrangement on
  desktop: two photos in the left column, one photo and `IMG_3011` in the middle,
  and `IMG_3045` in the wider right column. On phones the photos and videos
  stack.
- The **two videos** use the owner's Vimeo player embeds:
  - `IMG_3011` — Vimeo `1250270804`
  - `IMG_3045` — Vimeo `1250270805`
  Google Drive is not used because its previews were blank in the
  Behance-like sandbox.
- The **4 tool logos** keep their exact Imgur PNG URLs.

## Deployment

The page uses the existing standalone Apps Script deployment under the same
deployment ID, with the new `?page=dk-apartment` route. It is live as version 21:

```
https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec?page=dk-apartment
```

The existing routes are unchanged:

- `?page=al-rashed` still returns the Al-Rashed page.
- `?page=cellphone-store` still returns the Cellphone Store page.
- `?slide=P003-S01` still returns exactly that slideshow.
- `?tools=P003` still returns exactly that TOOLS USED strip.
- Missing, repeated, mixed, or unknown parameters still return the neutral
  error page.

## How to verify

From `migration/tools`:

```powershell
node generate-dk-apartment.js
node test-dk-apartment.js
```

`test-dk-apartment.js` loads the page inside Behance-like sandboxed frames at
987×4400 and 390×4400, checks the exact 38-slide order, both Vimeo IDs, the
three copied photos, the two copied hero files, the tools, and the slideshow
navigation. It stubs Imgur, Vimeo, and the fonts, so no original media is
downloaded. Result: **57/57**.

The live deployment is covered by:

```powershell
node test-live-dk-apartment.js https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec
```

It verifies the 8 jsDelivr hero/photo files, the new page route, the unchanged
Al-Rashed/Cellphone/slide/tools routes, both Behance-like frames, and the
slideshow. Result: **62/62**.

## Rollback

- **Remove the embed only:** delete the iframe block from the Behance project.
- **Revert the page:** revert the DK-Apartment commit and deploy the previous
  Apps Script version (version 19) under the same deployment ID. The 48
  `?slide=`, 38 `?tools=`, Al-Rashed, and Cellphone routes are unaffected.
- **Keep the other pages:** do not replace or edit the existing Al-Rashed or
  Cellphone Store embeds.

## Notes

- The two-video row is side by side on desktop and stacked one per row on
  phones.
- The videos are Vimeo embeds, so they need normal Vimeo playback access.
- The page is static HTML served by Apps Script; it uses no cookies, storage,
  messaging, or external scripts of its own. Apps Script injects its standard
  `jsapi` bootstrap script into the served frame.
