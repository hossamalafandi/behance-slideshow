# Phase 2 Bulk Rollout Report — All 47 Slideshows

Status: **all 47 slideshows are reconstructed, deployed as version 4, and
exported as 47 independent embed codes. All 37 TOOLS USED software-logo strips
are also exported as iframe codes served by the same Apps Script host. The
finished copy/paste set is in `05_BEHANCE_OUTPUT/ALL_EMBEDS.md` and
`05_BEHANCE_OUTPUT/ALL_EMBEDS.csv`, with the tools-only set in
`TOOLS_USED_EMBEDS.md` and `TOOLS_USED_EMBEDS.csv`. Static validation
3092/3092, local browser 340/340, live Apps Script 332/332, and the P001-S01
real published-Behance gate 18/18. Per owner instruction, further Behance
testing is closed; the codes are ready for manual use. P024 remains blocked.**
Date: 2026-11-20
Deployment: `https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec`
Deployment version: **3** (same deployment ID; no host change)

> **Post-report update (2026-11-21).** The owner fixed P024. It was rescanned
> and added as `P024-S01` (4 images, RENDERS) plus `P024-TOOLS` (4 logos). The
> current build is **48 slideshows in 37 projects, 339 image slots, 336 unique
> URLs, 38 TOOLS USED strips**, deployed as **version 6** under the same
> deployment ID. Static validation passes **3160/3160**. The 2026-11-20 results
> below remain the historical bulk-rollout record.
Reference: `PHASE_2_IMPLEMENTATION_PLAN.md`, `INDEPENDENT_EMBED_STANDARD.md`,
`FULLSCREEN_STANDARD.md`, `IMAGE_HOSTING_POLICY.md`.

## 1. Scope

All 47 slideshows in 36 projects were generated from the frozen audit data.
P024 remains `BLOCKED` with its ID reserved because its source link truncates to
`http://ww`; no URL was invented. P036 has no slideshow. No image was
downloaded, copied, resized, proxied, or rehosted.

| Metric | Result |
|---|---:|
| Slideshows generated | 47 |
| Projects with generated snippets | 36 |
| Image slots | 335 |
| Unique image URLs | 332 (331 audited + 1 owner-supplied P032-S01 replacement) |
| Ordered URL SHA-256 | `882a952d07cc442466cb2d7a3e3369ecb44a9a9e20fd299ca5f6f9e52ae001d0` |
| Image files downloaded or committed | 0 |
| Projects still blocked | 1 (P024) |
| Projects with no slideshow | 1 (P036) |

## 2. Generation and width rule

The generator always builds the complete 47-entry server map and all 36 project
snippet files. A preview-only rebuild cannot drop another slideshow from
`SlidesData.gs`.

Behance does not preserve the pasted iframe's `style`; it reads the declared
`width`/`height` and builds its own fixed-height wrapper. The width rule is:

- audited frame width **≥ 1200 px** → `width="100%"` (29 slideshows);
- audited frame width **< 1200 px** → the audited pixel width (18 slideshows).

Fixed-width buckets: 997 px (3), 772 px (1), 659 px (3), 546 px (8), 321 px (3).
Heights range from 443 px to 1570 px and are stored per slideshow. The visible
20 px corner radius comes from the slideshow container inside the iframe;
Behance strips the iframe's own `border-radius`.

Every snippet contains exactly one iframe, one `?slide=` ID, `allowfullscreen`,
`allow="fullscreen"`, and no `sandbox` attribute. There is no index, gallery,
dashboard, portfolio page, combined viewer, or multi-slideshow route.

## 3. Deployment

The expanded `SlidesData.gs` was pushed to the existing standalone Apps Script
project and deployed as **version 3** with the existing deployment ID. Version
4 later added `ToolsData.gs` and the `?tools=Pxxx` route for the 37 TOOLS USED
strips. The production Apps Script project and `index.html` were not touched.

## 4. Validation results

### 4.1 Static validation — 3092 / 3092

`node migration/tools/validate.js` passes every check:

- 47 slideshows, 36 projects, 335 slots, 332 unique URLs (331 audited plus the
  owner-supplied P032-S01 replacement), exact frozen hash;
- exact URL string and order comparison for every slideshow;
- P032-S01 keeps `https://i.imgur.com/1MWxYk7.jpeg` at position 2; position 3
  uses the owner-supplied replacement `https://i.imgur.com/PjEUKuC.jpeg`;
- P026-S02 remains an independent 3-image companion;
- P011-S01 keeps all 20 images and its repaired standard JavaScript;
- 29 fluid and 18 fixed widths, with per-slideshow heights;
- every preview and every project snippet matches its data;
- the server map contains all 47 IDs and no gallery or catalog;
- the router rejects missing, repeated, unknown, list, and wildcard IDs;
- no image binary, `assets/`, `data:image`, base64, Drive URL, or local path.

### 4.2 Local browser suite — 340 / 340

`node migration/tools/test-all.js` passes all 340 checks across all 47
slideshows in Chrome 157:

- 47/47 slideshows render the expected slides, dots, counter, and exact URLs;
- navigation, dot jumps, wrap-around, hover controls, and fullscreen work;
- each slideshow keeps its own state and dimensions;
- the router returns the neutral error page for invalid requests;
- 334 image requests were aborted; the browser deduplicated the repeated P032
  URL, so 334 blocked attempts represent all 335 slots. (This was before the
  owner replaced position 3; the delivered slideshow now has 335 distinct URLs.)

