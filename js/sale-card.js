/* ============================================================
   THE STORY-SALE ARTBOARD — everything that is drawn

   A port of story 08 in build/stories.mjs — the fanned cards under
   the lockup with the terms beneath — made editable. The composition
   the client approved is the default; every number below is that
   composition, and the layout only departs from it when the content
   forces it to.

   WHAT MOVES AND WHAT DOES NOT
   The artboard is always 1080 wide and its full height (1920 or
   1350). The safe areas hold: nothing that must be read sits under
   Instagram's profile row or reply bar, and the sign-off stays on
   the navy plinth where the print set puts it.

   What flexes is the fan. The text block under it is set first —
   the lead lines, the note, however many terms there are — and the
   cards are given whatever depth is left between the headline and
   that block. More terms, a third lead line, or the 4:5 format all
   take depth from the cards, never from the words: the words are
   what the story is for, the cards are what it shows. When even that
   leaves the cards too small, the header gives way, the same as the
   agenda's does, down to 72%.

   THE FAN GENERALISES. Three cards is the approved composition;
   one to five all set from the same rule — each card offset from the
   centre by its distance k, shrinking, dropping and tilting with |k|
   — so a two-card or five-card story still reads as one object. The
   spread is then clamped so the outermost card never leaves the
   artboard.

   TYPE IS MEASURED, NOT ASSUMED. The lead is set at 68px, but a
   line that would run past the margins at 68 is set at the largest
   size that fits. Nothing is ever clipped.

   NO COLOUR IS HARD-CODED. `useTheme` runs once per build and the
   rest reads from `T`.
   ============================================================ */
