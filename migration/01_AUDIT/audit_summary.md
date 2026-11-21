# Phase 1 Audit Summary

Portfolio: <https://sites.google.com/view/hossam-alafandi/freelance>
Audit date: 2026-11-18
Status: Phase 1.1 complete and approved; Phase 2 in progress. The P001-S01 local
pilot passes; deployment and the real Behance test are pending.

**Post-audit update (2026-11-21).** The owner supplied the fixed P024 page.
It was rescanned and added as `P024-S01` (4 images, RENDERS) and `P024-TOOLS`
(4 logos). Current totals: **48 slideshows in 37 projects, 339 image slots,
336 unique URLs, 38 TOOLS USED strips**, deployed as version 6 with the same
deployment ID. The Phase 1 tables below remain the 2026-11-18 audit snapshot.

## 1. Executive summary

All 38 Freelance projects were discovered in their original page order and
assigned permanent IDs `P001`–`P038`. Thirty-seven pages were fully inspected;
one (`P024`) has a malformed link and could not be reached. Of the 37 reachable
projects, 36 contain at least one interactive image slideshow and one (`P036`)
contains only static images.

A total of **47 slideshows** were detected and extracted, containing **335 image
slots** and **331 unique image URLs**. Every slideshow's original HTML was
archived, every image URL was verified over HTTP, and every image's true pixel
dimensions were read from the original file. There are no missing images and no
unreadable slideshow frames.

Phase 1.1 added two mandatory requirements:

- **No image downloading or rehosting.** All 335 slots keep their original
  remote URLs, in order, including repeated URLs. No image binary was saved.
- **One consistent fullscreen button on all 47 slideshows.** Only `P038-S01`
  originally had one; it is the visual/implementation reference and must not be
  duplicated.

Phase 1.1 also resolved two of the three slideshow exceptions and fully
investigated the third:

- `P026-S02` is an intentional separate companion slideshow, rendered side by
  side with `P026-S01`; its 3 images are a subset, but the layout and separate
  controls prove it is not an accidental duplicate. Preserve independently.
- `P032-S01` has 3 slots and 3 dots; positions 2 and 3 intentionally repeat the
  same URL. No evidence proves it accidental. Preserve exactly.
- `P011-S01` has 20 images and the standard CSS/markup but no `<script>` block.
  Its intended behavior is the same standard slideshow used by 45 other files.
  Restoring the shared JavaScript is recommended but requires owner approval
  because it changes the current live behavior from inert to working.

`P002`'s nine "empty" iframes are Google Drive **video** previews (MOV), not
static images and not slideshows. Their preview URLs return HTTP 200, but they
render blank in headless embedded capture. This does not affect the slideshow
migration.

`P024` was blocked during the original audit. Card 24 is a distinct
"MASTER BEDROOM" card with its own thumbnail
(`https://i.imgur.com/4OFuMn0.jpeg`), not the P009 card (`GeYUbMn.jpeg`). On
2026-11-21 the owner supplied the fixed page
(`.../freelance/av_sf_master_bedroom`); it was rescanned and migrated.

## 2. Coverage and status

| Status | Projects | Meaning |
|---|---:|---|
| `VERIFIED` | 35 | Page inspected, slideshow source and images archived, no open defect |
| `PARTIAL` | 1 | Content archived, but P011-S01 has a missing-script defect |
| `BLOCKED` | 1 | Page cannot be reached from the portfolio |
| `NO_SLIDESHOW` | 1 | Page inspected; no interactive slideshow exists |
| **Total** | **38** | |

| Slideshow status | Count |
|---|---:|
| `EXTRACTED` | 46 |
| `NEEDS_REVIEW` | 1 |
| `DETECTED` (not yet extracted) | 0 |
| `BLOCKED` | 0 |
| **Total** | **47** |

Partially reviewed project: `P011`.
Blocked project: `P024`.
No-slideshow project: `P036`.

P026 and P032 moved from `PARTIAL` to `VERIFIED` in Phase 1.1 after the evidence
review. Their slideshows are `EXTRACTED`, not silently altered.

