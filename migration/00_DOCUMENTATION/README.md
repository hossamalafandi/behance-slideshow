# Behance Slideshow Migration — Phase 2

Status: **Phase 2 bulk rollout complete. All 48 slideshows are reconstructed,
deployed, and exported as 48 independent Behance embed codes, and all 38
TOOLS USED software-logo strips are exported as iframe codes served by the same
Apps Script host. The complete copy/paste set is in
`05_BEHANCE_OUTPUT/ALL_EMBEDS.md` and `05_BEHANCE_OUTPUT/ALL_EMBEDS.csv`, with
the tools-only set in `05_BEHANCE_OUTPUT/TOOLS_USED_EMBEDS.md` and
`TOOLS_USED_EMBEDS.csv`. The owner paused further Behance test embeds after the
bulk rollout; P001-S01 remains the only real-Behance-verified embed. A phone
fit-layout pilot for `P030-S01` is deployed as version 8: on portrait embeds
the slideshow becomes an image-ratio card with no blur or crop. It awaits the
owner's phone review; no other slideshow has the layout enabled.**
Audit date: 2026-11-18
Bulk rollout date: 2026-11-20
P024 completion date: 2026-11-21
Phone fit pilot: 2026-11-22
Scope: the **Freelance** page of <https://sites.google.com/view/hossam-alafandi/>
and its 38 project pages.

This folder is the migration workspace. It was created without changing,
deleting, renaming, or redeploying anything in the live portfolio, the existing
production Apps Script project, or the existing `index.html` prototype. A **new
standalone** Apps Script project hosts all 48 slideshows and the 38 TOOLS USED
strips; it is deployed as version 8. One temporary Behance test project was
published. The audit, pilot, and bulk rollout commits are pushed to `main`. See
`01_AUDIT/phase_2_pilot_report.md` and `01_AUDIT/phase_2_bulk_report.md` for the
bulk test results, and `00_DOCUMENTATION/PHONE_FIT_LAYOUT.md` for the phone fit
pilot, its tests, rollout, and rollback.

Phase 1.1 adds two mandatory requirements: **no image downloading/rehosting**
and **one consistent fullscreen button on all 48 slideshows**. The owner also
confirmed that every slideshow is an **independent Behance embed**; the shared
deployment is hosting and rendering only, never a gallery. It also resolves or
documents the audit exceptions as far as the public evidence allows.

## 1. Headline results

| Metric | Result |
|---|---:|
| Projects discovered on the Freelance page | 38 |
| Project pages inspected | 38 |
| Projects with at least one interactive slideshow | 37 |
| Projects confirmed without a slideshow | 1 (P036) |
| Projects that could not be inspected | 0 |
| Slideshows detected and archived | 48 |
| Image slots in those slideshows | 339 |
| Unique image URLs | 336 (331 original audited + 1 owner-supplied P032-S01 replacement + 4 P024) |
| Image files downloaded or rehosted | 0 |
| Original slideshow HTML files archived | 48 |
| Slideshows with an existing fullscreen button | 1 (P038-S01) |
| Slideshows that must have one after migration | 48 |

## 2. Folder structure

```
migration/
├── 00_DOCUMENTATION/
│   ├── README.md                        this file
│   ├── NAMING_CONVENTION.md             permanent IDs, stems, paths, status vocabulary
│   ├── SYSTEM_ARCHITECTURE.md           proposed Apps Script design and limits
│   ├── IMAGE_HOSTING_POLICY.md          mandatory no-download/no-rehost rule
│   ├── FULLSCREEN_STANDARD.md           mandatory button, CSS, JS and fallback standard
│   ├── INDEPENDENT_EMBED_STANDARD.md    one request = one slideshow; no gallery
│   ├── PHONE_FIT_LAYOUT.md              opt-in phone fit pilot, rollout and rollback
│   └── PHASE_2_IMPLEMENTATION_PLAN.md   detailed build, test and rollout plan
├── 01_AUDIT/
│   ├── projects.csv                     38 projects: IDs, titles, URLs, status, counts
│   ├── slideshows.csv                   48 slideshows: IDs, stems, sections, controls, status
│   ├── images.csv                       339 remote image slots: order, exact URL, dimensions
│   ├── slides.config.json               machine-readable master for the rebuild phase
│   ├── layout.config.json               per-slideshow phone fit gate (P030-S01 pilot)
│   ├── audit_summary.md                 method, inventory and findings
│   ├── unresolved_items.md              blockers, defects and decisions needed
│   ├── phase_1_1_report.md              Phase 1.1 findings and approval checklist
│   ├── raw/                             raw crawl output (per project, context, image metadata, log)
│   └── evidence/                        pilot and bulk test reports (screenshots gitignored)
├── 02_SOURCE_BACKUP/                    untouched original slideshow HTML, one folder per project
├── 03_REBUILT_SLIDESHOWS/               generated data and previews for all 48 slideshows
├── 04_APPS_SCRIPT/                      shared Apps Script project (48-slide map, 38-tool map, version 8)
└── 05_BEHANCE_OUTPUT/                   all 48 embed codes plus 38 TOOLS USED codes: ALL_EMBEDS.md, ALL_EMBEDS.csv, TOOLS_USED_EMBEDS.md, TOOLS_USED_EMBEDS.csv, 37 project files
```

