/**
 * Growth surfaces: news explainers, the movie hub, minimum wage by state, the
 * money-emoji reference and the open-data docs.
 *
 * This module is the one integration point. The rest of the build needs only:
 *   - GROWTH_ROUTES / GROWTH_LABELS   (routes to build, sitemap, expected URL count)
 *   - generateGrowth(ctx)             (writes the HTML pages; called by generate-parasite.mjs
 *                                      so `node scripts/generate-parasite.mjs` renders them too)
 *   - growthArtifacts(ctx)            (JSON/CSV/Atom files for dist/, written by the Vite plugin)
 */
import { siteContext } from './util.mjs';
import { NEWS_ROUTES, NEWS_LABELS, generateNews, newsArtifacts } from './news.mjs';
import { MOVIE_ROUTES, MOVIE_LABELS, generateMovies, movieArtifacts } from './movies.mjs';
import { WAGE_ROUTES, WAGE_LABELS, generateWages, wageArtifacts } from './wages.mjs';
import { EMOJI_ROUTE, EMOJI_LABELS, generateEmoji } from './emoji.mjs';
import { OPEN_DATA_ROUTE, OPEN_DATA_LABELS, generateOpenData } from './opendata.mjs';

export const GROWTH_ROUTES = [...NEWS_ROUTES, ...MOVIE_ROUTES, ...WAGE_ROUTES, EMOJI_ROUTE, OPEN_DATA_ROUTE];
export const GROWTH_LABELS = { ...NEWS_LABELS, ...MOVIE_LABELS, ...WAGE_LABELS, ...EMOJI_LABELS, ...OPEN_DATA_LABELS };

if (new Set(GROWTH_ROUTES).size !== GROWTH_ROUTES.length) throw new Error('growth: duplicate route');

/** Write every growth page. `ctx` comes from siteContext(); omit it to read SITE_URL. */
export function generateGrowth(ctx = siteContext()) {
  generateNews(ctx);
  generateMovies(ctx);
  generateWages(ctx);
  generateEmoji(ctx);
  generateOpenData(ctx);
  return GROWTH_ROUTES;
}

/** Files that belong in dist/, keyed by path. Empty for preview builds (no real origin). */
export function growthArtifacts(ctx = siteContext()) {
  if (!ctx.siteUrl) return {};
  return { ...wageArtifacts(ctx), ...newsArtifacts(ctx), ...movieArtifacts(ctx) };
}

if (process.argv[1]?.endsWith('growth/index.mjs')) {
  const routes = generateGrowth();
  console.log(`Generated ${routes.length} growth pages.`);
}
