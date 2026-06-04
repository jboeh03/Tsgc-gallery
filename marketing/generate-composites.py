"""
Branded before/after composite generator for Tri-State Grill Cleaning.

Master template = the 1080x1080 square social card (matches the Blaze/Mariemont
reference): navy header bar with wordmark + service-area chip, cover-fit
before/after photos with BEFORE (white) / AFTER (burgundy) pills, and a navy
footer bar carrying location/model on the left and 5 stars + phone + URL on the
right. Display type is Oswald (brand font, fetched to marketing/fonts/).

Footer supports two modes:
  - "meta"    → location · date  +  grill model            (proof-led, default)
  - "message" → a headline + subline you pass in            (pitch-led)

Run from repo root:  python3 marketing/generate-composites.py
"""

import json
import math
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
JOBS_FILE = ROOT / "data" / "jobs.json"
PUBLIC_DIR = ROOT / "public"
FONT_DIR = ROOT / "marketing" / "fonts"
OUT_DIR = ROOT / "marketing" / "composites"

SITE_URL = "TRISTATEGRILLCLEANING.COM"
SITE_PHONE = "(657) 831-4276"

NAVY = (26, 48, 85)
NAVY_DK = (16, 33, 64)
BURGUNDY = (139, 31, 47)
BONE = (247, 243, 238)
WHITE = (255, 255, 255)
FADED = (175, 188, 209)

# --- fonts (Oswald variable; Arial fallback) ---
_OSWALD = FONT_DIR / "Oswald.ttf"
_ARIAL = "/System/Library/Fonts/Supplemental/Arial.ttf"


def oswald(size, weight=600):
    try:
        f = ImageFont.truetype(str(_OSWALD), size)
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
        return f
    except OSError:
        try:
            return ImageFont.truetype(_ARIAL, size)
        except OSError:
            return ImageFont.load_default()


def tw(f, s):
    b = f.getbbox(s)
    return b[2] - b[0]


