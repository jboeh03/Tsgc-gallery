# marketing/all-photos-raw

Raw photo working area for the internal `/studio` editor (and any future
"upload a photo first, decide where it goes later" flow).

Anything dropped here is visible inside the studio alongside the live
`public/gallery/` photos, but is **not** served as a static asset by Next.js.

Rendered outputs (restyled images, generated video clips) land in
`.outputs/<source-id>/...` — that subfolder is gitignored so the repo
doesn't bloat with MP4s.

To promote a finished asset to the public site, use the studio's
"merge to gallery" action, which copies the file into
`public/gallery/studio/` where it can be referenced from `data/jobs.json`.
