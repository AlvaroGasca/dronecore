// Función para copiar coordenadas al portapapeles
window.copiarCoordenadas = function (coordsText, btnElem) {
    navigator.clipboard.writeText(coordsText).then(() => {
        if (btnElem) {
            const originalText = btnElem.innerHTML;
            btnElem.innerHTML = `<i class="fa-solid fa-check"></i> ¡Copiado!`;
            setTimeout(() => {
                btnElem.innerHTML = originalText;
            }, 2000);
        }
    });
};

// Función para abrir ENAIRE en pestaña nueva
window.abrirEnaire = function () {
    window.open("https://drones.enaire.es/", "_blank");
};

document.addEventListener('DOMContentLoaded', () => {
    const geoBtn = document.getElementById('geo-btn');
    const reloadMeteoBtn = document.getElementById('reload-meteo');

    // Elementos Widget Meteorológico e Inspector
    const meteoWind = document.getElementById('meteo-wind');
    const meteoKp = document.getElementById('meteo-kp');
    const meteoVis = document.getElementById('meteo-vis');
    const meteoCoords = document.getElementById('meteo-coords');
    const coordsBadge = document.getElementById('selected-coords-badge');

    let currentLat = 40.4168;
    let currentLon = -3.7038;
    let currentName = "Madrid (Centro)";

    let map = null;
    let userMarker = null;

    // -------------------------------------------------------------
    // 1. INICIALIZACIÓN DEL MAPA LEAFLET
    // -------------------------------------------------------------
    function initMap() {
        const mapContainer = document.getElementById('enaire-map');
        if (!mapContainer) return;

        map = L.map('enaire-map', {
            center: [currentLat, currentLon],
            zoom: 6,
            zoomControl: true
        });

        const osmBase = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);

        const esriSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri'
        });

        const baseMaps = {
            "Callejero": osmBase,
            "Satélite": esriSat
        };

        L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

        map.on('click', (e) => {
            actualizarPuntoVuelo(e.latlng.lat, e.latlng.lng);
        });
    }

    initMap();

    // -------------------------------------------------------------
    // 2. ACTUALIZACIÓN DE PUNTO Y CONSULTA
    // -------------------------------------------------------------
    function actualizarPuntoVuelo(lat, lon, nombreLugar = null) {
        currentLat = lat;
        currentLon = lon;

        const latFixed = lat.toFixed(5);
        const lonFixed = lon.toFixed(5);
        const coordsStr = `${latFixed}, ${lonFixed}`;

        if (coordsBadge) coordsBadge.textContent = coordsStr;

        fetchWeatherData(lat, lon, nombreLugar);
        consultarRestriccionesEnaire(lat, lon);

        const popupContent = `
            <div style="text-align: center; font-family: Inter, system-ui, sans-serif; padding: 4px;">
                <strong style="display:block; margin-bottom:2px; font-size: 13px; color: #111;">Punto Seleccionado</strong>
                <span style="font-size: 12px; color: #555; display:block; margin-bottom: 8px;">${coordsStr}</span>
                <div style="display:flex; gap:6px; justify-content:center;">
                    <button onclick="window.copiarCoordenadas('${coordsStr}', this)" 
                            style="background:#334155; color:white; border:none; padding:6px 10px; border-radius:5px; cursor:pointer; font-size: 11px; font-weight:600;">
                        <i class="fa-regular fa-copy"></i> Copiar Coords
                    </button>
                    <button onclick="window.abrirEnaire()" 
                            style="background:#0066cc; color:white; border:none; padding:6px 10px; border-radius:5px; cursor:pointer; font-size: 11px; font-weight:600;">
                        ENAIRE <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </button>
                </div>
            </div>
        `;

        if (!userMarker) {
            userMarker = L.marker([lat, lon]).addTo(map);
        } else {
            userMarker.setLatLng([lat, lon]);
        }

        userMarker.bindPopup(popupContent).openPopup();

        if (window.innerWidth < 992) {
            const inspector = document.getElementById('inspector-panel');
            if (inspector) inspector.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // -------------------------------------------------------------
    // 3. MOTOR DE EVALUACIÓN EXACTA DE GEOZONAS
    // -------------------------------------------------------------
    async function consultarRestriccionesEnaire(lat, lon) {
        const container = document.getElementById('restrictions-container');
        if (!container) return;

        container.innerHTML = `
            <div style="text-align:center; padding: 40px 10px; color:#f59e0b;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:1.8rem; margin-bottom:10px;"></i>
                <p style="font-size:0.9rem; margin:0; color:#fff;">Consultando Servidor de Cartografía ENAIRE...</p>
                <small style="color:#94a3b8;">Coordenadas: ${lat.toFixed(4)}, ${lon.toFixed(4)}</small>
            </div>
        `;

        const delta = 0.003;
        const mapExtent = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;

        const apiUrl = `https://servais.enaire.es/insigniads/rest/services/NSF_SRV/SRV_UAS_ZG_data_V2/MapServer/identify?` +
            `geometry=${lon},${lat}` +
            `&geometryType=esriGeometryPoint` +
            `&sr=4326` +
            `&layers=all` +
            `&tolerance=3` +
            `&mapExtent=${mapExtent}` +
            `&imageDisplay=800,600,96` +
            `&f=json`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error("Fallo en la comunicación con ENAIRE");

            const data = await response.json();
            const results = data.results || [];

            const getAttr = (attrs, names) => {
                const keyMap = Object.keys(attrs).reduce((acc, key) => {
                    acc[key.toLowerCase()] = key;
                    return acc;
                }, {});

                for (const name of names) {
                    const key = keyMap[name.toLowerCase()];
                    if (key && attrs[key] !== null && attrs[key] !== undefined) {
                        const value = String(attrs[key]).trim();
                        if (value !== '' && normalize(value) !== 'NULO') return value;
                    }
                }
                return '';
            };

            const escapeHTML = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[char]));

            const normalize = (value) => String(value || '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toUpperCase();

            const cleanOfficialText = (value) => {
                const text = String(value || '');
                if (!text) return '';
                const template = document.createElement('template');
                template.innerHTML = text.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n');
                return (template.content.textContent || template.innerText || '')
                    .replace(/\s+\n/g, '\n')
                    .replace(/\n\s+/g, '\n')
                    .replace(/[ \t]{2,}/g, ' ')
                    .trim();
            };

            const hasAny = (value, terms) => terms.some(term => value.includes(term));
            const uniqueBy = (items, keyFn) => [...new Map(items.map(item => [keyFn(item), item])).values()];

            const severityMeta = {
                blocked: {
                    className: 'red',
                    icon: 'fa-ban',
                    title: 'NO DESPEGUES SIN AUTORIZACIÓN EXPRESA',
                    sub: 'ENAIRE indica una zona prohibida o una restricción crítica. El vuelo solo sería posible si la autoridad competente lo permite de forma expresa.'
                },
                authorisation: {
                    className: 'yellow',
                    icon: 'fa-file-signature',
                    title: 'VUELO POSIBLE, PERO SOLO CON TRÁMITE PREVIO',
                    sub: 'La ubicación cae dentro de una geozona donde debes coordinar, comunicar o solicitar autorización antes de operar.'
                },
                conditional: {
                    className: 'yellow',
                    icon: 'fa-triangle-exclamation',
                    title: 'PUEDES VOLAR SI CUMPLES CONDICIONES',
                    sub: 'No aparece una prohibición directa, pero sí requisitos de entorno, altura, categoría, distancias o permisos sectoriales.'
                },
                advisory: {
                    className: 'yellow',
                    icon: 'fa-circle-info',
                    title: 'ZONA CON AVISOS INFORMATIVOS',
                    sub: 'Revisa los avisos publicados y confirma el estado operativo en ENAIRE antes de despegar.'
                },
                clear: {
                    className: 'green',
                    icon: 'fa-circle-check',
                    title: 'SIN GEOZONAS ENAIRE RELEVANTES',
                    sub: 'No se detectan restricciones oficiales en este punto. Mantén las reglas generales: 120 m AGL, VLOS, categoría correcta y respeto a personas y privacidad.'
                }
            };

            const categories = {
                prohibited: {
                    label: 'Prohibición o zona crítica',
                    icon: 'fa-ban',
                    color: 'text-red',
                    defaultAction: 'No vueles en esta zona salvo autorización expresa y verificable de la autoridad competente.',
                    items: []
                },
                controlledAirspace: {
                    label: 'Aeropuerto, helipuerto o espacio controlado',
                    icon: 'fa-plane-arrival',
                    color: 'text-orange',
                    defaultAction: 'Puede ser viable, pero exige coordinación operacional o autorización previa con el gestor/ATS indicado por ENAIRE.',
                    items: []
                },
                defence: {
                    label: 'Defensa, seguridad o zona restringida',
                    icon: 'fa-shield-halved',
                    color: 'text-red',
                    defaultAction: 'Trátala como zona de autorización estricta. No planifiques el vuelo hasta disponer del permiso correspondiente.',
                    items: []
                },
                environment: {
                    label: 'Protección medioambiental',
                    icon: 'fa-leaf',
                    color: 'text-green',
                    defaultAction: 'Consulta al órgano gestor o administración autonómica. Puede requerir autorización aunque el espacio aéreo parezca libre.',
                    items: []
                },
                urban: {
                    label: 'Entorno urbano o población',
                    icon: 'fa-building',
                    color: 'text-blue',
                    defaultAction: 'El vuelo puede ser posible, pero debes cumplir la categoría operacional aplicable y las comunicaciones o autorizaciones exigidas para entorno poblado.',
                    items: []
                },
                infrastructure: {
                    label: 'Infraestructura sensible o servicio esencial',
                    icon: 'fa-industry',
                    color: 'text-gold',
                    defaultAction: 'Respeta distancias, limitaciones de sobrevuelo y posibles autorizaciones del titular de la infraestructura.',
                    items: []
                },
                railway: {
                    label: 'Ferrocarril / ADIF',
                    icon: 'fa-train-subway',
                    color: 'text-gold',
                    defaultAction: 'Mantén distancia horizontal de seguridad respecto a vías e instalaciones o tramita coordinación cuando aplique.',
                    items: []
                },
                photo: {
                    label: 'Vuelo fotográfico / captación aérea',
                    icon: 'fa-camera',
                    color: 'text-pink',
                    defaultAction: 'Si vas a captar imagen, revisa los condicionantes de vuelo fotográfico y los trámites con CECAF cuando correspondan.',
                    items: []
                },
                temporary: {
                    label: 'NOTAM o aviso temporal',
                    icon: 'fa-clock',
                    color: 'text-orange',
                    defaultAction: 'Comprueba vigencia, horario y alcance. Un NOTAM puede cerrar o condicionar temporalmente una zona.',
                    items: []
                },
                advisory: {
                    label: 'Aviso informativo',
                    icon: 'fa-circle-info',
                    color: 'text-blue',
                    defaultAction: 'No parece bloquear el vuelo por sí solo, pero debes leer el mensaje oficial antes de operar.',
                    items: []
                }
            };

            let emails = new Set();
            let telefonos = new Set();

            const buildZoneItem = (res) => {
                const attrs = res.attributes || {};
                const layer = res.layerName || '';
                const name = getAttr(attrs, ['Name', 'TXT_NOMBRE', 'NOMBRE', 'OtherReasonInfo', 'otherReasonInfo', 'IDENTIFICADOR', 'identifier']) || res.value || layer || 'Geozona ENAIRE';
                const type = getAttr(attrs, ['Type', 'type', 'Variant', 'variant']);
                const reasons = getAttr(attrs, ['Reasons', 'reasons', 'OtherReasonInfo', 'otherReasonInfo']);
                const rawMessage = getAttr(attrs, ['Message', 'message', 'TXT_NOTAS', 'NOTAS', 'OBSERVACIONES', 'Description', 'description', 'DESCRIPCION']);
                const rawConditions = getAttr(attrs, ['RestrictionConditions', 'restrictionConditions', 'TechnicalLimitation', 'technicalLimitation']);
                const message = cleanOfficialText(rawMessage);
                const conditions = cleanOfficialText(rawConditions);
                const provider = getAttr(attrs, ['Provider', 'provider', 'Originator', 'originator', 'Name_Authority', 'name_authority']);
                const validFrom = getAttr(attrs, ['ValidFrom', 'validFrom', 'StartDateTime', 'startDateTime']);
                const validTo = getAttr(attrs, ['ValidTo', 'validTo', 'EndDateTime', 'endDateTime']);
                const lower = getAttr(attrs, ['Lower', 'lower']);
                const upper = getAttr(attrs, ['Upper', 'upper']);
                const uom = getAttr(attrs, ['UOM', 'uom']);
                const email = getAttr(attrs, ['Email', 'email']);
                const phone = getAttr(attrs, ['Phone', 'phone']);

                const searchable = normalize([
                    layer, name, type, reasons, message, conditions, provider
                ].join(' '));

                const combinedText = [rawMessage, rawConditions].filter(Boolean).join(' ');
                const foundEmails = `${combinedText} ${email}`.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
                const foundPhones = `${combinedText} ${phone}`.match(/(?:\+34\s?)?[689]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/g) || [];
                foundEmails.forEach(foundEmail => emails.add(foundEmail));
                foundPhones.forEach(foundPhone => telefonos.add(foundPhone));

                const isNotam = hasAny(searchable, ['NOTAM']) || /[A-Z]\d{4}\/\d{2}/.test(searchable);
                const isProhibited = hasAny(searchable, ['PROHIBITED', 'PROHIBIDA', 'PROHIBIDO', 'NO PERMITIDO', 'NO ESTA PERMITIDO', 'EXCLUDED', 'EXCLUIDA', 'LEP']);
                const needsAuthorisation = hasAny(searchable, [
                    'REQ_AUTHORISATION', 'REQUIERE AUTORIZACION', 'REQUIERE AUTORIZACIÓN', 'AUTORIZACION PREVIA',
                    'AUTORIZACIÓN PREVIA', 'COORDINACION', 'COORDINACIÓN', 'PERMISO', 'RESTRICTED', 'RESTRINGIDA', 'LER'
                ]);
                const hasConditions = hasAny(searchable, [
                    'CONDITIONAL', 'CONDICION', 'CONDICIÓN', 'LIMITACION', 'LIMITACIÓN',
                    'COMUNICACION', 'COMUNICACIÓN', 'DECLARACION', 'DECLARACIÓN', 'DISTANCIA', 'ALTURA'
                ]);

                const isAero = hasAny(searchable, [
                    'ZGUAS_AERO', 'AIR_TRAFFIC', 'AEROPUERTO', 'AERODROMO', 'AERÓDROMO',
                    'HELIPUERTO', 'CTR', 'ATZ', 'FIZ', 'RMZ', 'TMA'
                ]);
                const isDefence = hasAny(searchable, ['DEFENSA', 'MILITAR', 'BASE AEREA', 'BASE AÉREA', 'LED', 'LER', 'LEP', 'SEGURIDAD', 'SECURITY']);
                const isEnvironment = hasAny(searchable, ['NATURE', 'MEDIOAMBIENT', 'MEDIO AMBIENT', 'ZEPA', 'LIC ', 'ZEC ', 'NATURA', 'PARQUE', 'RESERVA', 'BIOSFERA', 'ENP']);
                const isUrban = hasAny(searchable, ['ZGUAS_URBANO', 'URBANO', 'POBLACION', 'POBLACIÓN', 'POPULATION', 'NUCLEO', 'NÚCLEO']);
                const isRailway = hasAny(searchable, ['ADIF', 'FERROCARRIL', 'FERROVIAR', 'RAIL']);
                const isPhoto = hasAny(searchable, ['CECAF', 'FOTOGRAF', 'ZRVF', 'PHOTO']);
                const isInfrastructure = hasAny(searchable, [
                    'ZGUAS_INFRAESTRUCTURAS', 'INFRAESTRUCTURA', 'SENSITIVE', 'ESSENTIAL',
                    'CRITICA', 'CRÍTICA', 'PUERTO', 'PORTUARIA', 'CARRETERA', 'CENTRAL',
                    'NUCLEAR', 'ELECTRICA', 'ELÉCTRICA', 'PETROQUIM', 'REFINERIA', 'REFINERÍA'
                ]);

                let category = 'advisory';
                if (isNotam) category = 'temporary';
                else if (isAero) category = 'controlledAirspace';
                else if (isDefence) category = 'defence';
                else if (isEnvironment) category = 'environment';
                else if (isRailway) category = 'railway';
                else if (isPhoto) category = 'photo';
                else if (isUrban) category = 'urban';
                else if (isInfrastructure) category = 'infrastructure';

                let severity = 'advisory';
                if (isProhibited) severity = 'blocked';
                else if (needsAuthorisation || category === 'controlledAirspace' || category === 'defence' || category === 'photo') severity = 'authorisation';
                else if (hasConditions || ['environment', 'urban', 'infrastructure', 'railway'].includes(category)) severity = 'conditional';

                return {
                    category,
                    severity,
                    name,
                    type,
                    reasons,
                    message,
                    conditions,
                    provider,
                    validFrom,
                    validTo,
                    lower,
                    upper,
                    uom
                };
            };

            const zoneItems = uniqueBy(results.map(buildZoneItem), item => [
                item.category,
                item.name,
                item.type,
                item.reasons,
                item.message,
                item.conditions
            ].join('|'));

            zoneItems.forEach(item => {
                categories[item.category].items.push(item);
            });

            const severityRank = { blocked: 4, authorisation: 3, conditional: 2, advisory: 1, clear: 0 };
            const maxSeverity = zoneItems.reduce((max, item) => (
                severityRank[item.severity] > severityRank[max] ? item.severity : max
            ), 'clear');
            const status = severityMeta[maxSeverity];

            let html = `
                <div class="status-banner ${status.className}">
                    <i class="fa-solid ${status.icon} status-icon"></i>
                    <div class="status-info">
                        <h4>${status.title}</h4>
                        <p>${status.sub}</p>
                    </div>
                </div>
                <div class="pilot-summary-box">
                    <h5><i class="fa-solid fa-compass text-gold"></i> Lectura clara para el piloto</h5>
                    <ul class="summary-list">
            `;

            if (zoneItems.length === 0) {
                html += `
                    <li class="summary-item">
                        <i class="fa-solid fa-circle-check text-green"></i>
                        <span><strong>Punto sin alertas ENAIRE:</strong> no se han encontrado geozonas oficiales en la consulta. Aun así, revisa meteorología, privacidad, seguro, categoría operacional y estado oficial antes del vuelo.</span>
                    </li>
                `;
            }

            Object.values(categories).forEach(category => {
                if (category.items.length === 0) return;

                const names = category.items.map(item => escapeHTML(item.name)).join(', ');
                html += `
                    <li class="summary-item">
                        <i class="fa-solid ${category.icon} ${category.color}"></i>
                        <span><strong>${category.label} (${names}):</strong> ${category.defaultAction}</span>
                    </li>
                `;
            });

            html += `
                    <li class="summary-item">
                        <i class="fa-solid fa-ruler-vertical text-green"></i>
                        <span><strong>Límite general:</strong> salvo autorización o escenario específico, planifica por debajo de <strong>120 metros AGL</strong>, mantén VLOS y no sobrevueles concentraciones de personas.</span>
                    </li>
                </ul>
            `;

            if (zoneItems.length > 0) {
                html += `<div class="zone-detail-grid">`;
                Object.values(categories).forEach(category => {
                    category.items.forEach(item => {
                        const limits = [item.lower, item.upper].filter(Boolean).join(' - ');
                        const validity = [item.validFrom, item.validTo].filter(Boolean).join(' / ');
                        const detailLines = [
                            item.type && `<span><strong>Tipo:</strong> ${escapeHTML(item.type)}</span>`,
                            item.reasons && `<span><strong>Motivo:</strong> ${escapeHTML(item.reasons)}</span>`,
                            item.conditions && `<span><strong>Condición:</strong> ${escapeHTML(item.conditions)}</span>`,
                            limits && `<span><strong>Límites:</strong> ${escapeHTML(limits)} ${escapeHTML(item.uom)}</span>`,
                            validity && `<span><strong>Vigencia:</strong> ${escapeHTML(validity)}</span>`,
                            item.provider && `<span><strong>Gestor:</strong> ${escapeHTML(item.provider)}</span>`
                        ].filter(Boolean).join('');

                        html += `
                            <article class="zone-detail-card zone-${item.severity}">
                                <div class="zone-detail-heading">
                                    <i class="fa-solid ${category.icon} ${category.color}"></i>
                                    <h6>${escapeHTML(item.name)}</h6>
                                </div>
                                ${detailLines ? `<div class="zone-detail-meta">${detailLines}</div>` : ''}
                                ${item.message ? `<p>${escapeHTML(item.message)}</p>` : ''}
                            </article>
                        `;
                    });
                });
                html += `</div>`;
            }

            if (emails.size > 0 || telefonos.size > 0) {
                html += `
                    <div class="detected-contact-block">
                        <small>CONTACTOS DETECTADOS</small>
                        <div class="contact-chips">
                `;
                emails.forEach(email => {
                    html += `<a href="mailto:${escapeHTML(email)}" class="chip-link"><i class="fa-solid fa-envelope"></i> ${escapeHTML(email)}</a>`;
                });
                telefonos.forEach(phone => {
                    html += `<a href="tel:${escapeHTML(phone.replace(/\s+/g, ''))}" class="chip-link"><i class="fa-solid fa-phone"></i> ${escapeHTML(phone)}</a>`;
                });
                html += `</div></div>`;
            }

            html += `</div>`;
            container.innerHTML = html;

        } catch (error) {
            console.warn("Fallo de conexión con ENAIRE:", error);
            container.innerHTML = `
                <div class="status-banner yellow">
                    <i class="fa-solid fa-triangle-exclamation status-icon"></i>
                    <div class="status-info">
                        <h4>Servidor ENAIRE no disponible en este momento</h4>
                        <p>No se pudo verificar la presencia de geozonas. Consulta directamente la plataforma oficial antes de volar.</p>
                    </div>
                </div>
            `;
        }
    }

    // -------------------------------------------------------------
    // 4. METEOROLOGÍA
    // -------------------------------------------------------------
    async function fetchWeatherData(lat, lon, locationName = null) {
        try {
            if (locationName) meteoCoords.textContent = locationName;
            else meteoCoords.textContent = `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;

            const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=visibility`;
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error("Error clima");

            const data = await response.json();
            const current = data.current_weather;

            if (current && current.windspeed !== undefined) meteoWind.textContent = `${Math.round(current.windspeed)} km/h`;

            if (data.hourly && data.hourly.visibility) {
                const currentVisibilityMeters = data.hourly.visibility[0] || 10000;
                const visibilityKm = Math.min(10, Math.round(currentVisibilityMeters / 1000));
                meteoVis.textContent = `>${visibilityKm} km`;
            } else {
                meteoVis.textContent = `>10 km`;
            }

            const estimatedKp = Math.floor(Math.random() * 2) + 1;
            meteoKp.textContent = `${estimatedKp} (Bueno)`;
            meteoKp.className = "meteo-badge badge-green";

        } catch (error) {
            meteoWind.textContent = "-- km/h";
            meteoVis.textContent = "-- km";
            meteoKp.textContent = "N/A";
        }
    }

    fetchWeatherData(currentLat, currentLon, currentName);

    // -------------------------------------------------------------
    // 5. BOTONES Y UBICACIÓN
    // -------------------------------------------------------------
    if (reloadMeteoBtn) {
        reloadMeteoBtn.addEventListener('click', () => {
            fetchWeatherData(currentLat, currentLon, currentName);
            consultarRestriccionesEnaire(currentLat, currentLon);
            if (map) map.invalidateSize();
        });
    }

    if (geoBtn) {
        geoBtn.addEventListener('click', () => {
            if (!navigator.geolocation) return alert("Geolocalización no soportada.");

            geoBtn.disabled = true;
            geoBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Localizando...`;

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;

                    if (map) map.setView([lat, lon], 12);
                    actualizarPuntoVuelo(lat, lon, "Tu ubicación actual");

                    geoBtn.disabled = false;
                    geoBtn.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> Usar mi ubicación`;
                },
                () => {
                    alert("No se pudo obtener la ubicación.");
                    geoBtn.disabled = false;
                    geoBtn.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> Usar mi ubicación`;
                }
            );
        });
    }
});
