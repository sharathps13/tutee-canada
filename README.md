# Tutee Connect — Canada landing page

## v7 (Oct 2026): recreated from the client reference concept

- Hero skyline (`assets/img/photos/hero-toronto-concept.jpg`), manifesto campus
  (`campus-concept.jpg`) and the 9 journey thumbnails (`assets/canada/img/journey/`) are cut from
  the reference concept image supplied by Tutee Connect, upscaled ~3x. They are concept artwork
  (likely AI-generated): confirm usage rights, and replace with high-res licensed photos before launch.
- Vertical city list (hero, right), "Watch the leaf journey" replays the intro, city card, rail tooltips
  with thumbnails like the reference's scroll-journey column.

## v6 (Oct 2026): reference-led refinement

- Ambient red dots removed everywhere; the trail now appears only during the opening flight.
  Seasons use leaves (and snow in winter) sparingly.
- More realistic leaf: finely serrated margins, deeper crimson with a warm translucent centre,
  subtler veins, a gloss highlight. Small depth leaves replace particles in the hero.
- Hero typography follows the reference: Your / Canadian / Journey / Starts *Here.*, a
  "Study in Canada" leaf kicker, a 01/05 city counter, city card, and "Scroll to explore".
- Manifesto gains an editorial photograph on the right; the leaf enters on the left.
- Journey rail is now a curved glowing path with numbered stops and the leaf riding it
  (shown at ≥1360px so it never overlaps content). The leaf's route ends in the footer.

## v5 (Oct 2026): the leaf travels the whole page

- The hero leaf now follows a scroll-linked route through every section (`STOPS` in royal.js:
  one stop per section id with x/y viewport position and scale). It shrinks as the story goes
  on, curves between stops, bursts into red sparks when it reaches a stop, and settles larger
  beside the final counselling form. Stops sit in the margins so copy stays readable.
- Floating red glow particles (from the earlier design) are back, across the whole page —
  denser in the hero.
- A journey rail (right edge, desktop) shows progress with a mini leaf; each dot links to its
  section.
- Hero is brighter and warmer (golden hour), with a city card that updates per city and opens
  that city in the Destinations atlas.

## v4 (Oct 2026): cinematic leaf

- `leaf.js` now draws a large, detailed leaf (veins, translucency, texture, front/back faces,
  baked shadow) and runs the hero engine `TCLeaf.hero()`: a designed Bézier flight with 3D
  flutter, an ember trail (crimson/amber), depth leaves including out-of-focus foreground
  leaves, cursor parallax, a gust on city change, and a scroll continuation that carries the
  leaf into the next section. It draws on a fixed canvas (`.leaf-layer`) that always sits
  *behind* the hero copy and controls.
- The skyline opens through a light-reveal that follows the leaf; a drifting cloud deck, water
  shimmer and a leaf-driven glow add depth. "Replay the leaf" re-runs the sequence.
- Hero city selector (Toronto, Vancouver, Montréal, Calgary, Ottawa) swaps the scene, the
  coordinates and the city line; "Explore <city>" opens that city in the atlas. Toronto and
  Montréal use licensed photos; the others use an atlas view until you add a licensed photo
  (`photo` + `cred` on the `HC` entry in royal.js).
- No new libraries (no GSAP); everything is vanilla JS + CSS. Reduced motion skips the leaf.

## v3 (Oct 2026): "Maple-leaf journey"

- **Hero:** loader → a lit maple leaf (drawn in code, `assets/canada/js/leaf.js`) drifts through
  a blue-hour sky; where it lands, the blurred sky resolves into the real Toronto photograph
  with a light bloom. Landmark pins (CN Tower, Rogers Centre, Toronto Islands, downtown) sit on
  the photo; "Replay" re-runs the sequence. Reduced motion skips straight to the final frame.
- **No illustrations remain in use.** Seasons and the final section use the licensed photos,
  colour-graded in CSS, with live particles (falling leaves, snow, light). `scene-*.svg` are now
  unused and can be deleted.
- **Logo:** official artwork, colours untouched, with a thin ivory keyline (CSS drop-shadow) so it
  reads on dark backgrounds. A reversed/light official logo would be the ideal replacement.
- **New section:** Scholarships & financial support (`#scholarships`); FAQ now sits before
  Student experiences. Finance keeps the estimator and work rules.
