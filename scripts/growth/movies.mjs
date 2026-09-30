/**
 * Movies hub: what a night at the cinema costs in hours of work, plus the
 * season's big releases with their official trailers. Trailers are the
 * studios' own uploads (ids verified against YouTube's oEmbed endpoint) and
 * load only on click; nothing is invented about the films beyond what the
 * studios' own descriptions say.
 */
import fs from 'node:fs';
import { esc, usd, num, longDate, writePage, rmGenerated } from './util.mjs';
import { renderPage, breadcrumbHtml, faqHtml } from './shell.mjs';
import { buildGraph } from './jsonld.mjs';
import { basketHtml } from './widget.mjs';
import { hoursTableHtml, trailerHtml, takeHomeHourly } from './blocks.mjs';

export const MOVIE_DATA = JSON.parse(fs.readFileSync(new URL('../../datasets/movies.json', import.meta.url), 'utf8'));
export const MOVIE_HUB = 'movies';
export const MOVIE_CALC = `${MOVIE_HUB}/movie-night-cost-calculator`;
export const MOVIES = [...MOVIE_DATA.movies].sort((a, b) => a.release.localeCompare(b.release));
export const MOVIE_ROUTES = [MOVIE_HUB, MOVIE_CALC, ...MOVIES.map(m => `${MOVIE_HUB}/${m.slug}`)];
export const MOVIE_LABELS = {
  [MOVIE_HUB]: 'Fall 2026 movies: trailers and ticket costs',
  [MOVIE_CALC]: 'Movie night cost calculator',
  ...Object.fromEntries(MOVIES.map(m => [`${MOVIE_HUB}/${m.slug}`, `${m.title}: trailer and ticket cost`])),
};

const T = MOVIE_DATA.ticketFacts;
const filmRoute = m => `${MOVIE_HUB}/${m.slug}`;
const filmLink = m => `<a href="/${filmRoute(m)}/">${esc(m.title)}</a>`;
const asOf = MOVIE_DATA.asOf;
const ticketSource = `<a href="${esc(T.source.url)}" rel="noopener">${esc(T.source.name)}</a> (${esc(longDate(T.source.date))})`;

function filmTitle(m) {
  const options = [`${m.title}: Trailer, Release Date and Ticket Cost`, `${m.title}: Trailer, Date and Ticket Cost`, `${m.title}: Trailer and Ticket Cost`, `${m.title}: Trailer and Tickets`];
  return options.find(o => o.length <= 61) || options[options.length - 1];
}

function filmFaqs(m) {
  return [
    [`When does ${m.title} come out?`, `${m.title} opens on ${longDate(m.release)}. ${m.distributor} is the distributor. Formats named by the studio: ${m.formats.toLowerCase()}.`],
    [`Is there an official trailer for ${m.title}?`, `Yes. The trailer above is the official upload from ${m.trailer.channel} on YouTube, titled "${m.trailer.title}".`],
    [`How much will tickets for ${m.title} cost?`, `Prices are set by each theater and vary by format and city. The 2026 U.S. average for one ticket is ${usd(T.average, 2)} and a date night for two with a large popcorn averages ${usd(T.dateNight, 2)}, per CableTV.com. Premium formats cost more.`],
  ];
}