`02_SOURCE_BACKUP` contains one `*.original.html` per slideshow. These files are
the reconstructed, user-authored HTML with the Google Sites/Atari wrapper
scripts removed. They are the authoritative record of the original content and
must never be edited. The wrapper was removed from the saved copy only; the live
portfolio still renders normally.

## 3. Permanent identifiers

- Project: `P001` … `P038`, in the top-to-bottom order of the `SHOW` cards on
  the Freelance page.
- Slideshow: `P001-S01`, `P001-S02`, … in page order within that project.
- Descriptive stem: `P001-al-rashed-project-S01-renders`.
- Original spellings are preserved (`reciption`, `EYGPT`, `DINNING`); only case
  and separators are normalized. See `00_DOCUMENTATION/NAMING_CONVENTION.md`.

## 4. Mandatory image rule

**No image may be downloaded, copied, mirrored, proxied, or rehosted.** The
slideshows must reference the original remote URLs directly, in their exact
order, including repeated URLs and query parameters.

`01_AUDIT/images.csv` stores the remote URL only; the obsolete `local_target`
column was removed in Phase 1.1. There is no `assets/` directory in the rebuilt
output. Full rules and verification steps are in
`00_DOCUMENTATION/IMAGE_HOSTING_POLICY.md`.

The current ordered URL sequence SHA-256 (2026-11-21, after the documented
owner updates) is:

```
4338768034a434082e6bc3e2ddffb3a4214e5498f097c1cfc0d3429d3eb93d85
```

This covers 339 slots and 336 unique URLs. The Phase 1.1 hash was
`882a952d07cc442466cb2d7a3e3369ecb44a9a9e20fd299ca5f6f9e52ae001d0`; the only
changes since then are the owner-approved P032-S01 replacement and the P024
addition. Any other change is a defect.

## 5. Mandatory fullscreen rule

Every one of the 48 slideshows must have exactly one fullscreen button. P038-S01
already has one and must not receive a duplicate.

The button must match P038's visual style and position, remain an overlay, and
not alter images, order, aspect ratios, arrows, dots, transitions, shadows,
borders, typography, colors, animations, or existing interactions. Native
fullscreen is attempted first; denial must trigger a visible fallback, never a
silent failure or a blocking alert.

See `00_DOCUMENTATION/FULLSCREEN_STANDARD.md` for the exact markup, CSS,
JavaScript, iframe permissions, and acceptance checklist.

## 6. Independent embed rule

Every slideshow is embedded independently in a different Behance project or
project section. All embeds share one deployment URL but use different
`?slide=` identifiers. Each request must load exactly one slideshow.

The deployment is not an index, gallery, dashboard, portfolio page, or
multi-slideshow viewer. It must not expose a catalog or links to other
slideshows. Each iframe owns its image sequence, navigation state, fullscreen
state, and dimensions. Multiple visitors and multiple Behance projects must be
able to interact at the same time without interference.

The router accepts exactly one `slide` string; missing, repeated, array, list,
or unknown values return a neutral error page with no gallery. No
`localStorage`, cookies, `postMessage`, or other shared state is used for
navigation.

See `00_DOCUMENTATION/INDEPENDENT_EMBED_STANDARD.md` for the contract and test
matrix.

## 7. How the audit was performed

1. The Freelance page was rendered in Google Chrome (Playwright, 1440×900) and
   scrolled fully. Exactly 38 `SHOW` links were enumerated in DOM order.
2. Every linked project page was rendered, scrolled to force lazy embeds to load,
   and kept open until its Google Sites custom-embed frame chain resolved.
3. Google Sites serves a custom HTML embed through three nested cross-origin
   frames: an Atari intermediate frame → an `innerFrame` → the user HTML frame on
   `*.googleusercontent.com`. The audit traverses that chain and reads the
   rendered DOM directly. No information is inferred for frames that cannot be
   read; none remained unreadable.
4. For each slideshow the audit recorded: document title, frame size, image
   count and order, controls, dots, page counter, interactions, computed styling,
   and the full HTML source.
