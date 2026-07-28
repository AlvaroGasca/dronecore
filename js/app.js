document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Selector de Tema (Oscuro / Claro)
    const themeBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    const moonIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    const sunIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

    const currentTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.setAttribute('data-theme', currentTheme);
    themeBtn.innerHTML = currentTheme === 'dark' ? sunIcon : moonIcon;

    themeBtn.addEventListener('click', () => {
        let theme = htmlElement.getAttribute('data-theme');
        let newTheme = theme === 'dark' ? 'light' : 'dark';
        
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeBtn.innerHTML = newTheme === 'dark' ? sunIcon : moonIcon;
    });

    // 2. Observer para animaciones al hacer scroll (.fade-up y puntos de la timeline)
    function initObserver() {
        const observerOptions = {
            threshold: 0.2,
            rootMargin: "0px 0px -40px 0px"
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Activa el estado luminoso / destacado de la timeline al llegar con el scroll
                    if (entry.target.classList.contains('timeline-item')) {
                        entry.target.classList.add('active');
                        const dot = entry.target.querySelector('.timeline-dot');
                        if (dot) dot.classList.add('active');
                    }
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-up, .timeline-item').forEach(el => observer.observe(el));
    }
    
    initObserver();
});