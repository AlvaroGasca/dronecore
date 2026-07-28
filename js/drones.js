/**
 * DRONES.JS — Control de cámara 3D, filtros de subsistemas e inspección de componentes
 */

document.addEventListener('DOMContentLoaded', () => {
    const viewer = document.querySelector('#drone-viewer');
    const hotspots = document.querySelectorAll('.hotspot');
    const infoCard = document.querySelector('#info-card');
    const cardTitle = document.querySelector('#card-title');
    const cardDesc = document.querySelector('#card-desc');
    const cardTag = document.querySelector('#card-tag');
    const closeCardBtn = document.querySelector('#close-card');
    const resetBtn = document.querySelector('#reset-view-btn');
    const droneViewer = document.getElementById('drone-viewer');
    const viewerLoader = document.getElementById('viewer-loader');
    const filterChips = document.querySelectorAll('.filter-chip');

    if (!viewer) return;

    // Guardar órbita y objetivo por defecto
    const initialOrbit = viewer.getAttribute('camera-orbit') || '180deg 75deg 100%';
    const initialTarget = viewer.getAttribute('camera-target') || 'auto auto auto';

    // 1. Control del Loader Skeleton y Aparición Suave 3D
    function onModelLoaded() {
        if (droneViewer) {
            droneViewer.classList.add('is-loaded');
        }
        if (viewerLoader) {
            viewerLoader.classList.add('is-hidden');
        }
    }

    if (droneViewer) {
        droneViewer.addEventListener('load', onModelLoaded);
        if (droneViewer.loaded) {
            onModelLoaded();
        }
    }

    // 2. Filtro de Subsistemas (Óptica, Propulsión, Aviónica, Energía)
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const filterValue = chip.dataset.filter;

            // Actualizar chip activo
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            // Filtrar hotspots
            hotspots.forEach(hotspot => {
                const tag = hotspot.dataset.tag || '';
                if (filterValue === 'all' || tag.toUpperCase() === filterValue.toUpperCase()) {
                    hotspot.classList.remove('is-dimmed');
                } else {
                    hotspot.classList.add('is-dimmed');
                    hotspot.classList.remove('is-active');
                }
            });
        });
    });

    // 3. Manejo de Interacción con Hotspots (Puntos Clave)
    hotspots.forEach(hotspot => {
        hotspot.addEventListener('click', (e) => {
            e.stopPropagation();

            // Detener rotación continua al seleccionar un punto
            viewer.removeAttribute('auto-rotate');

            // Resaltar hotspot seleccionado
            hotspots.forEach(h => h.classList.remove('is-active'));
            hotspot.classList.add('is-active');

            const orbit = hotspot.dataset.orbit;
            const target = hotspot.dataset.target;
            const title = hotspot.dataset.title;
            const desc = hotspot.dataset.desc;
            const tag = hotspot.dataset.tag;

            // Transición de cámara hacia el objetivo
            if (orbit) viewer.cameraOrbit = orbit;
            if (target) viewer.cameraTarget = target;

            // Actualizar tarjeta lateral de información
            if (title && desc) {
                cardTitle.textContent = title;
                cardDesc.textContent = desc;
                if (tag) cardTag.textContent = tag;
                infoCard.classList.remove('hidden');
            }
        });
    });

    // 4. Cerrar la tarjeta informativa
    if (closeCardBtn) {
        closeCardBtn.addEventListener('click', () => {
            infoCard.classList.add('hidden');
            hotspots.forEach(h => h.classList.remove('is-active'));
        });
    }

    // 5. Restablecer el encuadre inicial
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            viewer.cameraOrbit = initialOrbit;
            viewer.cameraTarget = initialTarget;
            viewer.setAttribute('auto-rotate', '');
            
            if (infoCard) infoCard.classList.add('hidden');
            
            hotspots.forEach(h => {
                h.classList.remove('is-active');
                h.classList.remove('is-dimmed');
            });

            // Volver a activar chip "Todos"
            filterChips.forEach(c => c.classList.remove('active'));
            const allChip = document.querySelector('.filter-chip[data-filter="all"]');
            if (allChip) allChip.classList.add('active');
        });
    }
});