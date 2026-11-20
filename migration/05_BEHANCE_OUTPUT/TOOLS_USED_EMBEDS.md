# All 37 TOOLS USED Embed Codes

These are the original self-contained HTML/CSS software-logo strips from the
matching Google Sites project pages. They are raw HTML blocks, not iframes.
Paste one code into the TOOLS USED section of the matching Behance project.

- **Codes:** 37
- **Strip height:** 127 px on every project
- **Logos per strip:** 4–5
- **Image URLs:** exact originals, unchanged

## Quick reference

| # | Project | Embed ID | Frame | Logos |
|---:|---|---|---|---:|
| 1 | P001 — AL-RASHED PROJECT | `P001-TOOLS` | 1335 × 127 | 5 |
| 2 | P002 — Cellphone Store | `P002-TOOLS` | 1335 × 127 | 4 |
| 3 | P003 — DK-Apartment | `P003-TOOLS` | 1335 × 127 | 4 |
| 4 | P004 — AB-Apartment | `P004-TOOLS` | 1335 × 127 | 4 |
| 5 | P005 — GF-KIDS BEDROOM | `P005-TOOLS` | 884 × 127 | 5 |
| 6 | P006 — AP-GF-RECIPTION | `P006-TOOLS` | 884 × 127 | 5 |
| 7 | P007 — AP-GF-FAMILY MAJLIS | `P007-TOOLS` | 1335 × 127 | 5 |
| 8 | P008 — GIRL BEDROOM | `P008-TOOLS` | 884 × 127 | 5 |
| 9 | P009 — MASTER BEDROOM | `P009-TOOLS` | 884 × 127 | 5 |
| 10 | P010 — BOY BEDROOM | `P010-TOOLS` | 884 × 127 | 5 |
| 11 | P011 — OA-AP-FAMILY MAJLIS | `P011-TOOLS` | 1335 × 127 | 4 |
| 12 | P012 — GF-DINNING ROOM | `P012-TOOLS` | 884 × 127 | 5 |
| 13 | P013 — OA-AP-BOYS BEDROOM | `P013-TOOLS` | 1335 × 127 | 4 |
| 14 | P014 — AP-FF-RECIPTION | `P014-TOOLS` | 884 × 127 | 5 |
| 15 | P015 — OA_MASTER_BEDROOM | `P015-TOOLS` | 1335 × 127 | 4 |
| 16 | P016 — AP-GF-LANDSCAPE | `P016-TOOLS` | 884 × 127 | 5 |
| 17 | P017 — VILLA LOBBY - EYGPT | `P017-TOOLS` | 884 × 127 | 5 |
| 18 | P018 — GF-STAIRS | `P018-TOOLS` | 884 × 127 | 5 |
| 19 | P019 — GF-GIRL BEDROOM | `P019-TOOLS` | 884 × 127 | 5 |
| 20 | P020 — AV_3rd_Floor_Family_Majlis | `P020-TOOLS` | 1335 × 127 | 4 |
| 21 | P021 — VILLA GROUND FLOOR - UAE | `P021-TOOLS` | 884 × 127 | 5 |
| 22 | P022 — OA-AP-GIRL BEDROOM | `P022-TOOLS` | 884 × 127 | 5 |
| 23 | P023 — MEN MAJLIS - EYGPT | `P023-TOOLS` | 884 × 127 | 5 |
| 24 | P025 — VILLA ENTRANCE - EYGPT | `P025-TOOLS` | 884 × 127 | 5 |
| 25 | P026 — KITCHEN | `P026-TOOLS` | 884 × 127 | 5 |
| 26 | P027 — FAMILY NIGHT MAJLIS - EYGPT | `P027-TOOLS` | 884 × 127 | 5 |
| 27 | P028 — AP-FF-MASTER BEDROOM | `P028-TOOLS` | 884 × 127 | 5 |
| 28 | P029 — GUESTS ROOM - OM ASEL | `P029-TOOLS` | 884 × 127 | 5 |
| 29 | P030 — AV_SF_Family_Majlis_Render | `P030-TOOLS` | 1335 × 127 | 4 |
| 30 | P031 — ARABIC MAJLIS | `P031-TOOLS` | 884 × 127 | 5 |
| 31 | P032 — FAMILY LIVING ROOM GF- VRAY | `P032-TOOLS` | 1335 × 127 | 4 |
| 32 | P033 — AV-SF-BOY-BEDROOM | `P033-TOOLS` | 1335 × 127 | 4 |
| 33 | P034 — AV_SF_Girl Bedroom | `P034-TOOLS` | 1335 × 127 | 4 |
| 34 | P035 — GUEST MAJLIS- VRAY | `P035-TOOLS` | 1335 × 127 | 4 |
| 35 | P036 — MASTER-BEDROOM-VRAY | `P036-TOOLS` | 1335 × 127 | 4 |
| 36 | P037 — FAMILY MAJLIS GF - VRAY | `P037-TOOLS` | 1335 × 127 | 4 |
| 37 | P038 — Dental Clinic | `P038-TOOLS` | 884 × 127 | 4 |

