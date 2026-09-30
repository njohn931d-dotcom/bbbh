/**
 * Reusable HTML blocks for the growth pages. Each one is computed from the
 * tax module or from a dataset, never typed by hand, so the numbers on a page
 * cannot disagree with the method stated on it.
 */
import { esc, usd, num, longDate } from './util.mjs';
import { estimateTakeHome, overtimeDeduction, HOURS_PER_YEAR, round2 } from './tax.mjs';

/** Gross hourly wages used in the "hours of work" tables. 7.25 is the federal minimum. */
export const TABLE_WAGES = [7.25, 15, 20, 25, 35];

export const takeHomeHourly = wage => estimateTakeHome(wage * HOURS_PER_YEAR).net / HOURS_PER_YEAR;

const hoursText = h => {
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min`;
  return num(h, h < 100 ? 1 : 0);
};

/** "What does this cost in hours of work?" at five wages. */
export function hoursTableHtml(price, label) {
  const rows = TABLE_WAGES.map(w => {
    const t = takeHomeHourly(w);
    const h = price / t;
    return `<tr><td>${usd(w, 2)}</td><td class="gx-num">${usd(t, 2)}</td><td class="gx-num">${hoursText(h)}</td><td class="gx-num">${h >= 8 ? num(h / 8, 1) : '—'}</td></tr>`;
  }).join('');
  return `<div class="gx-table-wrap"><table><caption>${esc(label)}: ${usd(price, 2)}</caption><thead><tr><th>Hourly wage (before tax)</th><th class="gx-num">Take-home per hour</th><th class="gx-num">Hours of work</th><th class="gx-num">Workdays (8 h)</th></tr></thead><tbody>${rows}</tbody></table></div>` +
    `<p class="gx-credit">Take-home is an estimate for a single filer in 2026 after federal income tax and payroll tax, with no state tax. Hours are the price divided by take-home pay per hour.</p>`;
}

/** Before/after table for a wage step (for example Florida $14 to $15). */
export function wageStepHtml(before, after) {
  const a = estimateTakeHome(before * HOURS_PER_YEAR);
  const b = estimateTakeHome(after * HOURS_PER_YEAR);
  const row = (label, x, y, d = 2) => `<tr><td>${label}</td><td class="gx-num">${usd(x, d)}</td><td class="gx-num">${usd(y, d)}</td><td class="gx-num">+${usd(y - x, d)}</td></tr>`;
  return `<div class="gx-table-wrap"><table><thead><tr><th>Full-time worker</th><th class="gx-num">At ${usd(before, 2)}</th><th class="gx-num">At ${usd(after, 2)}</th><th class="gx-num">Difference</th></tr></thead><tbody>` +
    row('Per hour', before, after) + row('Per week (40 hours)', before * 40, after * 40) + row('Per month', before * HOURS_PER_YEAR / 12, after * HOURS_PER_YEAR / 12) +
    row('Per year, before tax', before * HOURS_PER_YEAR, after * HOURS_PER_YEAR, 0) + row('Per year, estimated take-home', a.net, b.net, 0) +
    `</tbody></table></div><p class="gx-credit">Take-home is an estimate for a single filer after federal income tax and payroll tax, with no state tax (Florida has no state income tax on wages).</p>`;
}

/** Worked examples for the overtime deduction, computed by the tax module. */
export function overtimeTableHtml() {
  const cases = [[18, 5], [18, 10], [25, 5], [25, 10], [35, 5], [35, 10]];
  const rows = cases.map(([rate, perWeek]) => {
    const hours = perWeek * 50;
    const r = overtimeDeduction({ regularRate: rate, overtimeHours: hours, otherWages: rate * HOURS_PER_YEAR });
    const otPay = round2(rate * 1.5 * hours);
    return `<tr><td>${usd(rate, 2)}</td><td class="gx-num">${perWeek}</td><td class="gx-num">${usd(otPay)}</td><td class="gx-num">${usd(r.deduction)}</td><td class="gx-num">${usd(r.taxSaved)}</td></tr>`;
  }).join('');
  return `<div class="gx-table-wrap"><table><thead><tr><th>Regular hourly rate</th><th class="gx-num">Overtime hours a week</th><th class="gx-num">Overtime pay a year</th><th class="gx-num">Deduction</th><th class="gx-num">Federal tax saved</th></tr></thead><tbody>${rows}</tbody></table></div>` +
    `<p class="gx-credit">Examples assume 2,080 regular hours plus overtime for 50 weeks at time-and-a-half, a single filer below the $150,000 phase-out, the 2026 standard deduction and brackets, and no other income. Only the premium half of overtime pay is deductible. Your result will differ.</p>`;
}

/** Click-to-load trailer. Nothing is requested from YouTube until the visitor presses play. */
export function trailerHtml(movie) {
  const t = movie.trailer;
  return `<div class="gx-video"><button type="button" data-video-id="${esc(t.id)}" data-title="${esc(t.title)}">` +
    `<span class="gx-play" aria-hidden="true">▶</span><strong>Watch the official trailer</strong>` +
    `<small>${esc(t.title)} · ${esc(t.channel)}. Loads from YouTube only when you press play.</small></button></div>` +
    `<p class="gx-credit">Official trailer from ${esc(t.channel)} on YouTube. <a href="https://www.youtube.com/watch?v=${esc(t.id)}" rel="noopener">Watch it on YouTube</a></p>`;
}

export { longDate };
