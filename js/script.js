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
   5) FIL CONDUCTEUR
   Principe en 3 étapes :
   a) on MESURE la position réelle des éléments marqués
      (data-thread-point = un point simple à traverser,
       data-thread-group = un bloc dont chaque enfant direct
       devient une branche séparée)
   b) on CONSTRUIT un <path> SVG par segment (tronc ou branche)
   c) au scroll, on RÉVÈLE chaque <path> petit à petit en
      jouant sur stroke-dasharray / stroke-dashoffset, ce qui
      donne l'effet de ligne qui se dessine au fur et à mesure.

   Tout est recalculé au resize, car la position des blocs
   change selon la largeur de l'écran (et le fil est masqué
   sur mobile, voir le CSS).
   ========================================================= */
const threadWrap = document.getElementById('threadWrap');
const threadSvg = document.getElementById('threadSvg');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let threadSegments = []; // { el, length, yStart, yEnd }
let threadDots = [];     // { el, fraction: () => number entre 0 et 1 }

function buildThread() {
  if (!threadWrap || !threadSvg) return;

  // on ne construit rien si le fil est caché (cf. media query mobile)
  if (getComputedStyle(threadSvg).display === 'none') return;

  threadSvg.innerHTML = '';
  threadSegments = [];
  threadDots = [];

  const wrapRect = threadWrap.getBoundingClientRect();
  const width = threadWrap.clientWidth;
  const height = threadWrap.scrollHeight;
  threadSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  threadSvg.setAttribute('width', width);
  threadSvg.setAttribute('height', height);

  const centerX = width / 2;

  // petit utilitaire : position d'un élément en coordonnées locales au thread-wrap
  const localTop = (el) => el.getBoundingClientRect().top - wrapRect.top;
  const localCenterX = (el) => {
    const r = el.getBoundingClientRect();
    return r.left + r.width / 2 - wrapRect.left;
  };

  // -- on construit la liste ordonnée des "arrêts" du fil (points simples + groupes) --
  const stops = Array.from(threadWrap.querySelectorAll('[data-thread-point], [data-thread-group]'));

  let prevX = centerX;
  let prevY = 0; // le fil démarre tout en haut du thread-wrap

  stops.forEach((stop) => {
    if (stop.hasAttribute('data-thread-point')) {
      const y = localTop(stop);
      addSegment(prevX, prevY, centerX, y);
      addDot(centerX, y, () => segmentFractionAt(threadSegments.length - 1));
      prevX = centerX;
      prevY = y;
    }

    if (stop.hasAttribute('data-thread-group')) {
      const groupTop = localTop(stop);
      // tronc qui descend jusqu'au point de séparation
      addSegment(prevX, prevY, centerX, groupTop);
      addDot(centerX, groupTop, () => segmentFractionAt(threadSegments.length - 1));

      // une branche par enfant direct du groupe (ex : chaque carte diplôme)
      const children = Array.from(stop.children);
      children.forEach((child) => {
        const cx = localCenterX(child);
        const cy = localTop(child);
        addBranch(centerX, groupTop, cx, cy);
        addDot(cx, cy, () => segmentFractionAt(threadSegments.length - 1));
      });

      // après un groupe, le tronc ne continue pas tout seul (rien après pour le moment) :
      // si tu ajoutes une section après, place un nouveau data-thread-point juste après le groupe.
      prevX = centerX;
      prevY = groupTop;
    }
  });

  if (!prefersReducedMotion) updateThread();
}

// segment droit (utilisé pour le tronc)
function addSegment(x1, y1, x2, y2) {
  const d = `M ${x1} ${y1} L ${x2} ${y2}`;
  threadSegments.push(makePath(d, y1, y2));
}

// segment "trace de circuit" : descend tout droit puis bascule en diagonale vers la cible
function addBranch(x1, y1, x2, y2) {
  const kneeY = y1 + (y2 - y1) * 0.5;
  const d = `M ${x1} ${y1} V ${kneeY} L ${x2} ${y2}`;
  threadSegments.push(makePath(d, y1, y2));
}

function makePath(d, yStart, yEnd) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  path.setAttribute('class', 'thread-line');
  threadSvg.appendChild(path);

  const length = path.getTotalLength();

  if (prefersReducedMotion) {
    // pas d'animation : le fil est affiché entièrement dessiné directement
    path.style.strokeDasharray = 'none';
  } else {
    path.style.strokeDasharray = `${length} ${length}`;
    path.style.strokeDashoffset = length;
  }

  return { el: path, length, yStart, yEnd };
}

function addDot(x, y, fractionFn) {
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', x);
  circle.setAttribute('cy', y);
  circle.setAttribute('r', 4);
  circle.setAttribute('class', 'thread-node');
  threadSvg.appendChild(circle);
  threadDots.push({ el: circle, fractionFn });
}

// fraction (0 à 1) déjà révélée du segment d'index donné, au moment de l'appel
function segmentFractionAt(index) {
  return threadSegments[index]._fraction || 0;
}

function updateThread() {
  if (prefersReducedMotion || threadSegments.length === 0) return;

  const wrapRect = threadWrap.getBoundingClientRect();
  // ligne de "révélation" : un point fixe à 80% de la hauteur de l'écran.
  // tout ce qui est plus haut que cette ligne dans le contenu est considéré comme "vu".
  const revealY = window.innerHeight * 0.8 - wrapRect.top;

  threadSegments.forEach((seg) => {
    const span = seg.yEnd - seg.yStart || 1;
    const fraction = Math.min(1, Math.max(0, (revealY - seg.yStart) / span));
    seg._fraction = fraction;
    seg.el.style.strokeDashoffset = seg.length * (1 - fraction);
  });

  threadDots.forEach((dot) => {
    dot.el.classList.toggle('is-lit', dot.fractionFn() > 0.92);
  });
}

// recalcul de la géométrie au resize (les blocs changent de position)
let threadResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(threadResizeTimer);
  threadResizeTimer = setTimeout(buildThread, 150);
});

// mise à jour au scroll, throttlée avec requestAnimationFrame pour rester fluide
let threadScrollTicking = false;
window.addEventListener('scroll', () => {
  if (threadScrollTicking) return;
  threadScrollTicking = true;
  requestAnimationFrame(() => {
    updateThread();
    threadScrollTicking = false;
  });
});

// premier calcul une fois que tout est chargé (polices, images) pour des mesures fiables
window.addEventListener('load', () => {
  buildThread();
  // les polices web peuvent finir de charger un instant après "load" et décaler le texte
  setTimeout(buildThread, 300);
});