function filmPage(ctx, m) {
  const title = filmTitle(m);
  const route = filmRoute(m);
  const description = `${m.title} opens ${longDate(m.release)}. Watch the official trailer and see what a ticket costs in hours of work, with the 2026 U.S. average price.`.slice(0, 158);
  const faqs = filmFaqs(m);
  const others = MOVIES.filter(x => x.slug !== m.slug);
  const facts = [
    ['Opens', longDate(m.release)], ['Distributor', m.distributor], ['Format', m.formats],
    ...(m.director ? [['Director', m.director]] : []),
    ...(m.cast.length ? [['Cast named in coverage', m.cast.join(', ')]] : []),
  ];
  const main = [
    breadcrumbHtml([{ name: 'Movies', href: `/${MOVIE_HUB}/` }, { name: m.title }]),
    `<section class="seo-hero"><div class="eyebrow"><span></span> MOVIES · OPENS ${esc(longDate(m.release).toUpperCase())}</div><h1>${esc(m.title)}: trailer, release date and what a ticket costs</h1>` +
      `<p class="gx-lead">${esc(m.title)} opens in theaters on ${esc(longDate(m.release))}. Here is the official trailer, the release details, and what a night out to see it costs in hours of your time.</p></section>`,
    `<article class="seo-article">`,
    `<h2>Official trailer</h2>`, trailerHtml(m),
    `<h2>Release details</h2><div class="gx-table-wrap"><table><tbody>${facts.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table></div><p>${esc(m.about)}</p>`,
    `<h2>What a ticket to ${esc(m.title)} costs in hours of work</h2>` +
      `<p>The 2026 U.S. average for one movie ticket is ${usd(T.average, 2)}, from ${ticketSource}. Your theater may charge more, especially for IMAX and other premium screens. The table converts that average into the time it takes to earn it.</p>`,
    hoursTableHtml(T.average, 'One average ticket'),
    `<h2>A night out for two</h2><p>Add a large popcorn and the average date night is ${usd(T.dateNight, 2)} in the same survey. Before parking, a sitter or a drink after.</p>`,
    hoursTableHtml(T.dateNight, 'Two tickets and a large popcorn'),
    `<p><a href="/${MOVIE_CALC}/">Price your own movie night with the calculator</a> and see it as hours of work.</p>`,
    faqHtml(faqs),
    `<section class="gx-sources"><h2>Sources</h2><ul>${m.sources.map(s => `<li><a href="${esc(s.url)}" rel="noopener">${esc(s.name)}</a></li>`).join('')}<li>${ticketSource}</li></ul></section>`,
    `<section class="seo-related"><h2>More fall movies</h2><div>${others.map(o => `<a href="/${filmRoute(o)}/">${esc(o.title)} <span>↗</span></a>`).join('')}<a href="/${MOVIE_HUB}/">All fall 2026 trailers <span>↗</span></a></div></section>`,
    `</article>`,
  ].join('');
  const schema = buildGraph(ctx, {
    route, name: `${m.title}: trailer, release date and ticket cost`, description, kind: 'page', published: '2026-09-30', modified: asOf,
    crumbs: [{ name: 'Movies', route: MOVIE_HUB }, { name: m.title }], faqs,
  });
  return renderPage(ctx, { route, title: `🎬 ${title}`, description, socialTitle: `🎬 ${title}`, main, schema, widget: true });
}

