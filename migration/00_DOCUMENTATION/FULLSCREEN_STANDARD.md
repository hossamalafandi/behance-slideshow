# Fullscreen Standard

Status: **mandatory design standard, approved 2026-11-18**, for all 48 migrated
slideshows.
Reference: `P038-S01` (`Image Slideshow with Fullscreen`).
Phase 1.1 investigated the reference implementation and tested the nested-frame
permission chain. No deployment or Behance publish has been performed.

## 1. Scope

Every migrated slideshow must have exactly one fullscreen button.

- `P038-S01` already has one. Keep it and do not add a second.
- The other 46 slideshows get the same button in the same position and style.
- The button is an overlay. It must not change image size, aspect ratio, layout,
  arrows, dots, counter, shadows, borders, typography, colors, transitions, or
  any existing interaction.
- Each button controls only its own iframe's slideshow. There is no
  cross-iframe fullscreen control or shared fullscreen state. See
  `INDEPENDENT_EMBED_STANDARD.md`.

No other controls are added.

## 2. Reference implementation (P038-S01)

The original source contains:

```html
<button class="fullscreen-btn" id="fullscreenBtn">⛶</button>
```

The glyph is U+26F6 (SQUARE FOUR CORNERS), not an emoji or an image.

```css
.fullscreen-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0,0,0,0.3);
  color: white;
  border: none;
  font-size: 20px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 10px;
  z-index: 20;
  transition: background 0.3s ease;
}

.fullscreen-btn:hover {
  background: rgba(0,0,0,0.6);
}
```

The button is a child of `.slideshow-container` (which must be
`position: relative`). The reference calls `slideshow.requestFullscreen()` on the
container; the container is the fullscreen element, not the page.

The original failure path is a blocking `alert()`. The migrated version replaces
it with the robust handling below. The visual appearance and position do not
change.

## 3. Required markup

```html
<div class="slideshow-container" id="slideshow">
  <!-- unchanged shadows, slides, arrows, counter, dots -->
  <button class="fullscreen-btn" id="fullscreenBtn" type="button"
          aria-label="Enter fullscreen" title="Fullscreen">⛶</button>
</div>
```

Rules:

- exactly one `#fullscreenBtn` per rendered slideshow;
- the button stays inside the slideshow container;
- `id="slideshow"` is added to the container if it is missing (no visual
  effect);
- do not move the button into `.slides`, the dot container, or an external
  toolbar;
- do not add a visible text label.

## 4. Required CSS

Use the P038 rules verbatim. Add only the fallback rules below; do not restyle
the normal state.

```css
.slideshow-container.theater-mode {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  padding-bottom: 50px;
  border-radius: 0;
  background: #000;
  z-index: 2147483647;
}

body.theater-open {
  overflow: hidden;
}
```

The fallback expands quietly: no status note, alert, or technical message.

## 5. Required JavaScript behavior

The implementation must:

1. feature-detect `requestFullscreen` (plus legacy prefixed variants if kept);
2. check `document.fullscreenEnabled`;
3. call `requestFullscreen()` on `#slideshow` from the click handler;
4. handle the returned Promise rejection;
5. listen for `fullscreenchange` and `fullscreenerror`;
6. update the button's `aria-label` and `title` on every state change;
7. call `exitFullscreen()` when already fullscreen;
8. fall back quietly to in-iframe theater mode when native fullscreen is
   unavailable or denied;
9. never throw an uncaught error, block with `alert()`, or leave the button
   doing nothing;
10. preserve the slideshow's other interactions.

Reference implementation:

