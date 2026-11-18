# Behance Slideshow Migration — Phase 2

Status: **Phase 2 approved. P001-S01 local pilot passes; deployment and the real
Behance release test are pending.**
Audit date: 2026-11-18
Scope: the **Freelance** page of <https://sites.google.com/view/hossam-alafandi/>
and its 38 project pages.

This folder is the migration workspace. It was created without changing,
deleting, renaming, or redeploying anything in the live portfolio, the existing
Apps Script project, or the existing `index.html` prototype. The audit and pilot
commits are pushed to `main`; no deployment or publish has been made. See
`01_AUDIT/phase_2_pilot_report.md` for the current pilot state.

Phase 1.1 adds two mandatory requirements: **no image downloading/rehosting**
and **one consistent fullscreen button on all 47 slideshows**. The owner also
confirmed that every slideshow is an **independent Behance embed**; the shared
deployment is hosting and rendering only, never a gallery. It also resolves or
documents the audit exceptions as far as the public evidence allows.

## 1. Headline results

| Metric | Result |
|---|---:|
| Projects discovered on the Freelance page | 38 |
| Project pages inspected | 37 |
| Projects with at least one interactive slideshow | 36 |
| Projects confirmed without a slideshow | 1 (P036) |
| Projects that could not be inspected | 1 (P024) |
| Slideshows detected and archived | 47 |
| Image slots in those slideshows | 335 |
| Unique image URLs | 331 |
| Image files downloaded or rehosted | 0 |
| Original slideshow HTML files archived | 47 |
| Slideshows with an existing fullscreen button | 1 (P038-S01) |
| Slideshows that must have one after migration | 47 |

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
│   └── PHASE_2_IMPLEMENTATION_PLAN.md   detailed build, test and rollout plan
├── 01_AUDIT/
│   ├── projects.csv                     38 projects: IDs, titles, URLs, status, counts
│   ├── slideshows.csv                   47 slideshows: IDs, stems, sections, controls, status
│   ├── images.csv                       335 remote image slots: order, exact URL, dimensions
│   ├── slides.config.json               machine-readable master for the rebuild phase
│   ├── audit_summary.md                 method, inventory and findings
│   ├── unresolved_items.md              blockers, defects and decisions needed
│   ├── phase_1_1_report.md              Phase 1.1 findings and approval checklist
│   ├── raw/                             raw crawl output (per project, context, image metadata, log)
│   └── evidence/                        local screenshots (gitignored) and the pilot test report
├── 02_SOURCE_BACKUP/                    untouched original slideshow HTML, one folder per project
├── 03_REBUILT_SLIDESHOWS/               generated P001-S01 data and preview
├── 04_APPS_SCRIPT/                      new Apps Script project files (P001-S01 only)
└── 05_BEHANCE_OUTPUT/                   generated P001-S01 embed snippet (deployment pending)
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

The ordered URL sequence SHA-256 at Phase 1.1 completion is:

```
882a952d07cc442466cb2d7a3e3369ecb44a9a9e20fd299ca5f6f9e52ae001d0
```

Any Phase 2 generation that changes this hash is a defect.

## 5. Mandatory fullscreen rule

Every one of the 47 slideshows must have exactly one fullscreen button. P038-S01
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
   image count and order match in 47/47 cases.
7. Live interaction tests covered P001-S01 (normal slideshow), P011-S01 (inert,
   missing JavaScript), and P036 (static images only).
8. Phase 1.1 added a cross-origin local harness for the fullscreen permission
   chain and a live re-check of the P002 Drive previews. No deployment or image
   download was involved.

## 8. Data files

| File | Rows | Purpose |
|---|---:|---|
| `01_AUDIT/projects.csv` | 38 | One row per project, including the blocked one and the no-slideshow one |
| `01_AUDIT/slideshows.csv` | 47 | One row per slideshow with styling, controls and archived source path |
| `01_AUDIT/images.csv` | 335 | One row per image slot; exact remote URL, dimensions, `duplicate_of` |
| `01_AUDIT/slides.config.json` | 47 | Nested config (slideshow → images) for code generation in Phase 2 |
| `01_AUDIT/raw/P0xx.json` | 38 | Crawl record per project (37 full records + the P024 blocked attempt) |
| `01_AUDIT/raw/context.json` | 37 | Section labels and embed positions in DOM order |
| `01_AUDIT/raw/image_meta.json` | 331 | HTTP status, format and true dimensions per unique image |
| `01_AUDIT/evidence/*.png` | 48 | Local audit screenshots (gitignored; not committed) |

