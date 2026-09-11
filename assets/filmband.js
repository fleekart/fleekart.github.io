/* ═══════════════════════════════════════════════════════════════
   FLEEKART — THE FILM BAND
   The handover film between the hero and About. It arrives as an
   inset window and opens to full bleed as the section is scrolled
   into, then holds there.

   · The window opens, not the video. Only the clip-path and a small
     counter-scale are tweened, so the footage is never resized and
     can never letterbox or stretch mid-move.
   · Scrubbed, so it is re-evaluated continuously and can never be
     stranded part-open by a ScrollTrigger.refresh().
   · The video is oversized while the window is opening and settles
     to 1 exactly as the window reaches the edges, so no edge of the
     band is ever exposed.

   app.js owns the lazy source and the in-view autoplay; this only
   layers the arrival on top of the element it already manages.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var band = document.getElementById('street');
  if (!band) return;

  var vid = band.querySelector('.filmband__vid');
  if (!vid) return;

  var REDUCED = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Without motion — or without GSAP — the band is simply open, and
     the caption shows: it is content, not decoration. */
  if (REDUCED || typeof window.gsap === 'undefined' || !window.ScrollTrigger) {
    band.style.setProperty('--cx', '0%');
    band.style.setProperty('--cy', '0%');
    band.style.setProperty('--cr', '0px');
    band.classList.add('is-read');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  var WIDE = window.innerWidth > 820;

  gsap.fromTo(band,
    { '--cx': WIDE ? '9%'  : '6%',
      '--cy': WIDE ? '7%'  : '5%',
      '--cr': WIDE ? '26px' : '18px' },
    {
      '--cx': '0%', '--cy': '0%', '--cr': '0px',
      ease: 'none',
      scrollTrigger: {
        trigger: band,
        start: 'top bottom',      /* the moment its first pixel is on screen */
        end:   'top 26%',         /* open well before it is read */
        scrub: 0.55,
        invalidateOnRefresh: true
      }
    });

  /* the push behind the opening window */
  gsap.fromTo(vid,
    { scale: WIDE ? 1.12 : 1.08 },
    {
      scale: 1, ease: 'none',
      scrollTrigger: {
        trigger: band,
        start: 'top bottom',
        end:   'top 26%',
        scrub: 0.55,
        invalidateOnRefresh: true
      }
    });

  /* the caption arrives once the band is properly on screen */
  ScrollTrigger.create({
    trigger: band,
    start: 'top 62%',
    onEnter:     function () { band.classList.add('is-read'); },
    onLeaveBack: function () { band.classList.remove('is-read'); }
  });
})();
