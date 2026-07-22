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
