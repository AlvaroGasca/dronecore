document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.site-header');
    const navToggle = document.querySelector('.nav-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    const backToTopBtn = document.querySelector('.back-to-top');
    const hudCards = document.querySelectorAll('.hud-card');

    // 1. Control de scroll para el header y botón volver arriba
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            header?.classList.add('is-scrolled');
        } else {
            header?.classList.remove('is-scrolled');
        }

        if (window.scrollY > 300) {
            backToTopBtn?.classList.add('is-visible');
        } else {
            backToTopBtn?.classList.remove('is-visible');
        }
    }, { passive: true });

    // 2. Menú Móvil
    navToggle?.addEventListener('click', () => {
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !isExpanded);
        mobileNav?.classList.toggle('is-open');
    });

    // 3. Animación de revelación al hacer scroll (Intersection Observer)
    const observerOptions = {
        root: null,
        threshold: 0.15
    };

    const cardObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Aplica un ligero desfase en la animación de las tarjetas
                setTimeout(() => {
                    entry.target.classList.add('is-revealed');
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    hudCards.forEach(card => cardObserver.observe(card));

    // 4. Volver arriba suave
    backToTopBtn?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});