- The hero photo is 1166×1143; a 2400px+ licensed Toronto skyline at blue hour would make the
  hero sharper — swap `students-campus.jpg` (and update credits).

## October 2026 (v2): "Royal Canada" redesign

`index.html` now uses `assets/canada/css/royal.css` + `assets/canada/js/royal.js`
(Playfair Display + Manrope, SIL OFL, self-hosted). The v1 files (`north.css`, `north.js`,
Fraunces/Inter fonts, `canada-map.svg`) are no longer referenced and can be deleted.
`index-classic.html` is the original generated page; `universities.html` is unchanged.

Sections: hero (3 destinations, cursor parallax) · manifesto · destinations atlas (map +
city dossiers, Ontario–Québec zoom) · university explorer (19 profiles on a map) + search
of all 1,135 DLIs · programme pathway builder · scroll-driven journey · finance (estimator,
scholarships, loans, work rules) · study-permit stepper · four seasons + student-life topics ·
stories (consent-only placeholders — add real ones in `STORIES` in royal.js) · FAQ · form.

- Hero/seasons/final scenes are original vector illustrations generated as SVG
  (`assets/canada/img/scene-*.svg`, hero layers inlined). No new photographs were added —
  the sandbox could not download images. Swap in licensed photos when available.
- `royal-map.svg`: Natural Earth outline + lakes © OpenStreetMap contributors (ODbL,
  credited in the footer). Marker positions come from the same projection; `CORRIDOR`
  in royal.js sets the Ontario–Québec zoom.
- University founding years and websites: from each university's official site.
  QS/PGWP/type/strengths come from `universities-data.js`.
- Facts checked on canada.ca, Oct 2026: C$23,448 proof of funds (from 1 Sep 2026),
  24 h/week off-campus work, PAL/TAL exemption for master's/PhD at public DLIs from
  1 Jan 2026, PGWP up to 3 years incl. master's ≥ 8 months, language proof required.
- Lead form contract unchanged (`/api/enquiry`); level/intake selects and anything picked
  on the page are appended to `destination`.

---

## October 2026: new "Your Next Chapter Is North" home page

`index.html` is now a standalone, hand-written page with its own visual identity
(forest/midnight, maple red, ivory; Fraunces serif + Inter, both SIL OFL, self-hosted).
It does **not** use `main.css`/`main.js`; the previous generated page is kept untouched as
`index-classic.html`. `universities.html` is unchanged and still links back to
`index.html#contact`, `#services` and `#testimonials`, which all exist on the new page.

```
index.html                       new Canada home page
index-classic.html               previous generated page (kept for rollback)
assets/canada/css/north.css      all styles for index.html
assets/canada/js/north.js        map, explorer, path finder, cost planner, journey, life, FAQ, lead form
assets/canada/img/canada-map.svg Natural Earth 1:50m outline (public domain), Lambert conformal conic
assets/canada/fonts/*.woff2      Fraunces 400/400i/600, Inter 400/500/600
```

- **Map markers** are percentages produced by the same projection that drew the SVG
  (d3-geo `geoConicConformal().rotate([96,0]).parallels([49,77])`, fitted to 1000×760), so
  they are geographically accurate. Regenerate both together if you change the map.
- **Explorer and city panels** read `assets/js/universities-data.js` (IRCC DLI list). Counts are
  computed live, nothing is typed in. Subject filtering only applies to the 50 universities
  with curated `programs`; the UI says so. No fees, intakes or rankings are invented.
- **Cost planner**: tuition presets are the University of Waterloo's published Sept 2026
  international first-year estimates (uwaterloo.ca, updated 17 Apr 2026). Living costs are
  entered by the student and compared with IRCC's proof-of-funds minimum of **C$23,448**
  (1 person, outside Quebec, applications from 1 Sep 2026 — verified on canada.ca, Oct 2026).
  No average living-cost breakdown is shown because we could not source one reliably.
- **Immigration copy** re-checked on canada.ca in October 2026: 24 h/week off-campus work,
  PAL/TAL exemption for master's/doctoral at public DLIs from 1 Jan 2026, CAQ for Quebec.
- **Lead form** posts to `/api/enquiry` with the same fields as the other pages (`name`, `email`,
  `country_code`+`phone_number` → `phone`, `destination`, `from_name`, `botcheck`). The
  path finder and the explorer's "Enquire" buttons write their summary into `destination`.
  A university picked on `universities.html` (localStorage `selectedUniversity`) pre-fills it too.
