# Photo credits

All four photographs in this directory are Canadian and sourced from Wikimedia
Commons under CC0 (public domain dedication) or CC-BY licences. CC-BY images
require the attribution shown below to be visible somewhere on the site — it is
rendered in the footer of both pages, in the elements marked
`data-photo-credit`. If you swap any photo, update this file **and** that footer
line.

CC-BY-SA images were deliberately avoided, as on the UK page, to keep the
licensing obligations to a single visible credit line.

Each file was cropped and resized from the Commons original with `sips`; the
exact crops are reproducible from `_tooling/README.md`. Output dimensions match
the UK page's files so the layout cannot shift.

---

## students-campus.jpg — hero (`#home`), 1166×1143

> **The filename no longer describes the subject.** It is kept because
> `students-campus.jpg` is a literal key in the compiled stylesheet — the class
> `bg-[url('/assets/img/photos/students-campus.jpg')]` plus the matching escaped
> selector and `url()` in `assets/css/main.css`, and the `<link rel="preload">`
> in the page shell. Renaming the file means editing all of those together;
> `verify_site.py` fails on a mismatch, the browser fails silently.

- **Depicts:** The Toronto skyline seen across the harbour from the Toronto
  Islands — the CN Tower centre frame with the Rogers Centre dome and the
  downtown towers behind it, moored sailboats and green trees in the
  foreground, in summer.
- **Commons file page:** https://commons.wikimedia.org/wiki/File:SkylineToronto4.jpg
- **Author / photographer:** Raysonho @ Open Grid Scheduler / Grid Engine
- **Licence:** CC0 1.0 Public Domain Dedication — https://creativecommons.org/publicdomain/zero/1.0/
- **Attribution required:** None (CC0). Credit is appreciated but not obligatory.
- **Crop:** original 4928×3264 → `sips -c 2664 2717 --cropOffset 600 182`
  (trims sky from the top and puts the CN Tower dead centre) → resized to
  1166×1143, quality 78.
- **Why this file is near-square and not 1400×779 like the UK page's hero:**
  the hero panel measures about **596×584 CSS px on desktop (1.02:1) and
  319×292 on mobile (1.09:1)** — essentially square at every breakpoint. The div
  is `bg-cover bg-center`, so a 1.797:1 file has roughly **43% of its width
  cropped away** and only its central strip is ever seen. The UK page's
  1400×779 hero has the same waste; it only looks fine because the Radcliffe
  Camera is a centred vertical subject.
- **Safe to reshape:** referenced *only* as a CSS `background-image` and a
  `<link rel="preload">` — there is no `<img>` tag for it on either page, so its
  aspect ratio has no effect on layout. Check with
  `grep -o "students-campus[^"')]*" index.html universities.html assets/css/main.css`
  before changing it.

### Heroes tried and replaced, so they are not retried

All were replaced on request, in order:

1. University College, University of Toronto — City of Toronto, CC BY 2.0.
   Sunlit, with students walking past; dropped as too dark/grey overall.
2. Convocation Hall, University of Toronto — Yinan Chen, public domain,
   `File:Gfp-canada-ontario-toronto-building-and-sky.jpg`. Bright and needs no
   attribution; the fallback if a campus shot is ever wanted again.
3. Horseshoe Falls, Niagara — Jorge Láscar, CC BY 2.0,
   `File:Horseshoe_Falls_-_Niagara_Falls_2017.jpg`. Wintry (shot in April) and
   the wide crest does not survive a square crop well.
4. Nathan Phillips Square with the 3D TORONTO sign — Scott Webb, CC0,
   `File:Toronto_urban_plaza_(Unsplash).jpg`. Sharp, sunny, people and
   fountains; a good option if a city-square scene is preferred to a skyline.

Rejected before installing, worth not retrying:

- Nathan Phillips Square skating shot (CC0, Brendan Church) — shallow depth of
  field focused on a foreground passer-by, so cropping to the sign leaves only
  blur, and the "T" falls outside the frame.
- Toronto skyline from the Islands (CC0, Austin Lee) — beautiful but hazy and
  low-contrast; the CN Tower reads as a smudge at 600 px.
- Château Frontenac, Moraine Lake, Queen's University at dusk (thumb over the
  lens), Université Laval (grey winter car park).

## team-working.jpg — `#relocate` ("The Pathway to Settlement"), 1400×933

