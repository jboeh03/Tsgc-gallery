"""
Generate FB-style before/after composites.

Two modes:

  Bulk (default) — iterate every job in data/jobs.json and write
  one composite per pair to marketing/fb-composites/, plus a zip.

      python3 marketing/generate-fb-composites.py

  One-off — render a single composite for a custom before/after with
  a custom navy meta band (eyebrow / title / subtitle). Matches the
  May 23 "stay tuned" post style: white BEFORE chip, burgundy AFTER
  chip, thin burgundy accent above the band, domain anchored right.

      python3 marketing/generate-fb-composites.py --one-off \\
        --before path/to/before.jpg --after path/to/after.jpg \\
        --eyebrow "SAME-DAY · CALLED THIS MORNING" \\
        --title "Weber Genesis II." \\
        --subtitle "Done before dinner" \\
        --out marketing/weber-genesis-deck/reveal.jpg
"""

import argparse
import json
import os
import zipfile
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

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
    """Aspect-fit src into a cell_w x cell_h canvas with bg backing.
    Honors EXIF orientation so phone-uploaded JPEGs land upright."""
    src = ImageOps.exif_transpose(Image.open(src_path)).convert("RGB")
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


DOMAIN = "TRISTATEGRILLCLEANING.COM"
SUBTITLE_GRAY = (180, 192, 212)


def build_oneoff_composite(before_path, after_path, eyebrow, title, subtitle):
    """May-23 style: white BEFORE chip, burgundy AFTER chip, burgundy
    accent strip above a navy meta band with custom eyebrow/title/
    subtitle and the domain anchored on the right."""
    canvas = Image.new("RGB", (CANVAS_W, CANVAS_H), BONE)
    figure = Image.new("RGB", (FIG_W, FIG_H), NAVY)

    before_cell = contain_into(before_path, HALF_W, PHOTO_STRIP_H)
    after_cell = contain_into(after_path, HALF_W, PHOTO_STRIP_H)
    figure.paste(before_cell, (0, 0))
    figure.paste(after_cell, (HALF_W + DIVIDER_W, 0))

    fd = ImageDraw.Draw(figure)
    fd.rectangle((HALF_W, 0, HALF_W + DIVIDER_W, PHOTO_STRIP_H), fill=BONE)

    meta_y = PHOTO_STRIP_H
    accent_h = 6
    fd.rectangle((0, meta_y, FIG_W, meta_y + accent_h), fill=BURGUNDY)
    fd.rectangle((0, meta_y + accent_h, FIG_W, FIG_H), fill=NAVY)

    pad_x = 56
    f_eyebrow = font(26, bold=True)
    f_title = font(64, bold=True)
    f_subtitle = font(28)
    f_domain = font(24, bold=True)

    text_y = meta_y + accent_h + 24
    if eyebrow:
        fd.text((pad_x, text_y), eyebrow, font=f_eyebrow, fill=BURGUNDY)
    text_y += 44
    if title:
        fd.text((pad_x, text_y), title, font=f_title, fill=WHITE)
    text_y += 78
    if subtitle:
        fd.text((pad_x, text_y), subtitle, font=f_subtitle, fill=SUBTITLE_GRAY)

    domain_bbox = f_domain.getbbox(DOMAIN)
    domain_w = domain_bbox[2] - domain_bbox[0]
    domain_x = FIG_W - pad_x - domain_w
    band_mid_y = meta_y + accent_h + (META_H - accent_h) // 2 - 14
    fd.text((domain_x, band_mid_y), DOMAIN, font=f_domain, fill=WHITE)

    figure_rgba = figure.convert("RGBA")
    mask = rounded_mask((FIG_W, FIG_H), FIGURE_RADIUS)
    canvas.paste(figure_rgba, (FIG_X, FIG_Y), mask=mask)
    canvas_rgba = canvas.convert("RGBA")

    chip_pad = 36
    draw_chip(
        canvas_rgba,
        (FIG_X + chip_pad, FIG_Y + chip_pad),
        "BEFORE",
        bg=WHITE,
        fg=NAVY,
    )

    f_chip = font(28, bold=True)
    after_bbox = f_chip.getbbox("AFTER")
    chip_w_after = (after_bbox[2] - after_bbox[0]) + 2 * 28
    after_x = FIG_X + FIG_W - chip_pad - chip_w_after
    draw_chip(canvas_rgba, (after_x, FIG_Y + chip_pad), "AFTER", bg=BURGUNDY, fg=WHITE)

    return canvas_rgba.convert("RGB")


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


def _cli():
    p = argparse.ArgumentParser(description="Generate FB-style before/after composites.")
    p.add_argument("--one-off", action="store_true", help="Render a single custom composite instead of iterating jobs.json.")
    p.add_argument("--before", help="Path to the BEFORE photo (one-off mode).")
    p.add_argument("--after", help="Path to the AFTER photo (one-off mode).")
    p.add_argument("--eyebrow", default="", help="Burgundy uppercase line above the title.")
    p.add_argument("--title", default="", help="Large white headline (e.g. 'Weber Genesis II.').")
    p.add_argument("--subtitle", default="", help="Small light line under the title.")
    p.add_argument("--out", help="Output JPG path (one-off mode).")
    args = p.parse_args()

    if args.one_off:
        for required in ("before", "after", "out"):
            if not getattr(args, required):
                p.error(f"--{required} is required with --one-off")
        img = build_oneoff_composite(args.before, args.after, args.eyebrow, args.title, args.subtitle)
        out = Path(args.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        img.save(out, "JPEG", quality=88, optimize=True)
        print(f"  ✓ {out}  ({out.stat().st_size // 1024} KB)")
    else:
        main()


if __name__ == "__main__":
    _cli()
