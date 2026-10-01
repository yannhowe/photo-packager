# Photo Packager

Photo Packager is a browser-based tool for turning photo collections into printable photographs, styled metadata backs, and fitted no-glue archive packages.

## Current features

- Instax Mini, Instax Wide, 4R, landscape 4R, 6x4, square, and custom formats
- Automatic portrait and landscape photo orientation
- EXIF metadata extraction for date, camera, lens, exposure, focal length, filename, dimensions, and optional GPS coordinates
- Styled metadata backs aligned for duplex printing
- Epson L6170 and AirPrint duplex compensation
- Exact-size A4 PDF generation without uploading photos to a server
- Configurable paper, margins, crop behavior, offsets, and print guides
- Cross-wrap, no-glue package dieline with a single wide locking tab
- Package artwork, cutting guide, folding instructions, and downloadable SVG
- Mobile-friendly workflow that preserves selected photos when PDFs open

Photos and metadata are processed locally in the browser.

## Run with Docker

```bash
docker compose up -d --build
```

Open [http://127.0.0.1:8092](http://127.0.0.1:8092).

## Run without Docker

Serve this directory with any static HTTP server. For example:

```bash
python3 -m http.server 8092
```

Then open [http://127.0.0.1:8092](http://127.0.0.1:8092).

## Printing notes

- Download the exact PDF instead of using browser print when possible.
- Print at **Actual size / 100%** with any fit-to-page option disabled.
- Use the included size-test PDF before printing production pages.
- Epson L6170 and iPhone AirPrint users can select the compensated duplex mode when the back sheet turns over the opposite edge.

## Project structure

- `index.html` - application interface
- `app.js` - photo processing, layout, PDF generation, and package geometry
- `styles.css` - application and print styles
- `one-pager.html` - product overview page
- `build_one_pager.py` - one-pager PDF builder
- `Dockerfile`, `compose.yml`, `nginx.conf` - local deployment
- `assets/renders/` - package renderings used by the overview

## Privacy

The current application performs photo and metadata processing on the user's device. Any future hosted ordering or professional fulfilment workflow should add explicit consent, encrypted storage, restricted production access, and automatic deletion policies before accepting customer photos.
