/**
 * DRONES.JS — Control de cámara 3D e inspección de componentes
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

    if (!viewer) return;

    // Guardar órbita y objetivo por defecto
    const initialOrbit = viewer.getAttribute('camera-orbit') || '180deg 75deg 100%';
    const initialTarget = viewer.getAttribute('camera-target') || 'auto auto auto';

    if (droneViewer) {
        // 1. Aparición suave tras la carga
        droneViewer.addEventListener('load', () => {
            droneViewer.classList.add('is-loaded');
        });

        // Si ya estaba en caché y cargó al instante
        if (droneViewer.loaded) {
            droneViewer.classList.add('is-loaded');
        }
    }

    // Manejo de interacción con hotspots
    hotspots.forEach(hotspot => {
        hotspot.addEventListener('click', (e) => {
            e.stopPropagation();

            // Detener rotación continua al seleccionar un punto
            viewer.removeAttribute('auto-rotate');

            const orbit = hotspot.dataset.orbit;
            const target = hotspot.dataset.target;
            const title = hotspot.dataset.title;
            const desc = hotspot.dataset.desc;
            const tag = hotspot.dataset.tag;

            // Transición de cámara hacia el hotspot objetivo
            if (orbit) viewer.cameraOrbit = orbit;
            if (target) viewer.cameraTarget = target;

            // Actualizar tarjeta lateral de información
            if (title && desc) {
                cardTitle.textContent = title;
                cardDesc.textContent = desc;

                if (tag) {
                    cardTag.textContent = tag;
                }

                infoCard.classList.remove('hidden');
            }
        });
    });

    // Cerrar la tarjeta informativa
    if (closeCardBtn) {
        closeCardBtn.addEventListener('click', () => {
            infoCard.classList.add('hidden');
        });
    }

    // Restablecer el encuadre inicial
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            viewer.cameraOrbit = initialOrbit;
            viewer.cameraTarget = initialTarget;
            viewer.setAttribute('auto-rotate', '');
            if (infoCard) infoCard.classList.add('hidden');
        });
    }
});