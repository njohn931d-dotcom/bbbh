import { getCalculator, calculateRoute, formatResult } from './calculator-model.mjs';

const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const spanishMortgage = {
  'Loan amount': 'Importe del préstamo',
  'Interest rate (annual, not APR with fees)': 'Tipo de interés anual (sin comisiones)',
  'Loan term in years': 'Plazo en años',
  'Monthly principal + interest': 'Cuota mensual: capital e intereses',
  'Total interest': 'Intereses totales',
  'Total repaid': 'Total devuelto',
};
const spanishNote = 'Solo capital e intereses. No incluye impuestos, seguros, gastos ni comisiones. Use el interés del préstamo, no la TAE con comisiones.';
const text = (s, lang) => lang === 'es' ? (spanishMortgage[s] || s) : s;

export function renderCalculator(route, lang = 'en') {
  const model = getCalculator(route);
  if (!model) throw Error(`No calculator for ${route}`);
  const isSpanish = lang === 'es';
  const defaults = Object.fromEntries(model.fields.map(f => [f.key, f.value]));
  const results = calculateRoute(route, defaults);
  const currency = isSpanish ? 'EUR' : 'USD';
  return `<section class="route-calculator" data-calculator="${escapeHtml(route)}" data-language="${escapeHtml(lang)}" aria-labelledby="route-calculator-title">
  <div class="route-calculator-header"><div class="section-label">${isSpanish ? 'CÁLCULO CON TUS CIFRAS' : 'CALCULATE WITH YOUR NUMBERS'}</div>
  <h2 id="route-calculator-title">${isSpanish ? 'Prueba tus propios datos' : 'Try your own numbers'}</h2>
  <p>${isSpanish ? 'Cambia los valores para obtener un resultado. Nada se envía a un servidor.' : 'Change the numbers to see your result. Your inputs stay in this browser.'}</p></div>
  <form class="route-calc-form">
  ${isSpanish ? `<label class="route-field"><span>Moneda de los resultados</span><select name="currency" aria-label="Moneda de los resultados"><option value="EUR">EUR (€)</option><option value="MXN">MXN ($)</option><option value="USD">USD ($)</option></select></label>` : ''}
  <div class="route-fields">${model.fields.map(f => `<label class="route-field"><span>${escapeHtml(text(f.label, lang))}</span><span class="route-input">${f.prefix ? `<span aria-hidden="true">${isSpanish ? '¤' : escapeHtml(f.prefix)}</span>` : ''}<input type="number" inputmode="decimal" name="${escapeHtml(f.key)}" value="${f.value}" min="${f.min}" max="${f.max}" step="${f.step}" required>${f.suffix ? `<span aria-hidden="true">${escapeHtml(f.suffix)}</span>` : ''}</span></label>`).join('')}</div>
  <button class="route-submit" type="submit">${isSpanish ? 'Calcular' : 'Calculate'} <span aria-hidden="true">→</span></button>
  <noscript><p>${isSpanish ? 'Activa JavaScript para recalcular. A continuación aparece un ejemplo con los valores iniciales.' : 'Enable JavaScript to recalculate. The result below is a worked example with the starting values.'}</p></noscript>
  </form>
  <div class="route-calc-result" aria-live="polite"><p class="route-calc-error" role="status" hidden></p>
  <dl>${results.map(o => `<div><dt>${escapeHtml(text(o.label, lang))}</dt><dd>${escapeHtml(formatResult(o, currency))}</dd></div>`).join('')}</dl></div>
  <p class="route-disclaimer">${escapeHtml(isSpanish ? spanishNote : model.note)}</p>
  </section>`;
}