## 3. Project inventory

| ID | Project title | Shows | Slideshow IDs (descriptor, images) | Image slots | Status |
|---|---|---|---:|---|---:|---|
| P001 | AL-RASHED PROJECT | 1 | P001-S01 (renders, 17) | 17 | VERIFIED |
| P002 | Cellphone Store | 1 | P002-S01 (renders, 11) | 11 | VERIFIED |
| P003 | DK-Apartment | 1 | P003-S01 (presentation, 38) | 38 | VERIFIED |
| P004 | AB-Apartment | 7 | P004-S01 (living-room, 7)<br>P004-S02 (reciption, 6)<br>P004-S03 (girls-bedroom, 5)<br>P004-S04 (master-bedroom, 5)<br>P004-S05 (kitchen, 5)<br>P004-S06 (boys-bedroom, 4)<br>P004-S07 (bathroom, 5) | 37 | VERIFIED |
| P005 | GF-KIDS BEDROOM | 1 | P005-S01 (renders, 8) | 8 | VERIFIED |
| P006 | AP-GF-RECIPTION | 1 | P006-S01 (renders, 7) | 7 | VERIFIED |
| P007 | AP-GF-FAMILY MAJLIS | 1 | P007-S01 (renders, 18) | 18 | VERIFIED |
| P008 | GIRL BEDROOM | 1 | P008-S01 (renders, 7) | 7 | VERIFIED |
| P009 | MASTER BEDROOM | 1 | P009-S01 (renders, 9) | 9 | VERIFIED |
| P010 | BOY BEDROOM | 1 | P010-S01 (renders, 6) | 6 | VERIFIED |
| P011 | OA-AP-FAMILY MAJLIS | 1 | P011-S01 (renders, 20) | 20 | PARTIAL |
| P012 | GF-DINNING ROOM | 1 | P012-S01 (renders, 5) | 5 | VERIFIED |
| P013 | OA-AP-BOYS BEDROOM | 1 | P013-S01 (renders, 6) | 6 | VERIFIED |
| P014 | AP-FF-RECIPTION | 1 | P014-S01 (renders, 5) | 5 | VERIFIED |
| P015 | OA_MASTER_BEDROOM | 1 | P015-S01 (renders, 8) | 8 | VERIFIED |
| P016 | AP-GF-LANDSCAPE | 1 | P016-S01 (renders, 8) | 8 | VERIFIED |
| P017 | VILLA LOBBY - EYGPT | 1 | P017-S01 (renders, 9) | 9 | VERIFIED |
| P018 | GF-STAIRS | 1 | P018-S01 (renders, 5) | 5 | VERIFIED |
| P019 | GF-GIRL BEDROOM | 1 | P019-S01 (renders, 6) | 6 | VERIFIED |
| P020 | AV_3rd_Floor_Family_Majlis | 1 | P020-S01 (renders, 4) | 4 | VERIFIED |
| P021 | VILLA GROUND FLOOR - UAE | 1 | P021-S01 (renders, 11) | 11 | VERIFIED |
| P022 | OA-AP-GIRL BEDROOM | 1 | P022-S01 (renders, 5) | 5 | VERIFIED |
| P023 | MEN MAJLIS - EYGPT | 2 | P023-S01 (renders-a, 8)<br>P023-S02 (renders-b, 4) | 12 | VERIFIED |
| P024 | — | 0 | — | 0 | BLOCKED |
| P025 | VILLA ENTRANCE - EYGPT | 1 | P025-S01 (renders, 4) | 4 | VERIFIED |
| P026 | KITCHEN | 2 | P026-S01 (renders-a, 6)<br>P026-S02 (renders-b, 3) | 9 | VERIFIED |
| P027 | FAMILY NIGHT MAJLIS - EYGPT | 2 | P027-S01 (renders-a, 4)<br>P027-S02 (renders-b, 4) | 8 | VERIFIED |
| P028 | AP-FF-MASTER BEDROOM | 1 | P028-S01 (renders, 5) | 5 | VERIFIED |
| P029 | GUESTS ROOM - OM ASEL | 2 | P029-S01 (renders-a, 5)<br>P029-S02 (renders-b, 5) | 10 | VERIFIED |
| P030 | AV_SF_Family_Majlis_Render | 1 | P030-S01 (renders, 4) | 4 | VERIFIED |
| P031 | ARABIC MAJLIS | 1 | P031-S01 (renders, 6) | 6 | VERIFIED |
| P032 | FAMILY LIVING ROOM GF- VRAY | 1 | P032-S01 (renders, 3) | 3 | VERIFIED |
| P033 | AV-SF-BOY-BEDROOM | 1 | P033-S01 (renders, 4) | 4 | VERIFIED |
| P034 | AV_SF_Girl Bedroom | 2 | P034-S01 (renders, 5)<br>P034-S02 (bathroom, 3) | 8 | VERIFIED |
| P035 | GUEST MAJLIS- VRAY | 1 | P035-S01 (renders, 6) | 6 | VERIFIED |
| P036 | MASTER-BEDROOM-VRAY | 0 | — | 0 | NO_SLIDESHOW |
| P037 | FAMILY MAJLIS GF - VRAY | 1 | P037-S01 (renders, 3) | 3 | VERIFIED |
| P038 | Dental Clinic | 1 | P038-S01 (renders, 3) | 3 | VERIFIED |

