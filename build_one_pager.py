from pathlib import Path

from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


OUT = Path(__file__).parent / "output" / "pdf" / "photo-case-studio-one-pager.pdf"
ASSETS = Path(__file__).parent / "assets" / "renders"
OUT.parent.mkdir(parents=True, exist_ok=True)

W, H = A4
MM = 72 / 25.4
CREAM = HexColor("#F5E9CC")
PAPER = HexColor("#FFFDF8")
RED = HexColor("#C65345")
RED_DARK = HexColor("#8F392F")
INK = HexColor("#272321")
MUTED = HexColor("#746D68")
LINE = HexColor("#D9CFC2")
SAGE = HexColor("#50746A")


def rounded(c, x, y, w, h, radius=4, fill=PAPER, stroke=LINE, sw=0.7):
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(sw)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)


def text(c, value, x, y, size, color=INK, font="Helvetica", max_width=None):
    c.setFillColor(color)
    c.setFont(font, size)
    if max_width and c.stringWidth(value, font, size) > max_width:
        while value and c.stringWidth(value + "...", font, size) > max_width:
            value = value[:-1]
        value += "..."
    c.drawString(x, y, value)


def label(c, value, x, y, color=RED):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(x, y, value.upper())


def photo_card(c, x, y, w, h, angle=0, tint=HexColor("#B8C7BE")):
    c.saveState()
    c.translate(x + w / 2, y + h / 2)
    c.rotate(angle)
    c.translate(-w / 2, -h / 2)
    c.setFillColor(PAPER)
    c.setStrokeColor(INK)
    c.setLineWidth(0.8)
    c.roundRect(0, 0, w, h, 3, fill=1, stroke=1)
    c.setFillColor(tint)
    c.rect(4, 13, w - 8, h - 17, fill=1, stroke=0)
    c.setFillColor(Color(1, 1, 1, alpha=0.6))
    c.circle(w * .67, h * .65, h * .1, fill=1, stroke=0)
    c.setStrokeColor(Color(1, 1, 1, alpha=.85))
    c.setLineWidth(2)
    c.line(8, 19, w * .42, h * .46)
    c.line(w * .42, h * .46, w * .62, h * .29)
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 4.5)
    c.drawString(5, 5, "PHOTO 07")
    c.restoreState()


def sheet_icon(c, x, y, w, h):
    c.setFillColor(PAPER)
    c.setStrokeColor(INK)
    c.setLineWidth(0.8)
    c.roundRect(x, y, w, h, 3, fill=1, stroke=1)
    margin, gap = 5, 3
    pw, ph = (w - margin * 2 - gap) / 2, (h - margin * 2 - gap) / 2
    colors = [HexColor("#D8A47F"), HexColor("#88A79A"), HexColor("#AAB0C8"), HexColor("#D3B0A7")]
    for row in range(2):
        for col in range(2):
            px = x + margin + col * (pw + gap)
            py = y + margin + (1-row) * (ph + gap)
            c.setFillColor(colors[row * 2 + col])
            c.rect(px, py, pw, ph, fill=1, stroke=0)
            c.setStrokeColor(RED)
            c.setLineWidth(.35)
            c.line(px-2, py, px-0.5, py)
            c.line(px+pw+.5, py, px+pw+2, py)


def case_icon(c, x, y, scale=1):
    pw, ph, spine, wrap = 62*scale, 45*scale, 5*scale, 13*scale
    top = 11*scale
    c.setFillColor(CREAM)
    c.setStrokeColor(INK)
    c.setLineWidth(.8)
    path = c.beginPath()
    path.moveTo(x, y)
    path.lineTo(x, y + ph)
    path.lineTo(x + 5*scale, y + ph + top)
    path.lineTo(x + pw - 5*scale, y + ph + top)
    path.lineTo(x + pw, y + ph)
    path.lineTo(x + pw + spine + pw + wrap - 3*scale, y + ph)
    path.lineTo(x + pw + spine + pw + wrap, y + ph - 3*scale)
    path.lineTo(x + pw + spine + pw + wrap, y + 3*scale)
    path.lineTo(x + pw + spine + pw + wrap - 3*scale, y)
    path.lineTo(x + pw, y)
    path.lineTo(x + pw - 5*scale, y - top)
    path.lineTo(x + 5*scale, y - top)
    path.close()
    c.drawPath(path, fill=1, stroke=1)
    c.setStrokeColor(RED)
    c.setLineWidth(.55)
    c.setDash(3, 2)
    c.line(x + pw, y, x + pw, y + ph)
    c.line(x + pw + spine, y, x + pw + spine, y + ph)
    c.line(x + pw + spine + pw, y, x + pw + spine + pw, y + ph)
    c.line(x + pw + spine + pw + 4*scale, y, x + pw + spine + pw + 4*scale, y + ph)
    c.line(x + 5*scale, y, x + pw - 5*scale, y)
    c.line(x + 5*scale, y + ph, x + pw - 5*scale, y + ph)
    c.setDash()
    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 6*scale)
    c.drawString(x + pw + spine + 7*scale, y + ph - 12*scale, "PHOTO")
    c.drawString(x + pw + spine + 7*scale, y + ph - 20*scale, "CASE")


def arrow(c, x1, y1, x2, y2):
    c.setStrokeColor(RED)
    c.setFillColor(RED)
    c.setLineWidth(1.4)
    c.line(x1, y1, x2, y2)
    c.line(x2, y2, x2 - 5, y2 + 3)
    c.line(x2, y2, x2 - 5, y2 - 3)


