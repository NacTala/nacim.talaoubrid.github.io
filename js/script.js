/* =========================================================
   1) ANIMATIONS AU SCROLL
   On observe tous les éléments avec data-reveal.
   Quand ils entrent dans l'écran, on ajoute .is-visible
   (qui déclenche la transition définie dans le CSS).
   ========================================================= */
const revealEls = document.querySelectorAll('[data-reveal]');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const delay = entry.target.getAttribute('data-reveal-delay') || 0;
      setTimeout(() => entry.target.classList.add('is-visible'), delay);
      revealObserver.unobserve(entry.target); // on anime une seule fois
    }
  });
}, {
  threshold: 0.15,
  rootMargin: '0px 0px -40px 0px',
});

revealEls.forEach((el) => revealObserver.observe(el));

/* =========================================================
   2) MENU MOBILE (le bouton "burger")
   ========================================================= */
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });

  // ferme le menu quand on clique un lien (utile sur mobile)
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* =========================================================
   3) NAVBAR — petite ombre quand on scrolle
   ========================================================= */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 10) {
    nav.style.boxShadow = '0 1px 0 rgba(20,24,31,0.06)';
  } else {
    nav.style.boxShadow = 'none';
  }
});

/* =========================================================
   4) ANNÉE AUTOMATIQUE DANS LE FOOTER
   ========================================================= */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
