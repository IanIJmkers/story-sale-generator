# story-sale-generator

Editor voor de story sale van Denna's Trading: het logo, STORY SALE, een waaier
met kaarten, de grote regels en de voorwaarden eronder. Eén statische pagina,
geen build, geen backend.

## Gebruik

Open `index.html` (of de Vercel-URL). Klik een kaart op de story om een foto te
kiezen, of sleep er een op. Rechts staan drie tabbladen:

- **Kaarten** — foto's kiezen, volgorde, uitsnede, één tot vijf kaarten, spreiding en kanteling van de waaier
- **Kleuren** — elk onderdeel van de story; ga met de muis over een regel om te zien wat hij verft
- **Tekst** — kop, grote regels (max. 3), regel eronder, voorwaarden (max. 4), Instagram-naam, regio

Onder elk tabblad staat **Controle**: contrast, foto's die te klein zijn voor de
HD-export, tekst die kleiner gezet moest worden.

## Exporteren

| Knop | Wat je krijgt |
|---|---|
| PNG downloaden | 1080 × 1920 (9:16) of 1080 × 1350 (4:5) |
| PNG HD (2×) | 2160 × 3840 — scherper op Instagram |
| PDF / print | dezelfde maat, met echte letters |
| Opslaan / Openen | een `.json` met alles erin, ook de foto's |
| Deel link | een link met tekst, kleuren en indeling — zonder foto's |

Je werk blijft in de browser van dit apparaat bewaard. Foto's worden
teruggebracht naar 1200 px op de lange zijde.

## Hoe de layout werkt

De story is altijd 1080 breed. Eerst wordt het tekstblok gemeten, dan krijgt de
waaier de hoogte die overblijft (tot 531 px), en pas als dat te weinig wordt
krimpt de kop mee, tot 72 %. Een grote regel die te lang is wordt vanzelf
kleiner gezet. De waaier zet zichzelf op voor één tot vijf kaarten en blijft
altijd binnen de story.

## Bestanden

```
index.html          de pagina
css/system.css      huisstijl: palet, letters, dieptevlakken
css/editor.css      alleen het gereedschap — komt nooit in een export
js/brand.js         motieven en het logo
js/sale-store.js    de foto's, tekst, kleuren en waaier; opslag en import/export
js/sale-card.js     alles wat getekend wordt
js/sale-panel.js    de kolom rechts
js/storysale.js     klikken, slepen en typen op de story
js/editor.js        werkbalk, schalen, exporteren
js/vendor/          html-to-image (lokaal, geen CDN)
fonts/              Anton, Archivo Narrow, Inter (lokaal)
assets/             logo en de drie standaardkaarten
```

## Deployen

Vercel: importeer deze repo, geen build-instellingen nodig (`vercel.json` staat er).
