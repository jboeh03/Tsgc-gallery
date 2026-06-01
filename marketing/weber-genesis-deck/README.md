# Weber Genesis II — sunset-deck reveal

Source photos for the "as promised" reveal of the May 23 *Stay Tuned*
post. Drop both files here, then I (or you) can run the one-off
composite generator from the repo root:

```bash
python3 marketing/generate-fb-composites.py --one-off \
  --before marketing/weber-genesis-deck/before.jpg \
  --after  marketing/weber-genesis-deck/after.jpg \
  --eyebrow "SAME-DAY · CALLED THIS MORNING" \
  --title "Weber Genesis II." \
  --subtitle "Done before dinner" \
  --out marketing/weber-genesis-deck/reveal-composite.jpg
```

Expected filenames:

```
before.jpg   The grimy Weber Genesis II — knobs with red indicators,
             dropcloth underneath. Same crop as the May 23 BEFORE panel.
after.jpg    The clean Weber Genesis II on the wood deck at sunset.
```

Output goes to `reveal-composite.jpg` in this folder.