- **Photos**: only the four licensed photos already in `assets/img/photos` are used. Vancouver,
  Calgary, Ottawa and Halifax use labelled vector illustrations; replace them with CC0/CC-BY
  photos when available (edit `LIFE` in `north.js`, and update CREDITS.md + footer credit).
- **Testimonials**: placeholders only, by design. Add approved stories in the `[data-stories]` block.
- CSP-safe: no inline scripts, no third-party hosts.

---

## Previous generated page (now index-classic.html)

A static rebuild of the USA landing page (https://pageus.netlify.app/#/) for the Canadian market.
Same layout, same Tailwind classes, same animations — Canadian content.

## Files

```
Start Local Server.command      double-click to preview locally (macOS)
serve.py                        the preview server it runs
index.html                      home page (10 sections)
universities.html               Canadian institution directory
assets/css/main.css             the reference site's compiled Tailwind output (verbatim, 2 URLs repointed)
assets/css/quicksand.css        webfont declarations
assets/fonts/*.woff2            Quicksand
assets/js/main.js               all interactivity (replaces the React app)
assets/js/services-data.js      the 9 service tabs: title, tagline, body copy, icon
assets/js/universities-data.js  1,135 Canadian designated learning institutions
assets/img/...                  logos, photos, lender logos
api/enquiry.py                  serverless function: emails enquiries to business@tuteeconnect.com
```

No build step and no dependencies — open `index.html` or drop the folder on any static host.

## How it was built

The reference is a React SPA. Its rendered DOM was captured, so the markup and every Tailwind
class is byte-identical to the original; only text nodes and a handful of `src`/`href`/`value`
attributes were changed. The stylesheet is the reference's own compiled CSS, which guarantees every
class in the HTML resolves to the same rule it did on the original site.

This page was localised from the UK page's section fragments, which carry that same DOM. The
generator (`_tooling/localise_ca.py`) replaces **whole text nodes** and then diffs the tag+class
skeleton of every fragment against its UK input, refusing to write if anything structural moved.

Verified on 2026-08-24:

- the live reference DOM is byte-identical to the captured copy (only the chat clock differs);
- `UK/index.html` and `UK/universities.html` still rebuild **byte-for-byte** after the build
  scripts were made multi-country, so nothing about the UK page changed;
- `CANADA/universities.html` has an **identical** tag + class + `data-*` hook skeleton to the UK
  page, and `CANADA/index.html` differs in exactly two intended places (below).

React's interactivity was reimplemented in `assets/js/main.js`. Elements are addressed by `data-*`
hooks so no class had to change:

| Behaviour | Notes |
|---|---|
| Scroll reveal | `IntersectionObserver`, threshold 0.1, adds `.active` then unobserves — same as the reference |
| Sticky header | condenses past 50px |
| Mobile nav drawer | slide-up sheet, body scroll lock, Esc to close |
| Services (desktop) | 9 tab cards drive the detail panel + progress dots |
| Services (mobile) | bottom sheet with prev/next, dots, swipe, Esc |
| Universities / testimonials carousels | mobile snap scroll, dots synced by observer (threshold 0.6, 50 ms debounce) |
| FAQ | single-open accordion, separate desktop and mobile presentations |
| Lead forms | POST to our own `/api/enquiry` serverless function, which emails business@tuteeconnect.com; email + phone validation, success/error states |
| AI counsellor panel | scripted replies, lead capture (name → phone → email), submits to `/api/enquiry` |
| Directory | live accent-folded search, load-more in 20s, multi-select, sticky selection bar, application modal |
| Marquee / float / ping / bounce | pure CSS, unchanged from the reference |

## Three deliberate divergences from the UK page

1. **Currency icons stay as dollars.** The UK build swaps the reference's lucide dollar glyphs for a
   pound glyph. Canada uses dollars, so that swap is off (`swap_currency: False`) and the
   reference's own `circle-dollar-sign` markup is preserved — verified semantically identical to
   the reference capture. Dollar amounts are written `C$` so they cannot be mistaken for USD.

2. **`pgwp` replaces the UK page's `offerRate`.** This is the significant one — see below.

3. **The directory search folds accents.** 273 of the 1,135 institutions carry French diacritics,
   and the UK page's plain substring match returned **zero** results for `montreal`, `cegep`,
   `universite` and `quebec` typed without accents. Both sides of the comparison are now
   diacritic-folded, so accented and unaccented queries agree (`montreal` and `Montréal` both
   return 92). This changes only the comparison — no markup, classes or animation. It is a fix to a
   broken function, in the same spirit as the UK page's dead-button fixes.

The UK page's other two divergences (CTAs wired to `#contact`, `cursor-pointer` on interactive
buttons) apply here too; `verify_site.py` fails on any button without a handler.

