# Image Hosting Policy — No Downloading or Rehosting

Status: **mandatory owner requirement** (Phase 1.1, 2026-11-18; reconfirmed for
Phase 2). Applies to every later phase, including Phase 2 and any future
maintenance. Phase 2 tests do not fetch, open, or inspect image content. The
single documented exception is the standalone Al-Rashed page in section 8.

## 1. The rule

The slideshow images already exist online, predominantly on `i.imgur.com`. The
migration must use those original URLs directly. The only exception is the
standalone Al-Rashed page described in section 8; it does not apply to any of
the 48 slideshows.

It is prohibited to:

- download an image file to the local computer;
- commit an image file to the GitHub repository;
- upload an image to Google Drive, Apps Script, GitHub Releases, or any other
  host;
- mirror, proxy, cache, transcode, resize, or rehost an image;
- replace an image automatically, including when it fails to load;
- use an imgur thumbnail or resized variant in place of the original URL.

The rebuilt slideshow HTML must contain the original remote URL in the `<img
src="…">` attribute. No image binaries are part of the 48-slideshow project.

## 2. What is allowed

Inspection without saving the image binary is allowed:

- HTTP `HEAD` requests and byte-range reads for status, format and dimensions;
- opening the original URL in a browser to check that it loads;
- recording the URL, HTTP status, natural dimensions and loading state;
- screenshots of the rendered portfolio for audit evidence.

Do not save the response body to disk. The Phase 1 audit already verified all
336 unique URLs and read dimensions with range requests; no image binaries were
stored.

## 3. URL fidelity

Every URL is treated as an opaque, exact string:

- preserve scheme, host, path, filename, extension, and case;
- preserve query parameters exactly, including their order and encoding;
- preserve fragments if present;
- preserve repeated URLs where the original slideshow repeats them;
- preserve the original order of every image slot;
- do not "clean up", shorten, normalize, upgrade `http` to `https`, or add
  cache-busting parameters.

`P032-S01` is the reference case: positions 2 and 3 both use
`https://i.imgur.com/1MWxYk7.jpeg`. Both slots must remain.

## 4. Repository and pipeline rules

- `03_REBUILT_SLIDESHOWS/assets/` is not used. No `assets` directory is created
  for slideshow images.
- `01_AUDIT/images.csv` stores the remote URL only. The obsolete `local_target`
  column was removed in Phase 1.1.
- `01_AUDIT/slides.config.json` stores remote URLs and dimensions only.
- The Apps Script project does not fetch, cache, encode, or serve image bytes.
  It only renders HTML that points at the remote URLs.
- Generated Behance snippets contain the Apps Script URL, never an image.
- The Phase 2 generator must never invoke an image download.
- The only committed image binaries are the 9 owner-approved derivatives in
  `assets/al-rashed/` for the standalone page (section 8). Scratch originals in
  `assets/al-rashed/raw/` are gitignored.

## 5. Failure handling

If an image fails to load during verification:

1. record the slideshow ID, position, exact URL, HTTP status or browser error,
   and the date in `01_AUDIT/unresolved_items.md`;
2. mark the affected slideshow `NEEDS_REVIEW` (or `BLOCKED` if it prevents
   verification);
3. stop and ask the owner for a decision;
4. never substitute, remove, reorder, or rehost the image.

A broken remote image is a content/hosting decision for the owner, not an
automatic repair.

## 6. Phase 2 verification

Before publishing any snippet:

- compare every generated `src` against `images.csv` byte-for-byte;
- compare the full URL sequence, including duplicates, against the source
  order;
- confirm the generated HTML contains no `assets/`, `data:image`, base64,
  Drive, or local-file references;
- confirm the repository contains no image binaries added by the migration,
  except the 9 approved `assets/al-rashed/` derivatives;
- confirm the browser loads the images directly from `i.imgur.com`.

A SHA-256 of the ordered URL sequence from `images.csv` at Phase 1.1 completion
is stored in the Phase 1.1 report. Recompute it after generation; it must match.

## 7. Accepted risk

Imgur can rate-limit, block hotlinking, or remove content. This risk is accepted
by the owner in exchange for not duplicating the assets. It is recorded as U07
in `01_AUDIT/unresolved_items.md`. The mitigation is monitoring and a documented
failure record, not rehosting.

