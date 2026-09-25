/* ============================================================
   THE STORE — story sale (cards)

   One source of truth for the story-sale artboard, shaped like the
   agenda store so the shared editor runtime (toolbar, in-place
   editing, export) can drive either without knowing which it has.

   Three things are stored:

     meta    the fixed copy — heading, the lead lines, the note,
             the sign-off, the format
     cards   the fan: an image each, plus where its crop is centred
     terms   the label / value rows under the lead

   IMAGES ARE STORED AS DATA URLS. There is no server, so a chosen
   photo has nowhere else to live. Every upload is resampled to at
   most 1200px on its long side and re-encoded as JPEG before it is
   kept: a 12-megapixel phone photo is 4 MB and would blow the
   browser's 5 MB store on the second card; at 1200px a card is
   ~150 KB and five of them fit with room to spare. 1200px is also
   more than the 2x export ever asks of a card, so nothing is lost.

   THE SHARE LINK CARRIES EVERYTHING BUT THE PICTURES. A link with
   three photos in it is half a megabyte and no messenger will pass
   it on intact. The link keeps copy, colours and layout; the JSON
   file keeps the photos too.
   ============================================================ */
(function (global) {
  'use strict';

  var KEY = 'dennas.storysale.v1';
  var MAX_CARDS = 5, MAX_EDGE = 1200, JPEG_Q = 0.82;

  var DEFAULTS = {
    meta: {
      heading: 'STORY SALE',
      lead: ['Prices are OBO', 'Taking trades at 80–90%'],
      note: 'Shares are appreciated',
      handle: '@dennastrading',
      region: 'NEDERLAND',
      /* 'story' = 1080x1920, 'post' = 1080x1350 */
      format: 'story',
      /* how wide the fan spreads and how far the flanks tilt, as a
         multiplier on the approved composition */
      spread: 1, tilt: 1
    },
    terms: [
      { label: 'PAYMENTS', value: 'Cash / Wire / PayPal' },
      { label: 'SHIPPING', value: 'Europe' }
    ],
    /* The three approved cards. `src` is a path for these and a data
       URL for anything the client chooses. fx/fy centre the crop. */
    cards: [
      { src: 'assets/story-cards/01-pikachu-felt-hat.jpg', fx: 50, fy: 50, w: 1145, h: 1600 },
      { src: 'assets/story-cards/02-rayquaza-gold-star.jpg', fx: 50, fy: 50, w: 1145, h: 1600 },
      { src: 'assets/story-cards/03-pikachu-kimono.jpg', fx: 50, fy: 50, w: 1145, h: 1600 }
    ],
    /* Every element that carries a colour. The defaults are the print
       palette mapped onto the parts of the story; nothing is a new
       hue. The lockup is not here: it is the supplied master. */
    theme: {
      bg:          '#F4F1EA',   pattern:    '#1B3A5C',   halo:       '#1B3A5C',
      sashNavy:    '#1B3A5C',   sashDeep:   '#10233A',   sashGold:   '#C3A063',
      sashGap:     '#F4F1EA',   sashPattern:'#F4F1EA',
      heading:     '#1B3A5C',   headRule:   '#C3A063',
      plate:       '#F4F1EA',   plateFrame: '#C3A063',   bracket:    '#C3A063',
      lead:        '#1B3A5C',   note:       '#40587A',
      termRule:    '#C3A063',   termLabel:  '#40587A',   termValue:  '#1B3A5C',
      handle:      '#F4F1EA',   region:     '#A8BBD0'
    }
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function normalise(s) {
    var out = clone(DEFAULTS);
    if (s && typeof s === 'object') {
      if (s.meta) for (var k in s.meta) if (k in out.meta) out.meta[k] = s.meta[k];
      if (!Array.isArray(out.meta.lead)) out.meta.lead = String(out.meta.lead || '').split('\n');
      out.meta.lead = out.meta.lead.slice(0, 3).map(String);
      if (!out.meta.lead.length) out.meta.lead = [''];
      out.meta.spread = clamp(+out.meta.spread || 1, 0.5, 1.4);
      out.meta.tilt = clamp(isNaN(+out.meta.tilt) ? 1 : +out.meta.tilt, 0, 2);
      if (s.theme) for (var t in out.theme) if (s.theme[t]) out.theme[t] = s.theme[t];
      if (Array.isArray(s.terms)) {
        out.terms = s.terms.slice(0, 4).map(function (r) {
          return { label: String(r.label || ''), value: String(r.value || '') };
        });
      }
      if (Array.isArray(s.cards)) {
        out.cards = s.cards.slice(0, MAX_CARDS).map(function (c) {
          return { src: String(c.src || ''), fx: clamp(+c.fx || 50, 0, 100), fy: clamp(+c.fy || 50, 0, 100),
                   w: +c.w || 0, h: +c.h || 0 };
        });
      }
    }
    out.cards.forEach(function (c, i) { c._id = 'c' + i + '_' + Math.random().toString(36).slice(2, 7); });
    return out;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function stripped(withImages) {
    var c = clone(state);
    c.cards.forEach(function (k) {
      delete k._id;
      if (!withImages && /^data:/.test(k.src)) k.src = '';
    });
    return c;
  }

  /* ---------- state ---------- */
  var state = null, subs = [];

  function load() {
    if (state) return state;
    var fromHash = readHash();
    if (fromHash) { state = normalise(fromHash); persist(); return state; }
    try { state = normalise(JSON.parse(localStorage.getItem(KEY))); }
    catch (e) { state = normalise(null); }
    return state;
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(stripped(true))); }
    catch (e) {
      /* the browser store is full — almost always photos. Say so once
         rather than silently losing the next edit. */
      if (!persist.warned) {
        persist.warned = true;
        alert('De browser kan dit niet meer opslaan (te veel foto’s). ' +
              'Sla je werk op als bestand met Opslaan.');
      }
    }
  }
  function commit() { persist(); subs.forEach(function (f) { f(state); }); }
  function subscribe(fn) { subs.push(fn); }
  function reset() { state = normalise(null); commit(); }

  function setPath(path, value, silent) {
    var parts = path.split('.'), o = state, i;
    for (i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = value;
    if (silent) persist(); else commit();
  }

  /* ---------- cards ---------- */
  function indexOf(id) {
    for (var i = 0; i < state.cards.length; i++) if (state.cards[i]._id === id) return i;
    return -1;
  }
  function addCard() {
    if (state.cards.length >= MAX_CARDS) return null;
    var c = { src: '', fx: 50, fy: 50, w: 0, h: 0, _id: 'c' + Date.now().toString(36) };
    state.cards.push(c);
    commit();
    return c;
  }
  function removeCard(id) {
    var i = indexOf(id);
    if (i >= 0) { state.cards.splice(i, 1); commit(); }
  }
  function moveCard(id, dir) {
    var i = indexOf(id), j = i + dir;
    if (i < 0 || j < 0 || j >= state.cards.length) return;
    var t = state.cards[i]; state.cards[i] = state.cards[j]; state.cards[j] = t;
    commit();
  }
  function updateCard(id, patch, silent) {
    var i = indexOf(id);
    if (i < 0) return;
    for (var k in patch) state.cards[i][k] = patch[k];
    if (silent) persist(); else commit();
  }

  /* Resample a chosen file to something the store can hold and the
     export can use, then hand back a data URL plus its pixel size. */
  function readImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) { reject(new Error('Dat is geen afbeelding.')); return; }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        var k = Math.min(1, MAX_EDGE / Math.max(w, h));
        var cw = Math.round(w * k), ch = Math.round(h * k);
        var cv = document.createElement('canvas');
        cv.width = cw; cv.height = ch;
        var ctx = cv.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cw, ch);   /* PNG alpha flattens to white */
        ctx.drawImage(img, 0, 0, cw, ch);
        URL.revokeObjectURL(url);
        resolve({ src: cv.toDataURL('image/jpeg', JPEG_Q), w: cw, h: ch, origW: w, origH: h });
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Deze afbeelding kon niet gelezen worden.')); };
      img.src = url;
    });
  }

  /* ---------- terms ---------- */
  function addTerm() {
    if (state.terms.length >= 4) return;
    state.terms.push({ label: 'LABEL', value: 'Waarde' });
    commit();
  }
  function removeTerm(i) { state.terms.splice(i, 1); commit(); }

  /* ---------- getting work off the machine ---------- */
  function toJSON() { return JSON.stringify(stripped(true), null, 2); }
  function fromJSON(text) { state = normalise(JSON.parse(text)); commit(); }

  function b64encode(str) {
    return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64decode(str) {
    var s = str.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return decodeURIComponent(escape(atob(s)));
  }
  function readHash() {
    var m = /[#&]d=([^&]+)/.exec(global.location.hash || '');
    if (!m) return null;
    try { return JSON.parse(b64decode(m[1])); } catch (e) { return null; }
  }
  function shareLink() {
    var base = global.location.href.split('#')[0];
    return base + '#d=' + b64encode(JSON.stringify(stripped(false)));
  }

  global.Store = {
    load: load, save: commit, persist: persist, reset: reset, subscribe: subscribe, setPath: setPath,
    addCard: addCard, removeCard: removeCard, moveCard: moveCard, updateCard: updateCard,
    readImage: readImage, addTerm: addTerm, removeTerm: removeTerm,
    toJSON: toJSON, fromJSON: fromJSON, shareLink: shareLink,
    DEFAULTS: DEFAULTS, MAX_CARDS: MAX_CARDS
  };
})(window);
