document.addEventListener('DOMContentLoaded', () => {
    const viewer = document.querySelector('#drone-viewer');
    const hotspots = document.querySelectorAll('.hotspot');
    const infoCard = document.querySelector('#info-card');
    const cardTitle = document.querySelector('#card-title');
    const cardDesc = document.querySelector('#card-desc');
    const cardTag = document.querySelector('#card-tag');
    const closeCardBtn = document.querySelector('#close-card');
    const resetBtn = document.querySelector('#reset-view-btn');

    if (!viewer) return;

    const initialOrbit = viewer.getAttribute('camera-orbit') || '0deg 75deg 100%';
    const initialTarget = viewer.getAttribute('camera-target') || 'auto auto auto';

    const closeInfoCard = () => {
        if (infoCard) infoCard.classList.add('hidden');
        hotspots.forEach(h => h.classList.remove('active'));
    };

    hotspots.forEach(hotspot => {
        hotspot.addEventListener('click', (e) => {
            e.stopPropagation();

            viewer.removeAttribute('auto-rotate');

            hotspots.forEach(h => h.classList.remove('active'));
            hotspot.classList.add('active');

            const { orbit, target, title, desc, tag, status } = hotspot.dataset;

            // Transición suave de la cámara hacia el punto exacto
            if (target) viewer.cameraTarget = target;
            if (orbit) viewer.cameraOrbit = orbit;

            // Actualizar panel lateral de información
            if (title && desc && infoCard) {
                if (cardTitle) cardTitle.textContent = title;
                if (cardDesc) cardDesc.textContent = desc;

                if (tag && cardTag) {
                    cardTag.textContent = tag;
                    cardTag.className = `status ${status || 'status-cyan'}`;
                }

                infoCard.classList.remove('hidden');
            }
        });
    });

    if (closeCardBtn) closeCardBtn.addEventListener('click', closeInfoCard);

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            viewer.cameraTarget = initialTarget;
            viewer.cameraOrbit = initialOrbit;
            viewer.setAttribute('auto-rotate', '');
            closeInfoCard();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && infoCard && !infoCard.classList.contains('hidden')) {
            closeInfoCard();
        }
    });
});