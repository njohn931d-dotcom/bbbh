/**
 * Server-side markup for the pay converter (widgets/converter.js is the
 * progressive enhancement). The markup already contains the computed results,
 * so the page is useful and indexable without JavaScript; the script only
 * recomputes the same numbers when a field changes.
 *
 * All labels are passed in, so the same component serves every language.
 */
import { esc } from './util.mjs';

export const EN_LABELS = {
  title: 'Pay converter',
  intro: 'Change any number. Everything is worked out in your browser and nothing is sent anywhere.',
  amount: 'Amount',
  per: { hour: 'per hour', day: 'per day', week: 'per week', biweek: 'every 2 weeks', month: 'per month', year: 'per year' },
  hoursPerWeek: 'Hours per week',
  weeksPerYear: 'Weeks per year',
  out: { hourly: 'Hourly', daily: 'Daily', weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly', annual: 'Annual' },
  price: 'A purchase costing',
  priceHours: 'That is about {h} hours of work at this pay, before tax.',
};

export const PERIODS = ['hour', 'day', 'week', 'biweek', 'month', 'year'];

/** Convert any period amount to an hourly figure. Mirrors widgets/converter.js. */
export function toHourly(amount, period, hoursPerWeek = 40, weeksPerYear = 52) {
  const perYear = hoursPerWeek * weeksPerYear;
  switch (period) {
    case 'hour': return amount;
    case 'day': return amount / (hoursPerWeek / 5);
    case 'week': return amount / hoursPerWeek;
    case 'biweek': return amount / (2 * hoursPerWeek);
    case 'month': return (amount * 12) / perYear;
    case 'year': return amount / perYear;
    default: throw new Error(`unknown period ${period}`);
  }
}

export function fromHourly(hourly, hoursPerWeek = 40, weeksPerYear = 52) {
  const weekly = hourly * hoursPerWeek;
  const annual = weekly * weeksPerYear;
  return { hourly, daily: weekly / 5, weekly, biweekly: weekly * 2, monthly: annual / 12, annual };
}

/**
 * @param {object} o
 * @param {number} o.amount
 * @param {'hour'|'day'|'week'|'biweek'|'month'|'year'} [o.period]
 * @param {string} [o.locale]   BCP-47 tag used for number formatting
 * @param {string} [o.currency] ISO 4217 code
 * @param {number} [o.hoursPerWeek]
 * @param {number} [o.weeksPerYear]
 * @param {number} [o.price]    example purchase price for the hours row
 * @param {typeof EN_LABELS} [o.labels]
 * @param {string} [o.heading]  'h2' (default) or 'h3'
 */
export function converterHtml(o) {
  const L = o.labels || EN_LABELS;
  const locale = o.locale || 'en-US';
  const currency = o.currency || 'USD';
  const period = o.period || 'hour';
  const hpw = o.hoursPerWeek ?? 40;
  const wpy = o.weeksPerYear ?? 52;
  const price = o.price ?? 100;
  const money = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 });
  const hoursFmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const hourly = toHourly(o.amount, period, hpw, wpy);
  const res = fromHourly(hourly, hpw, wpy);
  const tag = o.heading || 'h2';

  const attrs = `data-worth-converter data-locale="${esc(locale)}" data-currency="${esc(currency)}" data-price-text="${esc(L.priceHours)}"`;
  const rows = Object.keys(L.out).map(k => `<tr><th scope="row">${esc(L.out[k])}</th><td data-out="${k}">${money.format(res[k])}</td></tr>`).join('');
  const hoursText = L.priceHours.replace('{h}', hoursFmt.format(price / hourly));

  return `<section class="gx-conv" ${attrs}>` +
    `<${tag}>${esc(L.title)}</${tag}><p class="gx-conv-intro">${esc(L.intro)}</p>` +
    `<form class="gx-conv-form" autocomplete="off">` +
    `<label class="gx-wide">${esc(L.amount)}<span class="gx-row"><input name="amount" type="number" inputmode="decimal" min="0" step="any" value="${o.amount}">` +
    `<select name="period" aria-label="${esc(L.amount)}">${PERIODS.map(p => `<option value="${p}"${p === period ? ' selected' : ''}>${esc(L.per[p])}</option>`).join('')}</select></span></label>` +
    `<label>${esc(L.hoursPerWeek)}<input name="hours" type="number" inputmode="decimal" min="1" max="168" step="any" value="${hpw}"></label>` +
    `<label>${esc(L.weeksPerYear)}<input name="weeks" type="number" inputmode="decimal" min="1" max="52" step="any" value="${wpy}"></label>` +
    `</form>` +
    `<table class="gx-conv-out"><tbody>${rows}</tbody></table>` +
    `<form class="gx-conv-price" autocomplete="off"><label>${esc(L.price)}<input name="price" type="number" inputmode="decimal" min="0" step="any" value="${price}"></label>` +
    `<p data-out="priceHours">${esc(hoursText)}</p></form>` +
    `</section>`;
}

