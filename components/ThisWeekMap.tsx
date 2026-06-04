"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type MapStop = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  dayLabel: string; // e.g. "MON"
  status: "scheduled" | "completed";
  job?: {
    slug: string;
    model: string;
    hours: number;
    before: string;
    after: string;
    beforeAlt: string;
    afterAlt: string;
  };
};

const GRILL_GLYPH = `
  <svg class="pin__glyph" viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M2 7a11 11 0 0 0 22 0Z" fill="currentColor" stroke="none"/>
    <path d="M2 7h22"/><path d="M6 19l2.5-7M20 19l-2.5-7"/>
    <circle cx="19" cy="3" r="1.5" fill="currentColor" stroke="none"/>
  </svg>`;

export default function ThisWeekMap({ stops }: { stops: MapStop[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        zoomControl: true,
      });
      mapRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution: "&copy; OpenStreetMap &copy; CARTO",
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      const bounds: [number, number][] = [];

      for (const s of stops) {
        bounds.push([s.lat, s.lng]);

        if (s.status === "completed" && s.job) {
          const marker = L.marker([s.lat, s.lng], {
            icon: L.divIcon({
              className: "",
              iconSize: [52, 52],
              iconAnchor: [26, 26],
              html: `<div class="donepin"><img class="donepin__thumb" src="${s.job.after}" alt="${escapeAttr(
                s.job.afterAlt
              )}"><div class="donepin__check" aria-hidden="true">✓</div></div>`,
            }),
          }).addTo(map);
          marker.bindPopup(completedPopup(s), {
            minWidth: 300,
            maxWidth: 300,
          });
          marker.on("popupopen", (e) =>
            wireSlider((e.popup.getElement() as HTMLElement) ?? null)
          );
        } else {
          L.marker([s.lat, s.lng], {
            icon: L.divIcon({
              className: "",
              iconSize: [46, 58],
              iconAnchor: [23, 56],
              html: `<div class="pin pin--sched"><div class="pin__badge">${escapeHtml(
                s.dayLabel
              )}</div><div class="pin__body"></div>${GRILL_GLYPH}</div>`,
            }),
          })
            .addTo(map)
            .bindTooltip(`${escapeHtml(s.label)} — ${escapeHtml(s.dayLabel)}`, {
              direction: "top",
              offset: [0, -50],
            });
        }
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
      } else {
        map.setView([39.14, -84.45], 10); // Cincinnati fallback
      }
    })();

    return () => {
      cancelled = true;
      const map = mapRef.current as { remove?: () => void } | null;
      if (map?.remove) map.remove();
      mapRef.current = null;
    };
  }, [stops]);

  return (
    <div
      ref={containerRef}
      className="twmap h-[60vh] min-h-[420px] w-full"
      role="application"
      aria-label="Map of this week's grill-cleaning stops"
    />
  );
}

function completedPopup(s: MapStop): string {
  const j = s.job!;
  return `
    <div class="ba__head">
      <div class="ba__hood">${escapeHtml(s.label)}</div>
      <div class="ba__meta">${escapeHtml(j.model)}</div>
    </div>
    <div class="ba" data-ba>
      <img class="ba__before" src="${j.before}" alt="${escapeAttr(j.beforeAlt)}">
      <img class="ba__after" src="${j.after}" alt="${escapeAttr(j.afterAlt)}" data-after>
      <div class="ba__tag ba__tag--b">BEFORE</div>
      <div class="ba__tag ba__tag--a">AFTER</div>
      <div class="ba__handle" data-handle><div class="ba__grip" aria-hidden="true">⇆</div></div>
    </div>
    <div class="ba__foot">
      <span class="ba__hours">${j.hours} hr service</span>
      <a href="/gallery/${encodeURIComponent(j.slug)}">View in gallery →</a>
    </div>`;
}

/** Draggable before/after reveal inside an open popup. */
function wireSlider(root: HTMLElement | null) {
  if (!root) return;
  const ba = root.querySelector<HTMLElement>("[data-ba]");
  const after = root.querySelector<HTMLElement>("[data-after]");
  const handle = root.querySelector<HTMLElement>("[data-handle]");
  if (!ba || !after || !handle) return;

  const set = (p: number) => {
    const clamped = Math.max(0, Math.min(100, p));
    after.style.clipPath = `inset(0 0 0 ${clamped}%)`;
    handle.style.left = `${clamped}%`;
  };
  const move = (clientX: number) => {
    const r = ba.getBoundingClientRect();
    set(((clientX - r.left) / r.width) * 100);
  };

  let dragging = false;
  const onDown = (e: MouseEvent | TouchEvent) => {
    dragging = true;
    move("touches" in e ? e.touches[0].clientX : e.clientX);
    e.preventDefault();
  };
  ba.addEventListener("mousedown", onDown);
  ba.addEventListener("touchstart", onDown, { passive: false });
  window.addEventListener("mousemove", (e) => dragging && move(e.clientX));
  window.addEventListener(
    "touchmove",
    (e) => dragging && move(e.touches[0].clientX),
    { passive: false }
  );
  window.addEventListener("mouseup", () => (dragging = false));
  window.addEventListener("touchend", () => (dragging = false));
  set(50);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"
  );
}
function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, "&quot;");
}
