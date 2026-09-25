# story-sale-generator

Editor for Denna's Trading's story sale: the logo, STORY SALE, a fan of cards,
the big lines and the terms underneath. One static page, no build, no backend.

## Use

Open `index.html` (or the Vercel URL). Click a card on the story to choose a
photo, or drop one onto it. Three tabs on the right:

- **Cards** — choose photos, order them, one to five cards, spread and tilt of the fan
- **Colours** — every part of the story; hover a row to see what it paints
- **Text** — heading, big lines (max. 3), line underneath, terms (max. 4), Instagram handle, region

Under every tab: **Checks** — contrast, photos too small for the HD export, text
that had to be set smaller.

## Export

| Button | What you get |
|---|---|
| Download PNG | 1080 × 1920 (9:16) or 1080 × 1350 (4:5) |
| PNG HD (2×) | 2160 × 3840 — sharper on Instagram |
| PDF / print | same size, live type |
| Save / Open | a `.json` with everything in it, photos included |
| Share link | a link with text, colours and layout — without photos |

Your work stays in this device's browser. Every photo is fitted to the card
automatically: cropped to 63 × 88 from the centre, at 945 × 1320 px.

## How the layout works

The story is always 1080 wide. The text block is measured first, then the fan
gets the depth that is left (up to 531 px), and only when that runs short does
the header shrink, down to 72 %. A big line that is too long is set smaller by
itself. The fan lays itself out for one to five cards and always stays inside
the story.

## Files

```
index.html          the page
css/system.css      brand system: palette, type, depth planes
css/editor.css      the tool only — never reaches an export
js/brand.js         motifs and the logo
js/sale-store.js    photos, text, colours and fan; storage and import/export
js/sale-card.js     everything that is drawn
js/sale-panel.js    the column on the right
js/storysale.js     clicking, dropping and typing on the story
js/editor.js        toolbar, scaling, export
js/vendor/          html-to-image (local, no CDN)
fonts/              Anton, Archivo Narrow, Inter (local)
assets/             logo and the three default cards
```

## Deploy

Vercel: import this repo, no build settings needed (`vercel.json` is in place).