def tracked(draw, xy, text, font, fill, tracking=0, anchor_right=None):
    """Draw letter-spaced text. If anchor_right set, right-align to that x."""
    widths = [tw(font, c) for c in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x = (anchor_right - total) if anchor_right is not None else xy[0]
    y = xy[1]
    for c, w in zip(text, widths):
        draw.text((x, y), c, font=font, fill=fill)
        x += w + tracking
    return total


def rounded_mask(size, radius):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    return m


def cover_into(src_path, cw, ch):
    """Fill a cw x ch cell, center-cropping (no letterbox)."""
    src = ImageOps.exif_transpose(Image.open(src_path)).convert("RGB")
    sw, sh = src.size
    scale = max(cw / sw, ch / sh)
    nw, nh = max(cw, int(sw * scale) + 1), max(ch, int(sh * scale) + 1)
    img = src.resize((nw, nh), Image.LANCZOS)
    x, y = (nw - cw) // 2, (nh - ch) // 2
    return img.crop((x, y, x + cw, y + ch))


def pill(canvas, x, y, text, bg, fg, font, pad_x=22, pad_y=12, radius=18):
    b = font.getbbox(text)
    w = (b[2] - b[0]) + 2 * pad_x
    h = (b[3] - b[1]) + 2 * pad_y
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle((x, y, x + w, y + h), radius=radius, fill=bg)
    d.text((x + pad_x - b[0], y + pad_y - b[1]), text, font=font, fill=fg)
    return w, h


def star(draw, cx, cy, r, fill):
    pts = []
    for i in range(10):
        rr = r if i % 2 == 0 else r * 0.46
        a = -math.pi / 2 + i * math.pi / 5
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    draw.polygon(pts, fill=fill)


# --- square master template ---
SQ = 1080
M = 24
INNER_W = SQ - 2 * M
HEADER_H = 104
FOOTER_H = 156
GAP = 16
PHOTO_TOP = M + HEADER_H + GAP
PHOTO_BOTTOM = SQ - M - FOOTER_H - GAP
PHOTO_H = PHOTO_BOTTOM - PHOTO_TOP
PHOTO_GAP = 8
HALF_W = (INNER_W - PHOTO_GAP) // 2


def build_square(job, pair, footer_mode="meta", message=None):
    canvas = Image.new("RGB", (SQ, SQ), BONE)
    d = ImageDraw.Draw(canvas)

    # Header bar
    d.rounded_rectangle((M, M, M + INNER_W, M + HEADER_H), radius=20, fill=NAVY)
    d.rectangle((M + 20, M + HEADER_H - 4, M + INNER_W - 20, M + HEADER_H), fill=BURGUNDY)
    d.text((M + 30, M + 16), "Tri-State Grill Cleaning", font=oswald(44, 600), fill=WHITE)
    tracked(d, (M + 32, M + 74), "VETERAN-FOUNDED   ·   LOCALLY OPERATED",
            oswald(16, 500), FADED, tracking=3)
    # Service-area chip (right)
    chip_f = oswald(21, 600)
    cw, _ = pill(canvas, 0, -999, "Cincinnati · NKY · Dayton", BURGUNDY, WHITE, chip_f)  # measure
    pill(canvas, M + INNER_W - 24 - cw, M + (HEADER_H - 46) // 2,
         "Cincinnati · NKY · Dayton", BURGUNDY, WHITE, chip_f)

    # Photos (cover-fit, rounded as one block)
    strip = Image.new("RGB", (INNER_W, PHOTO_H), BONE)
    strip.paste(cover_into(PUBLIC_DIR / pair["before"].lstrip("/"), HALF_W, PHOTO_H), (0, 0))
    strip.paste(cover_into(PUBLIC_DIR / pair["after"].lstrip("/"), HALF_W, PHOTO_H),
                (HALF_W + PHOTO_GAP, 0))
    canvas.paste(strip, (M, PHOTO_TOP), rounded_mask((INNER_W, PHOTO_H), 20))

    # BEFORE / AFTER pills
    pf = oswald(26, 600)
    pill(canvas, M + 20, PHOTO_TOP + 20, "BEFORE", WHITE, NAVY, pf)
    bw = tw(pf, "AFTER") + 44
    pill(canvas, M + INNER_W - 20 - bw, PHOTO_TOP + 20, "AFTER", BURGUNDY, WHITE, pf)

    # Footer bar
    fy = SQ - M - FOOTER_H
    d.rounded_rectangle((M, fy, M + INNER_W, fy + FOOTER_H), radius=20, fill=NAVY)
    d.rectangle((M + 20, fy, M + INNER_W - 20, fy + 4), fill=BURGUNDY)

    if footer_mode == "message" and message:
        head, sub = message
        tracked(d, (M + 30, fy + 28), head.upper(), oswald(20, 600), BURGUNDY, tracking=2)
        d.text((M + 30, fy + 56), sub[0], font=oswald(46, 600), fill=WHITE)
        d.text((M + 30, fy + 112), sub[1], font=oswald(24, 400), fill=FADED)
    else:
        dt = datetime.strptime(job["date"], "%Y-%m-%d")
        loc = f"{job['neighborhood'].upper()}  ·  {dt.strftime('%b %Y').upper()}"
        tracked(d, (M + 30, fy + 30), loc, oswald(24, 600), BURGUNDY, tracking=1)
        d.text((M + 30, fy + 66), job["grillModel"], font=oswald(42, 600), fill=WHITE)
        d.text((M + 30, fy + 116), f"Service time: {_hrs(job['serviceHours'])}",
               font=oswald(24, 400), fill=FADED)

    # Right block: stars + phone + url
    right = M + INNER_W - 30
    for i in range(5):
        star(d, right - 138 + i * 30, fy + 40, 11, BURGUNDY)
    d.text((right - tw(oswald(40, 600), SITE_PHONE), fy + 60), SITE_PHONE,
           font=oswald(40, 600), fill=WHITE)
    tracked(d, (0, fy + 116), SITE_URL, oswald(19, 500), FADED, tracking=2, anchor_right=right)

    return canvas


def _hrs(h):
    return f"{int(h)} hrs" if float(h).is_integer() else f"{h} hrs"


# --- landscape variant (2000x1050, no header — photo-forward, matches the DCS ref) ---
def build_landscape(job, pair, footer_mode="meta", message=None):
    W, H = 2000, 1050
    m, foot_h, gap, pgap = 24, 184, 16, 8
    inner = W - 2 * m
    ptop = m
    ph = (H - m - foot_h - gap) - ptop
    half = (inner - pgap) // 2

    canvas = Image.new("RGB", (W, H), BONE)
    d = ImageDraw.Draw(canvas)

    strip = Image.new("RGB", (inner, ph), BONE)
    strip.paste(cover_into(PUBLIC_DIR / pair["before"].lstrip("/"), half, ph), (0, 0))
    strip.paste(cover_into(PUBLIC_DIR / pair["after"].lstrip("/"), half, ph), (half + pgap, 0))
    canvas.paste(strip, (m, ptop), rounded_mask((inner, ph), 20))

    pf = oswald(30, 600)
    pill(canvas, m + 24, ptop + 24, "BEFORE", WHITE, NAVY, pf)
    bw = tw(pf, "AFTER") + 48
    pill(canvas, m + inner - 24 - bw, ptop + 24, "AFTER", BURGUNDY, WHITE, pf)

    fy = H - m - foot_h
    d.rounded_rectangle((m, fy, m + inner, fy + foot_h), radius=20, fill=NAVY)
    d.rectangle((m + 20, fy, m + inner - 20, fy + 4), fill=BURGUNDY)

    if footer_mode == "message" and message:
        kicker, (head, sub) = message
        tracked(d, (m + 44, fy + 34), kicker.upper(), oswald(24, 600), BURGUNDY, tracking=2)
        d.text((m + 44, fy + 70), head, font=oswald(62, 600), fill=WHITE)
        d.text((m + 44, fy + 150), sub, font=oswald(30, 400), fill=FADED)
    else:
        dt = datetime.strptime(job["date"], "%Y-%m-%d")
        loc = f"{job['neighborhood'].upper()}  ·  {dt.strftime('%b %Y').upper()}"
        tracked(d, (m + 44, fy + 38), loc, oswald(30, 600), BURGUNDY, tracking=1)
        d.text((m + 44, fy + 80), job["grillModel"], font=oswald(54, 600), fill=WHITE)
        d.text((m + 44, fy + 148), f"Service time: {_hrs(job['serviceHours'])}",
               font=oswald(28, 400), fill=FADED)

    right = m + inner - 44
    for i in range(5):
        star(d, right - 196 + i * 42, fy + 52, 14, BURGUNDY)
    d.text((right - tw(oswald(52, 600), SITE_PHONE), fy + 76), SITE_PHONE,
           font=oswald(52, 600), fill=WHITE)
    tracked(d, (0, fy + 150), SITE_URL, oswald(24, 500), FADED, tracking=2, anchor_right=right)
    return canvas


def _footer(canvas, m, inner, fy, footer_h, job, footer_mode="meta", message=None):
    """Shared navy footer band: meta (location/model/service) or message, plus
    stars + phone + URL on the right."""
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle((m, fy, m + inner, fy + footer_h), radius=20, fill=NAVY)
    d.rectangle((m + 20, fy, m + inner - 20, fy + 4), fill=BURGUNDY)
    if footer_mode == "message" and message:
        kicker, (h1, h2) = message
        tracked(d, (m + 30, fy + 28), kicker.upper(), oswald(20, 600), BURGUNDY, tracking=2)
        d.text((m + 30, fy + 56), h1, font=oswald(46, 600), fill=WHITE)
        d.text((m + 30, fy + 112), h2, font=oswald(24, 400), fill=FADED)
    else:
        dt = datetime.strptime(job["date"], "%Y-%m-%d")
        loc = f"{job['neighborhood'].upper()}  ·  {dt.strftime('%b %Y').upper()}"
        tracked(d, (m + 30, fy + 30), loc, oswald(24, 600), BURGUNDY, tracking=1)
        d.text((m + 30, fy + 66), job["grillModel"], font=oswald(42, 600), fill=WHITE)
        d.text((m + 30, fy + 116), f"Service time: {_hrs(job['serviceHours'])}",
               font=oswald(24, 400), fill=FADED)
    right = m + inner - 30
    for i in range(5):
        star(d, right - 138 + i * 30, fy + 40, 11, BURGUNDY)
    d.text((right - tw(oswald(40, 600), SITE_PHONE), fy + 60), SITE_PHONE,
           font=oswald(40, 600), fill=WHITE)
    tracked(d, (0, fy + 116), SITE_URL, oswald(19, 500), FADED, tracking=2, anchor_right=right)


def build_single(job, photo_path, tag="AFTER", footer_mode="meta", message=None):
    """Single-photo branded card (1080x1350, IG/FB portrait) — for after-only or
    repair-spotlight jobs that have no before/after pair. `tag` is the corner pill
    (e.g. 'AFTER', 'DEEP CLEAN + REPAIR'); pass tag=None to omit it."""
    W, H = 1080, 1350
    m, header_h, footer_h, gap = 24, 104, 156, 16
    inner = W - 2 * m
    ptop = m + header_h + gap
    ph = (H - m - footer_h - gap) - ptop

    canvas = Image.new("RGB", (W, H), BONE)
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle((m, m, m + inner, m + header_h), radius=20, fill=NAVY)
    d.rectangle((m + 20, m + header_h - 4, m + inner - 20, m + header_h), fill=BURGUNDY)
    d.text((m + 30, m + 16), "Tri-State Grill Cleaning", font=oswald(44, 600), fill=WHITE)
    tracked(d, (m + 32, m + 74), "VETERAN-FOUNDED   ·   LOCALLY OPERATED",
            oswald(16, 500), FADED, tracking=3)
    chip_f = oswald(21, 600)
    cw, _ = pill(canvas, 0, -999, "Cincinnati · NKY · Dayton", BURGUNDY, WHITE, chip_f)
    pill(canvas, m + inner - 24 - cw, m + (header_h - 46) // 2,
         "Cincinnati · NKY · Dayton", BURGUNDY, WHITE, chip_f)

    canvas.paste(cover_into(photo_path, inner, ph), (m, ptop), rounded_mask((inner, ph), 20))
    if tag:
        pill(canvas, m + 20, ptop + 20, tag, BURGUNDY, WHITE, oswald(26, 600))

    _footer(canvas, m, inner, H - m - footer_h, footer_h, job, footer_mode, message)
    return canvas


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(JOBS_FILE) as f:
        jobs = json.load(f)["jobs"]
    for job in jobs:
        pair = job["pairs"][0]
        build_square(job, pair).save(OUT_DIR / f"{job['id']}-square.jpg", "JPEG", quality=90, optimize=True)
        build_landscape(job, pair).save(OUT_DIR / f"{job['id']}-landscape.jpg", "JPEG", quality=90, optimize=True)
        print(f"  ✓ {job['id']}  (square + landscape)")

    # One message-mode demo so the pitch-led footer is visible.
    demo = next(j for j in jobs if j["id"] == "tsg-013")
    msg = ("Down to the bare metal",
           ("We clean what others won't.", "Grates, heat shields, grease tray — every surface."))
    build_square(demo, demo["pairs"][0], footer_mode="message", message=msg).save(
        OUT_DIR / "tsg-013-message-square.jpg", "JPEG", quality=90, optimize=True)
    print("  ✓ tsg-013 message-mode demo")


if __name__ == "__main__":
    main()