```js
(function () {
  var container = document.getElementById('slideshow');
  var button = document.getElementById('fullscreenBtn');
  if (!container || !button) return;

  var fallbackActive = false;

  function setButtonState(active) {
    button.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
    button.setAttribute('title', active ? 'Exit fullscreen' : 'Fullscreen');
  }

  function enterFallback() {
    if (fallbackActive) return;
    if (document.fullscreenElement || document.webkitFullscreenElement) return;
    fallbackActive = true;
    container.classList.add('theater-mode');
    document.body.classList.add('theater-open');
    setButtonState(true);
  }

  function exitFallback() {
    if (!fallbackActive) return;
    fallbackActive = false;
    container.classList.remove('theater-mode');
    document.body.classList.remove('theater-open');
    setButtonState(false);
  }

  function requestNative() {
    var request = container.requestFullscreen ||
                  container.webkitRequestFullscreen ||
                  container.msRequestFullscreen;
    if (!request || document.fullscreenEnabled === false) {
      enterFallback();
      return;
    }
    try {
      var result = request.call(container);
      if (result && typeof result.then === 'function') {
        result.catch(enterFallback);
      }
    } catch (error) {
      enterFallback();
    }
  }

  function exitNative() {
    var exit = document.exitFullscreen ||
               document.webkitExitFullscreen ||
               document.msExitFullscreen;
    if (!exit) {
      exitFallback();
      return;
    }
    try {
      var result = exit.call(document);
      if (result && typeof result.then === 'function') {
        result.catch(function () {});
      }
    } catch (error) {
      /* stay in the current state; button remains usable */
    }
  }

  button.addEventListener('click', function () {
    if (document.fullscreenElement) {
      exitNative();
      return;
    }
    if (fallbackActive) {
      exitFallback();
      return;
    }
    requestNative();
  });

  document.addEventListener('fullscreenchange', function () {
    var active = document.fullscreenElement === container;
    if (active) exitFallback();
    setButtonState(active || fallbackActive);
  });

  document.addEventListener('fullscreenerror', enterFallback);

  setButtonState(false);
})();
```

Do not add autoplay, swipe, keyboard navigation, captions, or any other control
as part of this standard.

## 6. Fallback and its limitations

Native fullscreen is attempted first. If it is denied or unavailable, the button
toggles `.theater-mode`, which makes the slideshow fill the iframe viewport. The
fallback is intentionally quiet: it does not show a status note, alert, or
technical message.

Limitations of theater mode:

- it cannot expand beyond the iframe rectangle set by Behance;
- browser chrome, Behance navigation, and the page around the iframe remain;
- it is local to that iframe; it must not affect another embed's layout or
  state;
- it is not equivalent to browser fullscreen and must be described as a
  fallback;
- the button remains the exit control.

This is preferable to a blocking alert, a technical message, or a broken
slideshow.

## 7. Behance iframe requirements

Every generated snippet includes both modern and legacy permission signals:

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

Do not add a `sandbox` attribute to the generated iframe. If Behance adds one,
it must be tested.

Each snippet loads exactly one slideshow and is a standalone embed. Do not
generate a combined viewer, gallery, dashboard, or iframe containing another
slideshow. Fullscreen permission and state are per iframe.

`allowfullscreen` and `allow="fullscreen"` are necessary but not sufficient:
Behance may sanitize or rewrite the embed code. The real published-Behance test
is mandatory before declaring fullscreen supported.

## 8. Apps Script / iframe findings

Google documents the HtmlService `IFRAME` sandbox with these tokens:

```
allow-same-origin allow-forms allow-scripts allow-popups
allow-downloads allow-modals allow-popups-to-escape-sandbox
allow-top-navigation-by-user-activation
```

`allowfullscreen` is not in that list. However, a local Chromium test of a
Behance-like cross-origin parent → Apps Script-like wrapper → sandboxed
slideshow chain found:

| Outer iframe permission | `document.fullscreenEnabled` in slideshow | Result |
|---|---|---|
| `allowfullscreen allow="fullscreen"` | `true` | request granted; `fullscreenchange` fired |
| no permission | `false` | request denied; `fullscreenerror` fired; no change |

The inner sandbox did not block fullscreen when the outer embedding iframe
granted it. The outer iframe is the decisive layer. This is good news for the
architecture, but it is a Chromium result on a local harness, not proof about
Behance. Safari and Firefox may be stricter, and Behance's sanitizer is unknown.

The real test must inspect the actual Behance DOM after publishing and confirm
that the generated iframe still has the permission attributes.

## 9. Acceptance checklist

For every slideshow:

- [ ] exactly one fullscreen button, same glyph, style and position as P038;
- [ ] no duplicate in P038-S01;
- [ ] button does not shift or resize any image;
- [ ] images, order, aspect ratios and repeated URLs unchanged;
- [ ] arrows, dots, counter, shadows, borders and transitions unchanged;
- [ ] native request works when permission is granted;
- [ ] denial triggers theater mode quietly, with no crash or technical note;
- [ ] `fullscreenchange` updates the button label;
- [ ] exiting fullscreen restores the normal layout;
- [ ] fullscreen in one embed leaves other embeds' slide and fullscreen state
      unchanged;
- [ ] no uncaught console errors;
- [ ] one real published-Behance test passes before bulk rollout;
- [ ] independence tests in `INDEPENDENT_EMBED_STANDARD.md` pass.