(function (global) {
  'use strict';

  var B = global.Brand, S = global.Store;
  var W = 1080, SIDE = 80, CW = W - SIDE * 2;
  var PAD = 14, CARD_RATIO = 88 / 63;

  /* The approved composition (story) and its 4:5 reduction. Depths
     are absolute where they are anchored to the artboard's edge
     (plinth, sign-off) and relative where they stack. */
  var FORMATS = {
    story: { key: 'story', h: 1920, logoW: 380, logoTop: 170, head: 118, headGap: 14,
             fanGap: 40, leadGap: 62, lead: 68, note: 26, termLabel: 32, termValue: 46,
             termPitch: 52, termGap: 12, corner: 250, plinthR: 1700, plinthL: 1800,
             signY: 1818, sign: 30, midW: 340, sideDrop: 72, spread: 284, tilt: 9,
             fanMin: 380 },
    post:  { key: 'post',  h: 1350, logoW: 260, logoTop: 100, head: 84,  headGap: 10,
             fanGap: 28, leadGap: 40, lead: 50, note: 21, termLabel: 25, termValue: 36,
             termPitch: 42, termGap: 10, corner: 180, plinthR: 1180, plinthL: 1250,
             signY: 1266, sign: 24, midW: 340, sideDrop: 60, spread: 284, tilt: 9,
             fanMin: 300 }
  };
  function formatOf(st) { return FORMATS[st.meta.format] || FORMATS.story; }

  var T = S.DEFAULTS ? JSON.parse(JSON.stringify(S.DEFAULTS.theme)) : {};
  function useTheme(st) { T = st.theme; return T; }

  /* ---------- small helpers ---------- */
  function px(n) { return n.toFixed(1) + 'px'; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }
  function ed(p) { return ' data-edit="' + p + '"'; }
  function dp(part) { return part ? ' data-part="' + part + '"' : ''; }
  function rule(x, y, w, color, part) {
    return '<div' + dp(part) + ' style="position:absolute;left:' + x + 'px;top:' + px(y) +
      ';width:' + w + 'px;height:1.5px;background:' + color + '"></div>';
  }
  function lighten(hex, k) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
    if (!m) return hex;
    var n = parseInt(m[1], 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    var f = function (v) { return Math.round(v + (255 - v) * k); };
    return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }

  /* ---------- measuring ----------
     Width scales linearly with size, so one measurement at 100px
     gives the exact largest size at which a string fits a width. */
  var _mctx = null;
  function widthAt100(text, family, weight, track) {
    if (!text) return 0;
    if (!_mctx) _mctx = document.createElement('canvas').getContext('2d');
    var c = _mctx, extra = 0;
    c.font = weight + ' 100px "' + family + '", sans-serif';
    if ('letterSpacing' in c) c.letterSpacing = track + 'em';
    else extra = track * 100 * String(text).length;
    var w = c.measureText(String(text)).width + extra;
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    return w;
  }
  function fitSize(text, max, room, family, weight, track, floor) {
    var w = widthAt100(text, family, weight, track);
    if (w <= 0) return max;
    return Math.max(floor || 6, Math.min(max, room * 100 / w));
  }

  /* ---------- planes 1 and 2 ----------
     The field with the wave at 7.5%, the roll-up's sash twice — a
     corner top-left and a plinth at the foot, four planes each from
     the outside in — and the enso haloing the lockup. */
  function ground(F, logoCy) {
    var SASH = [
      { k: 1.19, fill: T.sashGold, op: 0.38, part: 'sashGold' },
      { k: 1.16, fill: T.sashGold, part: 'sashGold' },
      { k: 1.08, fill: T.sashGap, part: 'sashGap' },
      { k: 1,    fill: 'url(#navyG)', part: 'sashNavy' }
    ];
    var C0 = F.corner, drop = F.plinthL - F.plinthR;
    var cornerPts = function (k) { return '0,0 ' + (C0 * k) + ',0 0,' + (C0 * k); };
    var plinthPts = function (k) {
      var d = (k - 1) * C0;
      return '0,' + (F.plinthL - d) + ' ' + W + ',' + (F.plinthR - d) + ' ' + W + ',' + F.h + ' 0,' + F.h;
    };
    var polys = function (pts) {
      return SASH.map(function (s) {
        return '<polygon' + dp(s.part) + ' points="' + pts(s.k) + '" fill="' + s.fill + '"' +
          (s.op ? ' opacity="' + s.op + '"' : '') + '/>';
      }).join('');
    };
    var sash = '<svg style="position:absolute;left:0;top:0;width:' + W + 'px;height:' + F.h + 'px" viewBox="0 0 ' + W + ' ' + F.h + '">' +
      '<defs><linearGradient id="navyG" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="' + lighten(T.sashNavy, 0.06) + '"/>' +
      '<stop offset="52%" stop-color="' + T.sashNavy + '"/>' +
      '<stop offset="100%" stop-color="' + T.sashDeep + '"/></linearGradient>' +
      B.seigaiha({ id: 'patNavy', r: 34, stroke: T.sashPattern, sw: 1.6 }) +
      '<clipPath id="navyClip"><polygon points="' + cornerPts(1) + '"/><polygon points="' + plinthPts(1) + '"/></clipPath>' +
      '</defs>' + polys(cornerPts) + polys(plinthPts) +
      '<rect width="' + W + '" height="' + F.h + '" fill="url(#patNavy)" opacity="0.09" clip-path="url(#navyClip)"/>' +
      '</svg>';
    void drop;

    return '<div class="plane-1"' + dp('bg') + ' style="background:' + T.bg + '">' +
      '<svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 ' + W + ' ' + F.h + '">' +
      '<defs>' + B.seigaiha({ id: 'pat', r: 34, stroke: T.pattern, sw: 1.6 }) + '</defs>' +
      '<rect' + dp('pattern') + ' width="' + W + '" height="' + F.h + '" fill="url(#pat)" opacity="0.075"/></svg></div>' +
      '<div class="plane-2" style="overflow:hidden">' + sash +
      '<svg' + dp('halo') + ' style="position:absolute;left:-20px;top:' + px(logoCy - 560) +
      ';width:1120px;height:1120px" viewBox="-560 -560 1120 1120"><g opacity="0.04">' +
      B.enso({ R: 430, thick: 72, gap: 0.44, start: -1.05, fill: T.halo, seed: 4 }) +
      '</g></svg></div>';
  }

  /* ---------- the header ----------
     Lockup, then the word with a short rule either side of it. Scaled
     as one so its depth is linear in `s` and can be solved for. */
  function headerDepth(F, s) {
    return s * (F.logoTop + B.logoHeight(F.logoW) + F.headGap + F.head);
  }
  function header(st, F, s) {
    var logoW = F.logoW * s, logoH = B.logoHeight(logoW), head = F.head * s;
    var logoY = F.logoTop * s;
    var headY = logoY + logoH + F.headGap * s;
    var h = B.logo({ w: logoW, x: (W - logoW) / 2, y: logoY });
    h += '<div class="display"' + ed('meta.heading') + dp('heading') + ' style="position:absolute;left:' + SIDE +
      'px;top:' + px(headY) + ';width:' + CW + 'px;text-align:center;font-size:' + px(head) +
      ';color:' + T.heading + '">' + esc(st.meta.heading) + '</div>';
    var ry = headY + head * 0.56, rl = Math.round(120 * s);
    h += rule(SIDE, ry, rl, T.headRule, 'headRule') + rule(W - SIDE - rl, ry, rl, T.headRule, 'headRule');
    return { html: h, bottom: headY + head, logoCy: logoY + logoH / 2 };
  }

  /* ---------- the text block ----------
     Set before the fan so the fan can be given what is left. Returns
     its depth as well as its html, drawn at `y` later. */
  function textBlock(st, F, y) {
    var lead = st.meta.lead, size = F.lead;
    lead.forEach(function (line) {
      size = Math.min(size, fitSize(line, F.lead, CW, 'Anton', 400, -0.015, 30));
    });
    var LH = 1.02, leadH = Math.round(size * LH * lead.length);
    var noteY = y + leadH + 8;
    var termsY = noteY + F.note + F.termGap;
    var rows = st.terms.length;
    var termsH = rows ? 18 + (rows - 1) * F.termPitch + F.termValue : 0;
    var depth = leadH + 8 + F.note + F.termGap + termsH;

    var h = '<div' + dp('lead') + ' style="position:absolute;left:' + SIDE + 'px;top:' + px(y) + ';width:' + CW + 'px">';
    lead.forEach(function (line, i) {
      h += '<div class="display" data-lead="' + i + '" style="font-size:' + px(size) + ';line-height:' + LH +
        ';color:' + T.lead + ';text-align:center;white-space:nowrap">' + esc(line) + '</div>';
    });
    h += '</div>';
    h += '<div class="label-narrow"' + ed('meta.note') + dp('note') + ' style="position:absolute;left:' + SIDE +
      'px;top:' + px(noteY) + ';width:' + CW + 'px;font-size:' + F.note + 'px;letter-spacing:.22em;color:' +
      T.note + ';text-align:center;text-transform:uppercase">' + esc(st.meta.note) + '</div>';
    if (rows) {
      h += rule(SIDE, termsY, CW, T.termRule, 'termRule');
      st.terms.forEach(function (t, i) {
        var ry = termsY + 18 + i * F.termPitch;
        var vf = fitSize(t.value, F.termValue, CW * 0.62, 'Inter', 500, 0, 20);
        h += '<div style="position:absolute;left:' + SIDE + 'px;top:' + px(ry) + ';width:' + CW +
          'px;display:flex;justify-content:space-between;align-items:baseline;gap:24px">' +
          '<span class="label-narrow" data-term="' + i + '" data-field="label"' + dp('termLabel') +
          ' style="font-size:' + F.termLabel + 'px;letter-spacing:.2em;color:' + T.termLabel + ';white-space:nowrap">' + esc(t.label) + '</span>' +
          '<span class="body-med" data-term="' + i + '" data-field="value"' + dp('termValue') +
          ' style="font-size:' + px(vf) + ';color:' + T.termValue + ';white-space:nowrap;text-align:right">' + esc(t.value) + '</span></div>';
      });
    }
    return { html: h, depth: depth, leadSize: size };
  }

  /* ---------- one card ----------
     A paper plate with the gold hairline inside its padding, the
     photo cropped to 63x88 at its chosen centre, and — on the front
     card only — the corner brackets. The plate is `T.plate`, not
     white: white on this field glows. Shadows are navy-tinted. */
  function cardHTML(c, x, y, w, rot, front) {
    var h = Math.round(w * CARD_RATIO), pw = w + PAD * 2, ph = h + PAD * 2;
    var corner = function (cx, cy, vb, tx, ty, k) {
      return '<svg' + dp('bracket') + ' style="position:absolute;left:' + cx + 'px;top:' + cy + 'px;width:44px;height:44px" viewBox="' + vb + '">' +
        '<g transform="translate(' + tx + ' ' + ty + ')">' + B.bracket({ len: 30, sw: 2.2, corner: k, color: T.bracket }) + '</g></svg>';
    };
    var img = c.src
      ? '<img src="' + c.src + '" alt="" style="display:block;width:100%;height:100%;object-fit:cover;object-position:50% 50%;position:relative"/>'
      : '<div style="width:100%;height:100%;border:2px dashed ' + T.plateFrame + ';opacity:.5"></div>';
    return '<div' + dp('plate') + ' data-card="' + c._id + '" style="position:absolute;left:' + px(x) + ';top:' + px(y) +
      ';width:' + px(pw) + ';height:' + px(ph) + ';padding:' + PAD + 'px;box-sizing:border-box;background:' + T.plate +
      ';transform:rotate(' + rot.toFixed(2) + 'deg);transform-origin:50% 50%;' +
      'box-shadow:0 ' + (front ? 36 : 22) + 'px ' + (front ? 64 : 44) + 'px rgba(23,48,79,' + (front ? '.30' : '.22') + '),0 2px 6px rgba(23,48,79,.14);' +
      'z-index:' + (front ? 3 : 2) + '">' +
      '<div' + dp('plateFrame') + ' style="position:absolute;inset:' + (PAD / 2) + 'px;border:1px solid ' + T.plateFrame + ';opacity:.85;pointer-events:none"></div>' +
      img +
      (front ? corner(-10, -10, '0 0 60 60', 2, 2, 'tl') + corner(pw - 34, -10, '-60 0 60 60', -2, 2, 'tr') +
               corner(-10, ph - 34, '0 -60 60 60', 2, -2, 'bl') + corner(pw - 34, ph - 34, '-60 -60 60 60', -2, -2, 'br') : '') +
      '</div>';
  }

  /* ---------- the fan ----------
     Given the depth it may have, size the middle card, then place
     every card by its distance k from the centre. Returns the html,
     the hit rectangles for the editor, and the depth actually used. */
  function fan(st, F, fanY, avail) {
    var cards = st.cards, N = cards.length;
    if (!N) return { html: '', hits: [], depth: 0, midW: 0 };
    var midHmax = Math.round(F.midW * CARD_RATIO) + PAD * 2;
    var midH = Math.max(120, Math.min(midHmax, avail));
    var midW = (midH - PAD * 2) / CARD_RATIO;
    var k0 = (N - 1) / 2, kMax = k0;
    var shrink = 0.19, sz = midW / F.midW;

    var wOf = function (k) { return midW * Math.max(0.5, 1 - shrink * Math.abs(k)); };
    /* the spread the composition asks for, then clamped so the
       outermost plate stays 40px inside the artboard */
    var unit = F.spread * sz * st.meta.spread * (N === 2 ? 1.2 : 1);
    if (kMax > 0) {
      var wOuter = wOf(kMax) + PAD * 2;
      unit = Math.min(unit, (W / 2 - 40 - wOuter / 2) / kMax);
    }
    var tiltStep = F.tilt * st.meta.tilt * (N > 3 ? 0.8 : 1);
    var front = Math.floor(N / 2);

    var html = '', hits = [], bottom = fanY;
    var order = [];
    for (var i = 0; i < N; i++) order.push(i);
    /* draw the flanks first, the front card last */
    order.sort(function (a, b) { return Math.abs(b - k0) - Math.abs(a - k0); });
    order.forEach(function (i) {
      var k = i - k0, w = wOf(k), h = Math.round(w * CARD_RATIO);
      var x = W / 2 + k * unit - w / 2 - PAD;
      var y = fanY + Math.abs(k) * F.sideDrop * sz;
      var rot = k * tiltStep + (i === front && N > 1 ? -1.5 : 0);
      html += cardHTML(cards[i], x, y, w, rot, i === front);
      hits.push({ id: cards[i]._id, x: x, y: y, w: w + PAD * 2, h: h + PAD * 2, rot: rot, i: i });
      bottom = Math.max(bottom, y + h + PAD * 2);
    });
    return { html: html, hits: hits, depth: bottom - fanY, midW: midW, midH: midH };
  }

  function signoff(st, F) {
    return '<div style="position:absolute;left:' + SIDE + 'px;top:' + F.signY + 'px;width:' + CW +
      'px;display:flex;justify-content:space-between;align-items:baseline">' +
      '<span class="label-narrow"' + ed('meta.handle') + dp('handle') + ' style="font-size:' + F.sign + 'px;letter-spacing:.22em;color:' + T.handle + '">' + esc(st.meta.handle) + '</span>' +
      '<span class="label-narrow"' + ed('meta.region') + dp('region') + ' style="font-size:' + F.sign + 'px;letter-spacing:.22em;color:' + T.region + '">' + esc(st.meta.region) + '</span></div>';
  }

  /* ---------- assembly ----------
     Text block first, then the header yields if it must, then the
     fan takes what is left. */
  function build(st) {
    var F = formatOf(st);
    useTheme(st);
    var text = textBlock(st, F, 0);
    var limit = F.plinthR - 24;                      /* the plinth's high edge */
    var fixed = text.depth + F.leadGap + F.fanGap;
    var s = (limit - fixed - F.fanMin) / headerDepth(F, 1);
    s = Math.max(0.72, Math.min(1, s));

    var head = header(st, F, s);
    var fanY = head.bottom + F.fanGap;
    var avail = limit - fixed - head.bottom;
    var f = fan(st, F, fanY, avail);
    var textY = fanY + (f.depth || 0) + F.leadGap;
    if (!st.cards.length) textY = fanY;
    text = textBlock(st, F, textY);

    var html = ground(F, head.logoCy) +
      '<div class="plane-3">' + head.html + f.html + text.html + signoff(st, F) + '</div>';
    return {
      html: html, hits: f.hits, F: F,
      layout: { headerScale: s, midW: f.midW || 0, leadSize: text.leadSize, fanAvail: avail,
                textBottom: textY + text.depth, limit: limit }
    };
  }

  global.SaleCard = { W: W, SIDE: SIDE, CW: CW, PAD: PAD, FORMATS: FORMATS, formatOf: formatOf,
                      useTheme: useTheme, build: build, esc: esc };
})(window);