Screenshots are supporting evidence only and stay on the local machine; no image
file is committed to the repository. Imgur serves multi-megabyte originals
slowly, so some automated captures show a slide still loading; the DOM records
and archived HTML are the authoritative data.

`slideshows.csv` column `fullscreen` records what the **original source** had
(only P038-S01). It is not the migration target; all 47 are required to have the
button after rebuild.

## 9. Status vocabulary and current totals

Projects: `NOT_STARTED`, `SCANNED`, `NO_SLIDESHOW`, `VERIFIED`, `PARTIAL`,
`BLOCKED`.

Slideshows: `DETECTED`, `EXTRACTED`, `NEEDS_REVIEW`, `BLOCKED`.

Current totals after Phase 1.1 evidence review:

- Projects: 35 `VERIFIED`, 1 `PARTIAL` (P011), 1 `BLOCKED` (P024),
  1 `NO_SLIDESHOW` (P036).
- Slideshows: 46 `EXTRACTED`, 1 `NEEDS_REVIEW` (P011-S01), 0 `BLOCKED`.

P026-S02 and P032-S01 were resolved by evidence and are no longer
`NEEDS_REVIEW`; see `01_AUDIT/unresolved_items.md`. P011-S01's repair is approved
and waits until the P001-S01 pilot passes its real Behance test.

## 10. What was deliberately not done

- No image downloads, copies, mirrors, rehosting, or uploads. Phase 2 tests
  block every image request and do not inspect image content.
- No edits to the Google Sites portfolio.
- No deletion or overwrite of existing repository files.
- No Git commit or push of the audit and pilot files until they were reviewed;
  both commits are now on `main` (`0a33cf5`, `3426077`).
- No change to the existing Apps Script project or its deployment.
- No bulk reconstruction, deployment, publishing, or migration of the other 46
  slideshows. Only the P001-S01 pilot was generated locally.

## 11. Exception summary

| Item | Phase 1.1 outcome |
|---|---|
| P024 malformed link | Still `BLOCKED`; card 24 is a distinct "MASTER BEDROOM" card, not the P009 card; no page or hidden link found |
| P011-S01 missing JavaScript | Intended behavior identified from the identical standard template; repair with the shared script requires approval |
| P026-S02 duplicate subset | Confirmed intentional side-by-side companion slideshow; preserve independently |
| P032-S01 repeated image | Source has 3 slots/3 dots; no evidence of accident; preserve exactly |
| P002 Drive previews | Nine Google Drive **video** previews (MOV), HTTP 200, blank in headless embedded capture; not slideshows and not a migration blocker |
| Fullscreen feasibility | Native fullscreen is granted in Chromium when the outer iframe has `allowfullscreen` + `allow="fullscreen"`; real Behance verification remains a Phase 2 gate |

## 12. Next step

The P001-S01 local pilot is complete and pushed. Next:

1. ~~Authenticate the repository-owner GitHub account and push the reviewed
   migration files.~~ Done: `main` is at `3426077`.
2. Finish the Apps Script sign-in (the owner must enable the **Google Apps
   Script API**), create the **new** standalone project, and deploy the Web App
   with anonymous access.
3. Replace the deployment placeholder in `05_BEHANCE_OUTPUT/P001.md`.
4. Publish one temporary Behance test project containing only the P001-S01
   snippet and run the mandatory real fullscreen/independence gate.
5. Only after that gate passes, begin the approved P011-S01 repair and the next
   rollout batch.

Read `01_AUDIT/phase_2_pilot_report.md`, `01_AUDIT/unresolved_items.md`,
`00_DOCUMENTATION/INDEPENDENT_EMBED_STANDARD.md`, and
`00_DOCUMENTATION/PHASE_2_IMPLEMENTATION_PLAN.md` before those steps.
