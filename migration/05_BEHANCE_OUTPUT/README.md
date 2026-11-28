# Behance Embed Output

All 48 slideshows, all 38 TOOLS USED strips, and the six standalone project
pages are generated and ready for manual copy/paste.

## Files

| File | Use |
|---|---|
| `ALL_EMBEDS.md` | **Primary copy/paste source.** Every slideshow and TOOLS USED code block, grouped by project, with IDs and dimensions. |
| `ALL_EMBEDS.csv` | Spreadsheet version of the 48 slideshow codes, one row per slideshow. |
| `TOOLS_USED_EMBEDS.md` | All 38 TOOLS USED codes on their own, grouped by project. |
| `TOOLS_USED_EMBEDS.csv` | Spreadsheet version of the 38 TOOLS USED codes. |
| `AL_RASHED_EMBED.md` | **Standalone Al-Rashed project page code**, usage notes, image exception, and rollback. |
| `CELLPHONE_STORE_EMBED.md` | **Standalone Cellphone Store project page code**, Vimeo notes, image exception, and rollback. |
| `DK_APARTMENT_EMBED.md` | **Standalone DK-Apartment project page code**, Vimeo notes, image exception, and rollback. |
| `AB_APARTMENT_EMBED.md` | **Standalone AB-Apartment project page code**, room layout, image exception, and rollback. |
| `COLLEGE_OF_ARCHITECTURE_AND_ARTS_EMBED.md` | **Standalone College of Architecture and Arts page code**, board and render viewers, image exception, and rollback. |
| `AFRICAN_CAFETERIA_EMBED.md` | **Standalone African Cafeteria page code**, material palette, board and render viewers, image exception, and rollback. |
| `P001.md` … `P038.md` | Per-project slideshow files. These contain slideshows only; use `ALL_EMBEDS.md` or `TOOLS_USED_EMBEDS.md` for TOOLS USED codes. |

## Deployment

`https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec`

Deployment version 29. Every slideshow code uses one `?slide=<ID>` value and
loads exactly one slideshow. Every TOOLS USED code uses one `?tools=<ID>`
value and loads the original logo strip from the same host. The standalone pages
use one `?page=<code>` value. The production Apps Script deployment is
untouched.

## How to use

### Slideshows

1. Open `ALL_EMBEDS.md` (or the per-project file for the project you are editing).
2. Find the permanent slideshow ID, for example `P001-S01`.
3. Copy the entire `<iframe>…</iframe>` code block.
4. Paste it into the matching Behance project section.
5. Keep one slideshow per embed; do not combine codes.

The declared width and height are the values Behance reads. Frames at or
above 1200 px use `width="100%"`; narrower frames keep their audited pixel
width. Heights are per slideshow and must not be changed.

### TOOLS USED

1. In `ALL_EMBEDS.md`, scroll to the matching project and find the
   `Pxxx-TOOLS — TOOLS USED software logos` heading.
2. Copy the entire `<iframe>…</iframe>` code block.
3. Paste it into the TOOLS USED embed on that Behance project.

Each strip is 127 px high with 4–5 logos. The iframe loads the exact
original logo URLs and CSS; the images are not copied or rehosted.

### Al-Rashed project page

1. Open `AL_RASHED_EMBED.md`.
2. Copy the single `<iframe>…</iframe>` block.
3. Paste it into the Al-Rashed Behance project as one embed.
4. Keep `width="100%"` and `height="2980"`; the height is sized to the Behance
   desktop column and phone. Do not combine it with a slideshow code.

### Cellphone Store project page

1. Open `CELLPHONE_STORE_EMBED.md`.
2. Copy the single `<iframe>…</iframe>` block.
3. Paste it into the Cellphone Store Behance project as one embed.
4. Keep `width="100%"` and `height="13320"`; the height covers the full
   desktop and phone layout. Do not combine it with a slideshow code.

### DK-Apartment project page

1. Open `DK_APARTMENT_EMBED.md`.
2. Copy the single `<iframe>…</iframe>` block.
3. Paste it into the DK-Apartment Behance project as one embed.
4. Keep `width="100%"` and `height="2900"`. Do not combine it with a slideshow
   code.

### AB-Apartment project page

1. Open `AB_APARTMENT_EMBED.md`.
2. Copy the single `<iframe>…</iframe>` block.
3. Paste it into the AB-Apartment Behance project as one embed.
4. Keep `width="100%"` and `height="2750"`. Do not combine it with a slideshow
   code.

### College of Architecture and Arts project page

1. Open `COLLEGE_OF_ARCHITECTURE_AND_ARTS_EMBED.md`.
2. Copy the single `<iframe>…</iframe>` block.
3. Paste it into the College of Architecture and Arts Behance project as one
   embed.
4. Keep `width="100%"` and `height="2800"`. Do not combine it with a slideshow
   code.

### African Cafeteria project page

1. Open `AFRICAN_CAFETERIA_EMBED.md`.
2. Copy the single `<iframe>…</iframe>` block.
3. Paste it into the African Cafeteria Behance project as one embed.
4. Keep `width="100%"` and `height="3980"`. Do not combine it with a slideshow
   code.

Live verification: the Al-Rashed page suite passes **135/135**, the Cellphone
Store page suite passes **102/102** (local **76/76**), the DK-Apartment page
suite passes **57/57** locally (live **62/62**), the AB-Apartment page suite
passes **56/56** locally (live **57/57**), the College of Architecture and Arts
page suite passes **69/69** locally (live **76/76**), the African Cafeteria page
suite passes **72/72** locally (live **pending**), the all-slideshow suite
passes **339/339**, and the phone fit suite passes **64/64** against version 26.

## Not included

- **P036** has no slideshow, but its TOOLS USED code is included in both
  TOOLS USED files and in `ALL_EMBEDS.md`.
