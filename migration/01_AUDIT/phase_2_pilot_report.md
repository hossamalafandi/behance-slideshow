# Phase 2 Pilot Report — P001-S01 (Local Only)

Status: **local pilot checks pass; deployment and the real Behance release test
are still pending.** Phase 2 is in progress; the other 46 slideshows remain
unprocessed.
Date: 2026-11-18
Pilot ID: `P001-S01` (`AL-RASHED PROJECT`, section `RENDERS`)
Reference: `PHASE_2_IMPLEMENTATION_PLAN.md`, `INDEPENDENT_EMBED_STANDARD.md`,
`FULLSCREEN_STANDARD.md`, `IMAGE_HOSTING_POLICY.md`.

## 1. Approved scope

The owner approved Phase 2 preparation and the P001-S01 pilot with these
decisions:

1. P011-S01 is repaired later with the standard JavaScript, preserving all 20
   images and the original styling.
2. P024 stays blocked with its permanent ID reserved; no URL is invented.
3. P026-S02 remains an independent companion.
4. P032-S01 keeps its repeated image exactly.
5. Native fullscreen is attempted first, with a theater-mode fallback; the real
   Behance test is a release gate.
6. Each embed has its own height derived from its audited aspect ratio.
7. Original remote image URLs are preserved exactly; no downloading, copying,
   mirroring, resizing, proxying, or rehosting.
8. `INDEPENDENT_EMBED_STANDARD.md` is mandatory: one request loads exactly one
   slideshow; no index, gallery, dashboard, or multi-slideshow viewer.
9. GitHub write access will use the repository-owner account `hossamalafandi`.
10. A new standalone Apps Script project and deployment are authorized; the
    existing production deployment stays untouched.

Only `P001-S01` was generated. The generator's pilot allowlist rejects every
other ID.

## 2. Delivered files

| File | Purpose |
|---|---|
| `04_APPS_SCRIPT/Code.gs` | Stateless single-ID router; rejects missing, repeated, array, list, and unknown IDs with a neutral error page |
| `04_APPS_SCRIPT/Slideshow.html` | Shared template: original CSS, navigation, and fullscreen handling |
| `04_APPS_SCRIPT/SlidesData.gs` | Generated server-side lookup containing only `P001-S01` |
| `04_APPS_SCRIPT/appsscript.json` | New-project manifest targeting anonymous Web App access |
| `04_APPS_SCRIPT/.clasp.json.example` | Machine-specific binding template; no real ID committed |
| `03_REBUILT_SLIDESHOWS/data/P001-S01.json` | Generated manifest with the 17 audited remote URLs |
| `03_REBUILT_SLIDESHOWS/preview/P001-S01.html` | Local preview of the same response |
| `05_BEHANCE_OUTPUT/P001.md` | One standalone iframe snippet, height 805 px, deployment placeholder |
| `tools/generate.js` | Pilot-safe generator with the frozen hash and allowlist |
| `tools/validate.js` | 69 static integrity and independence checks |
| `tools/serve.js` | Local single-slideshow router emulator; no gallery route |
| `tools/test-pilot.js` | 37 browser and HTTP behavior checks |
| `01_AUDIT/evidence/phase2-pilot/pilot-test-results.json` | Machine-readable test report |

No deployment, publish, commit, or push has occurred. The iframe snippet still
contains `<NEW_DEPLOYMENT_ID>`.

## 3. Frozen-data validation

`node migration/tools/validate.js` → **69 / 69 checks pass**.

- 47 slideshows, 335 image slots, 331 unique URLs.
- Ordered URL SHA-256 remains
  `882a952d07cc442466cb2d7a3e3369ecb44a9a9e20fd299ca5f6f9e52ae001d0`.
- P001-S01 has exactly 17 images in the audited order, matching `images.csv`.
- The generated data, preview, and `SlidesData.gs` contain no other slideshow's
  images, IDs, or URLs.