Multi-slideshow projects are `P004` (7 room-based slideshows), `P023`, `P026`,
`P027`, `P029`, and `P034` (2 each).

## 4. What the slideshows actually are

All 47 are **Google Sites "Custom embed" blocks containing hand-written HTML**,
not YouTube, Vimeo, Drive, or a third-party gallery widget. Google Sites wraps
each one in nested cross-origin frames; the user HTML lives on
`*.googleusercontent.com` and was read directly. There is no standalone public
embed URL for these blocks — the HTML is stored inside the Sites page. The
archived `*.original.html` file is therefore the authoritative original source.

### Template variants

| Variant | Document title | Count |
|---|---|---:|
| Standard | `Image Slideshow with Side Shadows on Hover` | 46 |
| Older fullscreen | `Image Slideshow with Fullscreen` | 1 (`P038-S01`) |

Forty-five of the 46 standard files are byte-identical in CSS and JavaScript.
`P011-S01` shares the CSS and markup but has no `<script>` block, so it is
visually present but non-functional.

### Shared visual design

- Font: **Lexend** (Google Fonts), fallback sans-serif.
- Transparent page/container background.
- Container and images: **20 px** border radius.
- Images: `object-fit: cover`, full-frame.
- **120 px** gradient side shadows on left and right.
- Arrows (`❮` / `❯`), dots, and the `n / total` counter are hidden at rest
  (`opacity: 0`) and revealed on hover over the slideshow.
- Vertical centering with `height: 100vh`, 50 px bottom padding.

### Interactions

| Interaction | Source slideshows | Notes |
|---|---:|---|
| Previous/next arrows | 47 | Present everywhere; inert only in P011-S01 |
| Dot navigation | 45 | Absent in P011-S01 (no JS); P001-S01 verified working |
| Page counter | 46 | Empty in P011-S01 |
| Hover-revealed controls | 47 | CSS-only |
| Fullscreen button | 1 | P038-S01 only; **target is 47**, one per slideshow |
| Keyboard navigation | 0 | No key handlers in any source |
| Touch / swipe | 0 | No touch handlers |
| Autoplay | 0 | No timers |
| Captions or alt text | 0 | `alt="Slide N"` only |
| External JS libraries | 0 | No Swiper/Slick/jQuery/etc. |

### Frame sizes as rendered

Measured at a 1440×900 viewport. Width and height depend on the Google Sites
layout, not on the slideshow code:

