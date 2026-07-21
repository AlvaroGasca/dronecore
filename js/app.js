'use strict';

const navToggle = document.querySelector('.nav-toggle');
const mobileNav = document.querySelector('.mobile-nav');
const allNavLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('main section[id]');

/**
 * Control del menú móvil.
 */
function setMobileMenu(isOpen) {
    if (!navToggle || !mobileNav) {
        return;
    }

    navToggle.classList.toggle('is-open', isOpen);
    mobileNav.classList.toggle('is-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute(
        'aria-label',
        isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'
    );
    mobileNav.setAttribute('aria-hidden', String(!isOpen));
}

if (navToggle && mobileNav) {
    navToggle.addEventListener('click', () => {
        const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
        setMobileMenu(!isOpen);
    });
}

/**
 * Cierra el menú móvil cuando se selecciona una opción.
 */
allNavLinks.forEach((link) => {
    link.addEventListener('click', () => {
        if (mobileNav?.classList.contains('is-open')) {
            setMobileMenu(false);
        }
    });
});

/**
 * Permite cerrar el menú móvil pulsando Escape.
 */
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobileNav?.classList.contains('is-open')) {
        setMobileMenu(false);
        navToggle?.focus();
    }
});

/**
 * Cierra el menú móvil si el viewport vuelve a escritorio.
 */
window.addEventListener('resize', () => {
    if (window.innerWidth > 980 && mobileNav?.classList.contains('is-open')) {
        setMobileMenu(false);
    }
});

/**
 * Actualiza el enlace activo de navegación según la sección visible.
 * IntersectionObserver evita escuchar continuamente el evento scroll.
 */
function updateActiveNavigation(sectionId) {
    allNavLinks.forEach((link) => {
        const isActive = link.getAttribute('href') === `#${sectionId}`;
        link.classList.toggle('is-active', isActive);
    });
}

if ('IntersectionObserver' in window && sections.length > 0) {
    const sectionObserver = new IntersectionObserver(
        (entries) => {
            const visibleEntries = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

            if (visibleEntries.length > 0) {
                updateActiveNavigation(visibleEntries[0].target.id);
            }
        },
        {
            rootMargin: '-25% 0px -60% 0px',
            threshold: [0, 0.1, 0.25, 0.5, 1]
        }
    );

    sections.forEach((section) => sectionObserver.observe(section));
} else {
    /**
     * Fallback para navegadores sin IntersectionObserver.
     */
    const updateActiveSectionOnScroll = () => {
        const scrollPosition = window.scrollY + window.innerHeight * 0.3;
        let currentSectionId = sections[0]?.id;

        sections.forEach((section) => {
            if (section.offsetTop <= scrollPosition) {
                currentSectionId = section.id;
            }
        });

        if (currentSectionId) {
            updateActiveNavigation(currentSectionId);
        }
    };

    window.addEventListener('scroll', updateActiveSectionOnScroll, { passive: true });
    updateActiveSectionOnScroll();
}

/**
 * Soporte para navegación con teclado mediante foco visible.
 */
document.addEventListener('keyup', (event) => {
    if (event.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
    }
});

document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
});

/**
 * Inicialización.
 */
document.documentElement.classList.add('js-enabled');
setMobileMenu(false);
