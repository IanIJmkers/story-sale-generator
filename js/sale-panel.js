/* ============================================================
   THE PANEL — story sale

   The same shape as the agenda's panel, for the same reason: three
   named sections behind a switcher, nothing more than one click
   deep, every field labelled, every swatch lighting up what it
   paints.

     KAARTEN    the photos — choose, order, crop, add, remove; and
                how wide the fan spreads
     KLEUREN    every colour on the story
     TEKST      the heading, the lead lines, the note, the terms,
                the sign-off

   Under all three: CONTROLE. Nothing is forbidden; everything is
   measured — contrast, a photo too small to survive the 2x export,
   a lead line that had to be set smaller to fit.
   ============================================================ */
(function (global) {
  'use strict';

  var S = global.Store, E = global.Editor, K = global.SaleCard, el = null;
  var mount = null, typing = false, lastLayout = null, section = 'kaarten';

  function init(opts) { el = E.el; mount = document.querySelector(opts.mount); }
  function draw() { return global.StorySale.render(); }
  function redrawAll() { typing = false; draw(); }

  /* ---------- small builders ---------- */
  function field(labelText, input, note) {
    return el('label', { class: 'f' }, [
      el('span', { class: 'f-l', text: labelText }), input,
      note ? el('span', { class: 'f-n', text: note }) : null
    ]);
  }
  function textField(labelText, path, value, note) {
    return field(labelText, el('input', {
      type: 'text', value: value, spellcheck: 'false',
      oninput: function () { S.setPath(path, this.value, true); draw(); }
    }), note);
  }
  function range(labelText, value, min, max, step, onInput, note) {
    var out = el('span', { class: 'f-v', text: fmt(value) });
    var r = el('input', {
      type: 'range', min: min, max: max, step: step, value: value,
      oninput: function () { out.textContent = fmt(+this.value); onInput(+this.value); }
    });
    return el('div', { class: 'f' }, [
      el('span', { class: 'f-l' }, [el('span', { text: labelText }), out]), r,
      note ? el('span', { class: 'f-n', text: note }) : null
    ]);
  }
  function fmt(v) { return Number.isInteger(v) ? String(v) : v.toFixed(2); }

  /* ---------- KAARTEN ---------- */
  var pending = null;
  function live(fn) {
    /* sliders fire continuously; one redraw per frame is plenty */
    if (pending) return;
    pending = global.requestAnimationFrame(function () { pending = null; fn(); });
  }

  function cardRow(c, i, n) {
    var thumb = el('div', { class: 'thumb' + (c.src ? '' : ' empty') });
    if (c.src) thumb.appendChild(el('img', { src: c.src, alt: '' }));
    else thumb.textContent = '?';
    thumb.style.backgroundPosition = c.fx + '% ' + c.fy + '%';
    thumb.onclick = function () { global.StorySale.pick(c._id); };

    var kids = [
      el('div', { class: 'show-h' }, [
        el('span', { class: 'num', text: String(i + 1) }),
        el('span', { class: 'stamp' + (c.src ? '' : ' marker'), text:
          !c.src ? 'Nog geen foto' :
          (c.w && c.h ? c.w + ' × ' + c.h + ' px' : 'Foto gekozen') +
          (i === Math.floor(n / 2) ? ' · voorste kaart' : '') }),
        el('button', { class: 'mini', title: 'Naar links', text: '‹', disabled: i === 0 ? '' : null,
          onclick: function () { S.moveCard(c._id, -1); redrawAll(); } }),
        el('button', { class: 'mini', title: 'Naar rechts', text: '›', disabled: i === n - 1 ? '' : null,
          onclick: function () { S.moveCard(c._id, 1); redrawAll(); } }),
        el('button', { class: 'kill', title: 'Verwijder deze kaart', text: '✕',
          onclick: function () {
            if (!confirm('Kaart ' + (i + 1) + ' van de waaier halen?')) return;
            S.removeCard(c._id); redrawAll();
          } })
      ]),
      el('div', { class: 'card-body' }, [
        thumb,
        el('div', { class: 'card-ctl' }, [
          el('button', { class: 'btn ghost wide', style: 'margin-top:0', text: c.src ? 'Andere foto…' : 'Foto kiezen…',
            onclick: function () { global.StorySale.pick(c._id); } }),
          c.src ? range('Uitsnede ↔', c.fx, 0, 100, 1, function (v) {
            S.updateCard(c._id, { fx: v }, true); live(draw);
          }) : null,
          c.src ? range('Uitsnede ↕', c.fy, 0, 100, 1, function (v) {
            S.updateCard(c._id, { fy: v }, true); live(draw);
          }) : null
        ])
      ])
    ];
    var card = el('div', { class: 'show' }, kids);
    card.setAttribute('data-card', c._id);
    return card;
  }

  function kaartenSection(st) {
    var box = el('div', {});
    box.appendChild(el('p', { class: 'hint', text:
      'Klik een kaart op de story om een foto te kiezen, of sleep een foto erop. ' +
      'Een foto wordt bijgesneden op 63 × 88 — de verhouding van een kaart — en ' +
      'met de schuiven kies je welk deel je ziet.' }));
    st.cards.forEach(function (c, i) { box.appendChild(cardRow(c, i, st.cards.length)); });
    box.appendChild(el('button', {
      class: 'btn primary wide', text: '+ Kaart toevoegen',
      disabled: st.cards.length >= S.MAX_CARDS ? '' : null,
      onclick: function () {
        var c = S.addCard();
        redrawAll();
        if (c) global.StorySale.pick(c._id);
      }
    }));
    if (st.cards.length >= S.MAX_CARDS) {
      box.appendChild(el('p', { class: 'hint', style: 'margin-top:8px', text:
        'Vijf is het maximum: daarboven wordt elke kaart te klein om op een telefoon te lezen.' }));
    }

    box.appendChild(el('h3', { text: 'De waaier' }));
    box.appendChild(range('Spreiding', st.meta.spread, 0.5, 1.4, 0.05, function (v) {
      S.setPath('meta.spread', v, true); live(draw);
    }, 'Hoe ver de kaarten uit elkaar staan. Ze blijven altijd binnen de story.'));
    box.appendChild(range('Kanteling', st.meta.tilt, 0, 2, 0.1, function (v) {
      S.setPath('meta.tilt', v, true); live(draw);
    }, 'Hoe schuin de buitenste kaarten staan. 0 is recht.'));
    box.appendChild(el('button', {
      class: 'btn wide ghost', text: 'Terug naar de goedgekeurde waaier',
      onclick: function () { S.setPath('meta.spread', 1, true); S.setPath('meta.tilt', 1, true); redrawAll(); }
    }));
    return box;
  }

  /* ---------- KLEUREN ---------- */
  var GROUPS = [
    ['Vlak', [
      ['bg', 'Achtergrond'], ['pattern', 'Golfpatroon'], ['halo', 'Cirkel achter logo']
    ]],
    ['De sjerp (hoek en voet)', [
      ['sashNavy', 'Blauw vlak'], ['sashDeep', 'Blauw, donkere kant'], ['sashGold', 'Gouden rand'],
      ['sashGap', 'Lichte rand'], ['sashPattern', 'Golfpatroon op blauw']
    ]],
    ['Kop', [
      ['heading', 'Kop (STORY SALE)'], ['headRule', 'Lijntjes naast de kop']
    ]],
    ['De kaarten', [
      ['plate', 'Plaatje achter de foto'], ['plateFrame', 'Dunne lijn om de foto'], ['bracket', 'Hoekjes voorste kaart']
    ]],
    ['De tekst', [
      ['lead', 'Grote regels'], ['note', 'Regel eronder'],
      ['termRule', 'Lijn boven de voorwaarden'], ['termLabel', 'Voorwaarde (links)'], ['termValue', 'Waarde (rechts)']
    ]],
    ['Onderaan, op blauw', [
      ['handle', 'Instagram-naam'], ['region', 'Regio']
    ]]
  ];

  function lum(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
    if (!m) return 0;
    var n = parseInt(m[1], 16);
    var c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) {
      v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function ratio(a, b) {
    var A = lum(a), B2 = lum(b);
    return (Math.max(A, B2) + 0.05) / (Math.min(A, B2) + 0.05);
  }
  function spotlight(part, on) {
    var page = document.querySelector('.page');
    if (!page) return;
    Array.prototype.forEach.call(page.querySelectorAll('[data-part="' + part + '"]'),
      function (n) { n.classList.toggle('spot', on); });
  }
  function setColour(key, value, hexOut) {
    S.load().theme[key] = value;
    if (hexOut) hexOut.value = value.toUpperCase();
    S.persist();
    live(function () { draw(); spotlight(key, true); });
  }
  function swatch(key, label) {
    var th = S.load().theme;
    var dot = el('input', { type: 'color', value: th[key], 'aria-label': label,
      oninput: function () { setColour(key, this.value, hex); } });
    var hex = el('input', { class: 'hex', type: 'text', value: String(th[key]).toUpperCase(), spellcheck: 'false',
      'aria-label': label + ' hex',
      onchange: function () {
        var v = this.value.trim();
        if (!/^#/.test(v)) v = '#' + v;
        if (!/^#[0-9a-f]{6}$/i.test(v)) { this.value = String(S.load().theme[key]).toUpperCase(); return; }
        dot.value = v; setColour(key, v, this);
      } });
    var back = el('button', { class: 'undo', title: 'Terug naar de huisstijlkleur', text: '↺',
      onclick: function () { var d = S.DEFAULTS.theme[key]; dot.value = d; setColour(key, d, hex); paint(lastLayout); } });
    if (String(th[key]).toUpperCase() === S.DEFAULTS.theme[key].toUpperCase()) back.disabled = true;
    var row = el('div', { class: 'crow' }, [el('span', { text: label }), hex, dot, back]);
    row.addEventListener('mouseenter', function () { spotlight(key, true); });
    row.addEventListener('mouseleave', function () { spotlight(key, false); });
    return row;
  }
  function kleurenSection() {
    var box = el('div', {});
    box.appendChild(el('p', { class: 'hint', text:
      'Ga met de muis over een regel om te zien welk onderdeel het is. ' +
      'Met ↺ zet je er één terug, onderaan zet je alles terug.' }));
    GROUPS.forEach(function (g) {
      box.appendChild(el('h3', { text: g[0] }));
      g[1].forEach(function (r) { box.appendChild(swatch(r[0], r[1])); });
    });
    box.appendChild(el('button', { class: 'btn wide ghost', text: 'Herstel huisstijlkleuren',
      onclick: function () {
        var th = S.load().theme;
        for (var k in S.DEFAULTS.theme) th[k] = S.DEFAULTS.theme[k];
        S.persist(); redrawAll();
      } }));
    box.appendChild(el('p', { class: 'hint', style: 'margin:10px 0 0', text:
      'Het logo krijgt geen kleurkeuze: dat is het aangeleverde bestand en dat wordt niet hertint.' }));
    return box;
  }

  /* ---------- TEKST ---------- */
  function tekstSection(st) {
    var box = el('div', {});
    box.appendChild(el('h3', { text: 'Kop' }));
    box.appendChild(textField('Kop', 'meta.heading', st.meta.heading));

    box.appendChild(el('h3', { text: 'Grote regels' }));
    st.meta.lead.forEach(function (line, i) {
      var inp = el('input', { type: 'text', value: line, spellcheck: 'false',
        oninput: function () { S.load().meta.lead[i] = this.value; S.persist(); draw(); } });
      var row = el('div', { class: 'pair' }, [
        field('Regel ' + (i + 1), inp),
        st.meta.lead.length > 1 ? el('button', { class: 'kill tall', title: 'Regel weghalen', text: '✕',
          onclick: function () { st.meta.lead.splice(i, 1); S.persist(); redrawAll(); } }) : null
      ]);
      box.appendChild(row);
    });
    if (st.meta.lead.length < 3) {
      box.appendChild(el('button', { class: 'btn ghost wide', text: '+ Regel', style: 'margin-top:0',
        onclick: function () { st.meta.lead.push(''); S.persist(); redrawAll(); } }));
    }
    box.appendChild(el('p', { class: 'hint', style: 'margin-top:8px', text:
      'Een regel die te lang is voor de breedte wordt vanzelf kleiner gezet — en Controle zegt het.' }));

    box.appendChild(el('h3', { text: 'Regel eronder' }));
    box.appendChild(textField('Tekst', 'meta.note', st.meta.note, 'Wordt in kapitalen gezet'));

    box.appendChild(el('h3', { text: 'Voorwaarden' }));
    st.terms.forEach(function (t, i) {
      var l = el('input', { type: 'text', value: t.label, spellcheck: 'false', class: 'name',
        oninput: function () { t.label = this.value; S.persist(); draw(); } });
      var v = el('input', { type: 'text', value: t.value, spellcheck: 'false',
        oninput: function () { t.value = this.value; S.persist(); draw(); } });
      box.appendChild(el('div', { class: 'pair' }, [
        field('Links', l), field('Rechts', v),
        el('button', { class: 'kill tall', title: 'Voorwaarde weghalen', text: '✕',
          onclick: function () { S.removeTerm(i); redrawAll(); } })
      ]));
    });
    if (st.terms.length < 4) {
      box.appendChild(el('button', { class: 'btn ghost wide', text: '+ Voorwaarde', style: 'margin-top:0',
        onclick: function () { S.addTerm(); redrawAll(); } }));
    }
    box.appendChild(el('p', { class: 'hint', style: 'margin-top:8px', text:
      'Elke voorwaarde erbij haalt ruimte bij de kaarten weg; de tekst blijft op maat.' }));

    box.appendChild(el('h3', { text: 'Onderaan' }));
    box.appendChild(textField('Instagram-naam', 'meta.handle', st.meta.handle));
    box.appendChild(textField('Regio', 'meta.region', st.meta.region));
    return box;
  }

  /* ---------- warnings ---------- */
  var ON_BG = [['heading', 'Kop'], ['lead', 'Grote regels'], ['note', 'Regel eronder'],
               ['termLabel', 'Voorwaarde'], ['termValue', 'Waarde']];
  var ON_NAVY = [['handle', 'Instagram-naam'], ['region', 'Regio']];

  function warnings(L) {
    var st = S.load(), th = st.theme, F = K.formatOf(st), out = [];

    var empty = st.cards.filter(function (c) { return !c.src; }).length;
    if (!st.cards.length) out.push(['Geen kaarten', 'Er staat geen enkele kaart op de story. Voeg er één toe onder Kaarten.', false]);
    if (empty) out.push(['Nog geen foto', empty + ' kaart(en) hebben nog geen foto en drukken als leeg plaatje af.', false]);

    /* A card is drawn at up to ~500px tall and exported at 2x, so a
       photo under ~900px tall is being blown up. */
    var soft = st.cards.filter(function (c) { return c.src && c.h && c.h < 900; });
    if (soft.length) {
      out.push(['Foto aan de kleine kant',
        soft.map(function (c) { return st.cards.indexOf(c) + 1; }).join(', ') +
        ': korter dan 900 px. In de HD-export wordt die wazig. Een foto van een kaart is het scherpst op 1200 px of meer.', false]);
    }
    var portrait = st.cards.filter(function (c) { return c.src && c.w && c.h && c.w > c.h; });
    if (portrait.length) {
      out.push(['Liggende foto', 'Kaart ' +
        portrait.map(function (c) { return st.cards.indexOf(c) + 1; }).join(', ') +
        ' is breder dan hoog en wordt fors bijgesneden. Schuif de uitsnede, of kies een staande foto.', false]);
    }

    if (L) {
      if (L.leadSize < F.lead - 0.5) {
        out.push(['Grote regel verkleind',
          'Een regel is te lang voor de breedte en staat op ' + Math.round(L.leadSize) + ' px in plaats van ' +
          F.lead + '. Korter is groter.', false]);
      }
      if (L.headerScale < 0.999) {
        out.push(['Kop ingekrompen', 'Het logo en de kop staan op ' + Math.round(L.headerScale * 100) +
          '% om de kaarten ruimte te geven. Minder voorwaarden of regels geeft de kop terug.', false]);
      }
      if (st.cards.length && L.midW < 240) {
        out.push(['Kaarten klein', 'De voorste kaart is ' + Math.round(L.midW) + ' px breed. ' +
          (F.key === 'post' ? 'In 4:5 is dat de prijs van 570 px minder hoogte — voor een story is 9:16 groter. ' : '') +
          'Minder tekst onder de kaarten maakt ze groter.', false]);
      }
    }

    var weak = ON_BG.filter(function (p) { return ratio(th[p[0]], th.bg) < 4.5; });
    if (weak.length) {
      out.push(['Te weinig contrast', weak.map(function (p) {
        return p[1] + ' (' + ratio(th[p[0]], th.bg).toFixed(1) + ':1)';
      }).join(', ') + ' — onder 4,5:1 tegen de achtergrond.', false]);
    }
    var weakN = ON_NAVY.filter(function (p) { return ratio(th[p[0]], th.sashNavy) < 4.5; });
    if (weakN.length) {
      out.push(['Te weinig contrast op blauw', weakN.map(function (p) {
        return p[1] + ' (' + ratio(th[p[0]], th.sashNavy).toFixed(1) + ':1)';
      }).join(', ') + ' — onder 4,5:1 tegen de sjerp.', false]);
    }
    var LOGO_INK = '#1B3A5C';
    if (ratio(LOGO_INK, th.bg) < 3) {
      out.push(['Logo valt weg', 'Het logo is aangeleverd in donkerblauwe inkt en mag niet hertint worden. ' +
        'Tegen deze achtergrond is dat ' + ratio(LOGO_INK, th.bg).toFixed(1) + ':1.', false]);
    }

    if (!out.length) out.push(['In orde', 'Alles staat binnen de veilige zone en leest van een afstandje.', true]);
    return out;
  }
  function paintWarnings(L) {
    var box = mount.querySelector('[data-warnings]');
    if (!box) return;
    box.innerHTML = '';
    warnings(L).forEach(function (w) {
      box.appendChild(el('div', { class: 'warn' + (w[2] ? ' ok' : '') }, [
        el('strong', { text: w[0] }), el('span', { text: w[1] })
      ]));
    });
  }

  /* ---------- assembly ---------- */
  var TABS = [['kaarten', 'Kaarten'], ['kleuren', 'Kleuren'], ['tekst', 'Tekst']];

  function paint(L) {
    var st = S.load();
    mount.innerHTML = '';
    var nav = el('div', { class: 'pnav' });
    TABS.forEach(function (t) {
      nav.appendChild(el('button', { class: 'pnav-b' + (section === t[0] ? ' on' : ''), text: t[1],
        onclick: function () { section = t[0]; paint(lastLayout); } }));
    });
    mount.appendChild(nav);
    mount.appendChild(section === 'kleuren' ? kleurenSection() :
                      section === 'tekst' ? tekstSection(st) : kaartenSection(st));
    var box = el('div', {});
    box.setAttribute('data-warnings', '1');
    mount.appendChild(el('h2', { text: 'Controle' }));
    mount.appendChild(box);
    paintWarnings(L);

    Array.prototype.forEach.call(
      mount.querySelectorAll('input[type="text"],input[type="color"],input[type="range"]'),
      function (n) {
        n.addEventListener('focus', function () { typing = true; });
        n.addEventListener('blur', function () { typing = false; });
      });
  }

  function refresh(L, force) {
    lastLayout = L;
    if (typing && !force) { paintWarnings(L); return; }
    paint(L);
  }

  global.SalePanel = { init: init, refresh: refresh, redrawAll: redrawAll };
})(window);
