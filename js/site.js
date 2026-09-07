/* Alif Construction Limited: page behaviour ported from the design's logic classes.
   Reveal on scroll, counters, nav menu, language switch, testimonial switch, enquiry submit. */
(function () {
  'use strict';
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal observer: opal* entrance animations at 0.75s, no stagger
  var els = Array.prototype.slice.call(document.querySelectorAll('[data-oa]'));
  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.setAttribute('data-oa-in', ''); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.setAttribute('data-oa-in', ''); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -4% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  // Counters: 2000ms ease-out cubic, fire on entry
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  function fmt(el, v) { return el.hasAttribute('data-count-plain') ? String(v) : v.toLocaleString('en-US'); }
  function runCounter(el) {
    var to = parseInt(el.getAttribute('data-count'), 10);
    var t0 = performance.now();
    function step(t) {
      var p = Math.min(1, (t - t0) / 2000);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(el, Math.round(to * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (reduced || !('IntersectionObserver' in window)) {
    counters.forEach(function (el) { el.textContent = fmt(el, parseInt(el.getAttribute('data-count'), 10)); });
  } else if (counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  // Hero video: show once it can play (still image stays underneath as poster/fallback)
  var video = document.querySelector('[data-hero-video]');
  if (video && !reduced) {
    var ready = function () { video.setAttribute('data-ready', ''); };
    if (video.readyState >= 2) ready(); else video.addEventListener('loadeddata', ready, { once: true });
    var p = video.play(); if (p && p.catch) p.catch(function () {});
  }

  // State: lang, menu, quote
  var header = document.querySelector('header[data-menu]');
  var menuBtn = document.querySelector('[data-menu-btn]');
  var langToggle = document.querySelector('[data-lang-toggle]');
  var quote = 0;
  var quotes = Array.prototype.slice.call(document.querySelectorAll('[data-quote]'));

  function setMenu(open) {
    if (!header) return;
    header.setAttribute('data-menu', open ? 'open' : 'closed');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', String(open));
  }
  function setLang(l) {
    if (!langToggle) return;
    langToggle.setAttribute('data-lang', l);
    langToggle.querySelectorAll('button[data-seg]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-seg') === l));
    });
    document.documentElement.setAttribute('data-lang', l);
    try { localStorage.setItem('alif-lang', l); } catch (e) {}
  }
  function setQuote(i) {
    quote = ((i % quotes.length) + quotes.length) % quotes.length;
    quotes.forEach(function (q, k) { q.hidden = k !== quote; });
  }

  var actions = {
    toggleMenu: function () { setMenu(header.getAttribute('data-menu') !== 'open'); },
    closeMenu: function () { setMenu(false); },
    setEn: function () { setLang('en'); },
    setBn: function () { setLang('bn'); },
    prevQuote: function () { setQuote(quote + 1); },
    nextQuote: function () { setQuote(quote + 1); },
    onSubmit: function (e) {
      e.preventDefault();
      var form = e.currentTarget;
      if (form.reportValidity && !form.reportValidity()) return;
      var fd = new FormData(form), lines = [];
      fd.forEach(function (v, k) { if (String(v).trim()) lines.push(k + ': ' + String(v).trim()); });
      var text = 'Enquiry from the Alif Construction website' + (lines.length ? '\n' + lines.join('\n') : '');
      window.open('https://wa.me/8801672914871?text=' + encodeURIComponent(text), '_blank', 'noopener');
    }
  };

  document.querySelectorAll('[data-on]').forEach(function (el) {
    var fn = actions[el.getAttribute('data-on')];
    if (!fn) return;
    el.addEventListener(el.tagName === 'FORM' ? 'submit' : 'click', fn);
  });

  // Close the mobile panel with Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header && header.getAttribute('data-menu') === 'open') { setMenu(false); if (menuBtn) menuBtn.focus(); }
  });

  try { var saved = localStorage.getItem('alif-lang'); if (saved === 'bn' || saved === 'en') setLang(saved); } catch (e) {}
})();