## P001 — AL-RASHED PROJECT

- **Embed ID:** `P001-TOOLS`
- **Strip dimensions:** 1335 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Photoshop Logo, Lumion Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/al-rashed-project

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
  <img src="https://i.imgur.com/8y2GzCS.png" alt="Lumion Logo">
</div>
```

## P002 — Cellphone Store

- **Embed ID:** `P002-TOOLS`
- **Strip dimensions:** 1335 × 127 px
- **Logos:** 4 (3ds Max Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/cellphone-store

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 50vw; /* adjusted width since fewer logos */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0;
  }

  /* Grayscale all logos */
  .logo-row img {
    filter: grayscale(100%);
  }

  /* On hover, remove grayscale and add scale */
  .logo-row img:hover {
    filter: none;
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P003 — DK-Apartment

- **Embed ID:** `P003-TOOLS`
- **Strip dimensions:** 1335 × 127 px
- **Logos:** 4 (3ds Max Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/dk-apartment

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 50vw; /* adjusted width since fewer logos */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0;
  }

  /* Grayscale all logos */
  .logo-row img {
    filter: grayscale(100%);
  }

  /* On hover, remove grayscale and add scale */
  .logo-row img:hover {
    filter: none;
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P004 — AB-Apartment

- **Embed ID:** `P004-TOOLS`
- **Strip dimensions:** 1335 × 127 px
- **Logos:** 4 (3ds Max Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/ab-apartment

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 50vw; /* adjusted width since fewer logos */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0;
  }

  /* Grayscale all logos */
  .logo-row img {
    filter: grayscale(100%);
  }

  /* On hover, remove grayscale and add scale */
  .logo-row img:hover {
    filter: none;
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P005 — GF-KIDS BEDROOM

- **Embed ID:** `P005-TOOLS`
- **Strip dimensions:** 884 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/gf-kids-bedroom

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P006 — AP-GF-RECIPTION

- **Embed ID:** `P006-TOOLS`
- **Strip dimensions:** 884 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/ap-gf-reciption

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P007 — AP-GF-FAMILY MAJLIS

- **Embed ID:** `P007-TOOLS`
- **Strip dimensions:** 1335 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Unreal Engine Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/ap-gf-family-majlis

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 60vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/z0G51fu.png" alt="Unreal Engine Logo" class="unreal">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P008 — GIRL BEDROOM

- **Embed ID:** `P008-TOOLS`
- **Strip dimensions:** 884 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/girl-bedroom

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P009 — MASTER BEDROOM

- **Embed ID:** `P009-TOOLS`
- **Strip dimensions:** 884 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/master-bedroom

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P010 — BOY BEDROOM

- **Embed ID:** `P010-TOOLS`
- **Strip dimensions:** 884 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/boy-bedroom

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P011 — OA-AP-FAMILY MAJLIS

- **Embed ID:** `P011-TOOLS`
- **Strip dimensions:** 1335 × 127 px
- **Logos:** 4 (3ds Max Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/oa-ap-family-majlis

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 50vw; /* adjusted width since fewer logos */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0;
  }

  /* Grayscale all logos */
  .logo-row img {
    filter: grayscale(100%);
  }

  /* On hover, remove grayscale and add scale */
  .logo-row img:hover {
    filter: none;
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P012 — GF-DINNING ROOM

- **Embed ID:** `P012-TOOLS`
- **Strip dimensions:** 884 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/gf-dinning-room

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P013 — OA-AP-BOYS BEDROOM

- **Embed ID:** `P013-TOOLS`
- **Strip dimensions:** 1335 × 127 px
- **Logos:** 4 (3ds Max Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/oa-ap-boys-bedroom

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 50vw; /* adjusted width since fewer logos */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0;
  }

  /* Grayscale all logos */
  .logo-row img {
    filter: grayscale(100%);
  }

  /* On hover, remove grayscale and add scale */
  .logo-row img:hover {
    filter: none;
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P014 — AP-FF-RECIPTION

- **Embed ID:** `P014-TOOLS`
- **Strip dimensions:** 884 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/ap-ff-reciption

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P015 — OA_MASTER_BEDROOM

- **Embed ID:** `P015-TOOLS`
- **Strip dimensions:** 1335 × 127 px
- **Logos:** 4 (3ds Max Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/oa_master_bedroom

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 50vw; /* adjusted width since fewer logos */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0;
  }

  /* Grayscale all logos */
  .logo-row img {
    filter: grayscale(100%);
  }

  /* On hover, remove grayscale and add scale */
  .logo-row img:hover {
    filter: none;
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P016 — AP-GF-LANDSCAPE

- **Embed ID:** `P016-TOOLS`
- **Strip dimensions:** 884 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/ap-gf-landscape

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P017 — VILLA LOBBY - EYGPT

- **Embed ID:** `P017-TOOLS`
- **Strip dimensions:** 884 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/villa-lobby-eygpt

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P018 — GF-STAIRS

- **Embed ID:** `P018-TOOLS`
- **Strip dimensions:** 884 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/gf-stairs

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P019 — GF-GIRL BEDROOM

- **Embed ID:** `P019-TOOLS`
- **Strip dimensions:** 884 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/gf-girl-bedroom

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P020 — AV_3rd_Floor_Family_Majlis

- **Embed ID:** `P020-TOOLS`
- **Strip dimensions:** 1335 × 127 px
- **Logos:** 4 (3ds Max Logo, AutoCAD Logo, V-Ray Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/av_3rd_floor_family_majlis

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 50vw; /* adjusted width since fewer logos */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0;
  }

  /* Grayscale all logos */
  .logo-row img {
    filter: grayscale(100%);
  }

  /* On hover, remove grayscale and add scale */
  .logo-row img:hover {
    filter: none;
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/BRtEuwD.png" alt="V-Ray Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P021 — VILLA GROUND FLOOR - UAE

- **Embed ID:** `P021-TOOLS`
- **Strip dimensions:** 884 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/villa-ground-floor-uae

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P022 — OA-AP-GIRL BEDROOM

- **Embed ID:** `P022-TOOLS`
- **Strip dimensions:** 884 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/oa-ap-girl-bedroom

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P023 — MEN MAJLIS - EYGPT

- **Embed ID:** `P023-TOOLS`
- **Strip dimensions:** 884 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/men-majlis-eygpt

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P025 — VILLA ENTRANCE - EYGPT

- **Embed ID:** `P025-TOOLS`
- **Strip dimensions:** 884 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/villa-entrance-eygpt

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P026 — KITCHEN

- **Embed ID:** `P026-TOOLS`
- **Strip dimensions:** 884 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/kitchen

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P027 — FAMILY NIGHT MAJLIS - EYGPT

- **Embed ID:** `P027-TOOLS`
- **Strip dimensions:** 884 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/family-night-majlis-eygpt

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P028 — AP-FF-MASTER BEDROOM

- **Embed ID:** `P028-TOOLS`
- **Strip dimensions:** 884 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/ap-ff-master-bedroom

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P029 — GUESTS ROOM - OM ASEL

- **Embed ID:** `P029-TOOLS`
- **Strip dimensions:** 884 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/guests-room-om-asel

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P030 — AV_SF_Family_Majlis_Render

- **Embed ID:** `P030-TOOLS`
- **Strip dimensions:** 1335 × 127 px
- **Logos:** 4 (3ds Max Logo, AutoCAD Logo, V-Ray Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/av_sf_family_majlis_render

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 50vw; /* adjusted width since fewer logos */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0;
  }

  /* Grayscale all logos */
  .logo-row img {
    filter: grayscale(100%);
  }

  /* On hover, remove grayscale and add scale */
  .logo-row img:hover {
    filter: none;
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/BRtEuwD.png" alt="V-Ray Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P031 — ARABIC MAJLIS

- **Embed ID:** `P031-TOOLS`
- **Strip dimensions:** 884 × 127 px
- **Logos:** 5 (3ds Max Logo, Revit Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/arabic-majlis

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/STZTRZr.png" alt="Revit Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P032 — FAMILY LIVING ROOM GF- VRAY

- **Embed ID:** `P032-TOOLS`
- **Strip dimensions:** 1335 × 127 px
- **Logos:** 4 (3ds Max Logo, AutoCAD Logo, V-Ray Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/family-living-room-gf-vray

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 50vw; /* adjusted width since fewer logos */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0;
  }

  /* Grayscale all logos */
  .logo-row img {
    filter: grayscale(100%);
  }

  /* On hover, remove grayscale and add scale */
  .logo-row img:hover {
    filter: none;
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/BRtEuwD.png" alt="V-Ray Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P033 — AV-SF-BOY-BEDROOM

- **Embed ID:** `P033-TOOLS`
- **Strip dimensions:** 1335 × 127 px
- **Logos:** 4 (3ds Max Logo, AutoCAD Logo, V-Ray Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/av-sf-boy-bedroom

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 50vw; /* adjusted width since fewer logos */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0;
  }

  /* Grayscale all logos */
  .logo-row img {
    filter: grayscale(100%);
  }

  /* On hover, remove grayscale and add scale */
  .logo-row img:hover {
    filter: none;
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/BRtEuwD.png" alt="V-Ray Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P034 — AV_SF_Girl Bedroom

- **Embed ID:** `P034-TOOLS`
- **Strip dimensions:** 1335 × 127 px
- **Logos:** 4 (3ds Max Logo, AutoCAD Logo, V-Ray Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/av_sf_girl-bedroom

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 50vw; /* adjusted width since fewer logos */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0;
  }

  /* Grayscale all logos */
  .logo-row img {
    filter: grayscale(100%);
  }

  /* On hover, remove grayscale and add scale */
  .logo-row img:hover {
    filter: none;
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/BRtEuwD.png" alt="V-Ray Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P035 — GUEST MAJLIS- VRAY

- **Embed ID:** `P035-TOOLS`
- **Strip dimensions:** 1335 × 127 px
- **Logos:** 4 (3ds Max Logo, AutoCAD Logo, V-Ray Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/guest-majlis-vray

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 50vw; /* adjusted width since fewer logos */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0;
  }

  /* Grayscale all logos */
  .logo-row img {
    filter: grayscale(100%);
  }

  /* On hover, remove grayscale and add scale */
  .logo-row img:hover {
    filter: none;
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/BRtEuwD.png" alt="V-Ray Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P036 — MASTER-BEDROOM-VRAY

- **Embed ID:** `P036-TOOLS`
- **Strip dimensions:** 1335 × 127 px
- **Logos:** 4 (3ds Max Logo, AutoCAD Logo, V-Ray Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/master-bedroom-vray

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 50vw; /* adjusted width since fewer logos */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0;
  }

  /* Grayscale all logos */
  .logo-row img {
    filter: grayscale(100%);
  }

  /* On hover, remove grayscale and add scale */
  .logo-row img:hover {
    filter: none;
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/BRtEuwD.png" alt="V-Ray Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P037 — FAMILY MAJLIS GF - VRAY

- **Embed ID:** `P037-TOOLS`
- **Strip dimensions:** 1335 × 127 px
- **Logos:** 4 (3ds Max Logo, AutoCAD Logo, V-Ray Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/family-majlis-gf-vray

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 50vw; /* adjusted width since fewer logos */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0;
  }

  /* Grayscale all logos */
  .logo-row img {
    filter: grayscale(100%);
  }

  /* On hover, remove grayscale and add scale */
  .logo-row img:hover {
    filter: none;
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/BRtEuwD.png" alt="V-Ray Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## P038 — Dental Clinic

- **Embed ID:** `P038-TOOLS`
- **Strip dimensions:** 884 × 127 px
- **Logos:** 4 (3ds Max Logo, AutoCAD Logo, Corona Logo, Photoshop Logo)
- **Source:** https://sites.google.com/view/hossam-alafandi/freelance/dental-clinic

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Logos with Equal Spacing</title>
<style>
html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    height: 100vh;
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-row {
    display: flex;
    justify-content: space-between; /* equal spacing between logos */
    align-items: center;
    width: 90vw; /* container width */
    background: transparent;
  }

  .logo-row img {
    height: 60px;
    width: auto;
    background: transparent;
    user-select: none;
    pointer-events: auto;
    display: block;
    flex-shrink: 0;
    cursor: pointer;
    transition: 
      filter 0.3s ease, 
      transform 0.3s ease;
    margin: 0; /* remove margins */
  }

  /* Grayscale all except Unreal */
  .logo-row img:not(.unreal) {
    filter: grayscale(100%);
  }

  /* Unreal logo inverted always */
  .logo-row img.unreal {
    filter: invert(1);
  }

  /* On hover, remove grayscale from all except Unreal, add scale */
  .logo-row img:not(.unreal):hover {
    filter: none;
    transform: scale(1.1);
  }

  /* Unreal logo hover: scale, keep inverted */
  .logo-row img.unreal:hover {
    transform: scale(1.1);
  }
</style>
<div class="logo-row" aria-label="Software logos">
  <img src="https://i.imgur.com/znQK1ti.png" alt="3ds Max Logo">
  <img src="https://i.imgur.com/eusbdWx.png" alt="AutoCAD Logo">
  <img src="https://i.imgur.com/X4WSOcP.png" alt="Corona Logo">
  <img src="https://i.imgur.com/6sW1ghq.png" alt="Photoshop Logo">
</div>
```

## Not included

P024 has no audited project page, so it has no TOOLS USED code.
