/**
 * Money emoji reference: copy buttons, names, code points, shortcodes and
 * HTML entities. A genuinely useful utility page (people search for exactly
 * this) that also fits the site's subject. Code points are verified by a test
 * against the characters themselves, so a typo cannot ship.
 */
import { esc, writePage, rmGenerated } from './util.mjs';
import { renderPage, breadcrumbHtml, faqHtml } from './shell.mjs';
import { buildGraph } from './jsonld.mjs';

export const EMOJI_ROUTE = 'emoji/money-emoji';
export const EMOJI_LABELS = { [EMOJI_ROUTE]: 'Money emoji: copy and paste' };

/** [emoji, name, code point (hex, first scalar), GitHub shortcode, what it is used for] */
export const EMOJI_GROUPS = [
  ['Cash and coins', [
    ['💰', 'Money bag', '1F4B0', ':moneybag:', 'Wealth, a big payday, a prize, "the bag".'],
    ['💵', 'Dollar banknote', '1F4B5', ':dollar:', 'Cash, prices and pay in US dollars.'],
    ['💴', 'Yen banknote', '1F4B4', ':yen:', 'Japanese yen or Chinese yuan.'],
    ['💶', 'Euro banknote', '1F4B6', ':euro:', 'Euro prices and pay.'],
    ['💷', 'Pound banknote', '1F4B7', ':pound:', 'British pound prices and pay.'],
    ['💸', 'Money with wings', '1F4B8', ':money_with_wings:', 'Money leaving fast: spending, bills, subscriptions.'],
    ['🪙', 'Coin', '1FA99', ':coin:', 'Coins, small change, crypto and tokens.'],
    ['💲', 'Heavy dollar sign', '1F4B2', ':heavy_dollar_sign:', 'A price tag or "this costs money" marker.'],
  ]],
  ['Cards and banking', [
    ['💳', 'Credit card', '1F4B3', ':credit_card:', 'Cards, payments, debt and checkout.'],
    ['🏦', 'Bank', '1F3E6', ':bank:', 'Banks, savings accounts and loans.'],
    ['🏧', 'ATM sign', '1F3E7', ':atm:', 'Cash machines and withdrawals.'],
    ['🧾', 'Receipt', '1F9FE', ':receipt:', 'Receipts, invoices, taxes and expenses.'],
    ['💱', 'Currency exchange', '1F4B1', ':currency_exchange:', 'Exchange rates and converting currencies.'],
    ['🧮', 'Abacus', '1F9EE', ':abacus:', 'Calculating, budgeting and arithmetic.'],
  ]],
  ['Markets and growth', [
    ['📈', 'Chart increasing', '1F4C8', ':chart_with_upwards_trend:', 'Growth, gains, investing and raises.'],
    ['📉', 'Chart decreasing', '1F4C9', ':chart_with_downwards_trend:', 'Drops, losses and falling prices.'],
    ['📊', 'Bar chart', '1F4CA', ':bar_chart:', 'Statistics, comparisons and reports.'],
    ['💹', 'Chart increasing with yen', '1F4B9', ':chart:', 'Currency and market charts.'],
    ['🤑', 'Money-mouth face', '1F911', ':money_mouth_face:', 'Excited about money, often jokingly.'],
    ['🐷', 'Pig face', '1F437', ':pig:', 'Piggy banks and saving (there is no dedicated piggy bank emoji).'],
  ]],
  ['Time is money', [
    ['⏰', 'Alarm clock', '23F0', ':alarm_clock:', 'Deadlines, shifts and overtime.'],
    ['⏱️', 'Stopwatch', '23F1', ':stopwatch:', 'Tracking hours and hourly rates.'],
    ['⌛', 'Hourglass done', '231B', ':hourglass:', 'Time running out.'],
    ['⏳', 'Hourglass not done', '23F3', ':hourglass_flowing_sand:', 'Waiting, or time still left.'],
  ]],
  ['Everyday spending', [
    ['🛒', 'Shopping cart', '1F6D2', ':shopping_cart:', 'Groceries, online carts and impulse buys.'],
    ['🛍️', 'Shopping bags', '1F6CD', ':shopping:', 'Retail, sales and treats.'],
    ['🎟️', 'Admission tickets', '1F39F', ':tickets:', 'Events, concerts and cinema.'],
    ['🍿', 'Popcorn', '1F37F', ':popcorn:', 'Movie night.'],
    ['☕', 'Hot beverage', '2615', ':coffee:', 'The daily coffee, the classic small spend.'],
  ]],
];

