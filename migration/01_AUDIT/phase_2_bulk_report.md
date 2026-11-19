# Phase 2 Bulk Rollout Report — All 47 Slideshows

Status: **generated, deployed as version 3, and passing static, local, and live
Apps Script validation. Real published-Behance verification of the 45 newly
generated slideshows is pending owner review and publication.**
Date: 2026-11-20
Deployment: `https://script.google.com/macros/s/AKfycbzV7OufIj8Q6yLZaKxccF_ETSNJ3l76gMV_s0cvIzkPnxND7ofDwOMn35gdPO_JxlZfHA/exec`
Deployment version: **3** (same deployment ID; no host change)
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
| Unique image URLs | 331 |
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
project and deployed as **version 3** with the existing deployment ID. The
production Apps Script project and `index.html` were not touched.

## 4. Validation results

### 4.1 Static validation — 3092 / 3092

`node migration/tools/validate.js` passes every check:

- 47 slideshows, 36 projects, 335 slots, 331 unique URLs, exact frozen hash;
- exact URL string and order comparison for every slideshow;
- P032-S01 keeps both occurrences of `https://i.imgur.com/1MWxYk7.jpeg`;
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
  URL, so 334 blocked attempts represent all 335 slots.

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
only. Visual fidelity is deferred to real Behance review by the owner.

## 6. Preserved exceptions

| Item | State |
|---|---|
| P024 malformed link | Still `BLOCKED`; ID reserved; no URL invented |
| P026-S02 | Independent 3-image companion; preserved |
| P032-S01 repeated image | Both positions preserved |
| P011-S01 repair | 20 images, order, and styling preserved; local 21/21, live 20/20 |
| P038-S01 | Fullscreen-style reference; one button, no duplicate |
| P036 | Confirmed no slideshow; no snippet generated |

## 7. Real Behance verification pending

Only P001-S01 has been tested inside a real published Behance project. The
current test project does not contain the new narrow, portrait, or tall embeds,
and no Behance API credentials or module-creation route are available to add
them automatically.

Owner review is required before publishing. Recommended representative set:

| Slideshow | Audited size | Why |
|---|---|---|
| P002-S01 | 659 × 927 | Fixed-width portrait |
| P004-S01 | 546 × 771 | Narrow fixed-width |
| P005-S01 | 1335 × 1570 | Full-width tall |
| P023-S02 | 321 × 597 | Very narrow companion |
| P038-S01 | 1335 × 831 | Fullscreen reference |

The key open question is whether Behance honors declared heights above 1200 px
in its fixed-height wrapper. P005-S01 (1570 px) will answer that directly. If
Behance caps the height, the affected embeds must be re-measured and the height
strategy adjusted before rollout; no change is made speculatively.

After the owner publishes each test, run:

```text
node migration/tools/test-behance.js <published-url> --slide <ID> [--width <px>]
```

The script derives the expected image count, height, and exact URLs from
`03_REBUILT_SLIDESHOWS/data/<ID>.json`.

## 8. Evidence

| File | Contents |
|---|---|
| `01_AUDIT/evidence/phase2-bulk/bulk-local-test-results.json` | 340-check local browser suite, all 47 slideshows |
| `01_AUDIT/evidence/phase2-bulk/bulk-live-test-results.json` | 332-check live Apps Script suite, retry record, blocked-image count |
| `01_AUDIT/phase_2_pilot_report.md` | P001-S01 pilot and real Behance gate |
| `01_AUDIT/unresolved_items.md` | P024 and other exceptions |

## 9. Next step

1. Owner reviews and publishes the representative embeds above, or all 36
   project snippets.
2. Run the generalized real Behance gate on each published embed.
3. Resolve any height or width mismatch found in the real wrapper.
4. Obtain owner approval before replacing any live Behance embed.

No Behance embed was published by this rollout.