### 4.3 Live Apps Script suite — 332 / 332

`node migration/tools/test-live-all.js` loads every slideshow inside the same
`allowfullscreen` iframe context used by the Behance snippet. All 47 pass:

- the live wrapper is reached and the Google warning bar is **0 px**;
- the sandbox receives the full audited height;
- slides, dots, counter, eager images, and exact URL order match the data;
- no scrollbars at the audited viewport;
- navigation advances and the active dot follows;
- native fullscreen targets `#slideshow` and exits cleanly;
- all three live router rejection checks pass;
- 335 image requests were aborted; no image was opened or inspected.

One transient Apps Script cold start occurred: P011-S01 timed out on its first
attempt in the final batch and passed on the single automatic retry. P029-S02
also timed out once in an earlier batch and passed 20/20 individually; the final
suite includes a retry so cold starts do not create false failures.

### 4.4 Real published-Behance gate — P001-S01 18 / 18

The existing public test project
<https://www.behance.net/gallery/258648021/yty> was re-run after version 3:

- the exact P001-S01 embed is found, with the correct deployment and `?slide`;
- 987 × 805 rendered iframe, 0 px Google banner;
- 17 slides/dots, `1 / 17` counter, exact audited URL order;
- navigation, native fullscreen, and fullscreen exit work from the real parent;
- 22 image requests were blocked.

The gate script is now generalized with `--slide`, `--count`, `--height`,
optional `--width`, data-file lookup, exact URL comparison, and an exact-slide
selector. It can validate any published slideshow, not only P001-S01.

## 5. Image policy compliance

No test requested, downloaded, opened, or inspected an image. Every browser
route to `https://i.imgur.com/**` was aborted before the request left the
browser. Image fidelity is verified through exact `src` strings and DOM order
only. Visual fidelity is checked by the owner when the finished codes are
pasted into Behance.

## 6. Preserved exceptions

| Item | State |
|---|---|
| P024 malformed link | Still `BLOCKED`; ID reserved; no URL invented |
| P026-S02 | Independent 3-image companion; preserved |
| P032-S01 repeated image | Original positions 2 and 3 shared a URL; owner change 2026-11-21 replaced position 3 while keeping position 2 |
| P011-S01 repair | 20 images, order, and styling preserved; local 21/21, live 20/20 |
| P038-S01 | Fullscreen-style reference; one button, no duplicate |
| P036 | Confirmed no slideshow; no snippet generated |

## 7. Behance testing status

P001-S01 is the only slideshow tested inside a real published Behance project;
it passes 18/18 with the 805 px embed, zero banner, exact URL order, navigation,
and native fullscreen. The owner has closed further Behance testing and asked
for the finished deliverable without additional sample embeds or validation
rounds. The other 45 codes are therefore delivered for manual copy/paste. They
have passed static, local browser, and live Apps Script validation, but not a
real Behance wrapper test.

One real-wrapper behavior to watch during manual use: Behance may cap declared
heights above 1200 px. The tallest embeds are the 1570 px slideshows, including
P005-S01. The generated code uses the audited height as required; if Behance
visibly caps it, the height can be adjusted in Behance without changing the
slideshow or its images.

## 8. Evidence

| File | Contents |
|---|---|
| `05_BEHANCE_OUTPUT/ALL_EMBEDS.md` | All 47 slideshow codes plus all 37 TOOLS USED codes, grouped by project, with IDs and dimensions |
| `05_BEHANCE_OUTPUT/ALL_EMBEDS.csv` | One row per slideshow with a single-line embed code |
| `05_BEHANCE_OUTPUT/TOOLS_USED_EMBEDS.md` | All 37 TOOLS USED iframe codes, grouped by project |
| `05_BEHANCE_OUTPUT/TOOLS_USED_EMBEDS.csv` | One row per TOOLS USED strip with a single-line iframe code |
| `05_BEHANCE_OUTPUT/README.md` | How to use the output files |
| `01_AUDIT/evidence/phase2-bulk/bulk-local-test-results.json` | 340-check local browser suite, all 47 slideshows |
| `01_AUDIT/evidence/phase2-bulk/bulk-live-test-results.json` | 332-check live Apps Script suite, retry record, blocked-image count |
| `01_AUDIT/phase_2_pilot_report.md` | P001-S01 pilot and real Behance gate |
| `01_AUDIT/unresolved_items.md` | P024 and other exceptions |

## 9. Finished deliverable

All 47 independent embed codes are ready in
`05_BEHANCE_OUTPUT/ALL_EMBEDS.md` (primary copy/paste source) and
`05_BEHANCE_OUTPUT/ALL_EMBEDS.csv` (spreadsheet). All 37 TOOLS USED logo-strip
codes are in the same Markdown file and in `TOOLS_USED_EMBEDS.md` /
`TOOLS_USED_EMBEDS.csv`; they are iframes served by the same deployment at
`?tools=Pxxx`. The 36 per-project files remain available for
project-by-slideshow work. The owner copies each code into its matching Behance
project section.

No further automated work is required. P024 remains blocked with its ID
reserved. P036 has no slideshow, but its TOOLS USED code is included.
