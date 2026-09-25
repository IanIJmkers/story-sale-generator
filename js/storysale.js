/* ============================================================
   ARTBOARD — THE STORY SALE

   Drawing lives in sale-card.js; this file owns the editor's hooks
   into the drawn artboard:

   · every card gets a hit area you can click to choose a photo and
     drop a file on to replace it — the hit area is `.chrome`, so it
     is stripped from the export and hidden in preview
   · the lead lines and the term rows are typed on the artboard,
     silently, and the artboard is rebuilt when the caret leaves
   · the fixed copy uses the shared data-edit binding
   ============================================================ */
(function (global) {
  'use strict';

  var S = global.Store, E = global.Editor, K = global.SaleCard;
  var page = null;

  function pick(id) {
    var i = document.createElement('input');
    i.type = 'file'; i.accept = 'image/*';
    i.onchange = function () { if (i.files && i.files[0]) replace(id, i.files[0]); };
    i.click();
  }
  function replace(id, file) {
    S.readImage(file).then(function (im) {
      S.updateCard(id, { src: im.src, w: im.origW, h: im.origH, fx: 50, fy: 50 });
      render();
      global.SalePanel.refresh(lastLayout, true);
    }, function (err) { alert(err.message); });
  }

  /* The hit area sits exactly on the plate, rotated with it, so a
     click on a tilted flank lands on that flank and not on the field
     beside it. */
  function hitArea(h) {
    var st = S.load(), c = st.cards[h.i];
    var d = document.createElement('div');
    d.className = 'chrome card-hit' + (c && !c.src ? ' empty' : '');
    d.style.cssText = 'left:' + h.x.toFixed(1) + 'px;top:' + h.y.toFixed(1) + 'px;width:' + h.w.toFixed(1) +
      'px;height:' + h.h.toFixed(1) + 'px;transform:rotate(' + h.rot.toFixed(2) + 'deg);transform-origin:50% 50%';
    d.title = 'Klik om een foto te kiezen, of sleep er één op';
    d.innerHTML = '<span class="card-hit-l">' + (c && c.src ? 'Vervang foto' : 'Kies een foto') + '</span>';
    d.onclick = function () { pick(h.id); };
    d.ondragover = function (ev) { ev.preventDefault(); d.classList.add('over'); };
    d.ondragleave = function () { d.classList.remove('over'); };
    d.ondrop = function (ev) {
      ev.preventDefault(); d.classList.remove('over');
      var f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
      if (f) replace(h.id, f);
    };
    return d;
  }

  /* Lead lines and term cells are indexed fields rather than store
     paths, so they bind here. Same caret rule as everywhere: type
     silently, rebuild on blur. */
  function bindIndexed(root) {
    var plain = function (n) {
      n.setAttribute('contenteditable', 'plaintext-only');
      n.setAttribute('spellcheck', 'false');
      n.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); n.blur(); } });
      n.addEventListener('paste', function (ev) {
        ev.preventDefault();
        var t = (ev.clipboardData || global.clipboardData).getData('text');
        document.execCommand('insertText', false, String(t).replace(/\s+/g, ' ').trim());
      });
      n.addEventListener('blur', function () { render(); global.SalePanel.refresh(lastLayout, true); });
    };
    Array.prototype.forEach.call(root.querySelectorAll('[data-lead]'), function (n) {
      plain(n);
      n.addEventListener('input', function () {
        S.load().meta.lead[+n.getAttribute('data-lead')] = n.textContent.trim();
        S.persist();
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('[data-term]'), function (n) {
      plain(n);
      n.addEventListener('input', function () {
        var t = S.load().terms[+n.getAttribute('data-term')];
        if (t) { t[n.getAttribute('data-field')] = n.textContent.trim(); S.persist(); }
      });
    });
  }

  var lastLayout = null;
  function render() {
    var st = S.load();
    var out = K.build(st);
    lastLayout = out.layout;
    E.setSize(K.W, out.F.h);
    page.innerHTML = out.html;
    out.hits.forEach(function (h) { page.appendChild(hitArea(h)); });
    E.bindEditables(page, null);
    bindIndexed(page);
    E.fitStage();
    global.SalePanel.refresh(out.layout);
  }

  global.StorySale = {
    init: function () { page = document.querySelector('.page'); render(); },
    render: render, pick: pick, replace: replace
  };
})(window);
