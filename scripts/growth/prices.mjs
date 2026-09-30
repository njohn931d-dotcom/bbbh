/**
 * Dated, sourced price facts shared by the growth pages (state wage pages, the
 * news directives, the movie hub). One place to update when a price changes.
 *
 * Rule for this file: a number goes in only with a source and the date it was
 * published. Nothing here is an estimate made up for the page.
 */

export const PRICES = {
  movieTicket: {
    label: 'One movie ticket (U.S. average)',
    price: 16.30,
    date: '2026-07-10',
    source: { name: 'CableTV.com, 2026 movie ticket price survey', url: 'https://www.cabletv.com/entertainment/cost-of-a-movie-ticket' },
  },
  movieDateNight: {
    label: 'Movie date night: two tickets and a large popcorn',
    price: 54.08,
    date: '2026-07-10',
    source: { name: 'CableTV.com, 2026 movie ticket price survey', url: 'https://www.cabletv.com/entertainment/cost-of-a-movie-ticket' },
  },
  disneyPremium: {
    label: 'Disney+ Premium, one month',
    price: 21.49,
    date: '2026-09-23',
    source: { name: 'Deadline: Disney hikes price of Disney+ and Hulu streaming plans', url: 'https://deadline.com/2026/09/disney-hikes-price-disney-hulu-streaming-plans-1237111325/' },
  },
  streamingSeven: {
    label: 'Seven big streaming services, one month',
    price: 130.43,
    date: '2026-09-24',
    source: { name: 'The Motley Fool: Is Disney\'s new price hike a genius move?', url: 'https://www.fool.com/investing/2026/09/24/is-disneys-new-price-hike-a-genius-move-or-did-it/' },
  },
  gta6: {
    label: 'GTA VI, standard edition',
    price: 79.99,
    date: '2026-06-24',
    source: { name: 'Polygon: Rockstar confirms GTA 6 price and $99.99 Ultimate Edition', url: 'https://www.polygon.com/gta-6-price-confirmed-ultimate-edition-rockstar-games/' },
  },
  iphone18Pro: {
    label: 'iPhone 18 Pro (256 GB)',
    price: 1199,
    date: '2026-09-09',
    source: { name: 'MacRumors: iPhone 18 Pro starts at $1,199, Pro Max at $1,299', url: 'https://www.macrumors.com/2026/09/09/iphone-18-pro-pricing/' },
  },
  halloween: {
    label: 'Average Halloween spending per person',
    price: 115.14,
    date: '2026-09-22',
    source: { name: 'National Retail Federation, 2026 Halloween survey', url: 'https://nrf.com/research-insights/holiday-data-and-trends/halloween' },
  },
};

/** Items used in the per-state "what it costs in hours of minimum-wage work" table. */
export const WAGE_TABLE_ITEMS = ['movieTicket', 'disneyPremium', 'gta6', 'iphone18Pro', 'streamingSeven'];