5. Images were verified by HTTP request and their true pixel dimensions were read
   from the original files with byte-range requests. No image binary was saved.
   (The `b` imgur thumbnail is a 160×160 square crop and was deliberately
   rejected as a dimension source.)
6. Integrity checks compared every archived HTML file against its JSON record:
   image count and order match in 48/48 cases.
7. Live interaction tests covered P001-S01 (normal slideshow), P011-S01 (inert,
   missing JavaScript), and P036 (static images only).
8. Phase 1.1 added a cross-origin local harness for the fullscreen permission
   chain and a live re-check of the P002 Drive previews. No deployment or image
   download was involved.

## 8. Data files

| File | Rows | Purpose |
|---|---:|---|
| `01_AUDIT/projects.csv` | 38 | One row per project, including the no-slideshow one |
| `01_AUDIT/slideshows.csv` | 48 | One row per slideshow with styling, controls and archived source path |
| `01_AUDIT/images.csv` | 339 | One row per image slot; exact remote URL, dimensions, `duplicate_of` |
| `01_AUDIT/slides.config.json` | 48 | Nested config (slideshow → images) for code generation in Phase 2 |
| `01_AUDIT/raw/P0xx.json` | 38 | Crawl record per project (38 full records, including the 2026-11-21 P024 rescan) |
| `01_AUDIT/raw/context.json` | 37 | Section labels and embed positions in DOM order |
| `01_AUDIT/raw/image_meta.json` | 336 | HTTP status, format and true dimensions per unique image (metadata only; no image binaries saved) |
| `01_AUDIT/evidence/*.png` | 48 | Local audit screenshots (gitignored; not committed) |

Screenshots are supporting evidence only and stay on the local machine; no image
file is committed to the repository. Imgur serves multi-megabyte originals
slowly, so some automated captures show a slide still loading; the DOM records
and archived HTML are the authoritative data.

`slideshows.csv` column `fullscreen` records what the **original source** had
(only P038-S01). It is not the migration target; all 48 are required to have the
button after rebuild.

## 9. Status vocabulary and current totals

Projects: `NOT_STARTED`, `SCANNED`, `NO_SLIDESHOW`, `VERIFIED`, `PARTIAL`,
`BLOCKED`.

Slideshows: `DETECTED`, `EXTRACTED`, `NEEDS_REVIEW`, `BLOCKED`.

Current totals after the P024 rescan:

- Projects: 37 `VERIFIED`, 0 `BLOCKED`, 1 `NO_SLIDESHOW` (P036).
- Slideshows: 48 `EXTRACTED`, 0 `NEEDS_REVIEW`, 0 `BLOCKED`.

P026-S02 and P032-S01 were resolved by evidence; see
`01_AUDIT/unresolved_items.md`. P011-S01 was repaired on 2026-11-19 with the
shared standard JavaScript after the P001-S01 real Behance gate passed. All 20
images and the original order were preserved; local 21/21 and live 20/20 tests
pass.

On 2026-11-20 the bulk generator produced all 47 slideshows and 36 project
snippets, and the expanded server map was deployed as version 3 with the same
deployment ID. Version 4 later added the 37 TOOLS USED strips at `?tools=Pxxx`
so Behance can embed them as iframes. Static validation passes 3092/3092, the
local browser suite 340/340, and the live Apps Script suite 332/332. P001-S01
still passes the real published-Behance gate 18/18. The owner then stopped
further Behance testing; the finished deliverable is the complete 48-code
copy/paste set in `05_BEHANCE_OUTPUT/ALL_EMBEDS.md` and `ALL_EMBEDS.csv`, plus
all 38 TOOLS USED iframe codes in the same Markdown file and in
`TOOLS_USED_EMBEDS.md` / `TOOLS_USED_EMBEDS.csv`. P001-S01 remains the only
real-Behance-verified embed. On 2026-11-21 the owner supplied the fixed P024
page; it was audited, added as `P024-S01` + `P024-TOOLS`, and deployed as
version 6 with the same deployment ID. On 2026-11-22 an opt-in phone fit layout
was added and refined into version 8 for the single pilot `P030-S01`. On
portrait/tall embeds the slideshow becomes a card sized to the first image's
aspect ratio, centered with no blur and no crop; wide landscape frames keep the
original `cover` behavior. The outer Behance codes, image URLs, and image order
are unchanged. All 48 live slideshows still pass (339/339), the focused live
pilot passes 56/56, the local fit suite passes 75/75, and static validation
passes 3313/3313. The layout is enabled for `P030-S01` only and awaits the
owner's phone review; see `00_DOCUMENTATION/PHONE_FIT_LAYOUT.md` for the
rollout and rollback steps.

## 10. What was deliberately not done

- No image downloads, copies, mirrors, rehosting, or uploads. Phase 2 tests
  block every image request and do not inspect image content.
