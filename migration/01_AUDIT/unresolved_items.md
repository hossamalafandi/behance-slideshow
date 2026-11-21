# Unresolved Items and Decisions Needed

Audit date: 2026-11-18
Phase 1.1 refinement: 2026-11-18
Status: **Phase 2 bulk rollout complete 2026-11-20.** P024 remains the only
blocked project. P011-S01 repair is complete. All 47 slideshows and 47 embed
codes are delivered; GitHub push and the new Apps Script deployment are done.
Per owner instruction, no further Behance testing is being run. This register
separates true blockers from items resolved by evidence or owner decision.

## 1. Summary

| ID | Item | Type | Severity | Blocks Phase 2? | Status |
|---|---|---|---|---|---|
| U01 | P024 link is malformed; project page unknown | Blocker | High | P024 only | **Blocked — ID reserved, proceed without P024** |
| U02 | P011-S01 has no JavaScript; arrows inert | Defect | High | P011 only | **Resolved — repaired 2026-11-19** |
| U03 | P026-S02 repeats 3 images from P026-S01 | Duplicate content | Medium | No | **Resolved — intentional companion** |
| U04 | P032-S01 repeats the same image URL twice | Authoring ambiguity | Medium | No | **Resolved — owner replaced position 3 on 2026-11-21** |
| U05 | P002 has 9 empty Drive preview iframes | Capture limitation | Low | No | **Resolved — Drive video previews** |
| U06 | P036 contains static images, no slideshow | Confirmation | Low | No | **Confirmed** |
| U07 | All images are hotlinked from imgur | Hosting risk | High | No | **Accepted by owner policy** |
| U08 | Fullscreen inside Behance + Apps Script | Platform feasibility | Medium | Pilot only | **Resolved — P001 real Behance gate 18/18; further testing closed by owner** |
| U09 | Behance iframe height / portrait layout | Design decision | Medium | No | **Resolved — per-slide heights; 47 codes delivered; further testing closed by owner** |
| U10 | GitHub push and Apps Script access | Access | High | Yes, before deployment | **Resolved — GitHub pushed; new Apps Script project deployed** |
| U11 | Descriptive naming choices | Naming confirmation | Low | No | **Confirmed** |
| U12 | Google warning bar on anonymous Apps Script Web Apps | Visual regression | High | Pilot only | **Resolved — suppressed in iframe; top-level visits only** |

## U01 — P024 project link is malformed

**What was found.** The 24th `SHOW` card on the Freelance page points to:

```
http://www.google.com/url?q=http%3A%2F%2Fww&sa=D&sntz=1&usg=AOvVaw3htc4VAJDj21PIClImVl5y
```

The redirect target is truncated to `http://ww`. There is no usable destination.

Phase 1.1 re-checked the card in context:

- visual card 24, row-major, is a distinct "MASTER BEDROOM" card;
- its thumbnail is `https://i.imgur.com/4OFuMn0.jpeg`;
- the P009 "MASTER BEDROOM" card is a different card with thumbnail
  `https://i.imgur.com/GeYUbMn.jpeg`;
- the P024 image does not appear in any archived project page;
- the Freelance page source contains no hidden or unlinked P024 destination;
- no matching page, sitemap entry, or external portfolio item was found.

The shared title with P009 is not proof of a duplicate: the thumbnail and link
are different, and no P009-like page has this image.

**Impact.** The audit covers 37 of 38 projects. P024 has no title, URL, page,
slideshow count, or images. Nothing was invented and no replacement URL was
guessed.

**Owner decision (2026-11-18).** Keep P024 blocked and reserve its permanent ID.
Proceed with the remaining 37 projects and 47 slideshows. Do not invent a URL.

**After a future resolution.** If the owner supplies the intended URL, inspect
and archive the page, assign `P024-S01…` in page order, update the CSVs/config,
then rebuild. Until then, remove or clearly mark the current malformed card in
the live portfolio.

## U02 — P011-S01 has no JavaScript

**What was found.** The archived source contains the full standard slideshow
markup, CSS, 20 images, arrows, dots container, and page counter, but **no
`<script>` block**. Live verification:

- `typeof moveSlide === "undefined"`;
- clicking the arrows does nothing;
- no dots are created;
- the counter stays empty;
- `slidesContainer` never gets a transform.

