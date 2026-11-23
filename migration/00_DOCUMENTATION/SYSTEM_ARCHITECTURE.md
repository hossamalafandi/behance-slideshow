# System Architecture

Status: **approved architecture** (owner approval, 2026-11-18). Phase 2 is in
progress with the P001-S01 local pilot only. Nothing in this document has been
deployed.

## 1. Goals

- One GitHub repository is the single source of truth.
- One Google Apps Script Web App hosts the shared renderer for all slideshows,
  but every request serves exactly one slideshow by ID.
- Every slideshow has a permanent ID and a stable URL:
  `https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec?slide=P001-S01`
- Every Behance iframe is an independent embed. There is no index, gallery,
  dashboard, or multi-slideshow viewer.
- Rendering code is shared; per-slideshow content is data, not code.
- Behance snippets are generated, never hand-written.
- All images remain on their original remote URLs; nothing is downloaded or
  rehosted.
- Every slideshow has exactly one consistent fullscreen button.

## 2. Image policy

The final system does **not** store, mirror, proxy, transcode, or upload images.
The HTML points at the exact original `i.imgur.com` URLs, in the audited order,
including repeated URLs and query parameters. See `IMAGE_HOSTING_POLICY.md`.

Consequences:

- no `assets/` directory and no image binaries in the repository;
- no image URL Fetch calls, caching, or base64 encoding in Apps Script;
- image availability is an accepted external dependency;
- a broken image is recorded and escalated, never replaced automatically.

## 3. Verified platform facts

These were checked against the live portfolio, Google's documentation, and a
local cross-origin iframe harness during Phase 1.1:

| Fact | Consequence |
|---|---|
| Google Sites renders user HTML embeds as nested cross-origin frames on `*.googleusercontent.com` | Source must be read frame-by-frame; the outer page cannot be scraped with a simple HTML fetch |
| `doGet(e)` receives query parameters in `e.parameter` | `?slide=P001-S01` routing is supported by the platform |
| `HtmlService` can serve a different template evaluation per request | One deployment can serve any single slideshow per request; it does not require 47 deployments |
| Apps Script HTML runs in a sandboxed iframe with `allow-scripts`, `allow-same-origin`, `allow-forms`, `allow-popups`, `allow-downloads`, `allow-modals`, `allow-popups-to-escape-sandbox` | Scripts run normally; the sandbox itself did not block fullscreen in the Chromium test when the outer embedding iframe granted permission |
| Fullscreen permission is governed by the outer embedding iframe | The generated Behance iframe must include `allowfullscreen` and `allow="fullscreen"`; if Behance strips them, only the fallback works |
| Consumer quota: 20,000 URL Fetch calls/day, 30 simultaneous executions/user, 6 min/execution | Irrelevant for static HTML: each view is one short execution and no URL fetches |
| Script Properties: 9 KB per value, 500 KB total | Too small for comfortable multi-slide data storage |
| HtmlService cannot serve binary files | Images stay on the original external host (imgur) |

## 4. Components

```
Google Sites portfolio (read-only source)
        │  Phase 1 audit (Playwright)
        ▼
migration/01_AUDIT/*.csv  ──►  slides.config.json   (canonical data)
        │                              │
        │                              ├─► 03_REBUILT_SLIDESHOWS/  (local test pages)
        │                              ├─► 04_APPS_SCRIPT/SlidesData.gs
        │                              └─► 05_BEHANCE_OUTPUT/*.md
        ▼
02_SOURCE_BACKUP/  (immutable extracted originals)
```

Runtime: independent embeds share one stateless renderer, never one viewer.

```
Behance project A                    Behance project B
  └── <iframe ?slide=P001-S01>         └── <iframe ?slide=P002-S01>
                │                                    │
                └────────────────┬───────────────────┘
                                 ▼
                    One Apps Script Web App
                    (stateless, one request = one slideshow)
                      ├── Code.gs        doGet(e) → validates one ID
                      ├── Slideshow.html shared CSS + JS + markup shell
                      └── SlidesData.gs  server-side lookup: ID → {images, config}
```

