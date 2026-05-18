"""
Generate FB-style before/after composites for every job in data/jobs.json.

Matches the style of marketing/memorial-day-fb-composite.jpg:
  - 2568x1280 outer canvas, 80px bone padding, 36px rounded figure corners
  - Two photo halves with bone vertical divider
  - Photos contain-fit into 4:3 cells with navy backing (no crop, full grill visible)
  - Rounded BEFORE (transparent navy) and AFTER (burgundy) chips at top corners
  - Bottom navy metadata band: burgundy location/date line, white model, faded service time

Outputs one JPG per job to marketing/fb-composites/ and bundles them into
marketing/tsgc-before-afters-fb-style.zip.

Run from repo root:  python3 marketing/generate-fb-composites.py
"""

import json
import os
import zipfile
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
JOBS_FILE = ROOT / "data" / "jobs.json"
GALLERY_DIR = ROOT / "public"
OUT_DIR = ROOT / "marketing" / "fb-composites"
ZIP_PATH = ROOT / "marketing" / "tsgc-before-afters-fb-style.zip"

NAVY = (26, 48, 85)
BURGUNDY = (139, 31, 47)
BONE = (247, 243, 238)
WHITE = (255, 255, 255)

CANVAS_W, CANVAS_H = 2568, 1280
PADDING = 80
FIGURE_RADIUS = 36
META_H = 217
DIVIDER_W = 4

FIG_X = PADDING
FIG_Y = PADDING
FIG_W = CANVAS_W - 2 * PADDING
FIG_H = CANVAS_H - 2 * PADDING
PHOTO_STRIP_H = FIG_H - META_H
HALF_W = (FIG_W - DIVIDER_W) // 2

FONT_REGULAR = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"


def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REGULAR, size)


def rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    return mask


def contain_into(src_path, cell_w, cell_h, bg=NAVY):
    """Aspect-fit src into a cell_w x cell_h canvas with bg backing."""
    src = Image.open(src_path).convert("RGB")
    sw, sh = src.size
    scale = min(cell_w / sw, cell_h / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    fitted = src.resize((nw, nh), Image.LANCZOS)
    cell = Image.new("RGB", (cell_w, cell_h), bg)
    cell.paste(fitted, ((cell_w - nw) // 2, (cell_h - nh) // 2))
    return cell


def draw_chip(canvas, anchor, text, bg, fg=WHITE, padding_x=28, padding_y=14, radius=22, alpha=None):
    """Draw a rounded pill chip. anchor is (x, y) top-left of chip box."""
    f = font(28, bold=True)
    bbox = f.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    chip_w = tw + 2 * padding_x
    chip_h = th + 2 * padding_y + 6

    if alpha is not None:
        overlay = Image.new("RGBA", (chip_w, chip_h), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        od.rounded_rectangle((0, 0, chip_w, chip_h), radius=radius, fill=(*bg, alpha))
        od.text((padding_x - bbox[0], padding_y - bbox[1]), text, font=f, fill=fg)
        canvas.alpha_composite(overlay, anchor)
    else:
        d = ImageDraw.Draw(canvas)
        x0, y0 = anchor
        d.rounded_rectangle((x0, y0, x0 + chip_w, y0 + chip_h), radius=radius, fill=bg)
        d.text((x0 + padding_x - bbox[0], y0 + padding_y - bbox[1]), text, font=f, fill=fg)


def build_composite(job, pair):
    before_path = GALLERY_DIR / pair["before"].lstrip("/")
    after_path = GALLERY_DIR / pair["after"].lstrip("/")

    canvas = Image.new("RGB", (CANVAS_W, CANVAS_H), BONE)

    figure = Image.new("RGB", (FIG_W, FIG_H), NAVY)

    before_cell = contain_into(before_path, HALF_W, PHOTO_STRIP_H)
    after_cell = contain_into(after_path, HALF_W, PHOTO_STRIP_H)

    figure.paste(before_cell, (0, 0))
    figure.paste(after_cell, (HALF_W + DIVIDER_W, 0))

    fd = ImageDraw.Draw(figure)
    fd.rectangle((HALF_W, 0, HALF_W + DIVIDER_W, PHOTO_STRIP_H), fill=BONE)

    meta_y = PHOTO_STRIP_H
    fd.rectangle((0, meta_y, FIG_W, FIG_H), fill=NAVY)

    dt = datetime.strptime(job["date"], "%Y-%m-%d")
    location_line = f"{job['neighborhood'].upper()}  ·  {dt.strftime('%b %Y').upper()}"
    model_line = job["grillModel"]
    service_line = f"Service time: {_fmt_hours(job['serviceHours'])}"

    pad_x = 56
    f_small = font(26, bold=True)
    f_model = font(52, bold=True)
    f_service = font(28)

    cur_y = meta_y + 40
    fd.text((pad_x, cur_y), location_line, font=f_small, fill=BURGUNDY)
    cur_y += 44
    fd.text((pad_x, cur_y), model_line, font=f_model, fill=WHITE)
    cur_y += 70
    fd.text((pad_x, cur_y), service_line, font=f_service, fill=(180, 192, 212))

    figure_rgba = figure.convert("RGBA")
    mask = rounded_mask((FIG_W, FIG_H), FIGURE_RADIUS)
    canvas.paste(figure_rgba, (FIG_X, FIG_Y), mask=mask)

    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    chip_pad = 36
    draw_chip(
        overlay,
        (FIG_X + chip_pad, FIG_Y + chip_pad),
        "BEFORE",
        bg=NAVY,
        alpha=210,
    )
    canvas_rgba = canvas.convert("RGBA")
    canvas_rgba.alpha_composite(overlay)

    after_chip_text = "AFTER"
    f_chip = font(28, bold=True)
    after_bbox = f_chip.getbbox(after_chip_text)
    chip_w_after = (after_bbox[2] - after_bbox[0]) + 2 * 28
    after_x = FIG_X + FIG_W - chip_pad - chip_w_after
    draw_chip(canvas_rgba, (after_x, FIG_Y + chip_pad), after_chip_text, bg=BURGUNDY)

    return canvas_rgba.convert("RGB")


def _fmt_hours(hours):
    if float(hours).is_integer():
        return f"{int(hours)} hrs"
    return f"{hours} hrs"


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUT_DIR.glob("*.jpg"):
        old.unlink()

    with open(JOBS_FILE) as f:
        jobs = json.load(f)["jobs"]

    generated = []
    for job in jobs:
        for idx, pair in enumerate(job["pairs"]):
            suffix = f"-{idx + 1}" if len(job["pairs"]) > 1 else ""
            out_name = f"{job['id']}{suffix}-before-after.jpg"
            out_path = OUT_DIR / out_name
            img = build_composite(job, pair)
            img.save(out_path, "JPEG", quality=88, optimize=True)
            generated.append(out_path)
            print(f"  ✓ {out_name}  ({out_path.stat().st_size // 1024} KB)")

    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in generated:
            zf.write(p, arcname=p.name)

    print(f"\nWrote {len(generated)} composites → {ZIP_PATH}")
    print(f"Zip size: {ZIP_PATH.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