This is a defect in the original Google Sites embed, not a capture error. The
file shares the standard template's title, CSS, IDs and markup with the other 45
working standard files. Its intended behavior is therefore the standard
behavior:

- previous/next arrows move one slide and loop at both ends;
- dots are generated from the 20 slides and are clickable;
- the counter shows `n / 20`;
- no autoplay, keyboard navigation, swipe, or captions.

**Impact.** Rebuilding with the shared JavaScript restores the intended
behavior but changes the current live behavior from inert to working. That is a
visible repair and must be an explicit decision.

**Owner decision (2026-11-18).** Rebuild P011-S01 with the shared standard
JavaScript, preserving all 20 images, their order, the aspect ratio, CSS, and
all other visuals. Record the repair in the provenance note. Implement it only
after the P001-S01 pilot passes its real Behance test.

**Implemented (2026-11-19).** The P001-S01 real Behance gate passed 18/18, so
P011-S01 was rebuilt with the shared standard JavaScript. All 20 original URLs
remain in the original order; the 1335 × 1553 frame, 20 px radius, `cover`
object fit, hover arrows, shadows, and transparent background are unchanged.
The generated page has the standard script; the archived original had none.
Verification: static 117/117, P011 local browser suite 21/21, live Apps Script
suite 20/20, with every image request blocked. `P011-S01` is now `EXTRACTED`
and `P011` is `VERIFIED`. The repair note is also in
`05_BEHANCE_OUTPUT/P011.md`.

## U03 — P026-S02 duplicates part of P026-S01

**What was found.**

- `P026-S01`: 6 images — `hzEI3Bh`, `QvkGG9f`, `Y8WJfMo`, `qOEz19S`, `AoLpKH8`,
  `d1JRDhd`.
- `P026-S02`: 3 images — `qOEz19S`, `AoLpKH8`, `d1JRDhd`.

Phase 1.1 checked the rendered page layout:

- both frames start at the same vertical position;
- `P026-S01` is at x=52, width 772 px;
- `P026-S02` is at x=841, width 546 px;
- they are separate custom embeds with separate controls;
- `P026-S01` has 6 dots and `1 / 6`; `P026-S02` has 3 dots and `1 / 3`.

**Conclusion.** This is an intentional side-by-side companion layout, not an
accidental copy of the same module. The image subset is deliberate. Preserve
both slideshows independently.

**Status.** `P026-S02` is `EXTRACTED`; `P026` is `VERIFIED`. No content was
changed. If the owner later prefers to drop the companion, that is a separate
explicit decision.

## U04 — P032-S01 uses one image twice

**What was found.** `P032-S01` has exactly 3 image slots and 3 dots:

```
1. https://i.imgur.com/gZXL8KZ.jpeg
2. https://i.imgur.com/1MWxYk7.jpeg
3. https://i.imgur.com/1MWxYk7.jpeg
```

The archived source, the live controls and the audit all agree on three slots.
There is no comment, alternate source, or layout evidence proving the repeat was
accidental. The owner's rule is to preserve repeated URLs where they occur.

**Conclusion.** Keep all three slots in the original order. Marked `EXTRACTED`;
`P032` is `VERIFIED`.

**If evidence later appears.** Removing the third slot would require explicit
owner approval and a new provenance note; it must never be done silently.

**Post-delivery owner change (2026-11-21).** The owner explicitly replaced the
position 3 URL with `https://i.imgur.com/PjEUKuC.jpeg`. Position 2 keeps
`https://i.imgur.com/1MWxYk7.jpeg`; all three slots remain. Deployment version 5
serves the updated slideshow.

## U05 — P002 has nine Drive preview iframes

**What was found.** The Cellphone Store page contains 9 iframes pointing to
Google Drive previews. Phase 1.1 identified them as **video** previews, not
static images:

```
aria-label="Drive, IMG_3040.MOV"
aria-label="Drive, IMG_3208.MOV"
aria-label="Drive, IMG_3211.MOV"
...
```

Each preview URL returns HTTP 200, and a Drive poster image loads when the
preview URL is opened directly. In the embedded Google Sites page, the frames
remain blank in headless Chrome, likely because of Drive's embedded-player and
third-party-context behavior.