## Things to review before launch

1. **The directory is 1,135 real institutions from the official IRCC register — and unlike the UK
   page, no field in it is invented.**

   Every institution, city, province, public/private status and PGWP flag comes from Immigration,
   Refugees and Citizenship Canada's *Designated learning institutions list* — the register that
   determines where a study permit is actually valid. A snapshot lives in
   `_tooling/reference/ircc-dli-full-list.json`; rebuild with
   `python3 _tooling/build_dataset_ca.py`.

   Composition: Ontario 346 · Quebec 329 · British Columbia 200 · Alberta 114 · Nova Scotia 39 ·
   Manitoba 39 · Saskatchewan 25 · New Brunswick 21 · Newfoundland and Labrador 10 ·
   Prince Edward Island 9 · Yukon 2 · Northwest Territories 1. By type: 722 private, 274 colleges,
   67 public universities, 57 specialist, 15 U15.

   - **`pgwp` is real data.** It replaces the UK page's `offerRate`, which was a fabricated
     percentage on all 499 rows and which the UK README flags as a launch risk. It reports whether
     graduating from the institution can qualify a student for a Post-Graduation Work Permit:
     `Yes` (302), `No` (506), `Varies` (327, where IRCC records "Details", i.e. it depends on the
     specific programme or campuses differ). **Do not present `Yes` as a guarantee** — PGWP
     eligibility also depends on programme-level field-of-study and language requirements, not
     only on the institution. The card label reads "PGWP eligible:", not "PGWP guaranteed".
   - **`rank` is meaningful only for the first 50.** Those are the Canadian universities that
     appear in a published ranking: entries 1–17 are the QS World University Rankings 2026
     Canadian entries in QS order, entries 18–50 the remaining Maclean's 2026 universities by
     category (Medical Doctoral, then Comprehensive, then Primarily Undergraduate) and in-category
     position. Everything after that has `ranked: false`, carries no ranking meaning, is ordered by
     type tier then alphabetically, and renders as a dash. A line of copy on the directory page
     says so. Don't relabel that column as a single published ranking — no such combined ranking
     of Canadian institutions exists.
   - **`programs` is an indicative descriptor, not a course inventory.** It is curated for the 50
     ranked universities and derived from each institution's own name for the rest. Don't present
     it as authoritative.
   - **Nunavut has no entry** because IRCC lists no DLI there in this snapshot. That is the
     register's own state, not an omission.
   - The USA site this was cloned from claimed "5000 schools" by generating fake institutions
     ("Bristol State University", "Concord State University - Clinton"). Nothing here is padded.

2. **Photos.** All four are Canadian, from Wikimedia Commons under CC0 or CC-BY (CC-BY-SA was
   avoided) — see `assets/img/photos/CREDITS.md` for file pages, photographers, licences and the
   exact crops:
   - `students-campus.jpg` — Toronto skyline / CN Tower from the Islands (Raysonho, CC0) — hero
     (filename kept: it is a literal key in the compiled CSS and the preload tag)
   - `team-working.jpg` — Toronto Reference Library (Raysonho, CC0) — `#relocate`
   - `family.jpg` — Cabbagetown, Toronto (**Jay Woodworth, CC BY 2.0**) — `#relocate`
   - `canada-city.jpg` — downtown Montréal (Andrew Welch, CC0) — `#universities`

   Only `family.jpg` (Cabbagetown) carries a mandatory attribution; the other three are
   CC0. It **is already satisfied**: a credit line renders in the footer of
   both pages (desktop and mobile variants), marked `data-photo-credit`, generated from
   `PHOTO_CREDIT` in `_tooling/localise_ca.py`. If you swap any photo, update both `CREDITS.md`
   and that constant, then re-run `localise_ca.py` and the two builders.

   `team-working.jpg` is rendered `w-full h-auto object-cover`, so **its aspect ratio drives the
   layout** — any replacement must also be 3:2. The other three are cropped by CSS and are
   flexible.

   The hero is **1166×1143 (near-square), not 1400×779 like the UK page's**. The hero panel is
   about 1.02:1 on desktop and 1.09:1 on mobile, and the div is `bg-cover bg-center`, so a
   letterbox file loses ~43% of its width to cropping and only its central strip is ever seen.
   `CREDITS.md` explains this in full. It is safe to reshape because the file is referenced only
   as a CSS background plus a preload link — there is no `<img>` for it.

   No photo has an identifiable person as its subject. If you want students in the hero, buy a
   stock licence and drop in a 1400×779 file. `CREDITS.md` records the two earlier campus heroes
   in case you want to go back to one — the Convocation Hall shot is public domain.

