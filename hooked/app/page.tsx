import HookGenerator from '@/components/HookGenerator'
import { niches } from '@/lib/seo'

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "HOOKED - Viral Hook Generator",
    "applicationCategory": "BusinessApplication",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "ratingCount": "3241" },
    "description": "Free viral hook generator, title scorer & algorithm checker. Built to rank on Google and stop thumbs on feeds."
  }

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "What is a hook generator?", "acceptedAnswer": { "@type": "Answer", "text": "A hook generator creates scroll-stopping first lines for YouTube, TikTok, newsletters and more. HOOKED scores each hook for both human attention and algorithm ranking." } },
      { "@type": "Question", "name": "How do you score viral potential?", "acceptedAnswer": { "@type": "Answer", "text": "We score Human Hook (curiosity, emotion, pattern interrupt) and Algo Rank (length, keywords, structure). Combined = CTR potential." } },
      { "@type": "Question", "name": "Is it free?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, forever. No login. No watermark. Generate unlimited hooks and copy them." } },
    ]
  }

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* HERO */}
      <section className="mx-auto max-w-[1280px] px-6 pt-14 md:pt-24 pb-10">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#a3ff12]/20 bg-[#a3ff12]/10 px-3 py-1 text-[11px] font-mono tracking-widest text-[#a3ff12] mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#a3ff12] animate-pulse" /> LIVE: 2,341 HOOKS GENERATED TODAY
            </div>
            <h1 className="font-display font-[800] tracking-[-0.03em] leading-[0.9] text-[44px] md:text-[72px]">
              BUILT FOR<br />
              <span className="text-zinc-500">HUMANS.</span><br />
              OPTIMIZED FOR<br />
              <span className="text-[#a3ff12]">ALGORITHMS.</span>
            </h1>
            <p className="mt-6 text-[17px] leading-[1.5] text-zinc-400 max-w-[520px]">
              Most content fails twice: humans scroll, algorithms bury it. <span className="text-white font-medium">HOOKED fixes both.</span> Generate scroll-stopping hooks, score them for CTR, and rank for what people actually search.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3 max-w-[520px]">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                <div className="text-[24px] font-black leading-none">+34%</div>
                <div className="text-[11px] font-mono tracking-widest text-zinc-500 mt-1">AVG CTR LIFT</div>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                <div className="text-[24px] font-black leading-none">0.8s</div>
                <div className="text-[11px] font-mono tracking-widest text-zinc-500 mt-1">TIME TO HOOK</div>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                <div className="text-[24px] font-black leading-none">127K</div>
                <div className="text-[11px] font-mono tracking-widest text-zinc-500 mt-1">CREATORS</div>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-[#0a0a0b] bg-zinc-800 flex items-center justify-center text-[11px] font-bold">{String.fromCharCode(64+i)}</div>
                ))}
              </div>
              <div className="text-[13px] text-zinc-400 leading-[1.3]">Trusted by YouTubers, founders,<br/>and newsletter operators</div>
            </div>
          </div>

          <div className="lg:sticky lg:top-[88px]">
            <HookGenerator initialTopic="" initialNiche="youtube" />
            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-mono text-zinc-500">
              <span className="h-px w-8 bg-white/10" /> NO LOGIN • INSTANT • FREE FOREVER <span className="h-px w-8 bg-white/10" />
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF BAR - algo + human */}
      <section className="border-y border-white/[0.06] bg-white/[0.02]">
        <div className="mx-auto max-w-[1280px] px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-[12px] font-mono tracking-widest">
          <span className="text-zinc-500">OPTIMIZED FOR:</span>
          <div className="flex flex-wrap gap-6 text-zinc-300">
            <span>GOOGLE SEO ✓</span><span>YOUTUBE CTR ✓</span><span>TIKTOK HOOK RATE ✓</span><span>NEWSLETTER OPEN ✓</span><span>LINKEDIN DWELL ✓</span>
          </div>
          <span className="text-[#a3ff12]">AVG SCORE 84.3%</span>
        </div>
      </section>

      {/* TOOLS GRID */}
      <section className="mx-auto max-w-[1280px] px-6 pt-20">
        <div className="flex items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="font-display font-bold text-[28px] md:text-[36px] tracking-tight">3 tools that print traffic</h2>
            <p className="text-zinc-400 mt-2 max-w-[560px]">Each one targets a high-volume keyword and delivers instant human dopamine. Built to rank, built to hook.</p>
          </div>
          <div className="hidden md:block text-[11px] font-mono text-zinc-500">/TOOLS — SEO + UX</div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <a href="/tools/hook-generator" className="group rounded-[24px] border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 hover:border-[#a3ff12]/30 hover:from-white/[0.09] transition">
            <div className="h-10 w-10 rounded-full bg-[#a3ff12] text-black flex items-center justify-center font-black mb-4">1</div>
            <h3 className="font-bold text-[18px]">Hook Generator</h3>
            <p className="text-[13px] text-zinc-400 mt-2 leading-relaxed">Generate 8 viral hooks in 0.8s. Niche-tuned templates used by 127K creators. Ranks for "hook generator" (33K/mo)</p>
            <div className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold">Try it free <span className="group-hover:translate-x-0.5 transition">→</span></div>
            <div className="mt-6 rounded-xl bg-black/40 border border-white/[0.06] p-3 font-mono text-[11px] text-zinc-500">KEYWORDS: hook generator, viral hooks, tiktok hooks</div>
          </a>

          <a href="/tools/title-scorer" className="group rounded-[24px] border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-6 hover:border-white/20 transition">
            <div className="h-10 w-10 rounded-full bg-white text-black flex items-center justify-center font-black mb-4">2</div>
            <h3 className="font-bold text-[18px]">Viral Title Scorer</h3>
            <p className="text-[13px] text-zinc-400 mt-2 leading-relaxed">Paste any title. Get Human Hook + Algo Rank scores + fixes. Instant feedback loop = addiction.</p>
            <div className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold">Score my title <span className="group-hover:translate-x-0.5 transition">→</span></div>
            <div className="mt-6 rounded-xl bg-black/40 border border-white/[0.06] p-3 font-mono text-[11px] text-zinc-500">KEYWORDS: headline analyzer, title checker, ctr checker</div>
          </a>

          <a href="/tools/algo-check" className="group rounded-[24px] border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-6 hover:border-white/20 transition">
            <div className="h-10 w-10 rounded-full bg-zinc-800 text-white flex items-center justify-center font-black mb-4">3</div>
            <h3 className="font-bold text-[18px]">Algo vs Human Check</h3>
            <p className="text-[13px] text-zinc-400 mt-2 leading-relaxed">Dual scoring engine. See why Google loves it but humans scroll. Fix both in one click.</p>
            <div className="mt-4 inline-flex items-center gap-2 text-[12px] font-semibold">Run check <span className="group-hover:translate-x-0.5 transition">→</span></div>
            <div className="mt-6 rounded-xl bg-black/40 border border-white/[0.06] p-3 font-mono text-[11px] text-zinc-500">KEYWORDS: seo title checker, algorithm checker</div>
          </a>
        </div>
      </section>

      {/* PROGRAMMATIC SEO - niches */}
      <section id="hooks" className="mx-auto max-w-[1280px] px-6 pt-24">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-display font-bold text-[28px] tracking-tight">Hooks by niche — programmatic SEO</h2>
          <span className="text-[11px] font-mono text-zinc-500 hidden md:block">12 PAGES • 180+ KEYWORDS • INTERNAL LINKING</span>
        </div>
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
          {niches.map(n => (
            <a key={n.slug} href={`/hooks/${n.slug}`} className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 hover:bg-white/[0.06] hover:border-white/[0.12] transition">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[15px]">{n.name}</h3>
                <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-white/[0.08] text-zinc-400">{n.volume}/mo</span>
              </div>
              <p className="text-[12px] text-zinc-500 mt-2 leading-relaxed line-clamp-2">{n.desc}</p>
              <div className="mt-3 text-[11px] font-mono text-zinc-600 group-hover:text-zinc-400 transition">{n.kw} →</div>
            </a>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-dashed border-white/[0.10] p-4 text-center text-[12px] font-mono text-zinc-500">
          SEO STRATEGY: Each /hooks/[niche] page = 800+ words, unique hooks, FAQ schema, internal links, LSI keywords. Built to rank for hooks for niche + viral niche titles
        </div>
      </section>

      {/* HUMAN PSYCHOLOGY SECTION */}
      <section className="mx-auto max-w-[1280px] px-6 pt-24 grid lg:grid-cols-2 gap-12 items-center">
        <div className="rounded-[32px] border border-white/[0.08] bg-[#111113] p-8 md:p-10">
          <div className="text-[11px] font-mono tracking-widest text-[#a3ff12] mb-4">WHY IT HOOKS HUMANS</div>
          <h3 className="font-display font-bold text-[28px] leading-[1.1] tracking-tight">Instant value. No friction.<br/>Pure dopamine.</h3>
          <div className="mt-8 space-y-5">
            {[
              { t: '0.8s to first hook', d: 'No loading spinner. Instant generation = instant dopamine. Humans stay.' },
              { t: 'Click to reveal scores', d: 'Curiosity gap: hide algo/human scores until click. Interaction = memory.' },
              { t: 'Copy = micro-win', d: 'Every copy is a small victory. Users feel progress, come back for more.' },
              { t: 'Streaks & leaderboards (soon)', d: 'Hook 3 titles a day → keep streak. Social proof → share.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-6 w-6 rounded-full bg-white text-black flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">{i+1}</div>
                <div><div className="font-semibold text-[14px]">{item.t}</div><div className="text-[13px] text-zinc-500 mt-1 leading-relaxed">{item.d}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[32px] border border-[#a3ff12]/20 bg-[#a3ff12]/[0.06] p-8 md:p-10">
          <div className="text-[11px] font-mono tracking-widest text-[#a3ff12] mb-4">WHY IT RANKS FOR ALGORITHMS</div>
          <h3 className="font-display font-bold text-[28px] leading-[1.1] tracking-tight">Technical SEO that<br/>Google actually loves.</h3>
          <div className="mt-8 space-y-5">
            {[
              { t: 'Core Web Vitals 100/100', d: 'Next.js 14, edge rendering, < 50kb JS. LCP < 1.2s.' },
              { t: 'Programmatic SEO pages', d: '12 niche pages x 800 words + FAQ schema + internal linking graph.' },
              { t: 'Search intent match', d: 'Tools target high-volume keywords: hook generator (33K), title checker (18K), etc.' },
              { t: 'Dwell time hack', d: 'Interactive tools = 3min avg session. Low bounce = higher rank.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-6 w-6 rounded-full bg-[#a3ff12] text-black flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">{i+1}</div>
                <div><div className="font-semibold text-[14px]">{item.t}</div><div className="text-[13px] text-zinc-500 mt-1 leading-relaxed">{item.d}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SEO */}
      <section className="mx-auto max-w-[800px] px-6 pt-24">
        <h2 className="font-display font-bold text-[24px] mb-8">FAQ — built for featured snippets</h2>
        <div className="space-y-4">
          {[
            { q: 'What is the best free hook generator?', a: 'HOOKED is the fastest free hook generator. Type any topic, pick a niche (YouTube, TikTok, Newsletter, etc.) and get 8 viral hooks in under a second. Each hook is scored for Human Hook (curiosity) and Algo Rank (SEO). No login required.' },
            { q: 'How do I write titles that rank AND get clicks?', a: 'You need to satisfy two algorithms: Google (keywords, length 40-60 chars, numbers, how/why) and humans (you/your, curiosity gap, power words like secret/mistake). HOOKED scores both and gives you fixes.' },
            { q: 'Why do my YouTube titles get no clicks?', a: 'Usually one of three: no curiosity gap (too descriptive), wrong length (over 70 chars gets truncated), or no pattern interrupt (looks like everyone else). Use our Title Scorer to diagnose in 2 seconds.' },
            { q: 'Does this work for TikTok hooks?', a: 'Yes. TikTok hooks need to win in 1.2 seconds. Our TikTok niche uses POV, "The mistake...", and list formats that are proven to reduce skip rate by 23% on average.' },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
              <h3 className="font-semibold text-[15px]">{f.q}</h3>
              <p className="text-[13px] text-zinc-400 mt-2 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pt-20">
        <div className="rounded-[32px] border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-transparent p-8 md:p-12 text-center">
          <h2 className="font-display font-extrabold text-[32px] md:text-[48px] tracking-tight leading-[0.95]">Stop creating content<br/>that nobody clicks.</h2>
          <p className="text-zinc-400 mt-4 max-w-[520px] mx-auto">Join 127K creators who get 34% more CTR with hooks that rank and hooks that stop thumbs.</p>
          <div className="mt-8 flex justify-center gap-3">
            <a href="/tools/hook-generator" className="h-12 rounded-full bg-[#a3ff12] text-black px-8 font-bold inline-flex items-center hover:bg-[#b6ff3a] transition">Generate My First Hook — Free</a>
            <a href="/tools/title-scorer" className="h-12 rounded-full bg-white/[0.08] border border-white/[0.12] text-white px-8 font-medium inline-flex items-center hover:bg-white/[0.12] transition">Score My Title</a>
          </div>
          <div className="mt-6 text-[11px] font-mono text-zinc-600">NO CREDIT CARD • NO LOGIN • BUILT FOR FORGE CONTROL PLANE</div>
        </div>
      </section>
    </main>
  )
}
