# Al-Rashed Project — standalone Behance embed

Status: **ready for manual copy/paste. Nothing has been published or replaced.**
Built 2026-11-24 and deployed as version 22 under the existing deployment ID.
This page is independent of the 48 slideshow embeds and the 38 TOOLS USED
strips; none of those codes or image URLs changed.

The page is a clean standalone version of the Al-Rashed Google Sites project
page without the Google Sites header, navigation, logo, or footer. It uses the
same content, images, links, and typography, and it is responsive for the
Behance desktop column and phone.

## Copy/paste code

Paste this whole block into the Al-Rashed Behance project as one embed. Do not
combine it with a slideshow code.

```html
<iframe
  src="https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec?page=al-rashed"
  width="100%"
  height="2980"
  style="border:0;overflow:hidden"
  loading="lazy"
  allowfullscreen
  allow="fullscreen">
</iframe>
```

- **Width:** `100%` so it follows Behance's project column.
- **Height:** `2980` px. This is deliberate, not a placeholder. It fills the
  987 px Behance desktop column and the 390 px phone column exactly, with no
  blank strip and no scrollbar. At widths above roughly 1080 px the natural page
  is slightly taller, so the iframe gets a small internal scroll instead of
  stretching the layout.
- **Fullscreen:** `allowfullscreen` and `allow="fullscreen"` are required for
  the RENDERS viewer. Native fullscreen is tried first; if Behance or the phone
  browser denies it, the viewer expands into the approved quiet theater mode.

## What is on the page

| Section | Content |
|---|---|
| Hero | Original hero image, `AL-RASHED PROJECT`, `SAUDI ARABIA`, `- 2024 -` |
| Overview | The original project description |
| Renders | 17 renders in the original order, with arrows, dots, counter, keyboard arrows, swipe, and fullscreen; on phones the fullscreen button opens an in-page viewer that rotates the render to use the tall screen |
| Real photos | The 3 original real photos in the approved 1:2.05 desktop grid, stacked on phone |
| Location | The original Google Maps embed |
| Tools used | 3ds Max, Revit, AutoCAD, Photoshop, Lumion |
| Footer | Subtle `© 2025 HOSSAM ALAFANDI. All rights reserved.` line |

The page has no Google Sites header, logo, navigation, cookie banner, or
footer. It contains no links to the Google Sites portfolio and no gallery or
index of the 48 slideshows.

## Images and hosting

- The **17 renders** keep their exact Imgur IDs and original order. Desktop
  visitors receive the full-resolution originals
  (`https://i.imgur.com/<id>.jpeg`, 3840×2160); phone visitors receive the
  existing 1024×576 `h` variants through `<picture>`, so the phone page stays
  lightweight.
- The **5 tool logos** keep their exact Imgur PNG URLs.
- The **hero and 3 real photos** are the only copied images. Google Sites serves
  them with `Cross-Origin-Resource-Policy: same-site`, so they cannot be
  hotlinked into a Behance iframe. The owner approved this page-only exception.
  Nine optimized derivatives are committed under `assets/al-rashed/` and served
  through jsDelivr:
  `https://cdn.jsdelivr.net/gh/hossamalafandi/behance-slideshow@main/assets/al-rashed/`.
  Phone visitors receive 768 px versions; desktop visitors receive 1280/1920 px
  versions.
- The 48 slideshows still use only their original remote URLs. No slideshow
  image was copied, resized, or rehosted.

## Phone fullscreen

Behance's phone app blocks native fullscreen, so the fullscreen button uses a
custom in-page viewer on phones:

- it stays inside the page, so the page height does not collapse or jump;
- the current 16:9 render is rotated 90° to use the tall phone screen, with a
  **Rotate your phone for a larger view** hint;
- when the phone is turned landscape, the render switches to upright and fills
  the screen;
- the viewer loads the full-resolution original for the current render on
  demand, so the enlarged image stays sharp; the slideshow itself still uses
  the lightweight 1024×576 `h` files on phones;
- close with the **×** button, Escape, or a tap on the black area; swipe or use
  the arrows to change renders.

Desktop still uses native fullscreen, with the quiet theater fallback when the
browser blocks it.

## Deployment

The page uses the existing standalone Apps Script deployment under the same
deployment ID, with the new `?page=al-rashed` route. It is live as version 22:

```
https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec?page=al-rashed
```

The existing routes are unchanged:

- `?slide=P001-S01` still returns exactly that slideshow.
- `?tools=P001` still returns exactly that TOOLS USED strip.
- Missing, repeated, mixed, or unknown parameters still return the neutral
  error page.

## How to verify

From `migration/tools`:

```powershell
node generate-al-rashed.js
node test-al-rashed.js
node validate.js
```

`test-al-rashed.js` loads the page inside Behance-like sandboxed frames at
987×2980 and 390×2980, checks exact URLs and order, checks that desktop frames
request the full-resolution 3840×2160 originals and phone frames the 1024×576
`h` variants, checks that both frames fill 2980 px with no overflow, and
exercises navigation, dots, keyboard, swipe, native fullscreen, the theater
fallback, and the phone in-page fullscreen viewer. It fulfills every Imgur
request with a synthetic image and every map request with a stub, so no original
image or map tile is downloaded.

The live deployment is also covered:

```powershell
node test-live-al-rashed.js https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec
```

It verifies all 9 jsDelivr files, both Behance-like frames, the full-resolution
desktop renders, the phone `h` sources, the phone in-page fullscreen viewer,
navigation, fullscreen, the map, and the unchanged `?slide=` / `?tools=` routes.
Result: **135/135**. The full live regression is also green: **339/339** for all
48 slideshows and **64/64** for the phone fit layout.

## Rollback

- **Remove the embed only:** delete the iframe block from the Behance project.
  The page remains deployed but unreferenced.
- **Revert the page:** revert the Al-Rashed commit and deploy the previous
  Apps Script version (version 12) under the same deployment ID. The 48
  `?slide=` and 38 `?tools=` codes are unaffected because their routes, data,
  and image URLs are untouched.
- **Keep the slideshows:** do not replace, reorder, or edit the existing 48
  slideshow codes. This deliverable is a separate page embed.

## Notes

- The map is the original `maps-api-ssl.google.com` embed. If a network or
  regional policy blocks Google Maps, only the map frame stays blank; the rest
  of the page is unaffected.
- The copyright line is provisional and can be removed from the page generator
  without touching any other section.
- The page is static HTML served by Apps Script; it uses no cookies, storage,
  messaging, or external scripts of its own. Apps Script injects its standard
  `jsapi` bootstrap script into the served frame.
