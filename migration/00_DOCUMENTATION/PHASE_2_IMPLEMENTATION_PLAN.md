# Phase 2 Implementation Plan

Status: **approved 2026-11-18; bulk rollout generated and deployed 2026-11-20.
All 47 slideshows pass static (3092/3092), local browser (340/340), and live
Apps Script (332/332) validation. P001-S01 passes the real published-Behance
gate (18/18); real verification of the other 45 slideshows is pending owner
review and publication. P024 remains blocked.**
Prepared: 2026-11-18 after the Phase 1.1 audit refinement.
No image download is authorized by this document. Deployment and publishing
require the gates below.

## 1. Goal

Replace the 47 Google Sites slideshow embeds with one central Google Apps Script
Web App that hosts shared rendering code but serves **exactly one slideshow per
request**, identified by its permanent ID, while preserving the original images,
order, aspect ratios, styling, and interactions.

Each slideshow remains a separate Behance embed. The deployment is shared
hosting, not a gallery, dashboard, index, or multi-slideshow viewer. Multiple
embeds and multiple visitors must be able to interact independently at the same
time. See `INDEPENDENT_EMBED_STANDARD.md`.

The existing production Apps Script project and deployment remain untouched.

## 2. Non-negotiable constraints

1. **No image downloading or rehosting.** All image `src` values remain the
   original remote URLs. See `IMAGE_HOSTING_POLICY.md`.
2. **Permanent IDs.** `P001`–`P038` and `P001-S01`–`P038-S01` never change.
3. **One request = one slideshow.** Every iframe uses exactly one `?slide=`
   identifier and receives only that slideshow. No index, gallery, dashboard,
   portfolio page, or multi-slideshow viewer. No shared navigation or fullscreen
   state between embeds. See `INDEPENDENT_EMBED_STANDARD.md`.
4. **One new Apps Script deployment.** Shared template plus per-slide data; the
   deployment is stateless.
5. **GitHub is the source of truth.** Generated files are reproducible from
   committed inputs.
6. **P038-S01 keeps its existing fullscreen button; every other slideshow gets
   one identical button.** See `FULLSCREEN_STANDARD.md`.
7. **No silent content changes.** Exceptions are resolved only by evidence or
   explicit owner approval.
8. **No bulk migration before a pilot passes.**

## 3. Prerequisites and approval gates

| Gate | Needed for | Owner action |
|---|---|---|
| G1 | Phase 2 start | Approve the Phase 1.1 report and this plan |
| G2 | P011-S01 rebuild | Approve restoring the standard JavaScript (working arrows, dots, counter) |
| G3 | Git push | Grant push access to the account that will publish the repository |
| G4 | Apps Script | Confirm a **new** Apps Script project under the owner's account; provide edit access or run the provided `clasp` steps |
| G5 | Deployment | Approve creating a new Web App deployment with access "Anyone" |
| G6 | Behance test | Approve publishing one temporary test project to verify fullscreen inside Behance |
| G7 | Bulk rollout | Approve each batch after reviewing its test report |

If G3/G4 are not available, Phase 2 stops after local generation and testing.
Nothing is pushed or deployed without the corresponding gate.

## 4. Deliverables

```
migration/
├── 00_DOCUMENTATION/
│   ├── IMAGE_HOSTING_POLICY.md          (done in Phase 1.1)
│   ├── FULLSCREEN_STANDARD.md           (done in Phase 1.1)
│   ├── INDEPENDENT_EMBED_STANDARD.md    one request = one slideshow; no gallery
│   └── PHASE_2_IMPLEMENTATION_PLAN.md   this file
├── 03_REBUILT_SLIDESHOWS/
│   ├── preview/                         one local preview per slideshow (no gallery index)
│   └── data/                            one JSON manifest per slideshow (remote URLs)
├── 04_APPS_SCRIPT/
│   ├── Code.gs                          stateless doGet router, one ID per request
│   ├── Slideshow.html                   shared CSS + JS + markup shell
│   ├── SlidesData.gs                    generated server-side lookup from slides.config.json
│   ├── appsscript.json                  manifest
│   └── .clasp.json.example              no machine-specific ID committed
├── 05_BEHANCE_OUTPUT/
│   ├── P001.md … P038.md                per-project standalone snippets in page order
│   └── generated-checklist.md           rollout checklist, not a web page
└── tools/
    ├── generate.js                      data → preview, SlidesData.gs, snippets
    ├── validate.js                      URL/order/template/independence checks
    ├── serve.js                         local single-slideshow router emulator
    └── test-pilot.js                    Playwright DOM/behavior checks with image requests blocked
```