The page also contains the slideshow and a Google Map, both captured
successfully. The previews are not slideshows and are outside the migration
scope.

**Impact.** None on the slideshow audit or the migration. A normal-browser
visual check by the owner is optional.

**Status.** Resolved/documented; no further action required for Phase 2.

## U06 — P036 has no interactive slideshow

**What was found.** `P036` (MASTER-BEDROOM-VRAY) has exactly one custom embed:
the 127 px software-logo strip. Its `RENDERS` section contains 8 ordinary static
images, with no arrows, dots, counter, or slideshow frame.

**Status.** `NO_SLIDESHOW`. Nothing is missing from the audit; the project is
outside the slideshow migration scope. Confirmed intentional in the source.

## U07 — Images depend on imgur hotlinking

**What was found.** All 331 unique images are on `i.imgur.com`. All returned a
successful HTTP response (206 Partial Content for byte-range dimension reads),
but the originals are large (up to 4064×4515 and several MB each), and imgur can
rate-limit, block hotlinking, or remove content.

**Owner decision (Phase 1.1).** Do not download, mirror, or rehost any image.
Use the original URLs directly. This risk is accepted.

**Impact.** A future imgur outage would break slides. The response is:

- record the exact failed URL and slideshow position in this file;
- mark the slideshow `NEEDS_REVIEW` or `BLOCKED`;
- ask the owner for a decision;
- never substitute or rehost automatically.

**Status.** Accepted policy. No mirroring work will be planned or performed. See
`00_DOCUMENTATION/IMAGE_HOSTING_POLICY.md`.

## U08 — Fullscreen inside Behance and Apps Script

**What was found.** Only `P038-S01` uses the older
`Image Slideshow with Fullscreen` template. Its button is `⛶` (U+26F6), absolute
top/right 20 px, `rgba(0,0,0,0.3)`, white, 20 px, `8px 12px`, radius 10 px,
z-index 20. Its original script calls `slideshow.requestFullscreen()` and uses a
blocking `alert()` on rejection; it has no `fullscreenchange`, `fullscreenerror`,
or fallback.

Phase 1.1 tested a cross-origin chain matching Behance → Apps Script → sandboxed
slideshow in Chromium:

| Outer iframe permission | `document.fullscreenEnabled` | Result |
|---|---|---|
| `allowfullscreen allow="fullscreen"` | `true` | native request granted; `fullscreenchange` fired |
| none | `false` | request denied; `fullscreenerror` fired; no fullscreen |

The Apps Script inner sandbox (documented tokens, no `allowfullscreen` keyword)
did **not** block fullscreen when the outer iframe granted permission. The outer
embedding iframe is the decisive layer. Google's documented sandbox tokens and
the local harness are consistent with this.

**Conclusion for planning.** Native fullscreen is feasible if Behance preserves
`allowfullscreen` and `allow="fullscreen"` on the generated iframe. Behance's
help center accepts iframe embeds and shows both attributes in its Dimension
example, but its sanitizer and the actual published DOM are unverified.

**Required before rollout.** Publish one temporary test Behance project and
verify in Chrome, Edge, Firefox and Safari where available. Inspect the actual
iframe attributes. If native fullscreen is denied, the standard's theater-mode
fallback must work and be reported as a limitation, not hidden.

**Status.** Approved 2026-11-18: native fullscreen first, then the local
theater-mode fallback. The local pilot passed native, denied, and missing-API
paths. The real published-Behance test remains a mandatory release gate. The
button/JS/fallback standard is in `00_DOCUMENTATION/FULLSCREEN_STANDARD.md`.

## U09 — Behance iframe height and portrait slideshows

**What was found.** Original frame sizes vary from 321×597 to 1335×1570 because
Google Sites sizes them by layout. Aspect ratios split into 16 landscape, 3
square, and 28 portrait. Behance does not auto-size iframes, so one fixed height
cannot fit all slideshows.

**Owner decision (2026-11-18).** Each slideshow uses its own height derived from
its audited aspect ratio. P001-S01 computes to 805 px from 1335 × 805 (aspect
1.658). There is no shared height across embeds.

**Status.** Approved. The local 1335 × 805 pilot has no inner scrollbars. The
real Behance column width and final cropping must be confirmed during the
release test.

