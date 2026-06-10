"""
Weber Sprint social producer — turns real "after" job photos into branded assets:
  1. Upright (EXIF-corrected) exports of each photo
  2. Branded portrait still cards (1080x1350) in two styles
  3. A vertical 9:16 reel (1080x1920) — crossfade slideshow with a persistent
     brand bar + intro/outro cards — piped straight to ffmpeg (no temp frames).

Run from repo root: python3 marketing/weber_reel.py
"""
import math
import subprocess
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
UPLOADS = Path.home() / ".claude/uploads/a105edae-47e8-46f1-8a16-d804b572f7fb"
FONT = str(ROOT / "marketing/fonts/Oswald.ttf")
OUT = ROOT / "marketing/campaign-assets/weber"
OUT.mkdir(parents=True, exist_ok=True)

NAVY = (26, 48, 85)
BURGUNDY = (139, 31, 47)
BONE = (245, 242, 235)
AMBER = (252, 211, 77)
RED = (200, 16, 46)
WHITE = (255, 255, 255)

# The 5 afters Jeff sent, with a short model note for captions/footers
PHOTOS = [
    ("4623998b-IMG_0715.jpeg", "Weber Genesis · 4-burner"),
    ("303ee738-IMG_0978.jpeg", "Weber Genesis · 3-burner"),
    ("b47a3a1a-IMG_1013.jpeg", "Weber Genesis · 4-burner"),
    ("c9808706-IMG_0836.jpeg", "Weber · 6-burner"),
    ("17a57f89-IMG_0852.jpeg", "Weber · grates detail"),
]

def font(sz):
    return ImageFont.truetype(FONT, sz)

def load_upright(name):
    img = Image.open(UPLOADS / name).convert("RGB")
    return ImageOps.exif_transpose(img)

