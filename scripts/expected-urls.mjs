#!/usr/bin/env node
/**
 * Prints the number of URLs the site should contain, derived from the content
 * model rather than hardcoded.
 *
 * The deploy workflow used to assert "133 pages" as a literal. Every page added
 * or removed afterwards had to be found and edited in two places, and a missed
 * edit either broke the deploy or, worse, let the real count drift. Deriving it
 * means the assertion tracks the content automatically.
 *
 *   node scripts/expected-urls.mjs
 */
import { extraRoutes } from './generate-parasite.mjs';
import { routes, articleRoutes } from './generate-seo.mjs';

const all = new Set(['', ...routes, ...extraRoutes, ...articleRoutes]);
console.log(all.size);