## 5. Request flow

1. Behance loads the iframe with exactly one `?slide=P001-S01` value.
2. `doGet(e)` requires a single string parameter and normalises it (trim,
   uppercase).
3. If the ID is missing, repeated, ambiguous, or unknown, return a neutral
   error page with HTTP 200 (Apps Script cannot set status codes). The error
   page must not contain a gallery, a list, or links to other slideshows.
4. Otherwise evaluate `Slideshow.html`, injecting only that slideshow's JSON.
5. The client script renders that single slideshow: every image keeps the
   archived `loading="eager"`, then build dots, bind arrows, and implement the
   fullscreen standard. No keyboard or swipe behavior is added because the
   originals had none.
6. The response never contains a catalog of the other slideshows. Each iframe
   owns its navigation and fullscreen state.

## 6. Why one template plus data

The existing prototype hardcodes three images in `index.html`. It cannot serve
the 47 different slideshow IDs from one deployment without modification.
Duplicating the full HTML per slideshow would create 38+ near-identical files
and make every CSS fix a 38-file change.

The chosen design keeps exactly one HTML template and one JS bundle. Per-slide
differences (image list, aspect ratio, border radius, arrow/dot visibility,
caption text) live in `SlidesData.gs`:

```js
var SLIDES = {
  "P001-S01": {
    project: "P001",
    title: "AL-RASHED PROJECT — Renders",
    aspect: 1.658,
    radius: 20,
    fullscreen: true,
    images: [
      { src: "https://i.imgur.com/ywuUBKU.jpeg", w: 3840, h: 2160 },
      ...
    ]
  }
};
```

This file is generated from `slides.config.json`; it is never edited by hand.

## 7. Independent embed model

Every slideshow is embedded separately in a Behance project or project section.
The central deployment is shared hosting and rendering only; it is not a
portfolio page or a combined viewer.

- One iframe request contains exactly one slideshow ID.
- All snippets share the deployment URL and differ only in `?slide=…`.
- The server-side `SLIDES` table is a read-only lookup. It is never sent to the
  browser as a catalog; the template receives only the requested slideshow.
- There is no index, gallery, dashboard, thumbnail grid, next-project
  navigation, wildcard request, or multi-ID request.
- Missing, repeated, ambiguous, or unknown IDs return a neutral error page with
  no links to other slideshows.
- Each response is a self-contained document. Slide index, dots, counter,
  fullscreen state, and theater-mode state live only in that document.
- No `localStorage`, `sessionStorage`, cookies, `postMessage`, or
  `BroadcastChannel` are used to share slideshow state between iframes.
- Each embed has its own audited height and its own fullscreen container.
- Apps Script is stateless: concurrent visitors and concurrent iframes do not
  share navigation state, sessions, locks, or counters.

The full contract and required tests are in `INDEPENDENT_EMBED_STANDARD.md`.

## 8. Deployment strategy

- The existing prototype project and its deployment are left untouched.
- A new Apps Script project is created for the shared slideshow renderer, bound
  to this repository via `clasp`.
- The new project gets its own deployment URL. The old URL keeps working.
- Each request to the new deployment serves exactly one slideshow; the
  deployment is stateless and has no gallery route.
- Future updates: `clasp push` → new version → update the *new* deployment.
  The deployment ID stays stable, so Behance snippets never change.

`.clasp.json` contains a machine-specific script ID and is gitignored; the repo
keeps `.clasp.json.example`.

## 9. Behance embed output

Per slideshow:

```html
<iframe
  src="https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec?slide=P001-S01"
  width="100%"
  height="<per-slideshow height>"
  style="border:0;border-radius:20px;overflow:hidden"
  loading="lazy"
  allowfullscreen
  allow="fullscreen">
</iframe>
```

