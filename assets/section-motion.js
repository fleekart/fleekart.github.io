/* ═══════════════════════════════════════════════════════════════
   FLEEKART — SECTION TRANSITIONS
   The seams between sections, and nothing else. app.js keeps every
   reveal, sequence and widget it already owns; this only gives each
   section a considered arrival as the one before it hands over.

   Deliberately narrow, after two rounds that went too far:

   · Transform only. No opacity is touched anywhere, so no text can
     ever render at reduced contrast.
   · Scrubbed only. A scrubbed tween is re-evaluated continuously and
     is settled by definition once the section is in view — unlike a
     one-shot `from`, which ScrollTrigger.refresh() can revert and
     strand at its start state.
   · Nothing inside the handover widget or the Plinks equation moves:
     both position elements from measured boxes.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var doc = document;

  if (window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof window.gsap === 'undefined' || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  var WIDE = window.innerWidth > 820;
  var LIFT = WIDE ? 54 : 30;   /* the opening block */
  var LAG  = WIDE ? 92 : 46;   /* the media beside it, a little behind */

  /* Settles to 0 while the section is still arriving, so it is at rest
     long before it is anywhere near read. */
  function settle(el, from, sec) {
    if (!el || !sec) return;
    gsap.fromTo(el, { y: from }, {
      y: 0, ease: 'none',
      scrollTrigger: {
        trigger: sec,
        /* Plain ranges on purpose. GSAP's clamp() variants were tried
           here to give the first section its full travel and left every
           block parked at its start offset instead of resting at 0. */
        start: 'top bottom',
        end:   'top 62%',
        scrub: 0.5,
        invalidateOnRefresh: true
      }
    });
  }

  /* ── the opening block of each section ──────────────────────
     Found from its own heading, so it is whatever wrapper that
     section happens to use — .sec-head, .about__body, .plinks__body. */

  ['about', 'how', 'plinks', 'categories', 'impact', 'download']
    .forEach(function (id) {
      var sec = doc.getElementById(id);
      if (!sec) return;
      var h = sec.querySelector('h2.d2');
      settle(h && h.parentElement, LIFT, sec);
    });

  /* ── the media beside it, arriving a beat later ─────────────
     Only sections whose media holds no measured coordinates. */

  [['about',      '.about__grid > .stage'],
   ['categories', '.cats__stage'],
   ['impact',     '.shot--impact'],
   ['download',   '.dl__art']]
    .forEach(function (pair) {
      var sec = doc.getElementById(pair[0]);
      if (!sec) return;
      settle(sec.querySelector(pair[1]), LAG, sec);
    });

  /* ── keep the measurements honest ───────────────────────────
     Films, fonts and lazy sources all change section heights after
     first paint. app.js refreshes on resize; these are the rest. */

  function refresh() { ScrollTrigger.refresh(); }

  window.addEventListener('load', refresh);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(refresh);
  Array.prototype.forEach.call(doc.querySelectorAll('video'), function (v) {
    v.addEventListener('loadedmetadata', refresh, { once: true });
  });
})();
