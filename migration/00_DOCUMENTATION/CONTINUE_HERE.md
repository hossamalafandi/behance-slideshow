# Continue Here — Behance project pages

Last updated: 2026-11-27. This file is the handoff for a new chat/session.

## What this workspace is

A migration workspace for reconstructing Hossam Alafandi's Google Sites pages as
standalone Behance embeds. The shared Apps Script deployment also hosts the
original 48 slideshow routes and 38 TOOLS USED strips.

## Current deployment

- Deployment ID:
  `AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA`
- Base URL:
  `https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec`
- Current deployed version: **28**
- Git `main` HEAD: `235ee6d` (College page live).
- Deployment command (local clasp is in `migration/tools/node_modules/.bin`):
  `..\tools\node_modules\.bin\clasp.cmd push --force`
  `..\tools\node_modules\.bin\clasp.cmd deploy -i <deploymentID> -d "<description>"`

## Page routes completed

| Route | File | Height | Status |
|---|---|---:|---|
| `?page=al-rashed` | `AlRashed.html` | 2980 | Complete; phone fullscreen viewer |
| `?page=cellphone-store` | `CellphoneStore.html` | 13320 | Complete; 9 Vimeo videos; phone fullscreen |
| `?page=dk-apartment` | `DKApartment.html` | 2900 | Complete; 2 Vimeo videos; mixed image/video grid |
| `?page=ab-apartment` | `ABApartment.html` | 2750 | Complete; 7 room slideshows; phone fullscreen |
| `?page=college-of-architecture-and-arts` | `CollegeOfArchitectureAndArts.html` | 2800 | Complete; 2 board plates + zoom viewer; 7 renders; phone fullscreen |

Every page is independent. The 48 `?slide=` and 38 `?tools=` routes are
unchanged.

## Where things live

- `migration/04_APPS_SCRIPT/Code.gs` — route map (`PAGE_FILES`).
- `migration/tools/serve.js` — local router and page previews.
- `migration/tools/<page>-data.js` — page source data.
- `migration/tools/generate-<page>.js` — generator; edit source, never the
  generated HTML.
- `migration/tools/test-<page>.js` — local page suite.
- `migration/tools/test-live-<page>.js` — live page suite.
- `migration/tools/validate.js` — 48-slideshow/static validator.
- `assets/<page>/` — copied/optimized page images served by jsDelivr.
- `migration/05_BEHANCE_OUTPUT/*_EMBED.md` — owner copy/paste docs.
- `migration/05_BEHANCE_OUTPUT/README.md` — master index of embed docs.
- `migration/01_AUDIT/evidence/<page>/` — generated test reports.

## Verification state

| Suite | Result |
|---|---|
| Static validation (`node validate.js`) | 3491/3491 |
| Al-Rashed local / live | 218/218 / 135/135 |
| Cellphone local / live | 76/76 / 102/102 |
| DK-Apartment local / live | 57/57 / 62/62 |
| AB-Apartment local / live | 56/56 / 57/57 |
| College of Architecture and Arts local / live | 69/69 / 76/76 |
| All 48 live slideshows | 339/339 (shared code unchanged) |
| Live phone fit | 64/64 (shared code unchanged) |

## Workflow to use for a new project page

1. Read the Google Sites page with Playwright at 1440, 987, and 390 widths.
2. Find the project ID in `migration/01_AUDIT/projects.csv` and its archived
   slideshow data under `migration/03_REBUILT_SLIDESHOWS/data/`.
3. Copy only Google Sites images that block cross-site hotlinking into
   `assets/<page>/` as 768 phone + 1280 desktop versions; use a 1920/768 hero.
4. Keep slideshow images and tool logos on Imgur.
5. For videos, use Vimeo player embeds. Do **not** use Google Drive previews;
   they were blank in the Behance-like sandbox. The owner's Vimeo account is
   `vimeo.com/user265736061` (`7OSSAM0_o`); ask for share links if a video is
   private/unlisted.
6. Create `<page>-data.js`, `generate-<page>.js`, local and live suites, and add
   the route to `Code.gs`/`serve.js`.
7. Run the local page suite, deploy once, run only the page live suite. Do not
   rerun the full 48-slideshow suite for a page-only change.
8. Update `05_BEHANCE_OUTPUT/<PAGE>_EMBED.md`, the master README, and the
   documentation/policy notes. Commit and push.
9. Tell the owner the iframe code. Do not publish or replace anything on
   Behance; the owner pastes manually.

## Owner preferences

- Keep pages phone-compatible and avoid a large empty area at the page end.
- On phones, slideshows should be usable at a large size; fullscreen viewers
  should use the phone screen at maximum size without cropping the render.
- Two-video layouts may be side by side on desktop but should stack on phones.
- Keep the original wording, including original spelling.
- Report concisely. Do not run unnecessary long regression suites.

## Useful commands (from `migration/tools`)

```powershell
node generate-ab-apartment.js
node test-ab-apartment.js
node test-live-ab-apartment.js <base-exec-url>
node validate.js
```

## Embed docs

- `AL_RASHED_EMBED.md` — height 2980
- `CELLPHONE_STORE_EMBED.md` — height 13320
- `DK_APARTMENT_EMBED.md` — height 2900
- `AB_APARTMENT_EMBED.md` — height 2750
- `COLLEGE_OF_ARCHITECTURE_AND_ARTS_EMBED.md` — height 2800

Nothing has been published or replaced on Behance. All embeds are delivered for
manual copy/paste.