`allowfullscreen` and `allow="fullscreen"` are mandatory. Do not emit a
`sandbox` attribute. Height is chosen per slideshow from the audited aspect
ratio, capped so the module fits a Behance project column.

Each snippet is a standalone embed with exactly one slideshow ID and its own
height. The generator writes one Markdown file per project containing that
project's snippets in page order; the file is a copy source, not a gallery page.
No snippet loads more than one slideshow or communicates with another snippet.

## 10. Known limitations and risks

1. **Fullscreen.** The Apps Script sandbox has no `allowfullscreen` keyword, but
   a Phase 1.1 Chromium harness showed that the outer embedding iframe is the
   decisive permission layer: when it has `allowfullscreen` and
   `allow="fullscreen"`, the nested slideshow can enter native fullscreen; when
   it does not, `document.fullscreenEnabled` is false and `fullscreenerror`
   fires. Behance must preserve those attributes. Mitigation: native first, then
   a quiet in-iframe theater mode; real Behance test is a release gate.
2. **Fixed iframe height.** Behance does not auto-size embedded iframes. Each
   slideshow needs a deliberate height; portrait slideshows will look small in a
   wide column. Mitigation: per-slide aspect ratio in the config and a
   letterboxed stage.
3. **Cold starts.** Apps Script responses are not CDN-cached; first paint can
   take several hundred milliseconds. Mitigation: inline CSS, no external JS,
   and the archived eager image loading, which renders progressively.
4. **Image host dependency.** All current images are on imgur
   (`i.imgur.com`). If imgur blocks hotlinking or removes files, the slideshows
   break. This risk is **accepted**: the owner requires original URLs only.
   Mitigation: monitor, record failures in `unresolved_items.md`, and never
   replace or rehost an image automatically.
5. **No HTTP status control.** Unknown slide IDs return a 200 with an error
   panel, not a 404.
6. **Quotas.** Consumer Apps Script accounts have daily quotas; a portfolio's
   traffic is far below them, but this is not an enterprise-grade host.
7. **Google Sites link rot.** One Freelance card points to a malformed
   `google.com/url?q=http%3A%2F%2Fww…` redirect. The audit records it as
   unreachable until the owner supplies the intended page.

## 11. Rejected alternatives

| Alternative | Reason rejected |
|---|---|
| One Apps Script project per slideshow | 38 deployments, 38 URLs to manage, violates the "central deployment" goal |
| One HTML file per slideshow inside the same project | Works, but duplicates CSS/JS 38× and makes maintenance error-prone |
| One gallery or dashboard page listing all slideshows | Violates the independent-embed requirement; every Behance iframe must load exactly one slideshow |
| Shared client state across embeds (`localStorage`, cookies, `postMessage`) | Would couple separate Behance projects and allow one embed to affect another; prohibited |
| Hosting on GitHub Pages | Simpler and faster, but the accepted Behance integration is Apps Script. Kept as a contingency only if Behance strips iframe fullscreen permissions and the fallback is not acceptable; requires separate approval |
| Storing slide data in Script Properties | 9 KB per value limit; a generated `.gs` file is simpler and versioned |
| Live scraping of Google Sites at request time | Slow, fragile, and would require URL Fetch quota |

## 12. Open questions for Phase 2

- Confirm native fullscreen behaviour inside a real published Behance project
  and inspect whether the iframe keeps `allowfullscreen`/`allow="fullscreen"`.
- Confirm that multiple independent embeds, including different slideshows and
  duplicate instances of the same slideshow, pass the isolation tests in
  `INDEPENDENT_EMBED_STANDARD.md`.
- Confirm the exact Behance embed height that avoids inner scrollbars.
- Confirm the owner's decision on P011-S01 (restore the standard JavaScript).
- ~~Confirm P024's intended destination or exclude it explicitly.~~ Resolved
  2026-11-21: P024 was migrated as `P024-S01` + `P024-TOOLS`.
- Confirm the new Apps Script project's ownership and deployment access level
  ("Anyone").
