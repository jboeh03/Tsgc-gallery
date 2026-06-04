"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import type { StudioPhoto } from "@/lib/studio/photos";

export default function StudioGallery({
  initialPhotos,
}: {
  initialPhotos: StudioPhoto[];
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/studio/photos", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { photos: StudioPhoto[] };
    setPhotos(data.photos);
  }, []);

  const onUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/studio/upload", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? `Upload failed (${res.status})`);
        }
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [refresh]
  );

  const raw = photos.filter((p) => p.source === "raw");
  const gallery = photos.filter((p) => p.source === "gallery");

  return (
    <div className="space-y-10">
      <div className="rounded-xl border border-border bg-white p-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="font-display text-navy text-lg">Upload a photo</p>
          <p className="text-xs text-muted mt-1">
            JPG, PNG, or WebP · max 15 MB · saved to{" "}
            <code>marketing/all-photos-raw/</code>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {error ? (
            <span className="text-xs text-burgundy">{error}</span>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
            }}
            className="text-sm"
          />
        </div>
      </div>

      <PhotoSection
        title={`Raw uploads (${raw.length})`}
        empty="No raw uploads yet — drop in marketing/all-photos-raw/ or use the uploader above."
        photos={raw}
      />
      <PhotoSection
        title={`Live gallery (${gallery.length})`}
        empty="Gallery is empty."
        photos={gallery}
      />
    </div>
  );
}

function PhotoSection({
  title,
  empty,
  photos,
}: {
  title: string;
  empty: string;
  photos: StudioPhoto[];
}) {
  return (
    <div>
      <h2 className="font-display text-navy text-xl mb-3">{title}</h2>
      {photos.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((p) => (
            <li key={p.id}>
              <Link
                href={`/studio/${encodeURIComponent(p.id)}`}
                className="block group"
              >
                <div className="aspect-square rounded-md overflow-hidden bg-border relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.displayUrl}
                    alt={p.filename}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                    loading="lazy"
                  />
                  {p.outputs.length > 0 ? (
                    <span className="absolute top-2 right-2 rounded-full bg-navy text-bone text-[10px] px-2 py-0.5">
                      {p.outputs.length} output
                      {p.outputs.length === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-ink/80 truncate">{p.filename}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