- Width: 321–1335 px (546 px in two-column layouts, 1335 px full width).
- Height: 443–1570 px.
- Aspect: 16 landscape (≥ 1.0), 3 square (0.9–1.0), 28 portrait (< 0.9).
- The tallest frames (1335×1570) belong to single portrait renders; the Behance
  rebuild will need a deliberate fixed height instead of these page-driven sizes.

## 5. Image inventory

| Metric | Value |
|---|---:|
| Image slots | 335 |
| Unique image URLs | 331 |
| Hosts | `i.imgur.com` only |
| JPEG / PNG | 333 / 2 |
| HTTP failures | 0 |
| Missing dimensions | 0 |
| Distinct pixel dimensions | 23 |
| Portrait / landscape / square originals | 192 / 126 / 13 |
| Smallest original | 579×1030 |
| Largest original | 4064×4515 |

Most common source dimensions: 2700×3000 (126 images), 3721×2631 (38),
1080×1440 (32), 1831×1030 (25), 2560×1440 (20), 3840×2160 (15), 1030×1030 (13),
3120×1755 (11), 2000×2667 (10).

The two PNGs are `P004-S01` images 2 and 4. The single 38-image slideshow is
`P003-S01`. Image counts per slideshow range from 3 to 38, median 5.

Repeated content is deliberate in both places:

- `P026-S02` (3 images) is a strict subset of `P026-S01` (6 images). The two
  frames are rendered side by side at the same vertical position (x=52 and
  x=841), with separate 6-dot and 3-dot controls. Preserve independently.
- `P032-S01` uses `https://i.imgur.com/1MWxYk7.jpeg` at both position 2 and 3.
  The source has exactly 3 slides and 3 dots; preserve all three slots.

No image is shared between unrelated projects.

## 6. Non-slideshow media found

| Type | Count | Where |
|---|---:|---|
| Software-logo strips (custom embed) | 37 | One on every inspected project page; the only embed on P036 |
| Google Maps embeds | 2 | P001, P002 |
| Google Drive file previews | 2 | P003, P008 |
| Google Drive video previews (MOV) | 9 | P002; HTTP 200, blank in headless embedded capture |
| Ordinary static images | — | All project pages; P036 relies on them for its RENDERS section |

The logo strips use a different custom-embed document
(`Software Logos with Equal Spacing`) and are not slideshows: 4–5 static logo
images in a 127 px-high strip. They were excluded from the slideshow IDs.

The nine P002 Drive embeds are video previews (`IMG_3040.MOV`, `IMG_3208.MOV`,
etc.), not static images. Each preview URL returns HTTP 200 and a Drive poster
image, but the embedded frames remained blank in headless Chrome. They are
outside the slideshow scope and do not block migration. A normal-browser visual
check is recommended but not required.

## 7. Integrity checks performed

| Check | Result |
|---|---|
| Archived HTML vs JSON image count | 47/47 match |
| Archived HTML vs JSON image order | 47/47 match |
| Slideshows with zero images | 0 |
| Image URLs returning HTTP 2xx | 331/331 unique URLs |
| True dimensions obtained | 331/331 |
| Original source files archived | 47/47 |
| Slideshow frames readable | 47/47 |
| Live interaction test, P001-S01 | Passed: 17 dots, `1 / 17` → `2 / 17`, transform moves |
| Live interaction test, P011-S01 | Confirmed broken: `moveSlide` undefined, no dots, counter empty |
| P036 page inspection | Confirmed no slideshow; static images only |
| P026 layout comparison | Confirmed separate side-by-side frames at x=52 and x=841 |
| P032 source check | Confirmed 3 slots / 3 dots / repeated URL; no accidental-duplication evidence |
| P002 Drive check | 9 video preview iframes, HTTP 200, blank in headless embed |
| Phase 1.1 fullscreen harness | Outer iframe permission granted → native fullscreen works; outer denied → `fullscreenerror` |

Two audit artefacts were corrected during verification and are not data defects:

1. The first image-metadata pass used imgur's `b` thumbnail, which is a 160×160
   square crop. It was discarded and replaced by byte-range reads of the
   originals, producing real dimensions.
