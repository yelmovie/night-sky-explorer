# Scenery-first interface review — 2026-11-11

Translucent background fills, restrained borders/shadows, readable foreground text and icons. Core/selected/disabled states and learning artwork preserved. Large reading dialogs retain stronger fill. No opacity applied to whole controls.

107 unit tests on latest remote a10a6f1. 308 responsive states: zero covered controls, icon/text overlaps, or runtime errors. Existing 740x360 scaled controls produce 156 touch-size warnings in 39 states (38–43px effective targets); these remain a documented limitation. An attempted enlargement was reverted because it introduced a map overlap.

Browser QA uses Chromium and seeded states; physical tablets, Safari, and every natural play route were not tested.

Follow-up: card family corners unified at 18px, peer-card gaps 12px (8px compact), equal stretch preserved. Existing single-screen observation layouts retained: artwork is not shrunk or hidden to fit controls.
