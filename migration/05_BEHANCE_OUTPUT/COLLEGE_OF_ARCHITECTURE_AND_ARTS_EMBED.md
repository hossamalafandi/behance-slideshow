# College of Architecture and Arts — standalone Behance embed

Status: **ready for manual copy/paste. Nothing has been published or replaced.**
Built 2026-11-27 and deployed as version 26 under the existing deployment ID.
This page is independent of the 48 slideshow embeds, the 38 TOOLS USED strips,
the Al-Rashed page, the Cellphone Store page, the DK-Apartment page, and the
AB-Apartment page.

## Copy/paste code

Paste this whole block into the College of Architecture and Arts Behance project
as one embed.

```html
<iframe
  src="https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec?page=college-of-architecture-and-arts"
  width="100%"
  height="2800"
  style="border:0;overflow:hidden"
  loading="lazy"
  allowfullscreen
  allow="autoplay; fullscreen; picture-in-picture; encrypted-media">
</iframe>
```

Keep `width="100%"` and `height="2800"`.

## What is on the page

| Section | Content |
|---|---|
| Hero | Original Google Sites hero render, `COLLEGE OF ARCHITECTURE AND ARTS`, `5TH YEAR, FIRST SEMESTER`, `- 2024 -` |
| Overview | The original project description plus the six key facilities from it |
| Presentation boards | The two project boards, side by side on desktop and stacked on phones |
| Renders | The seven original exterior renders in the original order |
| Tools used | 3ds Max, Revit, AutoCAD, Photoshop, Lumion |
| Footer | Subtle `© 2025 HOSSAM ALAFANDI. All rights reserved.` line |

The page has no Google Sites header, logo, navigation, cookie banner, or footer.

## Design

The page follows the project's presentation-board language: near-black
blueprint grid, thin technical rules, amber drawing marks, mono labels, and
large Lexend headings. The hero uses the original Google Sites roof render.

- The two presentation boards sit in technical plates. Clicking a plate opens
  an in-page full-screen viewer with zoom (buttons, wheel, pinch), drag-to-pan,
  double-click reset, and previous/next plate controls. The viewer uses the
  2048 px board file on desktop and the 1280 px file on phones.
- The RENDERS section is a 16:9 stage with a seven-thumbnail film strip. The
  stage supports arrows, film-strip selection, keyboard navigation, swipe, and
  a full-screen viewer. The phone film strip and phone viewer use the 1024 px
  Imgur `h` JPGs; desktop uses the original JPGs.

## Slides and hosting

- The **seven renders** keep their exact Imgur IDs and order:
  `rsQGtCg`, `dX7JCC7`, `KgSoAxJ`, `GoBu1tK`, `RDsNRTZ`, `w2F0hT6`, `HEELBsD`.
  Desktop visitors receive the original JPGs; phone visitors receive the
  1024 px `h` JPGs through `<picture>`.
- The **hero image** and the **two presentation boards** are copied from Google
  Sites because Google Sites blocks cross-site hotlinking. Eight optimized
  derivatives live under `assets/college-of-architecture-and-arts/`:
  - `hero-1920.jpg`, `hero-768.jpg`
  - `board-1-2048.jpg`, `board-1-1280.jpg`, `board-1-768.jpg`
  - `board-2-2048.jpg`, `board-2-1280.jpg`, `board-2-768.jpg`

  They are served through jsDelivr at
  `https://cdn.jsdelivr.net/gh/hossamalafandi/behance-slideshow@main/assets/college-of-architecture-and-arts/`.
- The **5 tool logos** keep their exact Imgur PNG URLs.
- There are no videos on this page.

## Layout and height

The embed is **987 × 2800** on the Behance desktop column and **390 × 2800**
on a phone. Both layouts fill exactly 2800 px, so there is no large empty space
at the page end.

- Desktop: two board columns, a wide render stage, and one row of five tools.
- Phone: boards stack full width, the render stage and film strip stay full
  width, and the tools row stays on one line.

## Deployment

The page uses the existing standalone Apps Script deployment under the same
deployment ID, with the new `?page=college-of-architecture-and-arts` route. It
is live as version 26:

```
https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec?page=college-of-architecture-and-arts
```

The existing routes are unchanged:

- `?page=al-rashed`, `?page=cellphone-store`, `?page=dk-apartment`, and
  `?page=ab-apartment` still return their pages.
- `?slide=P004-S01` still returns exactly that slideshow.
- `?tools=P004` still returns exactly that TOOLS USED strip.
- Missing, repeated, mixed, or unknown parameters still return the neutral
  error page.

## How to verify

From `migration/tools`:

```powershell
node generate-college-of-architecture.js
node test-college-of-architecture.js
```

`test-college-of-architecture.js` loads the page inside Behance-like sandboxed
frames at 987×2800 and 390×2800 and checks the two boards, board viewer, seven
renders, film strip, render viewer, tools, height, and navigation. It stubs
Imgur and the fonts. Result: **69/69**.

The live deployment is covered by:

```powershell
node test-live-college-of-architecture.js https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec
```

It verifies the 8 jsDelivr page assets, the new page route, the unchanged
Al-Rashed/Cellphone/DK/AB/slide/tools routes, both Behance-like frames, and the
board and render viewers. Result: **76/76**.

## Rollback

- **Remove the embed only:** delete the iframe block from the Behance project.
- **Revert the page:** revert the College of Architecture and Arts commit and
  deploy the previous Apps Script version (version 25) under the same
  deployment ID. The other project-page routes, 48 `?slide=`, and 38 `?tools=`
  routes are unaffected.
- **Keep the other pages:** do not replace or edit the existing embeds.

## Notes

- The board viewer and the render viewer are local to this iframe.
- The page is static HTML served by Apps Script; it uses no cookies, storage,
  messaging, or external scripts of its own.
- The page reveals its sections on load and has a timed fallback, so content
  below the first viewport is never left hidden inside the fixed-height iframe.