/**
 * A small "basket" calculator: rows of quantity x price, plus the visitor's
 * take-home hourly pay, answering "what does this cost in hours of work?".
 * Results are rendered on the server and recomputed by widgets/converter.js.
 *
 * @param {object} o
 * @param {string} o.title
 * @param {string} [o.intro]
 * @param {{label:string, qty:number, price:number}[]} o.rows
 * @param {number} o.hourly   take-home pay per hour used for the hours figure
 * @param {string} [o.locale]
 * @param {string} [o.currency]
 * @param {{qty:string, price:string, hourly:string, total:string, hoursText:string}} [o.labels]
 */
export function basketHtml(o) {
  const locale = o.locale || 'en-US';
  const currency = o.currency || 'USD';
  const L = o.labels || {
    qty: 'Quantity', price: 'Price each', hourly: 'Your take-home pay per hour', total: 'Total',
    hoursText: 'About {h} hours of work at {rate} an hour (a full workday is 8 hours).',
  };
  const money = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 });
  const hoursFmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const total = o.rows.reduce((s, r) => s + r.qty * r.price, 0);
  const text = L.hoursText.replace('{h}', hoursFmt.format(total / o.hourly)).replace('{rate}', money.format(o.hourly));
  const rows = o.rows.map((r, i) => `<div class="gx-basket-row"><span>${esc(r.label)}</span>` +
    `<label><span class="gx-sr">${esc(L.qty)}</span><input name="qty-${i}" type="number" inputmode="decimal" min="0" step="any" value="${r.qty}" aria-label="${esc(r.label)}: ${esc(L.qty)}"></label>` +
    `<label><span class="gx-sr">${esc(L.price)}</span><input name="price-${i}" type="number" inputmode="decimal" min="0" step="any" value="${r.price}" aria-label="${esc(r.label)}: ${esc(L.price)}"></label></div>`).join('');
  return `<section class="gx-conv gx-basket" data-worth-basket data-locale="${esc(locale)}" data-currency="${esc(currency)}" data-hours-text="${esc(L.hoursText)}" data-rows="${o.rows.length}">` +
    `<h2>${esc(o.title)}</h2>${o.intro ? `<p class="gx-conv-intro">${esc(o.intro)}</p>` : ''}` +
    `<form class="gx-basket-form" autocomplete="off"><div class="gx-basket-head"><span></span><span>${esc(L.qty)}</span><span>${esc(L.price)}</span></div>${rows}` +
    `<label class="gx-basket-hourly">${esc(L.hourly)}<input name="hourly" type="number" inputmode="decimal" min="0.01" step="any" value="${o.hourly}"></label></form>` +
    `<p class="gx-basket-total">${esc(L.total)}: <strong data-out="total">${money.format(total)}</strong></p>` +
    `<p class="gx-basket-hours" data-out="hours">${esc(text)}</p></section>`;
}