- **Depicts:** The interior of the Toronto Reference Library, with study tables
  and readers.
- **Commons file page:** https://commons.wikimedia.org/wiki/File:TorontoReferenceLibrary.jpg
- **Author / photographer:** Raysonho @ Open Grid Scheduler / Grid Engine
- **Licence:** CC0 1.0 Public Domain Dedication — https://creativecommons.org/publicdomain/zero/1.0/
- **Attribution required:** None (CC0). Credit is appreciated but not obligatory.
- **Crop:** none needed — the original 4608×3072 is already 3:2. Resized to
  1400×933, quality 82.
- **Note:** this image is rendered with `w-full h-auto object-cover`, so its
  aspect ratio drives the layout. Any replacement must also be 3:2.

## family.jpg — `#relocate` ("Relocating with Your Family?"), 1400×1050

- **Depicts:** Victorian brick terraced houses on Pine Terrace, Cabbagetown,
  Toronto.
- **Commons file page:** https://commons.wikimedia.org/wiki/File:Cabbagetown_houses.jpg
- **Author / photographer:** Jay Woodworth (Brooklyn, NY, USA)
- **Licence:** CC BY 2.0 — https://creativecommons.org/licenses/by/2.0
- **Attribution required:** `Cabbagetown, Toronto — photo by Jay Woodworth, CC BY 2.0`
- **Crop:** original 4288×2848 → `sips -c 2848 3797 --cropOffset 0 245` (3:2 → 4:3,
  trimmed centred) → resized to 1400×1050, quality 68.

## canada-city.jpg — `#universities` panel background, 1400×933

- **Depicts:** The downtown Montréal skyline.
- **Commons file page:** https://commons.wikimedia.org/wiki/File:Downtown_Montreal_skyline_(Unsplash).jpg
- **Author / photographer:** Andrew Welch (via Unsplash)
- **Licence:** CC0 1.0 Public Domain Dedication — https://creativecommons.org/publicdomain/zero/1.0/
- **Attribution required:** None (CC0).
- **Crop:** original 4833×3201 → `sips -c 3201 4801 --cropOffset 0 16` (to exact
  3:2) → resized to 1400×933, quality 82.
- **Note:** this file is referenced by a Tailwind arbitrary-value class,
  `bg-[url('/assets/img/photos/canada-city.jpg')]`, which is a literal key into
  the compiled stylesheet. Renaming the file means editing **both** the class in
  the HTML and the escaped selector plus `url()` in `assets/css/main.css`.
  `verify_site.py` fails on a mismatch; the browser fails silently.

---

## Combined credit line (as rendered in the footer)

> Photography: Cabbagetown, Toronto © Jay Woodworth (CC BY 2.0); Toronto
> skyline and Toronto Reference Library by Raysonho (CC0); downtown Montréal
> by Andrew Welch (CC0). Via Wikimedia Commons.

**Only `family.jpg` (Cabbagetown) carries a mandatory attribution** — the other
three are CC0. The line is generated from `PHOTO_CREDIT` in
`_tooling/localise_ca.py`, so change it there and re-run `localise_ca.py` +
`assemble.py canada` + `build_unipage.py canada`.

## On photographs of people

As on the UK page, none of the four photos has an identifiable person as its
subject — the hero is a landscape with no people in it.
Appropriately-licensed photos of people are scarce on Commons (nearly all are
CC-BY-SA), so recognisable Canadian places were the better trade. If you want
students in the hero, buy a stock licence and drop in a 1400×779 file.

---

## assets/img/cities/ — hero destination card (added Oct 2026)

Downloaded from Wikimedia Commons at 1600px and re-encoded (JPEG q82). Attribution is shown on the card and in the footer.

| File | Commons file | Author | Licence |
|---|---|---|---|
| toronto.jpg | File:Toronto Waterfront, CN Tower 6277.jpg | ImagePerson | CC BY 4.0 |
| vancouver.jpg | File:Skyline of Vancouver, BC.jpg | Quintin Soloviev | CC BY 4.0 |
| montreal.jpg | File:Montreal skyline 2011.jpg | abdallahh | CC BY 2.0 |
| calgary.jpg | File:Calgary skyline, Canada; October 2019.jpg | Bernard Spragg. NZ | CC0 |
| ottawa.jpg | File:Canadian Parliament Building from across the Ottawa River - panoramio (2).jpg | A J Butler | CC BY 3.0 |
