# Brad · Madeira — staging folder for FB/IG composites

Drop the four source photos here, then run the composite generator
(see `marketing/generate-fb-composites.py`).

Expected filenames:

```
before-detail.jpg    The grimy close-up of the open cookbox
after-detail.jpg     The polished close-up of the open cookbox
before-wide.jpg      Wide outdoor-kitchen shot, work in progress
after-wide.jpg       Wide outdoor-kitchen shot, finished
```

`.jpg`, `.jpeg`, and `.png` are all fine — the generator detects the
real extension at runtime. Output composites land in `./composites/`
and never touch the public gallery.