## 8. Standalone Al-Rashed page exception

Date: 2026-11-24. Owner-approved scope: the standalone Al-Rashed project page
served at `?page=al-rashed`, and nothing else.

Google Sites serves the page hero and 3 real photos with
`Cross-Origin-Resource-Policy: same-site`, so those four source images cannot be
loaded inside a Behance iframe. The owner approved copying them for this page:

- 9 optimized JPEG derivatives live in `assets/al-rashed/`: 768 px phone
  versions, 1280 px desktop versions, and a 1920 px hero fallback.
- They are served from the public repository through jsDelivr at
  `https://cdn.jsdelivr.net/gh/hossamalafandi/behance-slideshow@main/assets/al-rashed/`.
- The scratch originals in `assets/al-rashed/raw/` are gitignored and are not
  part of the deployed page.
- The page keeps the exact 17 Imgur render IDs and order: full-resolution
  originals (`https://i.imgur.com/<id>.jpeg`) are used at desktop widths, and
  the existing 1024×576 `h` variants are used only on phones through
  `<picture>`.
- In the phone fullscreen viewer, the full-resolution original for the current
  render is loaded on demand; the slideshow itself keeps the `h` variants.
- The 5 tool logos keep their exact Imgur PNG URLs.
- No slideshow image was copied, resized, proxied, or rehosted. The 48
  slideshows remain governed by sections 1–6.
- This exception does not authorize copying any other Google Sites image or any
  slideshow image.

## 9. Cellphone Store page exception

Date: 2026-11-25. Owner-approved scope: the standalone Cellphone Store project
page served at `?page=cellphone-store`, and nothing else.

Google Sites serves the page's 21 stage and render/reality photos with
cross-site blocking headers, so they cannot be loaded inside a Behance iframe.
The owner asked for the page to be rebuilt as an embed, which authorizes this
page-only copy:

- 44 optimized JPEG derivatives live in `assets/cellphone-store/`: a 768 px
  phone version and a 1280 px desktop version for each of the 21 photos, plus
  1920/768 px hero versions.
- They are served through jsDelivr at
  `https://cdn.jsdelivr.net/gh/hossamalafandi/behance-slideshow@main/assets/cellphone-store/`.
- The 11 RENDERS slideshow images and the 4 tool logos keep their exact Imgur
  URLs. The 9 videos use the owner's Vimeo player embeds, not Google Drive.
- No slideshow image was copied, resized, proxied, or rehosted. The 48
  slideshows remain governed by sections 1–6.
- This exception does not authorize copying any other Google Sites image or any
  slideshow image.

## 10. DK-Apartment page exception

Date: 2026-11-26. Owner-approved scope: the standalone DK-Apartment project page
served at `?page=dk-apartment`, and nothing else.

Google Sites serves the page hero with cross-site blocking headers, so it
cannot be loaded inside a Behance iframe. The owner asked for the page to be
rebuilt as an embed, which authorizes this page-only copy:

- 8 optimized JPEG derivatives live in `assets/dk-apartment/`: 768 px phone
  versions and 1280 px desktop versions for the 3 on-site photos, plus
  1920/768 px hero versions.
- The 38 presentation images and 4 tool logos keep their exact Imgur URLs.
- The 2 videos use the owner's Vimeo player embeds, not Google Drive.
- No slideshow image was copied, resized, proxied, or rehosted. The 48
  slideshows remain governed by sections 1–6.
- This exception does not authorize copying any other Google Sites image or any
  slideshow image.

## 11. AB-Apartment page exception

Date: 2026-11-27. Owner-approved scope: the standalone AB-Apartment project page
served at `?page=ab-apartment`, and nothing else.

Google Sites serves the page hero with cross-site blocking headers, so it
cannot be loaded inside a Behance iframe:

- 2 optimized hero JPEG derivatives live in `assets/ab-apartment/`: a 768 px
  phone version and a 1920 px desktop version.
- The 37 room images across the 7 slideshows and the 4 tool logos keep their
  exact Imgur URLs.
- No slideshow image was copied, resized, proxied, or rehosted. The 48
  slideshows remain governed by sections 1–6.
- This exception does not authorize copying any other Google Sites image or any
  slideshow image.
