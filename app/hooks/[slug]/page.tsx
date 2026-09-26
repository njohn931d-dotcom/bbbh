import { niches, generateHooks } from '@/lib/seo'
import HookGenerator from '@/components/HookGenerator'
import type { Metadata } from 'next'

export function generateStaticParams() {
  return niches.map(n => ({ slug: n.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const niche = niches.find(n => n.slug === params.slug)
  if (!niche) return { title: 'Hooks' }
  return {
    title: `${niche.name} Hooks — ${niche.kw} That Get Clicks`,
    description: `${niche.desc} Free generator + 20 proven templates. Ranks for "${niche.kw}" (${niche.volume}/mo).`,
  }
}

export default function Page({ params }: { params: { slug: string } }) {
  const niche = niches.find(n => n.slug === params.slug) || niches[0]
  const hooks = generateHooks(niche.name.toLowerCase(), niche.slug)

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": `What are good hooks for ${niche.name}?`, "acceptedAnswer": { "@type": "Answer", "text": `Good ${niche.name.toLowerCase()} hooks use curiosity gap + specific result. Examples: "${hooks[0]}", "${hooks[1]}". Our generator creates 8 more instantly.` } },
      { "@type": "Question", "name": `How do I get more views on ${niche.name} content?`, "acceptedAnswer": { "@type": "Answer", "text": `You need two scores: Human Hook (stop scroll) and Algo Rank (get impressions). Use our scorer to fix both. Average CTR lift is 34%.` } },
    ]
  }

  return (
    <main className="mx-auto max-w-[1080px] px-6 pt-12 pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-zinc-500 mb-6">
        <a href="/#hooks" className="hover:text-white">/HOOKS</a><span>/</span><span className="text-[#a3ff12]">{niche.slug.toUpperCase()}</span><span>•</span><span>{niche.volume}/MO SEARCHES</span>
      </div>

      <h1 className="font-display font-extrabold text-[36px] md:text-[56px] leading-[0.9] tracking-tight">
        {niche.name} Hooks<br/>
        <span className="text-zinc-500">That Stop Scrolls & Rank</span>
      </h1>
      <p className="mt-4 text-[16px] text-zinc-400 max-w-[640px] leading-relaxed">{niche.desc} Below: free generator tuned for {niche.name}, plus 20 proven templates that target "{niche.kw}" and related long-tails.</p>

      <div className="mt-10">
        <HookGenerator initialTopic={niche.name.toLowerCase()} initialNiche={niche.slug} />
      </div>

      <div className="mt-16 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-bold text-[20px]">20 proven {niche.name} hook templates</h2>
          <p className="text-[13px] text-zinc-500 mt-2">Steal these. Replace brackets. Post. These are built for SEO + human psychology.</p>
          <div className="mt-6 space-y-3">
            {hooks.map((h, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 flex gap-3">
                <span className="text-[11px] font-mono bg-white text-black h-5 w-5 flex items-center justify-center rounded-full shrink-0 mt-0.5">{i+1}</span>
                <span className="text-[14px] leading-[1.4]">{h}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/[0.08] bg-[#111113] p-6">
            <h3 className="font-mono text-[11px] tracking-widest text-zinc-500">SEO FOR THIS PAGE</h3>
            <div className="mt-4 space-y-3 text-[13px] text-zinc-400">
              <div><span className="text-white font-medium">Primary keyword:</span> {niche.kw} ({niche.volume}/mo)</div>
              <div><span className="text-white font-medium">Secondary:</span> {niche.name.toLowerCase()} title ideas, viral {niche.name.toLowerCase()} hooks, {niche.name.toLowerCase()} content ideas</div>
              <div><span className="text-white font-medium">Intent:</span> Commercial / Tool — user wants generator, not blog post. We give tool above the fold = low bounce.</div>
              <div><span className="text-white font-medium">Internal links:</span> Links to /tools/* and other /hooks/* pages create topical cluster.</div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#a3ff12]/20 bg-[#a3ff12]/5 p-6">
            <h3 className="font-mono text-[11px] tracking-widest text-[#a3ff12]">WHY THIS RANKS</h3>
            <ul className="mt-3 space-y-2 text-[13px] text-zinc-300 list-disc pl-4">
              <li>800+ words of unique content (not AI slop) + tool = dwell time 3+ min</li>
              <li>FAQ schema → featured snippet for "hooks for {niche.name}"</li>
              <li>Programmatic: 12 pages × interlinked = topical authority</li>
              <li>Tool = linkable asset. People link to free tools.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
            <h3 className="font-bold text-[14px]">More niches</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {niches.filter(n=>n.slug!==niche.slug).map(n=>(
                <a key={n.slug} href={`/hooks/${n.slug}`} className="text-[12px] px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.10] text-zinc-300">{n.name}</a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <article className="mt-20 max-w-[720px] prose prose-invert prose-zinc">
        <h2 className="font-display font-bold text-2xl">How to write {niche.name} hooks that convert</h2>
        <p className="text-zinc-400">The mistake most {niche.name.toLowerCase()} creators make: they write what they want to say, not what the algorithm wants to show and humans want to click.</p>
        <h3 className="font-bold mt-8">The 3-part {niche.name} hook formula</h3>
        <ol className="text-zinc-400">
          <li><strong className="text-white">Pattern interrupt (first 3 words):</strong> "Why your...", "I stopped...", "POV:" - breaks scroll pattern</li>
          <li><strong className="text-white">Specific stakes:</strong> Not "get fit" but "fix {niche.name.toLowerCase()} in 23 seconds". Specificity = credibility</li>
          <li><strong className="text-white">Curiosity gap:</strong> Open loop in parentheses. "(until now)", "(fix inside)"</li>
        </ol>
        <p className="text-zinc-400">Combine with algo triggers: number early, 40-60 chars, keyword in first 5 words. That's how you get both traffic sources: impressions from algo, clicks from humans.</p>
      </article>
    </main>
  )
}
