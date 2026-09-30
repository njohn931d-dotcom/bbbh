/**
 * Vite plugin: after the bundle is written, add the build-time files (JSON,
 * CSV, Atom), append to llms.txt and run the head clean-up over dist/.
 * It runs last (enforce: 'post') so it sees the other plugins' output, and it
 * does nothing in a preview build (no SITE_URL), which ships no discovery files.
 */
import fs from 'node:fs';
import path from 'node:path';
import { siteContext } from './util.mjs';
import { growthArtifacts } from './index.mjs';
import { postprocessDist, augmentLlms } from './postprocess.mjs';

export function writeArtifacts(dist, ctx) {
  const files = growthArtifacts(ctx);
  for (const [rel, body] of Object.entries(files)) {
    const out = path.join(dist, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, body);
  }
  return Object.keys(files);
}

export function growthPlugin() {
  return {
    name: 'growth-artifacts',
    apply: 'build',
    enforce: 'post',
    closeBundle() {
      const ctx = siteContext();
      if (!ctx.siteUrl) return;
      const dist = path.resolve('dist');
      if (!fs.existsSync(dist)) return;
      const written = writeArtifacts(dist, ctx);
      const llms = augmentLlms(dist, ctx);
      const pages = postprocessDist(dist, ctx);
      console.log(`\u2713 growth: ${written.length} data files${llms ? ', llms.txt extended' : ''}, head metadata cleaned on ${pages} pages`);
    },
  };
}