3. **Immigration facts** reflect the rules as at 2026-08-24 and IRCC changed several of them during
   2024–2026. Re-check against canada.ca before publishing:
   - off-campus work **24 hours a week** during academic sessions, full time during scheduled
     breaks (permanent since November 2024); on-campus work is exempt from the cap;
   - proof of funds **C$22,895** living costs for a single applicant outside Quebec, on top of
     first-year tuition, for applications from 1 September 2025 (Quebec C$24,617);
   - a GIC is no longer mandatory, and the Student Direct Stream was discontinued in November 2024;
   - PAL/TAL needed for most college and undergraduate applications, with master's and doctoral
     students at public DLIs exempt from **1 January 2026**;
   - PGWP **up to 3 years**, with CLB/NCLC 7 for degree graduates and CLB/NCLC 5 for non-university
     programmes, plus a field-of-study requirement for non-degree programmes;
   - spousal open work permits narrowed in January 2025 to master's, doctoral and selected
     professional programmes;
   - PR via Express Entry (Canadian Experience Class) or a Provincial Nominee Program.

4. **Lender logos** are the Indian banks from the USA site (ICICI, HDFC Credila, Avanse, Prodigy,
   MPOWER, …). Correct for the same audience, but confirm each partner covers Canadian study loans.

5. **`animate-fade-in`** appears in the markup but has no keyframes — that is true of the reference
   site too, so the class is inert on both. Add a rule if you want the fade.

6. **Enquiry email.** The form posts to our own serverless function at `/api/enquiry`, which
   sends the enquiry to **business@tuteeconnect.com**. The recipient is a hard-coded constant in
   `api/enquiry.py` and the SMTP credentials are server-side environment variables, so nothing
   secret is in the page. **This needs a host that runs functions (Vercel)** — on a purely static
   host `/api/enquiry` 404s and the form shows its error message. Setup, env vars and local testing:
   see `_tooling/ENQUIRY_SETUP.md`.

## Running it locally

### Easiest: double-click `Start Local Server.command`

It opens a Terminal window, starts the server in this folder and launches your browser. Leave the
window open while you browse; close it (or press Ctrl+C) to stop. Nothing to install.

macOS may warn the first time because the file came from another machine — right-click it and
choose **Open**, then **Open** again. After that, double-clicking works.

### Or from a terminal

```bash
python3 serve.py
```

Then open <http://localhost:8000/>. Both routes use the same script, which serves from the folder
`serve.py` lives in, binds dual-stack so `localhost`/`127.0.0.1`/`[::1]` all work, moves to the
next free port if 8000 is taken, sends no-cache headers, and opens your browser. Pass a port to
override: `python3 serve.py 3000`.

### Or open the file directly, with no server

Double-click `index.html`. Every path is relative so this works fine. The one difference: the
`/api/enquiry` does not exist without a server, so form submissions fail — so test **real
form submissions over the server**.

### Rebuilding

```bash
cd "/Users/tuteeconnect/Landing Page/_tooling"
python3 build_dataset_ca.py     # regenerate universities-data.js from the IRCC snapshot
python3 localise_ca.py          # regenerate fragments-canada/ from fragments-uk/
python3 assemble.py canada      # rebuild CANADA/index.html
python3 build_unipage.py canada # rebuild CANADA/universities.html
python3 verify_site.py canada   # check the result
```

**Never hand-edit `index.html` or `universities.html`** — the next build overwrites them. Edit
`_tooling/fragments-canada/*.html`, or better, the `localise_ca.py` replacement that produces them.

### Deploying

There's no build step. Upload the folder as-is to Netlify, Vercel, Cloudflare Pages, S3 or any
static host — `index.html` at the root. `serve.py`, `Start Local Server.command` and `README.md`
are development-only and can be left out of the upload.
