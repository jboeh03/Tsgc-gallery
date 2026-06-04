import path from "node:path";

export const RAW_DIR = path.join(process.cwd(), "marketing", "all-photos-raw");
export const RAW_OUTPUTS_DIR = path.join(RAW_DIR, ".outputs");
export const GALLERY_DIR = path.join(process.cwd(), "public", "gallery");
export const GALLERY_STUDIO_DIR = path.join(GALLERY_DIR, "studio");

export type PhotoSource = "gallery" | "raw";

export const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
export const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov"]);

export function makePhotoId(source: PhotoSource, filename: string): string {
  return `${source}--${filename}`;
}

export function parsePhotoId(
  id: string
): { source: PhotoSource; filename: string } | null {
  const idx = id.indexOf("--");
  if (idx < 0) return null;
  const source = id.slice(0, idx);
  const filename = id.slice(idx + 2);
  if (source !== "gallery" && source !== "raw") return null;
  if (!filename || filename.includes("/") || filename.includes("..")) return null;
  return { source, filename };
}

export function publicUrlFor(
  source: PhotoSource,
  filename: string
): string {
  if (source === "gallery") return `/gallery/${filename}`;
  // Raw photos aren't statically served — stream via API route.
  return `/api/studio/raw/${encodeURIComponent(filename)}`;
}

export function absolutePathFor(
  source: PhotoSource,
  filename: string
): string {
  return source === "gallery"
    ? path.join(GALLERY_DIR, filename)
    : path.join(RAW_DIR, filename);
}

export function outputsDirFor(id: string): string {
  return path.join(RAW_OUTPUTS_DIR, id);
}

export function outputUrlFor(id: string, outputFile: string): string {
  return `/api/studio/output/${encodeURIComponent(id)}/${encodeURIComponent(outputFile)}`;
}