`03_REBUILT_SLIDESHOWS/assets/` is not created. No image binaries are written.

## 5. Canonical data model

`01_AUDIT/slides.config.json` remains the master input. Phase 2 adds no local
image paths. For each slideshow:

```json
{
  "slideshow_id": "P001-S01",
  "project_id": "P001",
  "section_label": "RENDERS",
  "descriptor": "renders",
  "frame_w": 1335,
  "frame_h": 805,
  "aspect": 1.658,
  "radius_px": "20px",
  "object_fit": "cover",
  "fullscreen_required": true,
  "images": [
    { "order": 1, "src": "https://i.imgur.com/ywuUBKU.jpeg", "w": 3840, "h": 2160, "alt": "Slide 1" }
  ]
}
```

Rules:

- `src` is the exact audited URL; no normalization;
- `order` is contiguous and defines DOM order;
- duplicate URLs stay as separate entries;
- `fullscreen_required` is `true` for all 47;
- the Behance height is computed per slideshow from its aspect ratio; there is
  no shared height across embeds;
- statuses and notes come from the audited CSVs.

## 6. Apps Script design

### 6.1 Router (`Code.gs`)

```js
function doGet(e) {
  var raw = e && e.parameter ? e.parameter.slide : null;

  // Exactly one string value; reject missing, repeated, array, or empty IDs.
  if (typeof raw !== 'string' || raw.trim() === '') {
    return HtmlService.createHtmlOutput(errorPage(''))
      .setTitle('Slideshow not found')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  var id = raw.trim().toUpperCase();
  var slide = Object.prototype.hasOwnProperty.call(SLIDES, id) ? SLIDES[id] : null;
  if (!slide) {
    return HtmlService.createHtmlOutput(errorPage(id))
      .setTitle('Slideshow not found')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  var template = HtmlService.createTemplateFromFile('Slideshow');
  template.slide = slide;
  return template.evaluate()
    .setTitle(slide.project_id + ' — ' + slide.section_label)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
```

- Exactly one `slide` string is accepted. Repeated parameters, arrays, empty
  values, comma-separated IDs, wildcards, `all`, `index`, and `list` are
  rejected.
- Unknown or missing IDs return a neutral error page, HTTP 200 (Apps Script
  cannot set 404). The error page contains no gallery, list, preview, or links to
  other slideshows.
- No image URLs are fetched, cached, or proxied.
- No external JavaScript libraries.
- The template receives only the requested slideshow object, not all 47. The
  `SLIDES` lookup is server-side only and is never serialized wholesale into the
  response.

### 6.2 Shared template (`Slideshow.html`)

- Preserve the original standard CSS: Lexend, transparent background, 20 px
  radius, `object-fit: cover`, 120 px side shadows, hover-revealed arrows,
  dots, `n / total` counter, 50 px bottom padding.
- Preserve `width: 100vw; height: 100vh` inside the iframe stage.
- Render slides server-side in audited order.
- Every slide image keeps `loading="eager"`, matching all 47 archived originals.
  The outer Behance iframe itself uses `loading="lazy"`.
- Add exactly one fullscreen button using `FULLSCREEN_STANDARD.md`.
- Add no autoplay, keyboard navigation, swipe, captions, or extra controls.
- Keep the JavaScript self-contained; no build step in the browser.

### 6.3 Generated data (`SlidesData.gs`)

Generated once per approved data freeze:

```js
var SLIDES = {
  "P001-S01": { /* fields above, including images */ }
};
```

The generator sorts by slideshow ID, preserves image order, and rejects any
mismatch with `images.csv`.

### 6.4 Stateless, isolated runtime

Server:

- `SLIDES` is a read-only lookup table for the lifetime of a request.
- No `CacheService`, `PropertiesService`, `UserProperties`, `LockService`, or
  spreadsheet writes are used for slide position, sessions, or per-visitor
  state.
