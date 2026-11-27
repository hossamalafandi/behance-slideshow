# AB-Apartment — standalone Behance embed

Status: **ready for manual copy/paste. Nothing has been published or replaced.**
Built 2026-11-27 and deployed as version 24 under the existing deployment ID.
This page is independent of the 48 slideshow embeds, the 38 TOOLS USED strips,
the Al-Rashed page, the Cellphone Store page, and the DK-Apartment page.

## Copy/paste code

Paste this whole block into the AB-Apartment Behance project as one embed.

```html
<iframe
  src="https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec?page=ab-apartment"
  width="100%"
  height="2750"
  style="border:0;overflow:hidden"
  loading="lazy"
  allowfullscreen
  allow="autoplay; fullscreen; picture-in-picture; encrypted-media">
</iframe>
```

Keep `width="100%"` and `height="2750"`.

## What is on the page

| Section | Content |
|---|---|
| Hero | Original hero image, `AB-APARTMENT`, `SYRIA, HAMA`, `- 2026 -` |
| Overview | The original 150 m² apartment description |
| Rooms | 7 room slideshows in the original two-column order: LIVING ROOM, RECIPTION, GIRLS BEDROOM / MASTER BEDROOM, KITCHEN, BOYS BEDROOM, BATHROOM |
| Tools used | 3ds Max, AutoCAD, Corona, Photoshop |
| Footer | Subtle `© 2025 HOSSAM ALAFANDI. All rights reserved.` line |

The page has no Google Sites header, logo, navigation, cookie banner, or footer.

## Slides and hosting

- The **37 room images** keep their exact Imgur IDs and order across the seven
  slideshows. Desktop visitors receive the original JPG/PNG files; phone
  visitors receive the 1024 px `h` JPGs through `<picture>`.
- The **hero image** is copied from Google Sites because Google Sites blocks
  cross-site hotlinking. Two optimized derivatives are stored under
  `assets/ab-apartment/` and served through jsDelivr:
  `https://cdn.jsdelivr.net/gh/hossamalafandi/behance-slideshow@main/assets/ab-apartment/`.
- The **4 tool logos** keep their exact Imgur PNG URLs.
- There are no videos on this page.

## Layout

- Desktop: two columns, matching the original page. The left column has LIVING
  ROOM, RECIPTION, GIRLS BEDROOM; the right column has MASTER BEDROOM, KITCHEN,
  BOYS BEDROOM, BATHROOM.
- Phone: one compact centered column so the seven portrait slideshows fit
  without a large empty space at the page end.

## Deployment

The page uses the existing standalone Apps Script deployment under the same
deployment ID, with the new `?page=ab-apartment` route. It is live as version 24:

```
https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec?page=ab-apartment
```

The existing routes are unchanged:

- `?page=al-rashed` still returns the Al-Rashed page.
- `?page=cellphone-store` still returns the Cellphone Store page.
- `?page=dk-apartment` still returns the DK-Apartment page.
- `?slide=P004-S01` still returns exactly that slideshow.
- `?tools=P004` still returns exactly that TOOLS USED strip.
- Missing, repeated, mixed, or unknown parameters still return the neutral
  error page.

## How to verify

From `migration/tools`:

```powershell
node generate-ab-apartment.js
node test-ab-apartment.js
```

`test-ab-apartment.js` loads the page inside Behance-like sandboxed frames at
987×2750 and 390×2750, checks the 7 room order, all 37 slides, the seven
slideshow tracks, both hero files, the tools, and navigation. It stubs Imgur
and the fonts. Result: **49/49**.

The live deployment is covered by:

```powershell
node test-live-ab-apartment.js https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec
```

It verifies the 2 jsDelivr hero files, the new page route, the unchanged
Al-Rashed/Cellphone/DK/slide/tools routes, both Behance-like frames, and the
seven slideshows. Result: **PENDING**.

## Rollback

- **Remove the embed only:** delete the iframe block from the Behance project.
- **Revert the page:** revert the AB-Apartment commit and deploy the previous
  Apps Script version (version 22) under the same deployment ID. The other
  project-page routes, 48 `?slide=`, and 38 `?tools=` routes are unaffected.
- **Keep the other pages:** do not replace or edit the existing embeds.

## Notes

- The slideshow arrows, dots, counter, keyboard, and swipe navigation work on
  each room independently.
- The page is static HTML served by Apps Script; it uses no cookies, storage,
  messaging, or external scripts of its own.
