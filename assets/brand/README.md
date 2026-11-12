# Brand

`medal.svg` is the Chiong Bah mark: a gold medal on a V ribbon with a runner cut out of its face.
It was generated with ElevenLabs (Recraft vector), traced into clean outlines and recoloured to
the app palette. `src/ui/emblemPaths.ts` holds the same outlines for the app. The app draws it with
`src/ui/Emblem.tsx`; the PNGs in `assets/images` (app icon, adaptive icon layers, splash and
favicon) are rendered from it with `scripts/render-brand.js`.

`alt-chevron-medal.svg` (the previous mark, with two chevrons), `alt-chevrons.svg` and
`alt-dogtag.svg` are marks that were considered and not chosen.
They are kept here in case the choice changes. Do not ship them.
