import fs from "node:fs/promises";
import path from "node:path";
import {
  GALLERY_DIR,
  IMAGE_EXTENSIONS,
  RAW_DIR,
  RAW_OUTPUTS_DIR,
  VIDEO_EXTENSIONS,
  makePhotoId,
  outputsDirFor,
  outputUrlFor,
  publicUrlFor,
  type PhotoSource,
} from "./paths";

export type StudioOutput = {
  filename: string;
  url: string;
  kind: "image" | "video";
  createdAt: number;
};

export type StudioPhoto = {
  id: string;
  source: PhotoSource;
  filename: string;
  displayUrl: string;
  outputs: StudioOutput[];
};

async function listDirSafe(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

function isImage(filename: string): boolean {
  return IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

function isVideo(filename: string): boolean {
  return VIDEO_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

async function loadOutputs(id: string): Promise<StudioOutput[]> {
  const dir = outputsDirFor(id);
  const names = await listDirSafe(dir);
  const out: StudioOutput[] = [];
  for (const name of names) {
    if (name.startsWith(".")) continue;
    const full = path.join(dir, name);
    let stat: Awaited<ReturnType<typeof fs.stat>>;
    try {
      stat = await fs.stat(full);
    } catch {
      continue;
    }
    if (!stat.isFile()) continue;
    const kind = isVideo(name) ? "video" : isImage(name) ? "image" : null;
    if (!kind) continue;
    out.push({
      filename: name,
      url: outputUrlFor(id, name),
      kind,
      createdAt: stat.mtimeMs,
    });
  }
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

async function listSource(
  source: PhotoSource,
  dir: string
): Promise<StudioPhoto[]> {
  const names = await listDirSafe(dir);
  const photos: StudioPhoto[] = [];
  for (const name of names) {
    if (name.startsWith(".")) continue;
    if (!isImage(name)) continue;
    const id = makePhotoId(source, name);
    photos.push({
      id,
      source,
      filename: name,
      displayUrl: publicUrlFor(source, name),
      outputs: await loadOutputs(id),
    });
  }
  return photos.sort((a, b) => a.filename.localeCompare(b.filename));
}

/**
 * List all photos from both sources (live gallery + raw uploads).
 * Outputs (rendered variants) are loaded eagerly per photo so the
 * gallery page can show counts without a second round trip.
 */
export async function listStudioPhotos(): Promise<StudioPhoto[]> {
  const [gallery, raw] = await Promise.all([
    listSource("gallery", GALLERY_DIR),
    listSource("raw", RAW_DIR),
  ]);
  return [...raw, ...gallery];
}

export async function getStudioPhoto(id: string): Promise<StudioPhoto | null> {
  const [gallery, raw] = await Promise.all([
    listSource("gallery", GALLERY_DIR),
    listSource("raw", RAW_DIR),
  ]);
  return [...gallery, ...raw].find((p) => p.id === id) ?? null;
}

export async function ensureOutputsDir(id: string): Promise<string> {
  const dir = outputsDirFor(id);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function ensureRawDir(): Promise<void> {
  await fs.mkdir(RAW_DIR, { recursive: true });
}

export async function ensureOutputsRoot(): Promise<void> {
  await fs.mkdir(RAW_OUTPUTS_DIR, { recursive: true });
}
