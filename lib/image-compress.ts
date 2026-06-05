/**
 * Client-side image compression for photo uploads. Phone photos are 3–12 MB
 * and often HEIC; sending them raw (base64 in a JSON body) blows past the
 * serverless request-body cap and gets rejected. Drawing each photo through a
 * canvas caps the longest edge, re-encodes to JPEG, and normalizes HEIC→JPEG —
 * dropping a multi-MB original to a few hundred KB with no visible quality loss
 * for grill photos. Browser-only (canvas/Image/FileReader); import from client
 * components only.
 */

export type ImagePart = { base64: string; mime: string; preview: string };

function downscaleToJpeg(file: File, maxDim: number, quality: number): Promise<ImagePart> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (Math.max(width, height) > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas unsupported")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const base64 = dataUrl.split(",")[1] ?? "";
      if (!base64) { reject(new Error("Could not encode image")); return; }
      resolve({ base64, mime: "image/jpeg", preview: dataUrl });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not load image")); };
    img.src = url;
  });
}

/** Fallback: read the raw file as a data URL (used only if canvas decode fails). */
function readRaw(file: File): Promise<ImagePart> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string; // data:<mime>;base64,<data>
      const base64 = result.split(",")[1] ?? "";
      resolve({ base64, mime: file.type || "image/jpeg", preview: result });
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress a picked image for upload. Returns the JPEG base64 (no data: prefix),
 * its mime, and a data-URL preview. Falls back to the raw bytes only if the
 * canvas can't decode the file (e.g. desktop HEIC).
 */
export async function compressImage(
  file: File,
  opts: { maxDim?: number; quality?: number } = {}
): Promise<ImagePart> {
  const maxDim = opts.maxDim ?? 1600;
  const quality = opts.quality ?? 0.82;
  try {
    return await downscaleToJpeg(file, maxDim, quality);
  } catch {
    return await readRaw(file);
  }
}
