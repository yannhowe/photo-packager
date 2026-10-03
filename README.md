# Photo Packager

A small site for turning a photo set into prints, matching backs, and a fitted no-glue sleeve.

Use the **studio** free in the browser. Files never leave the device. If you would rather have the set printed and posted, the fee is **$88**, with an optional tip. The free studio can also show a **tip** jar when a Stripe link is configured.

## Current features

- Landing page with a Three.js demonstration of stacking, scoring and folding
- Instax Mini, Instax Wide, 4R, landscape 4R, square, and custom formats
- Automatic portrait and landscape photo orientation
- EXIF metadata extraction for date, camera, lens, exposure, focal length, filename, dimensions, and optional GPS coordinates
- Styled metadata backs aligned for duplex printing
- Epson L6170 and AirPrint duplex compensation
- Exact-size A4 PDF generation without uploading photos to a server
- Cross-wrap, no-glue package dieline with a single wide locking tab
- Order slip for print-and-ship, plus Stripe Payment Link hooks for $88, tips, and a free-studio tip jar

## Run without Docker

Serve this directory with any static HTTP server. For example:

```bash
python3 -m http.server 8092
```

Then open [http://127.0.0.1:8092](http://127.0.0.1:8092).

The Three.js scene loads `three` from a CDN, so the landing page needs network access.

## Run with Docker

```bash
docker compose up -d --build
```

Open [http://127.0.0.1:8092](http://127.0.0.1:8092).

## Taking payment

There is no backend. Card charges use Stripe Payment Links pasted into `site-config.js`.

1. Set `email` to the inbox that should receive mailed order slips.
2. In Stripe Dashboard → Payment Links, create **four fixed-amount** links:
   - **$88** — print and post, no tip
   - **$96** — print and post + $8 tip
   - **$106** — print and post + $18 tip
   - **$116** — print and post + $28 tip
3. Create a fifth link with **customer chooses amount** for the free-studio tip jar.
4. Paste those URLs into `stripe.tips` (`88`, `96`, `106`, `116`), `stripe.print` (same as `88` is fine), and `stripe.tipJar`.
5. Use the same currency as the amounts shown on the site.
6. On the print links, set the success message to: keep the order number; wait for an email asking for a private iCloud, Dropbox, or WeTransfer link. Do not upload photos on Stripe.

Until the URLs are set, Pay now and Leave a tip stay hidden. The print-and-ship page still issues a copyable order slip.

## Printing notes

- Download the exact PDF instead of using browser print when possible.
- Print at **Actual size / 100%** with any fit-to-page option disabled.
- Use the included size-test PDF before printing production pages.
- Epson L6170 and iPhone AirPrint users can select the compensated duplex mode when the back sheet turns over the opposite edge.

## Project structure

- `index.html` — landing page
- `studio.html` — generator
- `commission.html` — $88 print-and-ship order
- `hero-scene.js` — Three.js folding demonstration
- `app.js` — photo processing, layout, PDF generation, and package geometry
- `site.css` / `styles.css` — site and studio styles
- `site-config.js` — operator email and Stripe Payment Links
- `site-tip.js` — shows the tip jar when `stripe.tipJar` is set
- `one-pager.html` — product overview sheet

## Privacy

The studio processes photos and metadata on the user's device. Print-and-ship jobs are paid first; photographs are then sent by a private link, used only for printing, and should be deleted after dispatch.