- Each `doGet` execution returns one self-contained HTML document for one
  slideshow. Concurrent requests do not share mutable state.

Client:

- Slide index, active dot, counter, transform, hover, fullscreen, and
  theater-mode state are held only in that iframe document's JavaScript closure.
- No `localStorage`, `sessionStorage`, cookies, or IndexedDB are used for
  navigation or fullscreen state.
- No `postMessage`, `BroadcastChannel`, or other cross-iframe communication is
  used.
- Navigation or fullscreen changes in one iframe must not affect another
  iframe, even when both load the same slideshow ID.

The complete contract and test matrix are in `INDEPENDENT_EMBED_STANDARD.md`.

## 7. Behance output

For each slideshow, generate:

```html
<iframe
  src="https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec?slide=P001-S01"
  width="100%"
  height="805"
  style="border:0;border-radius:20px;overflow:hidden"
  loading="lazy"
  allowfullscreen
  allow="fullscreen">
</iframe>
```

- Each snippet contains exactly one `slide` ID and loads exactly one slideshow.
- Each snippet is a standalone, independent embed; no snippet loads a gallery,
  dashboard, or another slideshow.
- Height is derived from that slideshow's audited aspect ratio and the intended
  Behance column width; it is recorded per slideshow. There is no shared height.
- `allowfullscreen` and `allow="fullscreen"` are mandatory.
- No `sandbox` attribute is emitted.
- One Markdown file per project, snippets in page order. The file is a
  copy/paste source, not a rendered multi-slideshow page.
- No cross-iframe navigation, shared state, or messaging is generated.

## 8. Fullscreen integration

Implementation follows `FULLSCREEN_STANDARD.md` exactly:

1. native request on `#slideshow`;
2. Promise rejection and `fullscreenerror` handling;
3. `fullscreenchange` state updates;
4. in-iframe theater-mode fallback with a transient status note;
5. one button, no duplicate in P038-S01;
6. generated iframe permissions as above.

The outer Behance iframe is the decisive permission layer in Chromium. The real
Behance DOM must be inspected after publishing to confirm the attributes survive.
If Behance strips them, native fullscreen is unavailable and the fallback is the
documented behavior; a hosting alternative would require a separate owner
decision.

## 9. Build and validation pipeline

1. **Freeze data.** Copy the audited `slides.config.json` to the Phase 2 input;
   do not edit URLs by hand.
2. **Validate input.** Recompute the ordered URL SHA-256 and compare with the
   Phase 1.1 value:
   `882a952d07cc442466cb2d7a3e3369ecb44a9a9e20fd299ca5f6f9e52ae001d0`.
   Confirm 335 rows, 331 unique URLs, 47 slideshows, duplicate slots intact.
3. **Generate.** Emit local preview pages, `SlidesData.gs`, and Behance
   snippets. No downloads.
4. **Static checks.** Scan generated output for `assets/`, `data:image`,
   `base64`, Drive URLs, local paths, and rewritten image URLs.
5. **Template checks.** Exactly one `#fullscreenBtn`, one `#slideshow`, no extra
   controls, no external JS, all original interactions present.
6. **DOM and layout checks.** Render each preview at its audited frame size and
   compare DOM geometry and computed styles with the source. Do not request,
   open, or inspect image files; image-content comparison is deferred to the
   real Behance test and owner review.
7. **Interaction checks.** Arrows, dots, counter, loop boundaries, hover
   reveals, and fullscreen.
8. **Local fullscreen harness.** Re-run the Phase 1.1 cross-origin parent →
   wrapper → sandboxed slide scenarios, including denial and Promise rejection.
9. **Independent-embed checks.** During the pilot, load duplicate instances of
   the same ID in separate iframes and browser contexts. Once a second ID is
   authorized, repeat with different IDs; verify that each response contains
   only the requested slideshow, navigation/fullscreen state is isolated, and no
   shared storage or messaging exists.
10. **Deploy to the new Apps Script project** only after G3/G4/G5.
11. **Verify the deployed URL** directly in Chrome, Edge, Firefox, and Safari
    where available.
12. **Behance test project** with independent generated snippets, after G6.
13. **Batch generation and owner review** after G7.

## 10. Test strategy

### 10.1 Data integrity