def cover(img, w, h):
    """Scale + center-crop to fill w×h."""
    iw, ih = img.size
    s = max(w / iw, h / ih)
    img = img.resize((round(iw * s), round(ih * s)), Image.LANCZOS)
    iw, ih = img.size
    return img.crop(((iw - w) // 2, (ih - h) // 2, (iw - w) // 2 + w, (ih - h) // 2 + h))

def fit_text(draw, text, max_w, start, min_sz=24):
    sz = start
    while sz > min_sz:
        f = font(sz)
        if draw.textlength(text, font=f) <= max_w:
            return f
        sz -= 2
    return font(min_sz)

def centered(draw, cx, y, text, f, fill):
    w = draw.textlength(text, font=f)
    draw.text((cx - w / 2, y), text, font=f, fill=fill)

def draw_stars(d, x, y, s, color, n=5, gap=9):
    r, ir = s / 2, s / 2 * 0.42
    for i in range(n):
        cx, cy = x + r + i * (s + gap), y + r
        pts = []
        for k in range(10):
            ang = -math.pi / 2 + k * math.pi / 5
            rad = r if k % 2 == 0 else ir
            pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
        d.polygon(pts, fill=color)

# ---------- Still card: framed style (navy header + footer, photo inset) ----------
def card_framed(photo, model, idx):
    W, H = 1080, 1350
    HEAD, FOOT = 150, 132
    c = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(c)
    # photo fills the middle
    ph = cover(photo, W, H - HEAD - FOOT)
    c.paste(ph, (0, HEAD))
    # header
    centered(d, W / 2, 40, "TRI-STATE GRILL CLEANING", fit_text(d, "TRI-STATE GRILL CLEANING", W - 80, 64), WHITE)
    centered(d, W / 2, 104, "VETERAN-FOUNDED  ·  CINCINNATI · NKY · DAYTON", font(26), AMBER)
    # weber-sprint pill (top-left over photo)
    pill = "WEBER SPRINT"
    pw = d.textlength(pill, font=font(34)) + 44
    d.rounded_rectangle([36, HEAD + 30, 36 + pw, HEAD + 30 + 58], 29, fill=RED)
    d.text((36 + 22, HEAD + 30 + 12), pill, font=font(34), fill=WHITE)
    # footer
    fy = H - FOOT
    d.rectangle([0, fy, W, H], fill=NAVY)
    d.text((40, fy + 30), model.upper(), font=font(40), fill=WHITE)
    draw_stars(d, 42, fy + 84, 28, AMBER)
    url = "TRISTATEGRILLCLEANING.COM/WEBER"
    d.text((W - 40 - d.textlength(url, font=font(30)), fy + 50), url, font=font(30), fill=BONE)
    p = OUT / f"weber-after-{idx}-framed.png"
    c.save(p)
    return p

# ---------- Still card: cinematic style (full-bleed photo + gradient + headline) ----------
def card_cinematic(photo, model, idx, headline):
    W, H = 1080, 1350
    c = cover(photo, W, H).copy()
    # bottom gradient for legibility
    grad = Image.new("L", (1, H), 0)
    for y in range(H):
        t = max(0, (y - H * 0.5) / (H * 0.5))
        grad.putpixel((0, y), int(225 * (t ** 1.4)))
    grad = grad.resize((W, H))
    shade = Image.new("RGB", (W, H), NAVY)
    c = Image.composite(shade, c, grad)
    d = ImageDraw.Draw(c)
    # weber-sprint pill top-left
    d.rounded_rectangle([40, 40, 40 + d.textlength("WEBER SPRINT", font=font(34)) + 44, 98], 29, fill=RED)
    d.text((62, 52), "WEBER SPRINT", font=font(34), fill=WHITE)
    # headline bottom
    f = fit_text(d, headline, W - 100, 86)
    d.text((50, H - 300), headline, font=f, fill=WHITE)
    d.text((50, H - 300 + f.size + 16), model.upper(), font=font(34), fill=AMBER)
    d.text((50, H - 96), "TRI-STATE GRILL CLEANING  ·  tristategrillcleaning.com/weber", font=font(28), fill=BONE)
    p = OUT / f"weber-after-{idx}-cinematic.png"
    c.save(p)
    return p

# ---------- Reel segment builders (1080x1920) ----------
RW, RH = 1080, 1920

def reel_photo(photo, model):
    img = cover(photo, RW, RH).copy()
    d = ImageDraw.Draw(img)
    # persistent bottom brand bar
    bar = Image.new("RGBA", (RW, 230), NAVY + (235,))
    img.paste(Image.new("RGB", (RW, 230), NAVY), (0, RH - 230), bar)
    d.text((44, RH - 196), "TRI-STATE GRILL CLEANING", font=font(46), fill=WHITE)
    d.text((44, RH - 140), model.upper(), font=font(34), fill=AMBER)
    d.text((44, RH - 92), "tristategrillcleaning.com/weber", font=font(30), fill=BONE)
    # sprint pill top-left
    d.rounded_rectangle([40, 60, 40 + d.textlength("WEBER SPRINT", font=font(38)) + 48, 124], 32, fill=RED)
    d.text((64, 73), "WEBER SPRINT", font=font(38), fill=WHITE)
    return np.asarray(img.convert("RGB"))

def reel_card(lines, sub=None, accent=AMBER):
    img = Image.new("RGB", (RW, RH), NAVY)
    d = ImageDraw.Draw(img)
    y = RH // 2 - 60 * len(lines)
    for ln, sz in lines:
        f = fit_text(d, ln, RW - 120, sz)
        centered(d, RW / 2, y, ln, f, WHITE if sz < 130 else accent)
        y += f.size + 16
    if sub:
        centered(d, RW / 2, y + 24, sub, font(40), BONE)
    centered(d, RW / 2, RH - 150, "TRISTATEGRILLCLEANING.COM/WEBER", font(36), AMBER)
    return np.asarray(img)

def build_reel(out_path):
    segs = [reel_card([("WEBER SPRINT", 150), ("12 OF 30 CLEANED", 96)], sub="Real Webers. Real results. This week.")]
    for name, model in PHOTOS:
        segs.append(reel_photo(load_upright(name), model))
    segs.append(reel_card([("BOOK YOUR", 96), ("WEBER", 200)], sub="15% off · 30% with a neighbor · ends June 17", accent=RED))
    FPS = 30
    HOLD = {0: 48, len(segs) - 1: 60}  # intro/outro hold longer
    XF = 14  # crossfade frames
    cmd = ["ffmpeg", "-y", "-f", "rawvideo", "-pixel_format", "rgb24",
           "-video_size", f"{RW}x{RH}", "-framerate", str(FPS), "-i", "-",
           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out_path)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for i, seg in enumerate(segs):
        hold = HOLD.get(i, 54)
        for _ in range(hold):
            proc.stdin.write(seg.tobytes())
        if i < len(segs) - 1:
            a, b = seg.astype(np.float32), segs[i + 1].astype(np.float32)
            for k in range(1, XF + 1):
                t = k / (XF + 1)
                proc.stdin.write(((a * (1 - t) + b * t).astype(np.uint8)).tobytes())
    proc.stdin.close()
    proc.wait()
    return out_path

# ---------- run ----------
uprights = []
for i, (name, model) in enumerate(PHOTOS, 1):
    up = load_upright(name)
    p = OUT / f"weber-after-{i}-upright.jpg"
    up.save(p, quality=92)
    uprights.append(p.name)

heads = ["ANOTHER WEBER, BACK TO LIFE.", "DEEP-CLEANED. DIALED IN.", "GREASE GONE. SUMMER ON."]
stills = []
stills.append(card_framed(load_upright(PHOTOS[0][0]), PHOTOS[0][1], 1).name)
stills.append(card_cinematic(load_upright(PHOTOS[1][0]), PHOTOS[1][1], 2, heads[0]).name)
stills.append(card_framed(load_upright(PHOTOS[2][0]), PHOTOS[2][1], 3).name)
stills.append(card_cinematic(load_upright(PHOTOS[3][0]), PHOTOS[3][1], 4, heads[1]).name)

reel = build_reel(OUT / "weber-sprint-reel.mp4")

print("UPRIGHTS:", ", ".join(uprights))
print("STILLS:", ", ".join(stills))
print("REEL:", reel.name, "size", reel.stat().st_size // 1024, "KB")
