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

/* =========================================================
   5) MODALES : ouverture / fermeture / clavier
   - éléments avec [data-modal-target] ouvrent la modale correspondante
   - éléments avec [data-modal-close] ferment la modale (overlay ou bouton)
   - Échap ferme toutes les modales ouvertes
   - Activation clavier (Enter / Space) sur les cartes
   ========================================================= */
window.addEventListener('load', () => {
  // initialisation des modales (après le DOM chargé)
  initModals();
});

function initModals() {
  // Ouverture
  document.querySelectorAll('[data-modal-target]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const id = el.getAttribute('data-modal-target');
      openModalById(id);
    });

    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = el.getAttribute('data-modal-target');
        openModalById(id);
      }
    });
  });

  // Fermeture (overlay et boutons)
  document.querySelectorAll('[data-modal-close]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) closeModal(modal);
    });
  });

  // Fermer au clic sur overlay (éléments avec class .modal__overlay)
  document.querySelectorAll('.modal__overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      const modal = overlay.closest('.modal');
      if (modal) closeModal(modal);
    });
  });

  // Fermer à Échap
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.is-open').forEach((m) => closeModal(m));
    }
  });
}

function openModalById(id) {
  if (!id) return;
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  // sauvegarde du scroll
  document.documentElement.style.overflow = 'hidden';
  // focus management : focus sur le bouton fermer
  const close = modal.querySelector('[data-modal-close]');
  if (close) close.focus();
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.documentElement.style.overflow = '';
}
