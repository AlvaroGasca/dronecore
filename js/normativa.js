/**
 * NORMATIVA.JS — Verificador de condiciones de vuelo
 * Orientativo. No sustituye la consulta de la normativa oficial.
 */
document.addEventListener('DOMContentLoaded', () => {

    const submitBtn = document.getElementById('checker-submit');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', () => {
        const peso    = document.getElementById('fc-peso').value;
        const camara  = document.getElementById('fc-camara').value;
        const zona    = document.getElementById('fc-zona').value;
        const altura  = document.getElementById('fc-altura').value;
        const horario = document.getElementById('fc-horario').value;

        // Validación mínima
        if (!peso || !camara || !zona || !altura || !horario) {
            alert('Completa todos los campos para obtener el análisis.');
            return;
        }

        const result = analyzeOperation({ peso, camara, zona, altura, horario });
        renderResult(result);
    });

    /**
     * Analiza los parámetros y devuelve un objeto con veredicto y requisitos.
     */
    function analyzeOperation({ peso, camara, zona, altura, horario }) {
        let verdict  = 'green';   // green | orange | red
        let title    = '';
        let summary  = '';
        const reqs   = [];        // { icon, type (ok|warn|danger), text }

        // ── Altura ──────────────────────────────────────────
        if (altura === 'gt120') {
            verdict = 'red';
            reqs.push({ type: 'danger', icon: 'fa-triangle-exclamation', text: 'Altura > 120 m: requiere autorización especial de AESA. No es posible en categoría abierta.' });
        } else if (altura === 'lt120') {
            reqs.push({ type: 'ok', icon: 'fa-circle-check', text: 'Altura dentro del límite de 120 m.' });
        } else {
            reqs.push({ type: 'ok', icon: 'fa-circle-check', text: 'Altura inferior a 50 m: sin problemas de altitud.' });
        }

        // ── Zona ────────────────────────────────────────────
        if (zona === 'restriccion') {
            if (verdict !== 'red') verdict = 'red';
            reqs.push({ type: 'danger', icon: 'fa-ban', text: 'Zona con restricción: consulta ENAIRE Drones. El vuelo puede estar completamente prohibido.' });
        } else if (zona === 'aglomeracion') {
            if (verdict !== 'red') verdict = 'red';
            reqs.push({ type: 'danger', icon: 'fa-ban', text: 'Aglomeración de personas: prohibido sobrevolar en categoría abierta. Requiere categoría específica.' });
        } else if (zona === 'residencial') {
            if (verdict === 'green') verdict = 'orange';
            reqs.push({ type: 'warn', icon: 'fa-triangle-exclamation', text: 'Zona residencial/urbana: aplica subcategoría A2 o A3. Mantén distancias mínimas a personas.' });
        } else {
            reqs.push({ type: 'ok', icon: 'fa-circle-check', text: 'Zona rural/despoblada: compatible con categoría abierta A3.' });
        }

        // ── Peso y registro ─────────────────────────────────
        if (peso === 'gt4k') {
            if (verdict !== 'red') verdict = 'orange';
            reqs.push({ type: 'warn', icon: 'fa-triangle-exclamation', text: 'MTOM > 4 kg: puede requerir categoría específica según el escenario. Consulta AESA.' });
            reqs.push({ type: 'warn', icon: 'fa-id-card', text: 'Registro de operador obligatorio.' });
            reqs.push({ type: 'warn', icon: 'fa-file-shield', text: 'Seguro de responsabilidad civil obligatorio (MTOM ≥ 20 kg o categoría específica).' });
        } else if (peso === 'lt250' && camara === 'no') {
            reqs.push({ type: 'ok', icon: 'fa-circle-check', text: 'Peso < 250 g sin cámara: registro de operador no obligatorio en la mayoría de casos.' });
        } else {
            reqs.push({ type: 'warn', icon: 'fa-id-card', text: 'Registro de operador obligatorio (UAS ≥ 250 g o con cámara).' });
        }

        // ── Cámara y privacidad ─────────────────────────────
        if (camara === 'si') {
            reqs.push({ type: 'warn', icon: 'fa-camera', text: 'Con cámara: aplica normativa de protección de datos. Minimiza la captación de personas.' });
        }

        // ── Horario nocturno ────────────────────────────────
        if (horario === 'noche') {
            if (verdict === 'green') verdict = 'orange';
            reqs.push({ type: 'warn', icon: 'fa-moon', text: 'Vuelo nocturno: requiere luz verde intermitente en la aeronave y formación adicional.' });
        } else {
            reqs.push({ type: 'ok', icon: 'fa-sun', text: 'Vuelo diurno: sin requisitos adicionales de iluminación.' });
        }

        // ── Veredicto ────────────────────────────────────────
        if (verdict === 'green') {
            title   = '✓ Operación compatible con Categoría Abierta';
            summary = 'Tu operación parece encajar dentro de la categoría abierta. Consulta ENAIRE Drones para verificar las zonas geográficas UAS antes de volar y asegúrate de cumplir todos los requisitos.';
        } else if (verdict === 'orange') {
            title   = '⚠ Revisa los requisitos antes de volar';
            summary = 'Tu operación tiene condiciones que requieren verificación adicional. Es posible que debas tramitar formación, seguro o consultar restricciones específicas de la zona.';
        } else {
            title   = '✗ Esta operación puede no ser posible sin autorización';
            summary = 'Alguna característica de tu vuelo supera los límites de la categoría abierta. Necesitarás autorización de AESA o encajar en categoría específica. No vueles sin verificar con la normativa oficial.';
        }

        return { verdict, title, summary, reqs };
    }

    /**
     * Renderiza el resultado en el DOM.
     */
    function renderResult({ verdict, title, summary, reqs }) {
        const resultEl = document.getElementById('checker-result');
        const innerEl  = document.getElementById('checker-result-inner');

        const iconMap = { green: 'fa-circle-check', orange: 'fa-triangle-exclamation', red: 'fa-circle-xmark' };

        const reqsHTML = reqs.map(r => `
            <li>
                <i class="fa-solid ${r.icon} req-${r.type}"></i>
                ${r.text}
            </li>
        `).join('');

        innerEl.innerHTML = `
            <div class="checker-verdict verdict--${verdict}">
                <div class="checker-verdict-icon">
                    <i class="fa-solid ${iconMap[verdict]}"></i>
                </div>
                <div class="checker-verdict-text">
                    <h4>${title}</h4>
                    <p>${summary}</p>
                </div>
            </div>
            <div class="checker-requirements">
                <h5>Análisis detallado</h5>
                <ul class="checker-req-list">${reqsHTML}</ul>
            </div>
        `;

        resultEl.style.display = 'block';
        resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
});
