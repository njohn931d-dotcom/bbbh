import { calculateRoute, formatResult } from './scripts/calculator-model.mjs';

const widget = document.querySelector('[data-calculator]');
if (widget) {
  const form = widget.querySelector('.route-calc-form');
  const output = widget.querySelector('.route-calc-result dl');
  const error = widget.querySelector('.route-calc-error');
  const update = () => {
    const invalid = form.querySelector('input:invalid');
    if (invalid) {
      output.replaceChildren();
      error.textContent = invalid.validationMessage;
      error.hidden = false;
      return;
    }
    try {
      const values = Object.fromEntries(new FormData(form));
      const results = calculateRoute(widget.dataset.calculator, values);
      const currency = values.currency || 'USD';
      output.replaceChildren(...results.map(({ label, ...rest }) => {
        const row = document.createElement('div');
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        const translated = widget.dataset.language === 'es' ? {
          'Monthly principal + interest': 'Cuota mensual: capital e intereses',
          'Total interest': 'Intereses totales', 'Total repaid': 'Total devuelto',
        } : {};
        dt.textContent = translated[label] || label;
        dd.textContent = formatResult(rest, currency);
        row.append(dt, dd);
        return row;
      }));
      error.hidden = true;
      error.textContent = '';
    } catch (e) {
      output.replaceChildren();
      error.textContent = e instanceof RangeError ? e.message : 'Unable to calculate; check your inputs.';
      error.hidden = false;
    }
  };
  form.addEventListener('submit', event => { event.preventDefault(); update(); });
  form.addEventListener('input', update);
  form.addEventListener('change', update);
}
