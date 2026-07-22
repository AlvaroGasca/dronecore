'use strict';

const toggle = document.querySelector('.nav-toggle');
const mobileNav = document.querySelector('.mobile-nav');
const setMenu = (open) => {
  if (!toggle || !mobileNav) return;
  toggle.classList.toggle('is-open', open);
  mobileNav.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
};
toggle?.addEventListener('click', () => setMenu(!toggle.classList.contains('is-open')));
document.querySelectorAll('.mobile-nav a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });

const themeButton = document.querySelector('.theme-toggle');
const savedTheme = localStorage.getItem('dronecore-theme');
if (savedTheme === 'light') document.documentElement.dataset.theme = 'light';
function updateThemeIcon() {
  const isLight = document.documentElement.dataset.theme === 'light';
  const icon = themeButton?.querySelector('i');
  if (icon) icon.className = isLight ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  themeButton?.setAttribute('aria-label', isLight ? 'Activar modo oscuro' : 'Activar modo claro');
}
updateThemeIcon();
themeButton?.addEventListener('click', () => {
  const isLight = document.documentElement.dataset.theme === 'light';
  if (isLight) delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = 'light';
  localStorage.setItem('dronecore-theme', isLight ? 'dark' : 'light');
  updateThemeIcon();
});

const topButton = document.querySelector('.back-to-top');
window.addEventListener('scroll', () => topButton?.classList.toggle('is-visible', window.scrollY > 500), { passive: true });
topButton?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

document.querySelectorAll('[data-auto-index]').forEach((index) => {
  document.querySelectorAll('.content-section[id] h2').forEach((heading) => {
    const section = heading.closest('.content-section');
    index.insertAdjacentHTML('beforeend', `<a href="#${section.id}">${heading.textContent}</a>`);
  });
});

const search = document.querySelector('#site-search');
search?.addEventListener('input', () => {
  const query = search.value.trim().toLocaleLowerCase('es');
  document.querySelectorAll('[data-search-item]').forEach((item) => {
    item.hidden = !item.textContent.toLocaleLowerCase('es').includes(query);
  });
});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.target.classList.toggle('is-visible', entry.isIntersecting)), { threshold: .12 });
  document.querySelectorAll('.tech-card, .glass-card, .resource-card, .hud-card').forEach((card) => { card.classList.add('reveal'); observer.observe(card); });
}

/* Marca la ruta: lo leído en verde y el siguiente paso en amarillo. */
document.querySelectorAll('.timeline').forEach((timeline) => {
  const steps = [...timeline.querySelectorAll('.timeline__item')];
  if (!steps.length) return;

  const updateReadingProgress = () => {
    const readingLine = window.innerHeight * 0.58;
    let lastRead = 0;

    steps.forEach((step, index) => {
      if (step.getBoundingClientRect().top <= readingLine) lastRead = index;
    });

    steps.forEach((step, index) => {
      step.classList.toggle('is-complete', index <= lastRead);
      step.classList.toggle('is-next', index === lastRead + 1);
      step.classList.remove('is-active');
    });
  };

  window.addEventListener('scroll', updateReadingProgress, { passive: true });
  window.addEventListener('resize', updateReadingProgress);
  updateReadingProgress();
});

/* Recorrido visual del dron en la página de tecnología. */
const scrollDrone = document.querySelector('#scroll-drone');
const droneStart = document.querySelector('#que-es');
const anatomyStage = document.querySelector('#anatomy-stage');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (scrollDrone && droneStart && anatomyStage && !reducedMotion) {
  let animationQueued = false;

  const updateDroneFlight = () => {
    animationQueued = false;
    const startTop = droneStart.getBoundingClientRect().top;
    const stage = anatomyStage.getBoundingClientRect();
    const viewport = window.innerHeight;
    const isInAnatomy = stage.top < viewport * .66 && stage.bottom > viewport * .25;
    const hasStarted = startTop < viewport * .86;
    const hasFinished = stage.bottom <= viewport * .25;

    anatomyStage.classList.toggle('is-active', isInAnatomy);
    scrollDrone.classList.remove('is-anatomy');
    scrollDrone.classList.toggle('is-flying', hasStarted && !isInAnatomy && !hasFinished);

    if (hasStarted && !hasFinished) {
      const distance = Math.max(1, (viewport * .86) - (viewport * .66 - stage.height));
      const progress = Math.min(1, Math.max(0, ((viewport * .86) - startTop) / distance));
      scrollDrone.style.setProperty('--flight-x', `${105 - progress * 45}vw`);
      scrollDrone.style.setProperty('--flight-y', `${9 + progress * 11}vh`);
      scrollDrone.style.setProperty('--flight-rotate', `${-17 + progress * 12}deg`);
      scrollDrone.style.setProperty('--flight-scale', `${.56 + progress * .18}`);
    }
  };

  const requestDroneUpdate = () => {
    if (!animationQueued) {
      animationQueued = true;
      window.requestAnimationFrame(updateDroneFlight);
    }
  };

  window.addEventListener('scroll', requestDroneUpdate, { passive: true });
  window.addEventListener('resize', requestDroneUpdate);
  updateDroneFlight();
}