- 47/47 slideshow IDs present; no duplicates, no missing IDs.
- 335/335 image slots; 331 unique URLs.
- Exact URL-string comparison, including query parameters and repeated URLs.
- Order comparison against `images.csv` and archived source HTML.
- P032-S01 positions 2 and 3 remain identical.
- P026-S02 remains a separate 3-image slideshow.
- P011-S01 has 20 images in the original order.

### 10.2 Template and DOM regression

- Exactly one fullscreen button in every rendered page.
- P038-S01 has no second button.
- Button computed style matches the reference: absolute, top/right 20 px,
  `rgba(0,0,0,0.3)`, white, 20 px, `8px 12px`, radius 10 px, z-index 20.
- No layout shift when the button is added; compare slide/image rectangles with
  and without the overlay.
- Images, border radius, shadows, arrows, dots, counter, transitions and hover
  behavior unchanged.
- No unexpected scrollbars at the audited frame size.

### 10.3 Interaction

- Next/previous arrows advance and loop at both ends.
- Every dot is clickable and updates the active state.
- Counter matches the current slide and total.
- Hover reveals arrows, dots, counter and side shadows exactly as before.
- P011-S01 works after the approved repair; record it as a behavior repair, not
  an original behavior.
- P038-S01 fullscreen button still exists once and uses the hardened handler.
- No autoplay or keyboard/swipe behavior is introduced.

### 10.4 Fullscreen

| Test | Method | Pass condition |
|---|---|---|
| Support detection | local page + harness | `document.fullscreenEnabled` read without error |
| Native grant | Chromium harness, outer iframe permission | `fullscreenchange` fires, container is fullscreen |
| Native denial | outer iframe without permission | `fullscreenerror` fires, no uncaught error |
| Promise rejection | stub `requestFullscreen` to reject | fallback activates, note shows |
| Exit | click button while fullscreen | `exitFullscreen()` resolves, layout restored |
| P038 | render P038-S01 | exactly one button, same style/position |
| iframe attributes | inspect generated snippet and Behance DOM | `allowfullscreen` and `allow="fullscreen"` present |
| Real Behance | published test project | button works or fallback is clearly shown |
| Browser matrix | Chrome, Edge, Firefox, Safari | documented result per browser |
| Mobile | iOS Safari / Android Chrome if available | no crash; fallback documented |

The real Behance test is a **release gate**, not an optional check. It must use a
new temporary project, not an existing published project, and must be approved
under G6.

### 10.5 Independence and concurrency

| Test | Method | Pass condition |
|---|---|---|
| Single-slideshow response | Request `?slide=P001-S01` | HTML contains only P001-S01's images and data; no other slideshow IDs, images, or catalog |
| Missing ID | Request without `slide` | Neutral error page; no gallery, list, or links |
| Unknown ID | Request `?slide=P999-S99` | Neutral error page; no gallery |
| Repeated ID parameter | Request `?slide=P001-S01&slide=P002-S01` | Rejected; no combined view |
| List/comma value | Request `?slide=P001-S01,P002-S01` or `?slide=all` | Rejected; no combined view |
| Different slideshows | Two iframes, P001-S01 and P002-S01 | Each shows its own sequence, counter, dots, and dimensions |
| Same slideshow twice | Two iframes with the same ID | Each has independent navigation state |
| Navigate one embed | Advance one iframe | The other iframe's slide, counter, and dots do not change |
| Fullscreen one embed | Enter/exit fullscreen in one iframe | The other iframe's state and layout do not change |
| Two visitors | Two independent browser contexts | Different slides can be active at the same time; no shared state |
| Storage/messaging scan | Inspect storage, cookies, and frame events | No navigation/fullscreen state in storage; no cross-iframe messaging |
| Per-embed dimensions | Portrait and landscape embeds together | Each uses its own audited height; no cross-iframe resizing or scroll interference |

The independence tests are part of the pilot and every rollout batch, not a
one-time local check.

### 10.6 Failure handling

- Simulate a blocked image URL: the page must show the slide layout without
  substituting another image; the failure is recorded in
  `unresolved_items.md`.
- Unknown `?slide=` value: neutral error page, no stack trace.
- Missing, repeated, array, or list `slide` values: neutral error page, never a
  gallery or combined view.
