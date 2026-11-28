# African Cafeteria — standalone Behance embed

Status: **ready for manual copy/paste. Nothing has been published or replaced.**
Built 2026-11-28 and deployed as version 29 under the existing deployment ID.
This page is independent of the 48 slideshow embeds, the 38 TOOLS USED strips,
and the other standalone project pages.

## Copy/paste code

Paste this whole block into the African Cafeteria Behance project as one embed.

```html
<iframe
  src="https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec?page=african-cafeteria"
  width="100%"
  height="3980"
  style="border:0;overflow:hidden"
  loading="lazy"
  allowfullscreen
  allow="autoplay; fullscreen; picture-in-picture; encrypted-media">
</iframe>
```

Keep `width="100%"` and `height="3980"`.

## What is on the page

| Section | Content |
|---|---|
| Hero | Original Google Sites ceiling render, `ACADEMIC PROJECT`, `African Cafeteria`, `5TH YEAR, FIRST SEMESTER`, `- 2024 -`, and a Tea House stamp |
| Concept | The original three-paragraph project description, split into Proposal / Materiality / Atmosphere, with the original social-and-cultural-hub line as a pull quote |
| Material palette | Clay, wood, brick, straw and plants, each with a tactile CSS swatch and a short descriptor from the research |
| Presentation boards | The two original boards, side by side on desktop and stacked on phones |
| Renders | The eight original interior renders in the original order |
| Tools used | 3ds Max, AutoCAD, Corona, Photoshop |
| Footer | Subtle `© 2025 HOSSAM ALAFANDI. All rights reserved.` line |

The page has no Google Sites header, logo, navigation, cookie banner, or footer.

## Design

The page uses the project's warm African interior language: espresso brown,
ochre, rust, clay and moss, a Fraunces serif display face, mono technical
labels, a triangular textile motif, and a Tea House stamp taken from the
project's own boards.

- The material palette is a tactile row of five swatches. On phones it becomes
  a horizontal swipe rail so it does not consume a full column of height.
- Each presentation board opens an in-page full-screen viewer with zoom
  (buttons, wheel, pinch), drag-to-pan, double-click reset, and previous/next
  plate controls. The viewer uses the 2048 px board file on desktop and the
  1280 px file on phones.
- The RENDERS section is a near-square 25:24 stage with an eight-thumbnail film
  strip, arrows, keyboard navigation, swipe, and a full-screen viewer. The
  phone stage, film strip and viewer use the 1024 px Imgur `h` JPGs; desktop
  uses the original JPGs.

## Slides and hosting

- The **eight renders** keep their exact Imgur IDs and order:
  `mqO7Tux`, `5yiTXg8`, `JqSmE5t`, `dOOMI2U`, `vXf69lo`, `9ihs7gg`,
  `GWAWab9`, `ZrLYu6n`.
- The **hero image** and the **two presentation boards** are copied from Google
  Sites because Google Sites blocks cross-site hotlinking. Eight optimized
  derivatives live under `assets/african-cafeteria/`:
  - `hero-1920.jpg`, `hero-768.jpg`
  - `board-1-2048.jpg`, `board-1-1280.jpg`, `board-1-768.jpg`
  - `board-2-2048.jpg`, `board-2-1280.jpg`, `board-2-768.jpg`

  They are served through jsDelivr at
  `https://cdn.jsdelivr.net/gh/hossamalafandi/behance-slideshow@main/assets/african-cafeteria/`.
- The **4 tool logos** keep their exact Imgur PNG URLs.
- There are no videos on this page.

## Layout and height

The embed is **987 × 3980** on the Behance desktop column and **390 × 3980**
on a phone. Both layouts fill exactly 3980 px, so there is no large empty space
at the page end.

- Desktop: two board columns, a centered 780 px render stage, five material
  cards in one row, and four tools with labels.
- Phone: a single editorial column, a swipeable material rail, stacked boards,
  a full-width render stage and film strip, and four tools in one row.

## Deployment

The page uses the existing standalone Apps Script deployment under the same
deployment ID, with the new `?page=african-cafeteria` route. It is live as
version 29:

```
https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec?page=african-cafeteria
```

The existing routes are unchanged:

- `?page=al-rashed`, `?page=cellphone-store`, `?page=dk-apartment`,
  `?page=ab-apartment`, and `?page=college-of-architecture-and-arts` still
  return their pages.
- `?slide=P004-S01` still returns exactly that slideshow.
- `?tools=P004` still returns exactly that TOOLS USED strip.
- Missing, repeated, mixed, or unknown parameters still return the neutral
  error page.

## How to verify

From `migration/tools`:

```powershell
node generate-african-cafeteria.js
node test-african-cafeteria.js
```

`test-african-cafeteria.js` loads the page inside Behance-like sandboxed
frames at 987×3980 and 390×3980 and checks the hero, three overview paragraphs,
five materials, two boards, board viewer, eight renders, film strip, render
viewer, tools, height, and navigation. It stubs Imgur and the fonts. Result:
**72/72**.

The live deployment is covered by:

```powershell
node test-live-african-cafeteria.js https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec
```

It verifies the 8 jsDelivr page assets, the new page route, the unchanged
Al-Rashed/Cellphone/DK/AB/College/slide/tools routes, both Behance-like
frames, and the board and render viewers. Result: **79/79**.

## Rollback

- **Remove the embed only:** delete the iframe block from the Behance project.
- **Revert the page:** revert the African Cafeteria commit and deploy the
  previous Apps Script version (version 28) under the same deployment ID. The
  other project-page routes, 48 `?slide=`, and 38 `?tools=` routes are
  unaffected.
- **Keep the other pages:** do not replace or edit the existing embeds.

## Notes

- The board viewer and the render viewer are local to this iframe.
- The page is static HTML served by Apps Script; it uses no cookies, storage,
  messaging, or external scripts of its own.
- The page reveals its sections on load and has a timed fallback, so content
  below the first viewport is never left hidden inside the fixed-height iframe.
