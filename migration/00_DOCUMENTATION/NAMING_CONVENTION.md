# Naming Convention

This document defines the permanent identifiers and file naming rules for the
Behance slideshow migration. IDs are assigned once and never change. Nothing in
this system may use timestamps, random strings, or content hashes as an
identifier.

## 1. Project IDs

Format: `P` + three digits, `P001` … `P038`.

Assignment rule: the order of the `SHOW` project cards on the Freelance page,
top to bottom, as captured in the Phase 1 audit on 2026-11-18.

- The order is frozen after the audit, even if the Google Sites page is
  reordered later.
- New projects, if ever added, receive the next free number (`P039`, …).
  Existing numbers are never reused or shifted.
- A project that is removed from the portfolio keeps its ID and is marked
  `RETIRED` in `01_AUDIT/projects.csv`.

## 2. Slideshow IDs

Format: `P###-S##`, for example `P001-S01`.

Assignment rule: `S01`, `S02`, … in the order the slideshow embeds appear on the
project page, top to bottom. Only actual interactive slideshows consume an
`S` number. Non-slideshow embeds (tool logos, maps, static Drive previews) are
recorded separately and never receive a slideshow ID.

- A slideshow removed later keeps its ID and is marked `RETIRED`.
- Adding a new slideshow to a project appends the next free `S` number.

## 3. Project slug

The slug is taken from the project page URL, last path segment, verbatim:

```
/freelance/al-rashed-project  ->  al-rashed-project
```

Lowercase, ASCII, hyphen-separated. The slug is part of filenames for human
readability only. If the URL ever changes, the slug is frozen at its audited
value; the live URL is stored in `projects.csv`.

## 4. Section descriptor

A short lowercase descriptor describing the slideshow's content or the section
label it sits under on the original page (`renders`, `real-photos`,
`presentation`, `interior`, `exterior`, `slideshow`, …).

- Derived from the nearest visible section heading above the embed.
- If no label exists, use `slideshow`.
- Must be unique within the project. On collision, append `-a`, `-b`.

## 5. Canonical file stem

```
{PID}-{slug}-S{##}-{section}
```

Examples from the specification:

```
P001-al-rashed-villas-S01-renders
P001-al-rashed-villas-S02-real-photos
P002-residential-apartment-S01-presentation
```

## 6. Paths

```
02_SOURCE_BACKUP/P001/P001-al-rashed-project-S01-renders.original.html
03_REBUILT_SLIDESHOWS/data/P001-S01.json
03_REBUILT_SLIDESHOWS/preview/P001-S01.html
05_BEHANCE_OUTPUT/P001.md
05_BEHANCE_OUTPUT/P001-S01.md
```

Rules:

- `02_SOURCE_BACKUP` holds the untouched extracted source, extension
  `.original.html`. Never edit these files.
- `03_REBUILT_SLIDESHOWS` holds generated local preview pages only; it is not
  the production host.
- `03_REBUILT_SLIDESHOWS/data` holds one JSON manifest per slideshow: image
  order, exact original remote URLs, dimensions, and styling configuration.
- `03_REBUILT_SLIDESHOWS/assets` is not used and must not be created.
- `05_BEHANCE_OUTPUT` holds ready-to-paste iframe snippets, grouped by project.
- One folder per project at every stage. No flat dumping of files.

## 7. Image references — remote only

Images are never stored in this repository. Each slideshow references the
original remote URLs directly. The mapping from ordinal to URL lives in the
slideshow JSON manifest and in `01_AUDIT/images.csv`.

- The URL is an opaque exact string; never normalize, shorten, rewrite, or
  replace it.
- Query parameters, their order, and their encoding are preserved.
- Repeated URLs remain repeated slots, in the original order.
- The `src` in generated HTML must match `images.csv` byte-for-byte.
- No `assets/`, base64, `data:image`, Drive, or local-file image references are
  allowed.

See `IMAGE_HOSTING_POLICY.md` for the mandatory rule and verification process.

## 8. Required provenance header

Every generated HTML file starts with an HTML comment:

```html
<!--
  slideshow: P001-S01
  project:   P001
  source:    https://sites.google.com/view/hossam-alafandi/freelance/al-rashed-project
  embed:     Google Sites custom embed (Atari)
  images:    original remote URLs from 01_AUDIT/images.csv (no local copies)
  generated: from 02_SOURCE_BACKUP/P001/P001-al-rashed-project-S01-renders.original.html
-->
```

## 9. Status vocabulary

Projects (`01_AUDIT/projects.csv`):

`NOT_STARTED`, `SCANNED`, `NO_SLIDESHOW`, `VERIFIED`, `PARTIAL`, `BLOCKED`.

Slideshows (`01_AUDIT/slideshows.csv`):

`DETECTED`, `EXTRACTED`, `NEEDS_REVIEW`, `BLOCKED`.

## 10. Prohibited practices

- No `final`, `new`, `v2`, `copy`, `temp`, or date-based filenames.
- No renaming of an ID after it appears in any generated file.
- No downloading, mirroring, rehosting, or uploading of slideshow images.
- No rewriting, shortening, normalizing, or substituting an image URL.
- No silent reordering of images. If the original order is ambiguous, the
  slideshow is marked `NEEDS_REVIEW` and the ambiguity is recorded in
  `01_AUDIT/unresolved_items.md`.
