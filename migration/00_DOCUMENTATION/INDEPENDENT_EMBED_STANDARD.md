# Independent Embed Standard

Status: **mandatory architectural requirement, approved 2026-11-18** (owner
instruction). Applies to the new Apps Script Web App and every generated Behance
embed. Nothing in this document has been deployed.

## 1. The rule

The Apps Script deployment is a shared hosting and rendering service, **not a
portfolio site, gallery, dashboard, or multi-slideshow viewer**.

Every slideshow is embedded independently in its own Behance project or project
section. Each iframe request must load exactly **one** slideshow, selected by its
permanent slideshow ID:

```
https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec?slide=P001-S01
https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec?slide=P004-S03
https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec?slide=P038-S01
```

All embeds share one deployment URL. Only the `slide` identifier differs.

## 2. Prohibited designs

The following are explicitly forbidden:

- an index, home, landing, gallery, catalog, or thumbnail-grid page;
- a combined viewer that shows more than one slideshow at a time;
- tabs, menus, next/previous project navigation, or links to other slideshows;
- wildcard, list, comma-separated, `all`, or multi-ID requests;
- a client-side catalog of the other 46 slideshows;
- a single Behance embed that cycles through multiple slideshow IDs;
- shared navigation state between iframes;
- cross-iframe `postMessage`, `BroadcastChannel`, shared storage, or shared
  cookies used to synchronize slideshows;
- server-side mutable state, sessions, locks, or counters that couple visitors.

A Markdown file in `05_BEHANCE_OUTPUT/` may group several snippets for one
project, but that file is a copy source, not a rendered viewer. Each snippet in
it is a separate, independent iframe.

## 3. Router contract

`doGet(e)` enforces the contract:

1. Read `e.parameter.slide`.
2. Require a single string value. Reject missing, repeated, array, empty, or
   non-string values.
3. Normalize only by trimming and uppercasing; do not accept aliases,
   wildcards, separators, or numeric ranges.
4. Look up the exact ID in the server-side `SLIDES` table.
5. If the ID is unknown, return a neutral error page with HTTP 200. The error
   page must not list, link to, preview, or suggest any other slideshow.
6. Otherwise render `Slideshow.html` with **only that slideshow's object**.
7. Never return a gallery if `slide` is missing or ambiguous.

The server-side `SLIDES` table is a read-only lookup. It is not a gallery and is
never serialized wholesale into the response. The client receives only the
requested slideshow's images and configuration.

## 4. Runtime isolation

Each iframe is a separate browser document and must own its state:

- current slide index, dot state, counter, transform, and hover state live only
  inside that document's JavaScript closure;
- navigation in one iframe must not change any other iframe;
- fullscreen targets that iframe's own `.slideshow-container`;
- entering or leaving fullscreen in one iframe must not change another
  iframe's slide, layout, or controls;
- no `localStorage`, `sessionStorage`, cookies, or IndexedDB are used for slide
  position, navigation, or fullscreen state;
- no communication with sibling iframes or the parent Behance page;
- no shared timer, autoplay, or global playlist.

The Apps Script server is stateless:

- no `CacheService`, `PropertiesService`, `UserProperties`, `LockService`, or
  spreadsheet writes for per-visitor or per-view state;
- no server-side "current slide" or session;
- `SLIDES` is read-only for the lifetime of a request;
- each `doGet` execution builds one self-contained HTML document;
- concurrent requests are independent by design.

## 5. Dimensions and fullscreen

- Each slideshow has its own iframe height derived from its audited aspect
  ratio; there is no shared height that all embeds must use.
- Width follows the Behance column, but each iframe is sized independently.
- Each fullscreen button controls only its own slideshow container.
- The theater-mode fallback is local to that iframe.
- A fullscreen request from one embed must never attempt to control another
  embed or the Behance page itself.

## 6. Behance output

Generate exactly one `<iframe>` snippet per slideshow:

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

Rules:

- every snippet contains exactly one `slide` value;
- every snippet has its own audited height;
- do not generate a page that contains all 48 iframes as a viewer;
- do not add project navigation, a gallery grid, or an "open all" control;
- a project Markdown file may contain that project's snippets in page order for
  copy/paste, but each snippet is independent.

## 7. Required tests

### 7.1 Router isolation

| Test | Pass condition |
|---|---|
| Valid `?slide=P001-S01` | Response contains P001-S01 only; no other slideshow IDs or image URLs |
| Valid `?slide=P038-S01` | Response contains P038-S01 only |
| Missing `slide` | Neutral error page; no gallery, list, or links |
| Unknown `?slide=P999-S99` | Neutral error page; no gallery |
| Repeated `?slide=P001-S01&slide=P002-S01` | Rejected; no combined view |
| Array-like or comma-separated value | Rejected; no combined view |
| Lowercase or padded ID | Normalized to the same single slideshow only |

### 7.2 Client isolation

| Test | Pass condition |
|---|---|
| Two different slideshows in two iframes | Each shows its own image sequence, counter, and controls |
| Advance one iframe | The other iframe remains on its own slide |
| Open/close fullscreen in one iframe | The other iframe's slide and layout are unchanged |
| Same slideshow loaded in two iframes | Each has independent navigation state |
| Reload one iframe | The other iframe keeps its state |
| Two browser contexts (two visitors) | No shared state; different slides can be active simultaneously |
| Inspect storage | No navigation/fullscreen state in local/session storage or cookies |
| Inspect events | No cross-iframe messaging or shared state channel |
| Inspect response payload | Only the requested slideshow's images are present |

### 7.3 Dimensions and fullscreen

| Test | Pass condition |
|---|---|
| Different aspect ratios | Each embed uses its own audited height |
| Portrait and landscape side by side | No cross-iframe resizing or scroll interference |
| Fullscreen one embed | Only that iframe's container becomes fullscreen |
| Denied fullscreen | Only that iframe enters quiet theater mode |
| Exit fullscreen | Only that iframe restores its normal layout |

## 8. Acceptance checklist

- [ ] One deployment URL, one `?slide=` ID per iframe.
- [ ] No index, gallery, dashboard, or multi-slideshow page exists.
- [ ] Missing/unknown/ambiguous IDs return a neutral error page with no gallery.
- [ ] Each HTML response contains only the requested slideshow's content.
- [ ] Each iframe owns its navigation and fullscreen state.
- [ ] No shared storage or cross-iframe messaging is used.
- [ ] Each embed has its own audited height.
- [ ] Multiple visitors and multiple iframes can interact simultaneously without
      interference.
- [ ] All independence tests in section 7 pass before rollout.

## 9. Non-goals

This standard does not add a public slideshow directory, a project browser, a
Behance profile replacement, analytics, autoplay, or cross-project navigation.
Those would contradict the independent-embed requirement and require a separate
owner decision.