function calcPage(ctx) {
  const extras = Math.round((T.dateNight - 2 * T.average) * 100) / 100;
  const hourly = Math.round(takeHomeHourly(25) * 100) / 100;
  const faqs = [
    ['How much does a night at the movies cost in 2026?', `The average date night in CableTV.com's 2026 survey is ${usd(T.dateNight, 2)} for two tickets and a large popcorn. A single ticket averages ${usd(T.average, 2)}, from ${usd(T.lowest.price, 2)} in ${T.lowest.state} to ${usd(T.highest.price, 2)} in ${T.highest.state}.`],
    ['How do you turn a movie night into hours of work?', 'Divide the total by your take-home pay per hour. A night out that costs $54.08 is about 2.6 hours of work at $21 an hour take-home.'],
    ['Is a movie cheaper at home?', `Often, per person. One average date night costs about as much as ${num(T.dateNight / 19.99, 1)} months of Netflix Standard at $19.99 a month, although the two are not the same experience.`],
  ];
  const title = 'Movie Night Cost Calculator: Tickets, Snacks, Hours of Work';
  const description = `Price a night at the movies: tickets, snacks, parking and a sitter, shown in hours of work. The 2026 U.S. average date night is ${usd(T.dateNight, 2)}.`;
  const main = [
    breadcrumbHtml([{ name: 'Movies', href: `/${MOVIE_HUB}/` }, { name: 'Movie night cost calculator' }]),
    `<section class="seo-hero"><div class="eyebrow"><span></span> CALCULATOR · 2026 PRICES</div><h1>Movie night cost calculator</h1><p class="gx-lead">A night at the movies costs ${usd(T.dateNight, 2)} for two tickets and a large popcorn, on average, and that is before parking or a sitter. Change any number below to price your own night, then see it as hours of work.</p></section>`,
    `<article class="seo-article">`,
    basketHtml({
      title: 'Price your movie night', intro: `Defaults are the 2026 U.S. averages from CableTV.com. The popcorn line is the survey's date-night total minus two average tickets (${usd(extras, 2)}).`,
      rows: [{ label: 'Movie tickets', qty: 2, price: T.average }, { label: 'Popcorn and drinks', qty: 1, price: extras }, { label: 'Parking or transport', qty: 1, price: 0 }, { label: 'Babysitter (hours)', qty: 0, price: 20 }],
      hourly,
    }),
    `<p>The default hourly figure of ${usd(hourly, 2)} is the estimated take-home for someone earning $25 an hour before tax. Replace it with your own.</p>`,
    `<h2>What tickets cost by state</h2><div class="gx-table-wrap"><table><thead><tr><th></th><th class="gx-num">One ticket</th><th class="gx-num">Date night for two</th></tr></thead><tbody>` +
      `<tr><td>U.S. average</td><td class="gx-num">${usd(T.average, 2)}</td><td class="gx-num">${usd(T.dateNight, 2)}</td></tr>` +
      `<tr><td>Lowest state average (${esc(T.lowest.state)} for tickets, ${esc(T.cheapestDate.state)} for a date)</td><td class="gx-num">${usd(T.lowest.price, 2)}</td><td class="gx-num">${usd(T.cheapestDate.price, 2)}</td></tr>` +
      `<tr><td>Highest state average (${esc(T.highest.state)})</td><td class="gx-num">${usd(T.highest.price, 2)}</td><td class="gx-num">${usd(T.priciestDate.price, 2)}</td></tr></tbody></table></div>` +
      `<p class="gx-credit">Source: ${ticketSource}. ${esc(T.premium.text)} (<a href="${esc(T.premium.source.url)}" rel="noopener">${esc(T.premium.source.name)}</a>).</p>`,
    `<h2>The same night in hours of work</h2><p>An average date night converted at five hourly wages.</p>`, hoursTableHtml(T.dateNight, 'Two tickets and a large popcorn'),
    `<h2>Ways to spend less without skipping the movie</h2><ul><li>Price the premium format separately. The upgrade, not the film, is often the expensive part.</li><li>Check your theater's cheaper showtimes and any loyalty or membership scheme before you book.</li><li>Decide the snack budget first. It is the line most people do not plan for.</li><li>If the film is a maybe, use the <a href="/guides/24-hour-rule/">24-hour rule</a> and see whether you still want it tomorrow.</li></ul>`,
    `<h2>This season's big releases</h2><div class="gx-cards">${MOVIES.map(m => `<a class="gx-card" href="/${filmRoute(m)}/"><small>Opens ${esc(longDate(m.release))}</small><h3>${esc(m.title)}</h3><p>${esc(m.distributor)} · ${esc(m.formats)}</p><span class="gx-more">Trailer and ticket cost →</span></a>`).join('')}</div>`,
    faqHtml(faqs),
    `</article>`,
  ].join('');
  const schema = buildGraph(ctx, {
    route: MOVIE_CALC, name: 'Movie night cost calculator', description, kind: 'tool', published: '2026-09-30', modified: asOf,
    crumbs: [{ name: 'Movies', route: MOVIE_HUB }, { name: 'Movie night cost calculator' }], faqs,
  });
  return renderPage(ctx, { route: MOVIE_CALC, title: `🍿 ${title}`, description, socialTitle: `🍿 ${title}`, main, schema, widget: true });
}

