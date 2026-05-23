// icons.js — Lucide icon swap-in helper.
// Each <i data-lucide="name"></i> becomes the corresponding Lucide SVG.
// Uses the official Lucide CDN bundle.
(function () {
  function load() {
    if (typeof window === 'undefined') return;
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/lucide@0.469.0/dist/umd/lucide.min.js';
    s.onload = () => {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons({
          attrs: { 'stroke-width': 1.75 },
        });
      }
    };
    document.head.appendChild(s);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