export const ALL_EMOJI = EMOJI_GROUPS.flatMap(([, list]) => list);

const entity = code => `&#x${code};`;

export function generateEmoji(ctx) {
  rmGenerated('emoji');
  const title = '💰 Money Emoji: Copy and Paste List With Meanings and Codes';
  const plainTitle = title.replace(/^\S+\s/, '');
  const description = `Copy and paste ${ALL_EMOJI.length} money emoji with their names, Unicode code points, shortcodes and HTML entities, plus what each one is used for.`;
  const faqs = [
    ['What is the money emoji?', `The most common one is the money bag 💰 (U+1F4B0). For cash, use the dollar banknote 💵, and for money being spent, money with wings 💸.`],
    ['How do I type a money emoji on a computer?', 'On Windows press the Windows key and the period key. On a Mac press Control, Command and Space. On a phone, open the emoji keyboard and search for "money". You can also press any button on this page to copy one.'],
    ['Do emoji help a page rank in Google?', 'No. Emoji are not a ranking factor. Search engines may show or drop them in titles and snippets, so use at most one, make it relevant, and never rely on it to carry meaning.'],
    ['What are the shortcodes for money emoji?', 'GitHub, Slack and Discord use names between colons, for example :moneybag:, :dollar:, :money_with_wings: and :credit_card:. The table on this page lists the shortcode for every emoji.'],
  ];
  const grids = EMOJI_GROUPS.map(([label, list]) => `<h2>${esc(label)}</h2><div class="gx-emoji-grid">${list.map(([e, name, , , ]) => `<button type="button" class="gx-emoji" data-copy="${e}" aria-label="Copy ${esc(name)}"><i aria-hidden="true">${e}</i><b>${esc(name)}</b><small>Press to copy</small></button>`).join('')}</div>`).join('');
  const table = `<div class="gx-table-wrap"><table class="gx-wide"><thead><tr><th>Emoji</th><th>Name</th><th>Unicode</th><th>Shortcode</th><th>HTML</th><th>Used for</th></tr></thead><tbody>` +
    ALL_EMOJI.map(([e, name, code, sc, use]) => `<tr><td>${e}</td><td>${esc(name)}</td><td>U+${code}</td><td><code>${esc(sc)}</code></td><td><code>${esc(entity(code))}</code></td><td>${esc(use)}</td></tr>`).join('') +
    `</tbody></table></div>`;
  const main = [
    breadcrumbHtml([{ name: 'Money emoji' }]),
    `<section class="seo-hero"><div class="eyebrow"><span></span> REFERENCE · COPY AND PASTE</div><h1>Money emoji: copy and paste, with meanings and codes</h1><p class="gx-lead">Press any emoji to copy it. Below every one are its name, Unicode code point, shortcode and HTML entity, and what people use it for.</p></section>`,
    `<article class="seo-article">`,
    grids,
    `<h2>Every money emoji: codes and uses</h2>`, table,
    `<h2>Using emoji well in titles, posts and messages</h2><p>One relevant emoji can make a headline or a message easier to scan. More than one usually reads as noise. Screen readers announce each emoji by name, so a string of them is tiring to listen to, and search engines may strip them from titles and snippets, so never put the meaning of a sentence in an emoji alone.</p>`,
    `<div class="gx-note"><strong>Money is time.</strong> Seeing a price as hours of work changes how it feels. Try the <a href="/calculators/cost-of-time/">cost of time calculator</a> ⏱️, or see what new prices cost in hours in <a href="/news/">Worth News</a> 📰.</div>`,
    faqHtml(faqs),
    `</article>`,
  ].join('');
  const schema = buildGraph(ctx, {
    route: EMOJI_ROUTE, name: plainTitle, description, kind: 'page', published: '2026-09-30', modified: '2026-09-30',
    crumbs: [{ name: 'Money emoji' }], faqs,
  });
  writePage(EMOJI_ROUTE, renderPage(ctx, { route: EMOJI_ROUTE, title, description, socialTitle: title, main, schema, widget: true }));
}
