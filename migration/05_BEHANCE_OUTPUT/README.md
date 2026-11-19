# Behance Embed Output

All 47 slideshows are generated, deployed, and ready for manual copy/paste.

## Files

| File | Use |
|---|---|
| `ALL_EMBEDS.md` | **Primary copy/paste source.** Every code block, grouped by project, with IDs and dimensions. |
| `ALL_EMBEDS.csv` | Spreadsheet version: one row per slideshow with a single-line embed code. |
| `P001.md` … `P038.md` | Per-project files, in Behance page order. Use these when working one project at a time. |

## Deployment

`https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec`

Deployment version 3. Every code uses one `?slide=<ID>` value and loads
exactly one slideshow. The production Apps Script deployment is untouched.

## How to use

1. Open `ALL_EMBEDS.md` (or the per-project file for the project you are editing).
2. Find the permanent slideshow ID, for example `P001-S01`.
3. Copy the entire `<iframe>…</iframe>` code block.
4. Paste it into the matching Behance project section.
5. Keep one slideshow per embed; do not combine codes.

The declared width and height are the values Behance reads. Frames at or
above 1200 px use `width="100%"`; narrower frames keep their audited pixel
width. Heights are per slideshow and must not be changed.

## Not included

- **P024** is blocked: its source link truncates to `http://ww`, so no URL
  exists. The permanent ID is reserved; no code was invented.
- **P036** has no slideshow: its project page contains static images only.
