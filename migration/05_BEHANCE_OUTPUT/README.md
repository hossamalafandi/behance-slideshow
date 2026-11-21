# Behance Embed Output

All 48 slideshows and all 38 TOOLS USED strips are generated and ready for
manual copy/paste.

## Files

| File | Use |
|---|---|
| `ALL_EMBEDS.md` | **Primary copy/paste source.** Every slideshow and TOOLS USED code block, grouped by project, with IDs and dimensions. |
| `ALL_EMBEDS.csv` | Spreadsheet version of the 48 slideshow codes, one row per slideshow. |
| `TOOLS_USED_EMBEDS.md` | All 38 TOOLS USED codes on their own, grouped by project. |
| `TOOLS_USED_EMBEDS.csv` | Spreadsheet version of the 38 TOOLS USED codes. |
| `P001.md` … `P038.md` | Per-project slideshow files. These contain slideshows only; use `ALL_EMBEDS.md` or `TOOLS_USED_EMBEDS.md` for TOOLS USED codes. |

## Deployment

`https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec`

Deployment version 6. Every slideshow code uses one `?slide=<ID>` value and
loads exactly one slideshow. Every TOOLS USED code uses one `?tools=<ID>`
value and loads the original logo strip from the same host. The production
Apps Script deployment is untouched.

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

## Not included

- **P036** has no slideshow, but its TOOLS USED code is included in both
  TOOLS USED files and in `ALL_EMBEDS.md`.