- No edits to the Google Sites portfolio.
- No deletion or overwrite of existing repository files.
- No Git commit or push of the audit and pilot files until they were reviewed;
  both commits are now on `main` (`0a33cf5`, `3426077`).
- No change to the existing production Apps Script project or its deployment.
  A **new standalone** project and deployment host the migration.
- No publishing or replacement of the live Behance portfolio. All 48 slideshows
  and 48 embed codes are generated; only the P001-S01 test embed has been
  published. The owner will paste the remaining codes manually.
- No real Behance verification of the other 47 slideshows. The owner closed
  further testing; those codes are delivered ready for manual use.
- No rollout of the phone fit layout beyond `P030-S01`. The pilot awaits the
  owner's phone review; all other slideshows keep the original layout.

## 11. Exception summary

| Item | Phase 1.1 outcome |
|---|---|
| P024 malformed link | Resolved 2026-11-21: owner supplied the fixed page; `P024-S01` (4 images, RENDERS) and `P024-TOOLS` (4 logos) are deployed |
| P011-S01 missing JavaScript | Repaired 2026-11-19 with the shared standard script after the pilot gate passed; 20 images and original order preserved; local 21/21 and live 20/20 |
| P026-S02 duplicate subset | Confirmed intentional side-by-side companion slideshow; preserve independently |
| P032-S01 repeated image | Original audit found 3 slots/3 dots with positions 2 and 3 sharing a URL. Owner change 2026-11-21: position 3 now uses `https://i.imgur.com/PjEUKuC.jpeg`; position 2 keeps the original. |
| P002 Drive previews | Nine Google Drive **video** previews (MOV), HTTP 200, blank in headless embedded capture; not slideshows and not a migration blocker |
| Fullscreen feasibility | Verified in the real published Behance page: `allowfullscreen` survives Behance's sandbox, native fullscreen targets `#slideshow`, and exit works. The gate passes 18/18. |

## 12. Finished output

The bulk rollout is generated, validated, deployed, and exported. No further
test embeds or validation cycles are being run.

1. ~~Authenticate the repository-owner GitHub account and push the reviewed
   migration files.~~ Done: `main` is pushed.
2. ~~Create the new standalone Apps Script project and deploy the Web App with
   anonymous access.~~ Done: deployment
   `AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA`.
3. ~~Replace the deployment placeholder in the generated snippets.~~ Done.
4. ~~Publish one temporary Behance test project and run the mandatory real
   fullscreen/independence gate.~~ Done: the published project
   <https://www.behance.net/gallery/258648021/yty> passes **18/18** checks with
   the 805 px pilot embed, zero banner, working navigation, and native
   fullscreen.
5. ~~Implement the approved P011-S01 repair.~~ Done: all 20 images, order,
   aspect ratio, CSS, and visuals preserved; local 21/21 and live 20/20.
6. ~~Generate all 47 slideshows, 36 project snippets, and the complete server
   map; deploy as version 3.~~ Done: static 3092/3092, local 340/340, live
   332/332, P001 real gate 18/18. P024 was added later as the 48th slideshow.
7. ~~Export all 48 embed codes in one Markdown document and one CSV.~~ Done:
   `05_BEHANCE_OUTPUT/ALL_EMBEDS.md` and
   `05_BEHANCE_OUTPUT/ALL_EMBEDS.csv`.
8. ~~Export all 38 TOOLS USED logo-strip codes.~~ Done: included in
   `ALL_EMBEDS.md` and in `TOOLS_USED_EMBEDS.md` /
   `TOOLS_USED_EMBEDS.csv`.
9. ~~Serve the TOOLS USED strips from the existing host so Behance accepts the
   codes.~~ Done: deployed as version 4 with the same deployment ID; every
   tools code is now an `?tools=Pxxx` iframe.

**Owner action:** open `05_BEHANCE_OUTPUT/ALL_EMBEDS.md` (or the per-project
slideshow file) and copy each iframe code into its matching Behance project
section. Then copy each project's `Pxxx-TOOLS` iframe block into that project's
TOOLS USED embed. Use the permanent ID and dimensions shown with each code. Do
not combine slideshows in one embed.

P024 is now included with its slideshow and TOOLS USED code. P036 has no
slideshow, but its TOOLS USED code is included.

Read `05_BEHANCE_OUTPUT/README.md`, `01_AUDIT/phase_2_bulk_report.md`,
`01_AUDIT/phase_2_pilot_report.md`, `01_AUDIT/unresolved_items.md`,
`00_DOCUMENTATION/INDEPENDENT_EMBED_STANDARD.md`, and
`00_DOCUMENTATION/PHASE_2_IMPLEMENTATION_PLAN.md` for the full record.
