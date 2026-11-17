(() => {
  'use strict';
  const nav = document.getElementById('mobile-nav');
  const toggle = document.getElementById('nav-toggle');
  const page = document.body.dataset.page;
  document.querySelectorAll('.site-links a, .mobile-nav a[data-page]').forEach(link => {
    if (link.dataset.page === page) link.setAttribute('aria-current', 'page');
  });
  const setMenu = open => {
    if (!nav || !toggle) return;
    nav.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  };
  toggle?.addEventListener('click', () => setMenu(nav.hidden));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav && !nav.hidden) {
      setMenu(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!nav || nav.hidden || toggle.contains(event.target)) return;
    if (!nav.contains(event.target) || event.target.closest('a')) setMenu(false);
  });
  const compact = matchMedia('(max-width:850px)');
  compact.addEventListener('change', () => { if (!compact.matches) setMenu(false); });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // One restrained entrance; content is present and usable before enhancement.
  if (!reduced.matches && Element.prototype.animate) {
    document.querySelectorAll('.hero-left,.home-products,.hero-right,.contact-left,.contact-right,.shop-hero-copy').forEach((element, index) => {
      element.animate([{ opacity: .6, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], {
        duration: 500, delay: Math.min(index, 2) * 65, easing: 'cubic-bezier(.22,1,.36,1)'
      });
    });
  }
  const slides = document.getElementById('home-slides');
  if (slides) {
    const images = [...slides.querySelectorAll('img')];
    const dots = [...document.querySelectorAll('[data-slide-index]')];
    const names = ['Lino que acompaña.', 'Una nueva silueta.', 'La belleza del detalle.', 'Texturas para quedarte.'];
    const pause = document.getElementById('slideshow-toggle');
    let index = 0, paused = reduced.matches, visible = true, timer;
    slides.dataset.enhanced = '';
    const display = next => {
      index = (next + images.length) % images.length;
      images.forEach((image, i) => { image.classList.toggle('is-active', i === index); image.setAttribute('aria-hidden', String(i !== index)); });
      dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === index)));
      document.getElementById('slide-name').textContent = names[index];
      document.getElementById('slide-number').textContent = `${String(index + 1).padStart(2, '0')} / 04`;
    };
    const schedule = () => {
      clearInterval(timer);
      if (!paused && !document.hidden && visible && !reduced.matches) timer = setInterval(() => display(index + 1), 5500);
      pause.hidden = reduced.matches;
      pause.setAttribute('aria-pressed', String(paused));
      pause.setAttribute('aria-label', paused ? 'Reanudar presentación' : 'Pausar presentación');
      pause.innerHTML = `<img src="assets/icons/${paused ? 'play' : 'pause'}.svg" width="18" height="18" alt="" aria-hidden="true">`;
    };
    const manual = next => { paused = true; display(next); schedule(); };
    dots.forEach(dot => dot.addEventListener('click', () => manual(Number(dot.dataset.slideIndex))));
    document.querySelector('[data-slide="-1"]').addEventListener('click', () => manual(index - 1));
    pause.addEventListener('click', () => { paused = !paused; schedule(); });
    slides.parentElement.addEventListener('focusin', () => { paused = true; schedule(); });
    document.addEventListener('visibilitychange', schedule);
    reduced.addEventListener('change', () => { if (reduced.matches) paused = true; schedule(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }).observe(slides);
    display(0); schedule();
  }
  const toast = document.getElementById('experience-toast');
  let timer;
  document.querySelectorAll('[data-social]').forEach(button => {
    const channel = button.dataset.social;
    const url = (window.DAYA_CONTACT || {})[channel] || '';
    if (/^https:\/\/[^\s]+$/.test(url)) {
      const anchor = document.createElement('a');
      anchor.href = url; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer';
      anchor.setAttribute('aria-label', `${button.getAttribute('aria-label')} (abre en otra pestaña)`);
      anchor.innerHTML = button.innerHTML; button.replaceWith(anchor);
    } else button.addEventListener('click', () => {
      if (!toast) return;
      toast.textContent = `La cuenta oficial de ${button.getAttribute('aria-label')} está por anunciarse. Escríbenos por correo.`;
      toast.hidden = false; clearTimeout(timer); timer = setTimeout(() => { toast.hidden = true; }, 6000);
    });
  });
})();
