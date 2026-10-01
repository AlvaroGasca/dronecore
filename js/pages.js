/**
 * pages.js — Shared interactive logic for titulaciones, recursos and faq
 */
document.addEventListener('DOMContentLoaded', () => {

    // -----------------------------------------------------------------------
    // 1. THEME TOGGLE (dark / light)
    // -----------------------------------------------------------------------
    const themeBtn = document.querySelector('.theme-toggle');
    const root = document.documentElement;

    const applyTheme = (t) => {
        root.setAttribute('data-theme', t);
        localStorage.setItem('dronecore-theme', t);
        if (themeBtn) {
            themeBtn.querySelector('i').className =
                t === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
    };

    const saved = localStorage.getItem('dronecore-theme') || 'dark';
    applyTheme(saved);

    themeBtn?.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
    });

    // -----------------------------------------------------------------------
    // 2. MOBILE NAV TOGGLE
    // -----------------------------------------------------------------------
    const navToggle = document.querySelector('.nav-toggle');
    const mobileNav = document.querySelector('.mobile-nav');

    navToggle?.addEventListener('click', () => {
        const open = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', String(!open));
        mobileNav?.classList.toggle('is-open', !open);
    });

    // -----------------------------------------------------------------------
    // 3. HEADER SCROLL STATE + BACK-TO-TOP
    // -----------------------------------------------------------------------
    const header = document.querySelector('.site-header');
    const backBtn = document.querySelector('.back-to-top');

    window.addEventListener('scroll', () => {
        header?.classList.toggle('is-scrolled', window.scrollY > 40);
        backBtn?.classList.toggle('is-visible', window.scrollY > 320);
    }, { passive: true });

    backBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // -----------------------------------------------------------------------
    // 4. HUD CARDS — staggered reveal on scroll
    // -----------------------------------------------------------------------
    const hudObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('is-revealed'), i * 120);
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.hud-card').forEach(c => hudObserver.observe(c));

    // -----------------------------------------------------------------------
    // 5. PAGE INDEX — auto-build from content-section anchors
    // -----------------------------------------------------------------------
    const pageIndex = document.querySelector('.page-index[data-auto-index]');
    if (pageIndex) {
        const sections = document.querySelectorAll('.content-section[id]');
        sections.forEach(sec => {
            const a = document.createElement('a');
            a.href = '#' + sec.id;
            a.textContent = sec.querySelector('h2')?.textContent || sec.id;
            pageIndex.appendChild(a);
        });

        // Active link on scroll
        const indexLinks = pageIndex.querySelectorAll('a');
        const secObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    indexLinks.forEach(l => l.classList.remove('is-active'));
                    const active = pageIndex.querySelector(`a[href="#${entry.target.id}"]`);
                    active?.classList.add('is-active');
                }
            });
        }, { rootMargin: '-20% 0px -70% 0px' });

        sections.forEach(s => secObserver.observe(s));
    }

    // -----------------------------------------------------------------------
    // 6. FAQ — text search + category filter tabs
    // -----------------------------------------------------------------------
    const searchInput = document.getElementById('site-search');
    const faqItems   = document.querySelectorAll('[data-search-item]');
    const faqEmpty   = document.getElementById('faq-empty');
    const filterBtns = document.querySelectorAll('.faq-filter-btn');

    let activeCategory = 'all';

    const applyFilters = () => {
        const query = searchInput?.value.toLowerCase().trim() || '';
        let visible = 0;

        faqItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            const cat  = item.dataset.cat || 'all';
            const matchText = !query || text.includes(query);
            const matchCat  = activeCategory === 'all' || cat === activeCategory;
            const show = matchText && matchCat;
            item.hidden = !show;
            if (show) visible++;
        });

        if (faqEmpty) faqEmpty.style.display = visible === 0 ? 'block' : 'none';
    };

    searchInput?.addEventListener('input', applyFilters);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            activeCategory = btn.dataset.cat;
            // clear search when switching category
            if (searchInput) searchInput.value = '';
            applyFilters();
        });
    });

    // -----------------------------------------------------------------------
    // 7. INTERACTIVE FLIGHT CHECKLIST (recursos)
    // -----------------------------------------------------------------------
    const checklistEl = document.getElementById('flight-checklist');
    const countEl     = document.getElementById('checklist-count');
    const fillEl      = document.getElementById('checklist-fill');
    const resetBtn    = document.getElementById('checklist-reset');

    if (checklistEl) {
        const items = checklistEl.querySelectorAll('.flight-checklist__item');
        const total = items.length;

        const updateProgress = () => {
            const checked = checklistEl.querySelectorAll('.is-checked').length;
            if (countEl) countEl.textContent = `${checked} / ${total}`;
            if (fillEl) fillEl.style.width = `${(checked / total) * 100}%`;
        };

        items.forEach(item => {
            item.addEventListener('click', () => {
                item.classList.toggle('is-checked');
                updateProgress();
            });
        });

        resetBtn?.addEventListener('click', () => {
            items.forEach(i => i.classList.remove('is-checked'));
            updateProgress();
        });

        updateProgress();
    }

});