2. The first automated capture of `P001-S01` sampled the frame before its
   JavaScript initialized, temporarily recording zero dots and no counter. A
   live re-test confirmed the slideshow works; `slideshows.csv` now reflects the
   verified state.

## 8. Reconstruction risks

1. **Host dependency, accepted.** All 331 images are hotlinked from imgur. If
   imgur blocks hotlinking, rate-limits, or removes files, rebuilt slideshows
   break. The owner's no-download/no-rehost policy means the response is
   monitoring and documentation, not mirroring.
2. **Image weight.** Originals reach 4064×4515 and several megabytes each;
   `P003-S01` alone has 38 images marked `loading="eager"`. The pilot initially
   planned lazy loading for all but the first slide, but the archived sources
   use eager loading everywhere and lazy navigation produced blank slides
   during testing. The pilot therefore preserves eager loading; the outer
   Behance iframe remains `loading="lazy"`. Revisit only with owner approval.
3. **No standalone embed URL.** Google Sites custom embeds are inline HTML.
   Reconstruction must use the archived source, not a URL.
4. **Fullscreen permissions.** Native fullscreen works in the Chromium harness
   when the outer iframe has `allowfullscreen` + `allow="fullscreen"`. Behance
   may sanitize the attributes. The standard requires a visible fallback and a
   real published-Behance test before rollout.
5. **Frame geometry.** The original frames were sized by the Google Sites layout
   (321–1335 px wide, 443–1570 px tall). Behance requires explicit iframe
   heights; portrait and landscape slideshows cannot share one height.
6. **P011 behaviour.** Rebuilding it with working JavaScript would change the
   current live behaviour. This is the one remaining owner decision.
7. **P024 completeness.** The inventory cannot be called 38/38 verified until
   the intended URL is supplied.

## 9. Answers to the 11 audit questions

1. **Projects discovered:** 38 of 38, in page order, `P001`–`P038`.
2. **Projects containing slideshows:** 36.
3. **Projects without slideshows:** 1 confirmed (`P036`); 1 unknown (`P024`,
   blocked).
4. **Total slideshows:** 47.
5. **Total images:** 335 slots, 331 unique URLs.
6. **Fully accessible slideshows:** 46 `EXTRACTED`.
7. **Partially accessible slideshows:** 1 `NEEDS_REVIEW` (`P011-S01`, missing
   JavaScript). P026-S02 and P032-S01 were resolved in Phase 1.1.
8. **Blocked slideshows:** 0. (One project, `P024`, is blocked before any
   slideshow could be assessed.)
9. **Unresolved issues:** see `unresolved_items.md`; the main ones are the P024
   link, P011's missing JavaScript, Behance's iframe permission handling,
   fixed iframe heights, and Apps Script/GitHub access.
10. **Can the existing infrastructure support the proposed system?** Not as-is.
    The existing prototype hardcodes three images in one `index.html`. Apps
    Script itself supports the target design: `doGet(e)` can route
    `?slide=P001-S01`, and one deployment can evaluate a shared template with
    per-slide data. A new Apps Script project/deployment is recommended so the
    existing deployment stays untouched.
11. **Recommended architecture and limitations:** single new Apps Script Web
    App with a stateless `doGet` router, one shared HTML/CSS/JS template,
    generated `SlidesData.gs`, GitHub as source of truth, and generated Behance
    iframes with `allowfullscreen` and `allow="fullscreen"`. Every request
    serves exactly one slideshow by ID; each Behance iframe is independent, and
    there is no gallery, dashboard, or multi-slideshow viewer. Limitations:
    Behance may strip permissions (fallback), fixed iframe heights, Apps Script
    cold starts, accepted imgur dependency, no HTTP 404 control, and consumer
    quotas. Full details in `00_DOCUMENTATION/SYSTEM_ARCHITECTURE.md`,
    `00_DOCUMENTATION/FULLSCREEN_STANDARD.md`, and
    `00_DOCUMENTATION/INDEPENDENT_EMBED_STANDARD.md`.
