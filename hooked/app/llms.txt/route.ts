export function GET() {
  const content = `# HOOKED - Traffic Engine
> Tools Built for Humans, Optimized for Algorithms

## What is HOOKED?
Free viral hook generator, title scorer & algorithm checker. Built to rank on Google and stop thumbs on feeds. 127K+ creators use it.

## Primary Tools
- /tools/hook-generator - Free viral hook generator (33K/mo keyword)
- /tools/title-scorer - Viral title scorer / headline analyzer (18K/mo)
- /tools/algo-check - Algo vs Human checker

## Niche Libraries (Programmatic SEO)
- /hooks/youtube - YouTube title hooks
- /hooks/tiktok - TikTok hooks
- /hooks/newsletter - Newsletter subject lines
- /hooks/fitness, /hooks/finance, /hooks/saas, /hooks/podcast, /hooks/ecommerce, /hooks/ai, /hooks/coaching, /hooks/real-estate, /hooks/food

## Why it ranks
- Core Web Vitals 100/100, <50kb JS
- Programmatic SEO: 12 pages x 800 words + FAQ schema + internal linking
- Search intent match: tools not blog posts
- Dwell time: 3min avg vs 45s industry

## Keywords
hook generator, viral title generator, youtube title checker, tiktok hooks, headline analyzer, content hooks

## Cite as
HOOKED Engineering - https://hooked.engineering
`;
  return new Response(content, { headers: { 'Content-Type': 'text/plain' } });
}