- Slow Apps Script cold start: archived eager images render progressively; no
  broken controls.
- Iframe height too small/large: no inner scrollbars; letterboxing only if
  unavoidable and documented.

## 11. Pilot and rollout

**Pilot (after G1–G6):**

1. `P001-S01` — the only pilot generated and tested until the real Behance gate
   passes.
2. `P038-S01` is the fullscreen style/behavior reference; it is not generated in
   this pilot.
3. `P011-S01`, `P026-S02`, and `P032-S01` are handled in their approved rollout
   batches, not before the pilot gate.

Before publishing, load duplicate instances of `P001-S01` in separate iframes
and separate browser contexts simultaneously and run the independence tests in
section 10.5. Each must keep its own navigation, fullscreen state, and
dimensions. Once a second ID is authorized, repeat with different IDs.

Publish only the test Behance project first. Do not replace the live portfolio
until the pilot report is approved.

**Batch rollout:**

- Batch A: P001–P010.
- Batch B: P011–P020.
- Batch C: P021–P030.
- Batch D: P031–P038 (P024 remains blocked).
- After each batch: run data checks, DOM/behavior spot checks, interaction
  tests, and a fullscreen smoke test; deliver a short report; wait for approval.

**Current state (2026-11-20):** the bulk generator produced all 47 slideshows
and 36 project snippets in one pass, and the complete server map was deployed
as version 3 with the existing deployment ID. Static validation passes
3092/3092, the local browser suite 340/340, and the live Apps Script suite
332/332. The real published-Behance gate passes P001-S01 18/18; the other 45
slideshows await owner review and publication before the same gate can run.
P024 remains blocked. See `01_AUDIT/phase_2_bulk_report.md`.

No batch is auto-published. Snippets are generated for the owner to paste or for
an approved automated update.

## 12. Rollback

- The Google Sites portfolio remains live and unchanged during the rollout.
- A Behance embed can be replaced by its previous code without touching Apps
  Script.
- The new Apps Script deployment is versioned; roll back by deploying the
  previous version.
- The existing production Apps Script project/deployment is never modified, so
  it remains a working fallback.
- No image assets exist to clean up.

## 13. Acceptance criteria

Phase 2 is complete only when:

- all 47 slideshows are individually reachable and render correctly from the
  new Web App;
- every request loads exactly one slideshow by ID; no index, gallery, dashboard,
  or multi-slideshow viewer exists;
- every HTML response contains only the requested slideshow's images and data;
- every embed has its own audited height, navigation state, and fullscreen
  state;
- multiple iframes and multiple visitors can interact simultaneously without
  interference or shared state;
- every image URL and order matches the audit exactly, with no local images;
- every slideshow has exactly one fullscreen button matching P038's visual;
- native fullscreen or the documented fallback works in the real Behance test;
- all original interactions still work;
- P011's repair, P026-S02's independence, and P032's repeated image are recorded;
- P024 remains explicitly blocked, not silently omitted;
- the owner approves the final batch report.

## 14. Risks and open decisions

| Risk / decision | Status | Handling |
|---|---|---|
| P024 destination unknown | Open | Keep `BLOCKED`; migrate only after owner supplies a URL |
| Cross-embed state leakage | Prevented by design | Stateless router, per-request HTML, no shared storage/messaging; independence tests required |
| Gallery/index scope creep | Prohibited | One `slide` ID per iframe; error page has no catalog; review each generated snippet |
| P011 repair behavior | Done | Rebuilt with standard JS on 2026-11-19; 20 images and order preserved; local 21/21, live 20/20 |
| Behance sanitizes iframe permissions | Verified for P001-S01 | `allowfullscreen` survives; native fullscreen targets `#slideshow`; representative embeds still need the real gate |
| Fixed iframe height | Locally/live verified | All 47 pass at their audited heights; real Behance wrapper still must be checked for heights above 1200 px, especially P005-S01 (1570 px) |
| Apps Script / GitHub access | Open | G3/G4; stop before deployment if unavailable |
| Imgur hotlink failure | Accepted | Monitor; record failures; never rehost |
| Safari/Firefox fullscreen differences | Unknown | Test matrix; fallback must work |
| Apps Script cold start | Known | Inline CSS/JS; outer iframe lazy; archived eager images render progressively |
