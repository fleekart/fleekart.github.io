(function () {
  'use strict';
  var doc = document, body = doc.body;
  body.classList.remove('no-js');

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var REDUCED = mqReduce.matches;
  if (REDUCED) body.classList.add('reduced');

  var hasGSAP = typeof window.gsap !== 'undefined';
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ─────────────── reveal on scroll (CSS + IO) ─────────────── */
  var rvs = Array.prototype.slice.call(doc.querySelectorAll('.rv'));
  function showAll() { rvs.forEach(function (e) { e.classList.add('is-in'); }); }
  if (REDUCED || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    var rio = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.style.transitionDelay = (n++ * 70) + 'ms';
        en.target.classList.add('is-in');
        rio.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -9% 0px', threshold: 0.01 });
    rvs.forEach(function (e) { rio.observe(e); });
    /* belt and braces: nothing may ever be stuck invisible */
    window.addEventListener('load', function () {
      setTimeout(function () {
        rvs.forEach(function (e) {
          if (e.getBoundingClientRect().top < window.innerHeight) e.classList.add('is-in');
        });
      }, 400);
    });
  }

  /* ─────────────── icons: a gesture that matches the meaning ─────────────── */
  (function () {
    var HOSTS = 'a,button,li,.eq,.life,.rung,.store,.about__pt,.deal__hub,.wallet,' +
                '.catart figcaption,.deal__slot,.flow__out,.chip';
    var icons = [], hosts = [];
    Array.prototype.forEach.call(doc.querySelectorAll('svg use[href^="#i-"]'), function (u) {
      var svg = u.ownerSVGElement;
      if (!svg || svg.hasAttribute('data-ico')) return;
      svg.setAttribute('data-ico', u.getAttribute('href').slice(3));
      icons.push(svg);
      var host = svg.closest(HOSTS);
      if (host && hosts.indexOf(host) === -1) { host.classList.add('ico-host'); hosts.push(host); }
    });
    var dot = doc.querySelector('.hero__note .dot');

    if (REDUCED) return;

    /* an animation only restarts if its name genuinely changes, so the
       reveal class is dropped once it has played and hover re-adds a
       separate class after a forced reflow */
    icons.forEach(function (el) {
      el.addEventListener('animationend', function () {
        el.classList.remove('ico-in', 'ico-go');
        el.style.animationDelay = '';
      });
    });

    function replay(host) {
      Array.prototype.forEach.call(host.querySelectorAll('svg[data-ico]'), function (el) {
        el.classList.remove('ico-in', 'ico-go');
        void el.offsetWidth;                 /* forces the restart */
        el.classList.add('ico-go');
      });
    }
    if (window.matchMedia('(hover:hover)').matches) {
      hosts.forEach(function (h) { h.addEventListener('mouseenter', function () { replay(h); }); });
    }
    hosts.forEach(function (h) {
      h.addEventListener('focusin', function () { replay(h); });
    });

    /* play once, the first time each icon is actually seen —
       the impact tiles animate their own icons, so leave those alone */
    if (!('IntersectionObserver' in window)) return;
    var lifeline = doc.getElementById('lifeline');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        if (lifeline && lifeline.contains(el)) return;
        el.style.animationDelay = (Math.random() * 160 | 0) + 'ms';
        el.classList.add('ico-in');
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .4 });
    icons.forEach(function (el) { io.observe(el); });
    if (dot) io.observe(dot);
  })();

  /* ───────────────────────── navigation ───────────────────── */
  var nav = doc.getElementById('nav');
  var lastStuck = null;
  function onScroll() {
    var stuck = window.scrollY > 24;
    if (stuck !== lastStuck) { nav.classList.toggle('is-stuck', stuck); lastStuck = stuck; }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* mobile menu */
  var burger = doc.getElementById('burger'), mnav = doc.getElementById('mnav');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mnav.classList.toggle('is-open', open);
    if (open) { mnav.removeAttribute('inert'); } else { mnav.setAttribute('inert', ''); }
    body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  mnav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); }
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1080 && burger.getAttribute('aria-expanded') === 'true') setMenu(false);
  });

  /* scroll spy */
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll('.nav__links a'));
  var spyTargets = navLinks.map(function (a) { return doc.querySelector(a.getAttribute('href')); });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var i = spyTargets.indexOf(en.target);
        navLinks.forEach(function (a, j) {
          if (j === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spyTargets.forEach(function (t) { if (t) spy.observe(t); });
  }

  /* ───────────── video: lazy, plays only while on screen ───────────── */
  var vids = Array.prototype.slice.call(doc.querySelectorAll('video[data-lazyvid], video[data-inview]'));

  function loadSources(v) {
    if (v.dataset.loaded || !v.querySelector('source[data-src]')) return;
    v.dataset.loaded = '1';
    Array.prototype.forEach.call(v.querySelectorAll('source[data-src]'), function (s) {
      s.src = s.getAttribute('data-src');
    });
    v.load();
  }

  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) {
          loadSources(v);
          if (!REDUCED) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        } else if (!v.paused) { v.pause(); }
      });
    }, { rootMargin: '200px 0px' });
    vids.forEach(function (v) { vio.observe(v); });
  } else {
    vids.forEach(loadSources);
  }
  doc.addEventListener('visibilitychange', function () {
    if (doc.hidden) vids.forEach(function (v) { if (!v.paused) v.pause(); });
  });

  /* ───────────────────────── categories ───────────────────── */
  var catBtns = Array.prototype.slice.call(doc.querySelectorAll('.cat'));
  var catStage = doc.getElementById('catStage');
  var catList = doc.getElementById('catList');
  var catIndex = 0, artIndex = 0;

  /* what is on screen — hover can borrow this without changing the selection */
  function showArt(i) {
    if (i === artIndex && doc.querySelector('.catart.is-on')) return;
    var prevArt = doc.getElementById(catBtns[artIndex].getAttribute('aria-controls'));
    var nextArt = doc.getElementById(catBtns[i].getAttribute('aria-controls'));
    artIndex = i;
    nextArt.hidden = false;
    if (hasGSAP && !REDUCED) {
      gsap.killTweensOf([prevArt, nextArt]);
      gsap.set(nextArt, { opacity: 0 });
      gsap.fromTo(nextArt.querySelector('img'), { scale: 1.06 },
                  { scale: 1, duration: 1.15, ease: 'power3.out', overwrite: true });
      gsap.to(nextArt, { opacity: 1, duration: .5, ease: 'power2.out' });
      gsap.to(prevArt, {
        opacity: 0, duration: .42, ease: 'power2.out',
        onComplete: function () {
          if (prevArt !== nextArt) { prevArt.hidden = true; prevArt.classList.remove('is-on'); }
        }
      });
      nextArt.classList.add('is-on');
    } else {
      if (prevArt !== nextArt) { prevArt.hidden = true; prevArt.classList.remove('is-on'); }
      nextArt.classList.add('is-on');
    }
  }

  function showCat(i, focus) {
    i = (i + catBtns.length) % catBtns.length;
    catIndex = i;
    catBtns.forEach(function (b, j) {
      b.classList.toggle('is-on', j === i);
      b.setAttribute('aria-selected', String(j === i));
      b.tabIndex = j === i ? 0 : -1;
    });
    showArt(i);
    if (catBtns[i].scrollIntoView && window.innerWidth <= 820) {
      catBtns[i].scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
    }
    if (focus) catBtns[i].focus();
  }

  /* hover or focus previews a category; leaving the list restores the chosen one */
  if (catList && window.matchMedia('(hover:hover)').matches) {
    catBtns.forEach(function (b, i) {
      b.addEventListener('mouseenter', function () {
        showArt(i);
        if (catStage) catStage.classList.add('is-peek');
      });
      b.addEventListener('focus', function () { showArt(i); });
    });
    catList.addEventListener('mouseleave', function () {
      showArt(catIndex);
      if (catStage) catStage.classList.remove('is-peek');
    });
    catList.addEventListener('focusout', function (ev) {
      if (!catList.contains(ev.relatedTarget)) showArt(catIndex);
    });
  }

  catBtns.forEach(function (b, i) {
    b.addEventListener('click', function () { showCat(i); });
    b.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); showCat(catIndex + 1, true); }
      else if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); showCat(catIndex - 1, true); }
      else if (k === 'Home') { e.preventDefault(); showCat(0, true); }
      else if (k === 'End') { e.preventDefault(); showCat(catBtns.length - 1, true); }
    });
  });
  if (catStage) {
    var tx = 0, ty = 0;
    catStage.addEventListener('touchstart', function (e) { tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY; }, { passive: true });
    catStage.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 46 && Math.abs(dx) > Math.abs(dy) * 1.4) showCat(catIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ───────────────────────── download note ────────────────── */
  var dlBtn = doc.getElementById('dlBtn');
  if (dlBtn) {
    dlBtn.addEventListener('click', function () {
      var note = doc.getElementById('dlNote');
      if (!note) return;
      note.setAttribute('role', 'status');
      if (hasGSAP && !REDUCED) gsap.fromTo(note, { opacity: .4 }, { opacity: 1, duration: .5, ease: 'power2.out' });
      var stores = doc.querySelector('.dl__stores');
      if (stores && hasGSAP && !REDUCED) gsap.fromTo(stores.children, { y: 6, opacity: .5 }, { y: 0, opacity: 1, duration: .45, stagger: .07, ease: 'power2.out' });
    });
  }

  if (!hasGSAP) return;

  /* ═════════════════════════ MOTION ═══════════════════════════ */

  /* ── hero intro ─────────────────────────────────────────── */
  var heroLines = doc.querySelectorAll('#heroH1 .ln > span');
  if (!REDUCED) {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: .12 });
    tl.from('#heroBrow', { opacity: 0, y: 10, duration: .6 })
      .from(heroLines, { yPercent: 108, duration: .95, stagger: .085 }, '-=.34')
      .from('#heroLead', { opacity: 0, y: 14, duration: .7 }, '-=.55')
      .from('#heroCta > *', { opacity: 0, y: 14, duration: .6, stagger: .08 }, '-=.45')
      .from('#heroNote', { opacity: 0, duration: .6 }, '-=.35')
      .from('#heroShot .shot__frame', { opacity: 0, yPercent: 4, scale: .97, duration: 1.15, transformOrigin: '50% 50%' }, '-=1.15')
      ;
  }

  /* ── the handover, performed by the visitor ─────────────── */
  var deal = doc.getElementById('deal');
  if (deal) {
    var THINGS = [
      { icon: 'i-shirt',  name: 'Denim jacket',        the: 'the jacket' },
      { icon: 'i-toy',    name: 'Wooden train',        the: 'the train' },
      { icon: 'i-book',   name: 'Paperback stack',     the: 'the books' },
      { icon: 'i-gadget', name: 'Over-ear headphones', the: 'the headphones' }
    ];
    var stage = doc.getElementById('dealStage');
    var thing = doc.getElementById('thing');
    var thingUse = doc.getElementById('thingUse');
    var thingName = doc.getElementById('thingName');
    var slotFrom = doc.getElementById('slotFrom');
    var slotTo = doc.getElementById('slotTo');
    var coin = doc.getElementById('coin');
    var walletDonor = doc.getElementById('walletDonor');
    var hint = doc.getElementById('dealHint');
    var again = doc.getElementById('dealAgain');
    var dots = Array.prototype.slice.call(deal.querySelectorAll('.deal__dots button'));
    var hub = doc.getElementById('dealHub');

    var idx = 0, done = false, held = false, home = { x: 0, y: 0 }, target = { x: 0, y: 0 };

    function centreIn(box) {
      var s = stage.getBoundingClientRect(), b = box.getBoundingClientRect(), t = thing.getBoundingClientRect();
      return { x: (b.left - s.left) + (b.width - t.width) / 2, y: (b.top - s.top) + (b.height - t.height) / 2 };
    }
    function measure() {
      home = centreIn(slotFrom);
      target = centreIn(slotTo);
      /* sit the hub on the same line as the two shelves */
      var mid = deal.querySelector('.deal__mid');
      if (mid && window.matchMedia('(min-width:821px)').matches) {
        var s = stage.getBoundingClientRect();
        var slot = slotFrom.getBoundingClientRect();
        var hubBox = hub.getBoundingClientRect();
        var wanted = (slot.top - s.top) + slot.height / 2;
        var offset = (hubBox.top - s.top) + hubBox.height / 2
                     - parseFloat(getComputedStyle(mid).paddingTop || 0);
        mid.style.setProperty('--hub-top', Math.max(0, wanted - offset) + 'px');
      } else if (mid) {
        mid.style.removeProperty('--hub-top');
      }
    }
    function place(p) { gsap.set(thing, { x: p.x, y: p.y }); }

    function say(html) { if (hint) hint.innerHTML = html; }

    function setThing(i) {
      idx = i;
      thingUse.setAttribute('href', '#' + THINGS[i].icon);
      thingName.textContent = THINGS[i].name;
      dots.forEach(function (d, k) {
        d.setAttribute('aria-selected', String(k === i));
        d.tabIndex = k === i ? 0 : -1;
      });
    }

    function reset(i, quiet) {
      done = false;
      deal.classList.remove('is-done', 'is-armed');
      deal.classList.add('is-idle');
      if (typeof i === 'number') setThing(i);
      gsap.set(coin, { opacity: 0, scale: .5 });
      measure();
      if (REDUCED || quiet) place(home);
      else gsap.to(thing, { x: home.x, y: home.y, duration: .5, ease: 'power3.out' });
      thing.setAttribute('aria-label', 'Hand over ' + THINGS[idx].name + '. Press Enter to send it, or drag it across.');
      if (again) again.disabled = true;
      say('<b>Your turn.</b> Drag ' + THINGS[idx].the + ' across to Fleekart — or press Enter.');
    }

    function complete() {
      if (done) return;
      done = true;
      deal.classList.remove('is-idle', 'is-armed');
      measure();
      say('<b>Through Fleekart…</b>');
      var tl = gsap.timeline();
      if (REDUCED) {
        place(target);
        deal.classList.add('is-done');
        gsap.set(coin, { opacity: 1, x: 0, y: 0 });
      } else {
        var mid = centreIn(hub);
        tl.to(thing, { x: mid.x, y: mid.y, duration: .45, ease: 'power2.inOut' })
          .to(hub, { scale: 1.12, duration: .18, ease: 'power2.out' }, '-=.12')
          .to(hub, { scale: 1, duration: .38, ease: 'elastic.out(1,.5)' })
          .to(thing, { x: target.x, y: target.y, duration: .5, ease: 'power2.inOut' }, '-=.3')
          .add(function () { deal.classList.add('is-done'); })
          /* the Plinks go the other way */
          .set(coin, { opacity: 1, scale: 1, x: centreIn(slotTo).x + 50, y: centreIn(slotTo).y + 84 })
          .to(coin, { x: centreIn(hub).x + 52, y: centreIn(hub).y + 90, duration: .4, ease: 'power2.in' })
          .to(coin, { x: centreIn(walletDonor).x + 52, y: centreIn(walletDonor).y + 84, duration: .45, ease: 'power2.out' })
          .to(coin, { opacity: 0, scale: .6, duration: .25 }, '-=.05');
      }
      tl.add(function () {
        say('<b>' + THINGS[idx].name + ' has a second life.</b> Plinks went back to the Donor — no price, no cash, nothing sold.');
        if (again) again.disabled = false;
      });
    }

    /* dragging */
    var startPt = null, startXY = null;
    thing.addEventListener('pointerdown', function (ev) {
      if (done) return;
      held = true;
      deal.classList.remove('is-idle');
      thing.classList.add('is-held');
      thing.setPointerCapture(ev.pointerId);
      measure();
      startPt = { x: ev.clientX, y: ev.clientY };
      startXY = { x: gsap.getProperty(thing, 'x'), y: gsap.getProperty(thing, 'y') };
    });
    thing.addEventListener('pointermove', function (ev) {
      if (!held) return;
      var nx = startXY.x + (ev.clientX - startPt.x);
      var ny = startXY.y + (ev.clientY - startPt.y);
      gsap.set(thing, { x: nx, y: ny });
      var total = Math.hypot(target.x - home.x, target.y - home.y) || 1;
      var moved = Math.hypot(nx - home.x, ny - home.y);
      deal.classList.toggle('is-armed', moved / total > .42);
    });
    function release() {
      if (!held) return;
      held = false;
      thing.classList.remove('is-held');
      var nx = gsap.getProperty(thing, 'x'), ny = gsap.getProperty(thing, 'y');
      var total = Math.hypot(target.x - home.x, target.y - home.y) || 1;
      if (Math.hypot(nx - home.x, ny - home.y) / total > .42) complete();
      else {
        deal.classList.remove('is-armed');
        gsap.to(thing, { x: home.x, y: home.y, duration: .5, ease: 'power3.out' });
        say('<b>Not quite.</b> Take ' + THINGS[idx].the + ' all the way across — or press Enter.');
      }
    }
    thing.addEventListener('pointerup', release);
    thing.addEventListener('pointercancel', release);

    /* keyboard and tap both send it */
    thing.addEventListener('click', function (ev) {
      if (ev.detail !== 0) return;      /* real clicks are handled by the drag */
      complete();
    });
    thing.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
        ev.preventDefault(); complete();
      }
    });

    if (again) again.addEventListener('click', function () {
      reset((idx + 1) % THINGS.length);
      thing.focus();
    });
    dots.forEach(function (d, i) {
      d.addEventListener('click', function () { reset(i); });
      d.addEventListener('keydown', function (ev) {
        if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') { ev.preventDefault(); reset((i + 1) % 4); dots[(i + 1) % 4].focus(); }
        else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') { ev.preventDefault(); reset((i + 3) % 4); dots[(i + 3) % 4].focus(); }
      });
    });

    /* first paint, and whenever the box changes shape */
    function settle() {
      measure();
      place(done ? target : home);
    }
    reset(0, true);
    window.addEventListener('load', settle);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(settle);
    var dz; window.addEventListener('resize', function () { clearTimeout(dz); dz = setTimeout(settle, 180); });
  }

  /* ── the ladder: one handover, two sides ─────────────────── */
  var rows = doc.getElementById('ladderRows');
  if (rows && !REDUCED) {
    var rungs = Array.prototype.slice.call(rows.querySelectorAll('.rung'));

    /* the spine fill is a pseudo-element — drive its scale through a custom property */
    ScrollTrigger.create({
      trigger: rows, start: 'top 80%', end: 'bottom 80%', scrub: .7,
      onUpdate: function (s) { rows.style.setProperty('--spine-scale', s.progress.toFixed(4)); }
    });

    /* mirrored entrance only where the two sides sit side by side */
    var mirrored = window.matchMedia('(min-width:821px)').matches;
    rungs.forEach(function (r, i) {
      var d = r.querySelector('.rung__side--donor');
      var bn = r.querySelector('.rung__side--ben');
      var node = r.querySelector('.rung__node');
      ScrollTrigger.create({
        trigger: r, start: 'top 72%', end: 'bottom 28%',
        onToggle: function (s) { r.classList.toggle('is-lit', s.isActive); }
      });
      gsap.timeline({ scrollTrigger: { trigger: r, start: 'top 86%', once: true } })
        .fromTo(node, { scale: .5, opacity: 0 },
                      { scale: 1, opacity: 1, duration: .5, ease: 'back.out(2)' })
        .fromTo(d, { x: mirrored ? -22 : 0, y: mirrored ? 0 : 14, opacity: 0 },
                   { x: 0, y: 0, opacity: 1, duration: .6, ease: 'power3.out' }, '-=.36')
        .fromTo(bn, { x: mirrored ? 22 : 0, y: mirrored ? 0 : 14, opacity: 0 },
                    { x: 0, y: 0, opacity: 1, duration: .6, ease: 'power3.out' }, '<');
    });
  }

  /* ── plinks equation ────────────────────────────────────── */
  var equation = doc.querySelector('.equation');
  if (equation && !REDUCED) {
    var eqRows = Array.prototype.slice.call(equation.querySelectorAll('.eq'));
    var eqArrows = Array.prototype.slice.call(equation.querySelectorAll('.eq__arrow'));
    var eqCoin = doc.getElementById('eqCoin');

    var et = gsap.timeline({ scrollTrigger: { trigger: equation, start: 'top 80%', once: true } });
    eqRows.forEach(function (row, i) {
      et.fromTo(row, { opacity: 0, x: -18 },
                     { opacity: 1, x: 0, duration: .5, ease: 'power3.out' }, i * .14);
      et.fromTo(row.querySelector('.eq__i'), { scale: .7, opacity: 0 },
                { scale: 1, opacity: 1, duration: .45, ease: 'back.out(2)' }, i * .14 + .08);
      if (eqArrows[i]) {
        et.fromTo(eqArrows[i], { opacity: 0, y: -6 },
                  { opacity: 1, y: 0, duration: .3, ease: 'power2.out' }, i * .14 + .3);
      }
    });

    /* a Plink runs down the chain once the rows have landed */
    if (eqCoin && eqRows.length) {
      var seat = function (row) {
        var e0 = equation.getBoundingClientRect(), r = row.querySelector('.eq__i').getBoundingClientRect();
        return { x: (r.left - e0.left) + (r.width - 30) / 2, y: (r.top - e0.top) + (r.height - 30) / 2 };
      };
      et.add(function () { var p = seat(eqRows[0]); gsap.set(eqCoin, { x: p.x, y: p.y }); });
      et.to(eqCoin, { opacity: 1, scale: 1, duration: .25, ease: 'back.out(2)' });
      eqRows.slice(1).forEach(function (row) {
        et.to(eqCoin, {
          duration: .5, ease: 'power2.inOut',
          onStart: function () { var p = seat(row); gsap.to(eqCoin, { x: p.x, y: p.y, duration: .5, ease: 'power2.inOut' }); }
        });
      });
      et.to(eqCoin, { opacity: 0, scale: .6, duration: .3, ease: 'power2.in' });
    }
  }

  /* ── impact lifeline ────────────────────────────────────── */
  if (!REDUCED && doc.getElementById('lifeline')) {
    var links = doc.querySelectorAll('.life__link i');
    var lives = Array.prototype.slice.call(doc.querySelectorAll('.life'));
    var icons = lives.map(function (l) { return l.querySelector('.life__box svg'); });
    gsap.set(links, { scaleX: 0, transformOrigin: 'left center' });

    var lt = gsap.timeline({ scrollTrigger: { trigger: '#lifeline', start: 'top 76%', once: true } });
    lives.forEach(function (life, i) {
      lt.fromTo(life, { opacity: 0, y: 20 },
                      { opacity: 1, y: 0, duration: .55, ease: 'power3.out' }, i * .22);
      /* each icon arrives in a way that says what the step means */
      var from = { opacity: 0, scale: .62, transformOrigin: '50% 50%' };
      if (i === 1) from.rotation = -170;          /* second life — it turns over */
      if (i === 3) from.rotationY = 180;          /* more value — the coin flips */
      lt.fromTo(icons[i], from,
        { opacity: 1, scale: 1, rotation: 0, rotationY: 0, duration: .7, ease: 'back.out(1.7)' },
        i * .22 + .12);
      if (links[i]) {
        lt.to(links[i], { scaleX: 1, duration: .38, ease: 'power2.inOut' }, i * .22 + .42);
      }
    });
  }

  /* keep triggers honest when layout changes */
  var rt, lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) return;      /* mobile URL-bar noise */
    lastW = window.innerWidth;
    clearTimeout(rt); rt = setTimeout(function () { ScrollTrigger.refresh(); }, 240);
  });
})();