def feature(c, x, y, number, title, body, accent=RED):
    c.setFillColor(accent)
    c.circle(x + 10, y + 29, 9, fill=1, stroke=0)
    c.setFillColor(PAPER)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(x + 10, y + 26.5, str(number))
    text(c, title, x + 26, y + 32, 9, INK, "Helvetica-Bold")
    text(c, body, x + 26, y + 19, 6.8, MUTED, "Helvetica", 170)
    c.setStrokeColor(LINE)
    c.setLineWidth(.5)
    c.line(x + 26, y + 10, x + 180, y + 10)


c = canvas.Canvas(str(OUT), pagesize=A4)
c.setTitle("Photo Case Studio - One Page Overview")
c.setAuthor("Photo Case Studio")
c.setFillColor(PAPER)
c.rect(0, 0, W, H, fill=1, stroke=0)

# Header
label(c, "PRINT + PACKAGE", 24*MM, H - 22*MM)
text(c, "PHOTO CASE", 24*MM, H - 36*MM, 27, INK, "Helvetica-Bold")
text(c, "STUDIO", 24*MM, H - 47*MM, 27, RED, "Helvetica-Bold")
text(c, "Turn a camera roll into a tactile,", 24*MM, H - 58*MM, 10.5, MUTED)
text(c, "printable photo archive.", 24*MM, H - 64*MM, 10.5, MUTED)

# Hero workflow illustration
hero_x, hero_y = 103*MM, H - 73*MM
rounded(c, hero_x, hero_y, 83*MM, 53*MM, 8, CREAM, CREAM)
c.drawImage(ImageReader(str(ASSETS / "photo-case-closed.png")), hero_x + 2*MM, hero_y + 2*MM, 79*MM, 49*MM, preserveAspectRatio=True, anchor="c", mask="auto")

# Workflow band
band_y = H - 111*MM
text(c, "ONE PRIVATE WORKFLOW", 24*MM, band_y + 12*MM, 13, INK, "Helvetica-Bold")
text(c, "Your images and metadata stay in the browser.", 24*MM, band_y + 6*MM, 7.5, MUTED)
steps = [("01", "SELECT", "Choose a full set"), ("02", "LAY OUT", "A4, 4R or 6R"), ("03", "PRINT", "Fronts + aligned backs"), ("04", "FOLD", "A fitted no-glue case")]
sx = 24*MM
for i, (num, title, desc) in enumerate(steps):
    x = sx + i * 43*MM
    text(c, num, x, band_y - 5*MM, 7, RED, "Helvetica-Bold")
    text(c, title, x, band_y - 12*MM, 10, INK, "Helvetica-Bold")
    text(c, desc, x, band_y - 18*MM, 6.7, MUTED)
    if i < 3:
        c.setStrokeColor(LINE); c.setLineWidth(.7); c.line(x + 34*MM, band_y - 10*MM, x + 39*MM, band_y - 10*MM)

# Center hero: case and metadata
mid_y = H - 190*MM
rounded(c, 24*MM, mid_y, 162*MM, 58*MM, 8, HexColor("#F8F2E5"), LINE)
c.drawImage(ImageReader(str(ASSETS / "photo-case-exploded.png")), 28*MM, mid_y + 5*MM, 78*MM, 48*MM, preserveAspectRatio=True, anchor="c", mask="auto")
text(c, "A case that fits the stack", 116*MM, mid_y + 43*MM, 14, INK, "Helvetica-Bold")
text(c, "Photo count, media thickness and", 116*MM, mid_y + 34*MM, 7.4, MUTED)
text(c, "paper stock determine the spine,", 116*MM, mid_y + 29*MM, 7.4, MUTED)
text(c, "gussets, bevels and locking tabs.", 116*MM, mid_y + 24*MM, 7.4, MUTED)
label(c, "FULL-EDGE WRAP / NO GLUE", 116*MM, mid_y + 12*MM, SAGE)

# Features
features_y = 43*MM
text(c, "BUILT FOR REAL PRINTING", 24*MM, features_y + 54*MM, 13, INK, "Helvetica-Bold")
feature(c, 24*MM, features_y + 12*MM, 1, "Flexible formats", "Instax Wide, 4R, square or custom.")
feature(c, 105*MM, features_y + 12*MM, 2, "Straight-cut sheets", "Clean grids and crop marks for a guillotine.", SAGE)
feature(c, 24*MM, features_y - 20*MM, 3, "Styled metadata", "Date, camera, lens and exposure settings.", SAGE)
feature(c, 105*MM, features_y - 20*MM, 4, "Optional GPS", "Coordinates stay local unless you print them.")

# Footer
c.setFillColor(INK)
c.rect(0, 0, W, 24*MM, fill=1, stroke=0)
text(c, "DESIGN. PREVIEW. PRINT. FOLD.", 24*MM, 14*MM, 10, PAPER, "Helvetica-Bold")
text(c, "yannhowe.github.io/photo-packager/", 24*MM, 8*MM, 6.5, HexColor("#D6CEC5"))
qr_code = qr.QrCodeWidget("https://yannhowe.github.io/photo-packager/")
bounds = qr_code.getBounds()
size = 16*MM
drawing = Drawing(size, size, transform=[size/(bounds[2]-bounds[0]),0,0,size/(bounds[3]-bounds[1]),0,0])
drawing.add(qr_code)
drawing.drawOn(c, W - 24*MM - size, 4*MM)

c.showPage()
c.save()
print(OUT)