## U10 — GitHub push and Apps Script access

**What was found.**

- The repository is public (`hossamalafandi/behance-slideshow`).
- The stored Git credential is the `stellarstudious` account and reports
  `push: false` for this repository.
- No `gh` CLI, no `clasp`, no authenticated Apps Script session, and no Script ID
  or deployment URL is present in the repository.
- The existing `Code.gs` was found outside the repository in
  `C:\Users\hossa\Downloads\Code.gs`.

**Impact.** Read-only audit was unaffected. Phase 2 cannot push code or create a
deployment until access is granted.

**Action before deployment.** The owner authorized GitHub write access with the
repository-owner account `hossamalafandi` and a **new** standalone Apps Script
project/deployment. Authentication must be completed interactively by the owner;
the existing production deployment must not be modified.

**Status.** Resolved. GitHub is authenticated as `hossamalafandi`, and the
commits are pushed to `main`. Google is signed in as `afandihussam@gmail.com`;
the Google Apps Script API was enabled; the new standalone project “Behance
Slideshow Renderer” was created and deployed. No credential is stored in the
repository, and the existing production deployment is untouched.

## U12 — Google warning bar on anonymous Apps Script Web Apps

**What was found.** A **top-level** visit to an anonymous `/exec` response shows
a Google-generated 45 px warning bar: “This application was created by a Google
Apps Script user”, with “Report abuse”, “More information”, and a dismiss `X`.
The bar is part of the outer `script.google.com` page, outside the sandboxed
slideshow HTML.

**Critical distinction.** When the same `/exec` URL is loaded inside an iframe —
the Behance embedding context — Google collapses the warning node to 0 px and
the `sandboxFrame` receives the full iframe height. A 1335 × 805 iframe test
measured a 0 px banner and an 805 px slideshow viewport. This matches the
owner's previously working Apps Script/Behance method.

**Impact.** None in the intended embed. The bar is visible only if someone
opens the raw `/exec` URL as a standalone page. Do not use the raw URL as a
public page.

**Status.** Resolved by reproducing the exact iframe context. No host change.
The real Behance test remains the release gate.

## U11 — Naming confirmations

These are deliberate choices, not errors:

- `reciption` is preserved from the original section label in `P004-S02` and the
  project title `AP-GF-RECIPTION`; it is not silently corrected to “reception”.
- Slideshows that share the `RENDERS` label on the same page are suffixed `-a`
  and `-b`: `P023-S01/S02`, `P026-S01/S02`, `P027-S01/S02`, `P029-S01/S02`.
- `P034-S02` uses the descriptor `bathroom` because that is the visible section
  label above it.
- `P002-S01` uses `renders` even though the page's visible hero text does not
  repeat the word; the section label was captured from the rendered page.

**Status.** Confirmed.

## Resolved during Phase 1.1 (recorded for transparency)

| Item | Resolution |
|---|---|
| P026-S02 intentionality | Confirmed separate side-by-side companion; preserve independently; status `EXTRACTED`, P026 `VERIFIED` |
| P032-S01 repeated image | Confirmed 3 slots / 3 dots originally; owner replaced position 3 on 2026-11-21; status `EXTRACTED`, P032 `VERIFIED` |
| P002 Drive previews | Confirmed 9 Google Drive video previews, HTTP 200, blank in headless embed; not slideshows |
| P036 no slideshow | Confirmed static images only |
| Image local-target plan | Removed; no downloads or rehosting; `images.csv` stores remote URLs only |
| Fullscreen feasibility | Chromium harness proved outer-iframe permission is decisive; real Behance test remains |
| P024 identity | Confirmed distinct card/thumbnail from P009; destination still unknown |
| Thumbnail dimensions | 160×160 imgur `b` crop rejected; true dimensions read via byte ranges |
| P001-S01 initial capture | Capture race; live re-test confirmed 17 dots and working counter |
| Source vs JSON order | 47/47 exact matches |

## What is not unresolved

- No slideshow frame was inaccessible.
- No slideshow image is missing or broken.
- No image order conflict exists between the archived source and the JSON data.
- No project other than P024 is unreachable.
- No duplicate slideshow IDs or filename collisions exist.