function hubPage(ctx) {
  const title = 'Fall 2026 Movie Trailers, Release Dates and Ticket Costs';
  const description = `Official trailers and release dates for ${MOVIES.map(m => m.title).slice(0, 3).join(', ')} and more, with what a night at the movies costs in hours of work.`.slice(0, 158);
  const faqs = [
    ['What are the biggest movies coming out this fall?', `This page tracks ${MOVIES.map(m => `${m.title} (${longDate(m.release)})`).join(', ')}.`],
    ['Where do the trailers come from?', 'Each trailer is the official upload from the studio\'s YouTube channel. Nothing loads from YouTube until you press play.'],
    ['How much is a movie ticket in 2026?', `The U.S. average is ${usd(T.average, 2)} according to CableTV.com, ranging from ${usd(T.lowest.price, 2)} in ${T.lowest.state} to ${usd(T.highest.price, 2)} in ${T.highest.state}.`],
  ];
  const main = [
    breadcrumbHtml([{ name: 'Movies' }]),
    `<section class="seo-hero"><div class="eyebrow"><span></span> MOVIES · UPDATED ${esc(longDate(asOf).toUpperCase())}</div><h1>Fall 2026 movie trailers and what the tickets cost</h1><p class="gx-lead">Official trailers and release dates for the season's biggest films, each with what a ticket costs in hours of work. The average ticket is ${usd(T.average, 2)}, and a date night averages ${usd(T.dateNight, 2)}.</p></section>`,
    `<article class="seo-article">`,
    `<h2>Release calendar</h2><div class="gx-table-wrap"><table class="gx-wide"><thead><tr><th>Opens</th><th>Film</th><th>Distributor</th><th>Format</th></tr></thead><tbody>${MOVIES.map(m => `<tr><td>${esc(longDate(m.release))}</td><td>${filmLink(m)}</td><td>${esc(m.distributor)}</td><td>${esc(m.formats)}</td></tr>`).join('')}</tbody></table></div>`,
    ...MOVIES.map(m => `<h2>${esc(m.title)}</h2><p>Opens ${esc(longDate(m.release))}. ${esc(m.about)} <a href="/${filmRoute(m)}/">Tickets, cast details and cost in hours →</a></p>${trailerHtml(m)}`),
    `<div class="gx-note"><strong>Plan the night:</strong> the <a href="/${MOVIE_CALC}/">movie night cost calculator</a> adds tickets, snacks, parking and a sitter, then shows the total as hours of work.</div>`,
    faqHtml(faqs),
    `<section class="gx-sources"><h2>Sources</h2><ul><li>${ticketSource}</li><li>Release dates and trailers: the studios' official YouTube channels, linked on each film page.</li></ul></section>`,
    `</article>`,
  ].join('');
  const schema = buildGraph(ctx, {
    route: MOVIE_HUB, name: 'Fall 2026 movie trailers and ticket costs', description, kind: 'hub', published: '2026-09-30', modified: asOf,
    crumbs: [{ name: 'Movies' }], faqs,
  });
  return renderPage(ctx, { route: MOVIE_HUB, title: `🎬 ${title}`, description, socialTitle: `🎬 ${title}`, main, schema, widget: true });
}

export function generateMovies(ctx) {
  rmGenerated(MOVIE_HUB);
  writePage(MOVIE_HUB, hubPage(ctx));
  writePage(MOVIE_CALC, calcPage(ctx));
  for (const m of MOVIES) writePage(filmRoute(m), filmPage(ctx, m));
}

export function movieArtifacts() {
  return {
    'api/v1/movies.json': JSON.stringify({
      dataset: 'fall-2026-movies', as_of: asOf, note: MOVIE_DATA.note, ticket_facts: T,
      movies: MOVIES.map(m => ({ title: m.title, slug: m.slug, release: m.release, distributor: m.distributor, formats: m.formats, trailer_youtube_id: m.trailer.id, trailer_channel: m.trailer.channel })),
    }, null, 2) + '\n',
  };
}
