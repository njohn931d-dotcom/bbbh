/**
 * Minimum wage by state: a hub, one page per state and DC, and the same data as
 * static JSON/CSV. Source of truth: datasets/minimum-wage.json (transcribed from
 * the U.S. Department of Labor table, with scheduled changes that two or more
 * sources agree on). Nothing on these pages is invented: rates, overtime rules
 * and dates come from that file; take-home figures come from tax.mjs.
 */
import fs from 'node:fs';
import { esc, usd, num, longDate, slugify, writePage, rmGenerated, fileHref } from './util.mjs';
import { estimateTakeHome, HOURS_PER_YEAR, round2 } from './tax.mjs';
import { renderPage, breadcrumbHtml, faqHtml } from './shell.mjs';
import { buildGraph } from './jsonld.mjs';
import { converterHtml } from './widget.mjs';
import { PRICES, WAGE_TABLE_ITEMS } from './prices.mjs';

export const WAGE_DATA = JSON.parse(fs.readFileSync(new URL('../../datasets/minimum-wage.json', import.meta.url), 'utf8'));
export const WAGE_HUB = 'minimum-wage';
export const WAGE_LICENSE = 'https://creativecommons.org/licenses/by/4.0/';

const ordinalPlace = n => {
  const v = n % 100;
  return n + (v >= 11 && v <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'));
};

/** One normalised row per jurisdiction, with steps already in force applied. */
export function wageRows(data = WAGE_DATA) {
  const asOf = data.asOf;
  const rows = data.jurisdictions.map(j => {
    const inForce = j.next && j.next.rate != null && j.next.date <= asOf;
    const stateRate = inForce ? j.next.rate : j.rate;
    const effective = Math.max(stateRate ?? 0, data.federal);
    return {
      code: j.code, name: j.name, slug: slugify(j.name), route: `${WAGE_HUB}/${slugify(j.name)}`,
      stateRate, effective, federalApplies: stateRate == null || stateRate <= data.federal,
      hasLaw: stateRate != null, previousRate: inForce ? j.rate : null, stepDate: inForce ? j.next.date : null,
      annual: round2(effective * HOURS_PER_YEAR), premium: j.premium, tiers: j.tiers, note: j.note,
      upcoming: j.next && !inForce ? j.next : null,
    };
  });
  const sorted = [...rows].sort((a, b) => b.effective - a.effective || a.name.localeCompare(b.name));
  for (const r of rows) r.rank = 1 + sorted.filter(x => x.effective > r.effective).length;
  return rows;
}

export const ROWS = wageRows();
export const WAGE_ROUTES = [WAGE_HUB, ...ROWS.map(r => r.route)];
export const WAGE_LABELS = Object.fromEntries([[WAGE_HUB, 'Minimum wage by state 2026'], ...ROWS.map(r => [r.route, `${r.name} minimum wage 2026`])]);

const byRate = [...ROWS].sort((a, b) => b.effective - a.effective || a.name.localeCompare(b.name));
const median = byRate[Math.floor(byRate.length / 2)].effective;
const atFloor = ROWS.filter(r => r.effective === WAGE_DATA.federal);
const noLaw = ROWS.filter(r => !r.hasLaw);
const at15 = ROWS.filter(r => r.effective >= 15);
/** Figures other modules (news directives, tests) can quote without retyping them. */
export const WAGE_FACTS = {
  asOf: WAGE_DATA.asOf, federal: WAGE_DATA.federal, median,
  atFloor: atFloor.length, noLaw: noLaw.map(r => r.name), at15: at15.length,
  highest: byRate[0], highestState: byRate.find(r => r.code !== 'DC'),
};

const dateOrder = (a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name);
const upcomingList = () => ROWS.filter(r => r.upcoming).map(r => ({ ...r.upcoming, name: r.name, slug: r.slug, route: r.route, from: r.effective }))
  .sort(dateOrder);

const link = r => `<a href="/${r.route}/">${esc(r.name)}</a>`;
/** Prose helpers: "the District of Columbia" mid-sentence, "The District of Columbia" at the start. */
const the = r => (r.code === 'DC' ? 'the ' : '');
const theLink = r => `${the(r)}${link(r)}`;
const nameIn = r => `${the(r)}${esc(r.name)}`;
const NameStart = r => `${r.code === 'DC' ? 'The ' : ''}${esc(r.name)}`;
const plainIn = r => `${the(r)}${r.name}`;
const plainStart = r => `${r.code === 'DC' ? 'The ' : ''}${r.name}`;
const rateText = r => usd(r.effective, 2);

function sourcesHtml() {
  const d = WAGE_DATA;
  return `<section class="gx-sources" id="sources"><h2>Sources and method</h2><ul>` +
    `<li>Rates and overtime rules: <a href="${esc(d.source.url)}" rel="noopener">${esc(d.source.name)}</a>, updated ${esc(longDate(d.source.updated))}.</li>` +
    d.scheduleSources.map(s => `<li>Scheduled and announced changes: <a href="${esc(s.url)}" rel="noopener">${esc(s.name)}</a>.</li>`).join('') +
    `<li>Yearly figures assume 2,080 paid hours (40 hours × 52 weeks) and are before tax. Take-home figures are estimates for a single filer using 2026 federal brackets and payroll tax only, with no state or local tax. Local minimum wages (Seattle, SeaTac, Denver, parts of California and others) can be higher than the state rate and are not included.</li>` +
    `<li>Checked against the sources above on ${esc(longDate(d.asOf))}. This is general information, not legal advice; confirm with your state labor department.</li></ul></section>`;
}

// ---------------------------------------------------------------- hub page

function hubFaqs() {
  const hi = byRate[0]; const hs = WAGE_FACTS.highestState;
  return [
    ['What is the federal minimum wage in 2026?', `${usd(WAGE_DATA.federal, 2)} an hour, unchanged since ${longDate(WAGE_DATA.federalSince)}. It applies to employers covered by the Fair Labor Standards Act wherever the state rate is lower or there is no state law.`],
    ['Which state has the highest minimum wage?', `${NameStart(hi)} pays the most at ${usd(hi.effective, 2)} an hour, and ${esc(hs.name)} is the highest of the 50 states at ${usd(hs.effective, 2)}. Some cities set higher local minimums.`],
    ['Which states have no minimum wage law?', `${noLaw.map(r => esc(r.name)).join(', ')} have no state minimum wage law, so the federal ${usd(WAGE_DATA.federal, 2)} applies. Georgia and Wyoming have a state rate of $5.15 that is below the federal one, so the federal rate applies to most workers there too.`],
    ['How many states are at the federal minimum?', `${atFloor.length} states set their minimum at, or defer to, the federal ${usd(WAGE_DATA.federal, 2)}. ${at15.length - 1} states and the District of Columbia are at $15 or more.`],
    ['When do minimum wage increases take effect?', 'Most take effect on January 1. Oregon and the District of Columbia change on July 1, Alaska steps up on July 1, and Florida\'s final step to $15.00 falls on September 30, 2026. Inflation-indexed states announce their January rate in the fall.'],
  ];
}

function hubPage(ctx) {
  const d = WAGE_DATA;
  const faqs = hubFaqs();
  const up = upcomingList();
  const title = 'Minimum Wage by State 2026: All 50 States and DC, Ranked';
  const description = `Minimum wage in every U.S. state and DC as of ${longDate(d.asOf)}, with full-time yearly pay, overtime rules and 2027 increases. Data from the Labor Department.`;
  const hi = byRate[0];

  const table = `<div class="gx-table-wrap"><table class="gx-wide"><thead><tr><th>#</th><th>State</th><th class="gx-num">Hourly</th><th class="gx-num">Full-time year</th><th>Next change</th></tr></thead><tbody>` +
    byRate.map(r => `<tr><td>${r.rank}</td><td>${link(r)}</td><td class="gx-num">${rateText(r)}</td><td class="gx-num">${usd(r.annual)}</td><td>${r.upcoming ? `${r.upcoming.rate != null ? usd(r.upcoming.rate, 2) : 'Indexed'} · ${esc(longDate(r.upcoming.date))}` : (r.stepDate ? `Now ${usd(r.effective, 2)} (from ${esc(longDate(r.stepDate))})` : '—')}</td></tr>`).join('') +
    `</tbody></table></div>`;

  const upTable = `<div class="gx-table-wrap"><table><thead><tr><th>When</th><th>State</th><th class="gx-num">New rate</th><th>Basis</th></tr></thead><tbody>` +
    up.map(u => `<tr><td>${esc(longDate(u.date))}</td><td>${link(u)}</td><td class="gx-num">${u.rate != null ? usd(u.rate, 2) : 'To be announced'}</td><td>${esc(u.status)}</td></tr>`).join('') +
    `</tbody></table></div>`;

  const main = [
    breadcrumbHtml([{ name: 'Minimum wage by state' }]),
    `<section class="seo-hero"><div class="eyebrow"><span></span> OPEN DATA · UPDATED ${esc(longDate(d.asOf).toUpperCase())}</div>` +
      `<h1>Minimum wage by state 2026</h1>` +
      `<p class="gx-lead">The federal minimum wage is ${usd(d.federal, 2)} an hour and has been since ${esc(longDate(d.federalSince))}. ${atFloor.length} states use it, ${noLaw.length} have no state law at all, and ${nameIn(hi)} pays the most at ${usd(hi.effective, 2)}. Every state is ranked below, with what it adds up to over a full-time year and the increases already scheduled.</p></section>`,
    `<div class="gx-stats"><div class="gx-stat"><b>${usd(d.federal, 2)}</b><span>Federal minimum</span></div><div class="gx-stat"><b>${usd(median, 2)}</b><span>Median of 50 states + DC</span></div><div class="gx-stat"><b>${usd(hi.effective, 2)}</b><span>Highest: ${esc(hi.name === 'District of Columbia' ? 'DC' : hi.name)}</span></div><div class="gx-stat"><b>${at15.length}</b><span>States and DC at $15 or more</span></div></div>`,
    `<article class="seo-article">`,
    `<h2>Every state, ranked</h2><p>Hourly rates are the higher of the state and federal minimum for a typical covered employer. The yearly column is a full-time year of 2,080 hours before tax. Click a state for its overtime rule, take-home estimate and scheduled changes.</p>`,
    table,
    `<h2>States with no minimum wage law</h2><p>${noLaw.map(link).join(', ')} have no state minimum wage law. Employers covered by the Fair Labor Standards Act there pay the federal ${usd(d.federal, 2)}.</p>`,
    `<h2>Increases already scheduled</h2><p>Some changes are written into law and others were announced. Inflation-indexed states publish their January rate in the fall, so several amounts below are still to be announced.</p>`,
    upTable,
    converterHtml({ amount: d.federal, period: 'hour', price: 100, heading: 'h2' }),
    `<h2>Download the data</h2><p>The same table is published as <a href="${fileHref(ctx, 'api/v1/minimum-wage.json')}">JSON</a> and <a href="${fileHref(ctx, 'api/v1/minimum-wage.csv')}">CSV</a> under a <a href="${WAGE_LICENSE}" rel="license noopener">CC BY 4.0</a> licence: use it freely, and please link back to this page. See <a href="/open-data/">all open datasets</a>.</p>`,
    faqHtml(faqs),
    sourcesHtml(),
    `</article>`,
  ].join('');

  const schema = buildGraph(ctx, {
    route: WAGE_HUB, name: 'Minimum wage by state 2026', description, kind: 'dataset', published: '2026-09-30', modified: d.asOf,
    crumbs: [{ name: 'Minimum wage by state' }], faqs,
    dataset: {
      name: 'U.S. minimum wage by state and DC', description: 'State and federal minimum wage rates, overtime rules and scheduled changes for the 50 states and the District of Columbia.',
      license: WAGE_LICENSE, temporalCoverage: `2026-07-01/2028-01-01`, spatialCoverage: 'United States', keywords: ['minimum wage', 'state minimum wage', 'overtime', 'hourly wage'],
      variableMeasured: ['Hourly minimum wage (USD)', 'Full-time annual equivalent (USD)', 'Scheduled change'],
      isBasedOn: [d.source.url],
      distribution: [{ url: `${ctx.siteUrl}/api/v1/minimum-wage.json`, format: 'application/json' }, { url: `${ctx.siteUrl}/api/v1/minimum-wage.csv`, format: 'text/csv' }],
    },
  });

  return renderPage(ctx, {
    route: WAGE_HUB, title, description, socialTitle: `💵 ${title}`, main, schema, widget: true, ogType: 'website',
  });
}

// -------------------------------------------------------------- state pages

const statePageTitle = r => {
  const full = `${r.name} Minimum Wage 2026: ${usd(r.effective, 2)} an Hour (${usd(r.annual)} a Year)`;
  return full.length <= 65 ? full : `${r.name} Minimum Wage 2026: ${usd(r.effective, 2)} an Hour`;
};

function stateLead(r) {
  const fed = WAGE_DATA.federal;
  if (!r.hasLaw) return `${NameStart(r)} has no state minimum wage law, so employers covered by the federal Fair Labor Standards Act must pay ${usd(fed, 2)} an hour. That is ${usd(r.annual)} a year for a full-time worker before tax.`;
  if (r.stateRate < fed) return `${NameStart(r)}'s own minimum wage of ${usd(r.stateRate, 2)} an hour is below the federal rate, so employers covered by the Fair Labor Standards Act must pay the federal ${usd(fed, 2)}. That is ${usd(r.annual)} a year full time before tax.`;
  if (r.effective === fed) return `${NameStart(r)}'s minimum wage is the federal ${usd(fed, 2)} an hour, which is ${usd(r.annual)} a year for a full-time worker before tax.`;
  const base = `${NameStart(r)}'s minimum wage is ${usd(r.effective, 2)} an hour, ${usd(r.effective - fed, 2)} above the federal rate. For a full-time worker that is ${usd(r.annual)} a year before tax.`;
  if (r.stepDate) return `${base} It rose from ${usd(r.previousRate, 2)} on ${esc(longDate(r.stepDate))}.`;
  if (r.upcoming && r.upcoming.rate != null) return `${base} It is set to reach ${usd(r.upcoming.rate, 2)} on ${esc(longDate(r.upcoming.date))}.`;
  return base;
}

function stateDescription(r) {
  const tail = r.upcoming && r.upcoming.rate != null ? ` Rises to ${usd(r.upcoming.rate, 2)} on ${longDate(r.upcoming.date)}.` : (r.stepDate ? ` Up from ${usd(r.previousRate, 2)}.` : '');
  const fedOnly = !r.hasLaw || r.stateRate < WAGE_DATA.federal ? ' The federal rate applies.' : '';
  const head = `${r.code === 'DC' ? 'DC' : r.name} minimum wage: ${usd(r.effective, 2)} an hour, ${usd(r.annual)} a year full time before tax.${fedOnly}`;
  const candidates = [`${head}${tail} Overtime rules, take-home estimate and sources.`, `${head}${tail} Overtime and take-home estimate.`, `${head}${tail}`, head];
  return candidates.find(c => c.length <= 158) || head;
}

function overtimeSentence(r) {
  if (r.premium) {
    const rule = esc(r.premium.charAt(0).toLowerCase() + r.premium.slice(1));
    const clause = /1\.5x|2x/.test(r.premium) ? '' : ', paid at one and a half times the regular rate unless stated otherwise';
    return `The Department of Labor lists this premium-pay rule for ${nameIn(r)}: ${rule}${clause}. The federal rule of time-and-a-half after 40 hours a week also applies to employees covered by the FLSA.`;
  }
  return `The Department of Labor's table lists no separate state overtime rule for ${nameIn(r)}. The federal Fair Labor Standards Act still requires time-and-a-half after 40 hours in a workweek for covered, non-exempt employees.`;
}

function stateFaqs(r) {
  const take = estimateTakeHome(r.annual);
  const f = [];
  f.push([`What is the minimum wage in ${plainIn(r)} in 2026?`, `${usd(r.effective, 2)} an hour as of ${longDate(WAGE_DATA.asOf)}${r.hasLaw && r.stateRate > WAGE_DATA.federal ? '' : `, because the federal minimum applies${r.hasLaw ? '' : ' and the state has no law of its own'}`}. Source: the U.S. Department of Labor state minimum wage table.`]);
  f.push([`How much is the minimum wage in ${plainIn(r)} per year?`, `${usd(r.annual)} before tax for a full-time worker (2,080 hours). After federal income tax and payroll tax that is roughly ${usd(take.net)}, or ${usd(take.net / HOURS_PER_YEAR, 2)} an hour, before any state or local tax.`]);
  f.push([`When does ${plainIn(r)}'s minimum wage go up next?`, r.upcoming
    ? `${r.upcoming.rate != null ? `It is scheduled to reach ${usd(r.upcoming.rate, 2)} on ${longDate(r.upcoming.date)}` : `A change is due on ${longDate(r.upcoming.date)}, but the amount is not confirmed in the sources used here`} (${r.upcoming.status}).`
    : `No further change is listed in the sources used for this page. ${r.federalApplies ? 'A rise in the federal minimum would lift the rate here.' : 'Check the state labor department for updates.'}`]);
  if (r.tiers && r.tiers.length) f.push([`Does ${plainIn(r)} have more than one minimum wage?`, `Yes. ${r.tiers.map(t => `${t.label}: ${usd(t.rate, 2)}`).join('; ')}. The main rate of ${usd(r.stateRate, 2)} applies otherwise.`]);
  return f;
}

function statePage(ctx, r) {
  const d = WAGE_DATA;
  const take = estimateTakeHome(r.annual);
  const takeHourly = take.net / HOURS_PER_YEAR;
  const faqs = stateFaqs(r);
  const title = statePageTitle(r);
  const description = stateDescription(r);
  const above = byRate.filter(x => x.effective > r.effective);
  const below = byRate.filter(x => x.effective < r.effective);
  const nextUp = above.length ? above[above.length - 1] : null;
  const nextDown = below.length ? below[0] : null;
  const tied = ROWS.filter(x => x.effective === r.effective && x.code !== r.code);

  const periods = [['Hour', r.effective], ['Day (8 hours)', r.effective * 8], ['Week (40 hours)', r.effective * 40], ['Two weeks', r.effective * 80], ['Month', r.annual / 12], ['Year', r.annual]];
  const payTable = `<table><thead><tr><th>Period</th><th class="gx-num">Before tax</th></tr></thead><tbody>${periods.map(([k, v]) => `<tr><td>${k}</td><td class="gx-num">${usd(v, 2)}</td></tr>`).join('')}</tbody></table>`;

  const takeTable = `<table><thead><tr><th>Full-time year</th><th class="gx-num">Amount</th></tr></thead><tbody>` +
    `<tr><td>Gross pay</td><td class="gx-num">${usd(take.gross)}</td></tr>` +
    `<tr><td>Federal income tax (single, standard deduction)</td><td class="gx-num">−${usd(take.federal)}</td></tr>` +
    `<tr><td>Social Security and Medicare (employee share)</td><td class="gx-num">−${usd(take.fica)}</td></tr>` +
    `<tr><td><strong>Estimated take-home</strong></td><td class="gx-num"><strong>${usd(take.net)}</strong></td></tr>` +
    `<tr><td>Per hour after these taxes</td><td class="gx-num">${usd(takeHourly, 2)}</td></tr></tbody></table>`;

  const items = WAGE_TABLE_ITEMS.map(k => PRICES[k]);
  const hoursTable = `<table><thead><tr><th>Item</th><th class="gx-num">Price</th><th class="gx-num">Hours of work</th></tr></thead><tbody>` +
    items.map(p => `<tr><td>${esc(p.label)}</td><td class="gx-num">${usd(p.price, Number.isInteger(p.price) ? 0 : 2)}</td><td class="gx-num">${num(p.price / takeHourly, p.price / takeHourly < 10 ? 1 : 0)}</td></tr>`).join('') +
    `</tbody></table><p class="gx-credit">Hours use the estimated take-home rate of ${usd(takeHourly, 2)} an hour. Prices: ${items.map(p => `<a href="${esc(p.source.url)}" rel="noopener">${esc(p.source.name.split(':')[0])}</a>`).join(', ')}.</p>`;

  const compare = [];
  compare.push(`${NameStart(r)} ranks <strong>${ordinalPlace(r.rank)}</strong> of ${ROWS.length} jurisdictions (50 states and DC) by minimum wage.`);
  if (tied.length) compare.push(`It is tied with ${tied.length} other ${tied.length === 1 ? 'state' : 'states'} at ${rateText(r)}.`);
  if (nextUp) compare.push(`The next step up is ${theLink(nextUp)} at ${rateText(nextUp)}.`);
  if (nextDown) compare.push(`The next step down is ${theLink(nextDown)} at ${rateText(nextDown)}.`);
  compare.push(r.rank === 1 ? `That is the highest minimum wage of any state or DC.` : `The highest minimum wage is in ${theLink(byRate[0])} at ${rateText(byRate[0])}, which is ${num(byRate[0].effective / r.effective, 1)} times ${nameIn(r)}'s rate.`);

  const tierHtml = r.tiers && r.tiers.length
    ? `<h2>Other rates in ${nameIn(r)}</h2><ul>${r.tiers.map(t => `<li>${esc(t.label)}: <strong>${usd(t.rate, 2)}</strong></li>`).join('')}</ul>` : '';

  const scheduled = r.upcoming
    ? `<h2>What changes next</h2><p>${r.upcoming.rate != null ? `${NameStart(r)}'s minimum wage is scheduled to rise to <strong>${usd(r.upcoming.rate, 2)}</strong> on ${esc(longDate(r.upcoming.date))} (${esc(r.upcoming.status)}). That would be ${usd(r.upcoming.rate * HOURS_PER_YEAR)} a year full time, ${usd((r.upcoming.rate - r.effective) * HOURS_PER_YEAR)} more than today.` : `A change is due on ${esc(longDate(r.upcoming.date))} (${esc(r.upcoming.status)}). The new amount is not confirmed in the sources used for this page, so this page will be updated when it is published.`}</p>`
    : (r.stepDate ? `<h2>What changed</h2><p>${NameStart(r)}'s rate stepped up from ${usd(r.previousRate, 2)} to <strong>${usd(r.effective, 2)}</strong> on ${esc(longDate(r.stepDate))}, a rise of ${usd((r.effective - r.previousRate) * HOURS_PER_YEAR)} a year for a full-time worker.</p>` : '');

  const main = [
    breadcrumbHtml([{ name: 'Minimum wage by state', href: `/${WAGE_HUB}/` }, { name: r.name }]),
    `<section class="seo-hero"><div class="eyebrow"><span></span> MINIMUM WAGE · CHECKED ${esc(longDate(d.asOf).toUpperCase())}</div><h1>${esc(r.name)} minimum wage 2026</h1><p class="gx-lead">${stateLead(r)}</p></section>`,
    `<div class="gx-stats"><div class="gx-stat"><b>${usd(r.effective, 2)}</b><span>Per hour</span></div><div class="gx-stat"><b>${usd(r.annual)}</b><span>Full-time year, before tax</span></div><div class="gx-stat"><b>${usd(r.annual / 12)}</b><span>Per month, before tax</span></div><div class="gx-stat"><b>${usd(take.net)}</b><span>Estimated take-home a year</span></div></div>`,
    `<article class="seo-article">`,
    `<h2>${NameStart(r)} minimum wage by pay period</h2>`, payTable,
    r.note ? `<p>${esc(r.note)}</p>` : '',
    tierHtml,
    `<h2>Take-home pay at ${usd(r.effective, 2)} an hour</h2><p>These are estimates for a single filer working 2,080 hours, using 2026 federal brackets and payroll tax. State and local income tax are not included.</p>`, takeTable,
    `<h2>Overtime in ${nameIn(r)}</h2><p>${overtimeSentence(r)}</p>`,
    scheduled,
    `<h2>How ${nameIn(r)} compares</h2><p>${compare.join(' ')}</p>`,
    `<h2>What things cost in hours at this wage</h2><p>The same prices cost very different amounts of your time depending on the wage. At ${nameIn(r)}'s minimum they work out like this.</p>`, hoursTable,
    converterHtml({ amount: r.effective, period: 'hour', price: 100, heading: 'h2' }),
    faqHtml(faqs),
    `<section class="seo-related"><h2>Keep going</h2><div><a href="/${WAGE_HUB}/">Minimum wage in every state <span>↗</span></a><a href="/calculators/overtime-pay/">Overtime pay calculator <span>↗</span></a><a href="/calculators/salary-to-hourly/">Salary to hourly calculator <span>↗</span></a><a href="/calculators/cost-of-time/">Cost of time calculator <span>↗</span></a></div></section>`,
    sourcesHtml(),
    `</article>`,
  ].join('');

  const schema = buildGraph(ctx, {
    route: r.route, name: `${r.name} minimum wage 2026`, description, kind: 'page', published: '2026-09-30', modified: d.asOf,
    crumbs: [{ name: 'Minimum wage by state', route: WAGE_HUB }, { name: r.name }], faqs,
  });

  return renderPage(ctx, {
    route: r.route, title, description, socialTitle: `💵 ${title}`, main, schema, widget: true,
  });
}

export function generateWages(ctx) {
  rmGenerated(WAGE_HUB);
  writePage(WAGE_HUB, hubPage(ctx));
  for (const r of ROWS) writePage(r.route, statePage(ctx, r));
}

// ------------------------------------------------------------- data files

export function wageArtifacts(ctx) {
  const d = WAGE_DATA;
  const url = r => (ctx.siteUrl ? `${ctx.siteUrl}/${r}/` : undefined);
  const jurisdictions = byRate.map(r => ({
    code: r.code, name: r.name, state_rate: r.stateRate, effective_rate: r.effective, federal_applies: r.federalApplies,
    full_time_annual_2080h: r.annual, overtime_rule: r.premium || 'Federal FLSA: 1.5x after 40 hours a week',
    other_rates: r.tiers || [], upcoming_change: r.upcoming ? { rate: r.upcoming.rate, date: r.upcoming.date, status: r.upcoming.status } : null,
    page: url(r.route),
  }));
  const json = {
    dataset: 'us-minimum-wage', as_of: d.asOf, currency: 'USD', unit: 'per hour',
    federal: { rate: d.federal, since: d.federalSince },
    license: WAGE_LICENSE, attribution: `Worth${ctx.siteUrl ? ` (${url(WAGE_HUB)})` : ''}`,
    source: d.source, notes: d.notes, jurisdictions,
  };
  const csvCell = v => (v == null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replaceAll('"', '""')}"` : String(v));
  const header = ['code', 'name', 'state_rate', 'effective_rate', 'full_time_annual_2080h', 'upcoming_rate', 'upcoming_date', 'page'];
  const csv = [header.join(','), ...jurisdictions.map(j => [j.code, j.name, j.state_rate, j.effective_rate, j.full_time_annual_2080h, j.upcoming_change?.rate, j.upcoming_change?.date, j.page].map(csvCell).join(','))].join('\n') + '\n';
  return { 'api/v1/minimum-wage.json': JSON.stringify(json, null, 2) + '\n', 'api/v1/minimum-wage.csv': csv };
}