- The snippet has exactly one iframe, one `?slide=P001-S01`, height 805,
  `allowfullscreen`, `allow="fullscreen"`, and no `sandbox`.
- The router rejects repeated, list, wildcard, empty, and unknown IDs; its error
  page contains no gallery, links, or slideshow IDs.
- No image binaries exist in the generated output.

## 4. Behavioral validation

`node migration/tools/test-pilot.js` → **37 / 37 checks pass** in Chrome 157.

- Canonical response is HTTP 200 and contains only the 17 audited images.
- Missing, empty, unknown, repeated, comma-separated, wildcard, and wrong-key
  requests all return the same neutral error page.
- Lowercase, padded, and encoded-key IDs normalize to the same single slideshow.
- Repeated requests are byte-identical; concurrent valid/invalid requests do
  not interfere.
- 17 slides, 17 dots, `1 / 17` counter, `object-fit: cover`, 20 px radius, no
  scrollbars at 1335 × 805.
- Next, previous, dot jumps, wrap-around, and hover-revealed controls match the
  original behavior.
- Native fullscreen targets only `#slideshow`; dots remain inside the
  fullscreen element; exit restores the normal layout.
- A denied request activates theater mode with the fallback note; a missing
  Fullscreen API does the same without uncaught errors.
- Two instances of the same slideshow keep independent counters, active dots,
  hover state, and fullscreen state; reloading one does not reset the other.
- Two browser contexts act as two visitors with different slides at the same
  time.
- No navigation or fullscreen state is written to storage or cookies; the app
  uses no `postMessage` or `BroadcastChannel`.

## 5. Image policy compliance

The owner's latest instruction is to leave the images alone. Phase 2 tests
therefore **made no imgur request**: every browser image route was aborted
(136 blocked attempts), and no image was fetched, saved, opened, or inspected.

Image fidelity is checked without image bytes:

- every `src` in the DOM matches `images.csv` exactly, in order;
- all 17 URLs remain remote `https://i.imgur.com/...` values;
- no `data:`, `file:`, proxied, resized, or mirrored URL exists;
- no image file exists anywhere under `03_REBUILT_SLIDESHOWS`.

Visual comparison is intentionally deferred to the real Behance release test and
owner review. The local pilot does not claim pixel-level image verification.

## 6. Fidelity decisions recorded by the pilot

1. **All slide images keep `loading="eager"`.** All 47 archived originals use
   eager loading on every image. A planned lazy-loading optimization was
   reversed because it could show blank slides during navigation and would
   diverge from the originals. The outer Behance iframe itself remains
   `loading="lazy"`.
2. **The dot container sits inside `#slideshow`.** In normal mode its position
   is visually identical; in native fullscreen the dots remain visible instead
   of disappearing with a sibling node.
3. **No other visual or interaction change.** URLs, order, CSS, arrows, dots,
   counter, hover behavior, and the 20 px radius are preserved.

## 7. Not yet proven

- The generated HTML has not run inside Apps Script's `HtmlService`.
- The new deployment URL does not exist yet.
- A real published Behance project has not loaded the iframe, so the survival
  of `allowfullscreen` / `allow="fullscreen"` is unconfirmed.
- Native fullscreen + theater fallback in the real Behance parent is the
  mandatory release gate and is still pending.
- The exact Behance column width and the final 805 px height need visual
  confirmation by the owner.
- The other 46 slideshows have not been generated or tested.

## 8. Reproduce locally

```powershell
node migration/tools/generate.js --slide P001-S01
node migration/tools/validate.js
node migration/tools/test-pilot.js
```

The last command launches local Chrome, blocks all imgur requests, and writes
`migration/01_AUDIT/evidence/phase2-pilot/pilot-test-results.json`.

## 9. Verdict

The P001-S01 **local** pilot passes its static, router, navigation, fullscreen,
and independence checks with no image access. Phase 2 must not process the other
46 slideshows until the new Apps Script deployment and the real Behance
fullscreen test pass.
