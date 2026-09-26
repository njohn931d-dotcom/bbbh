import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Traffic Tools — Hook Generator, Title Scorer, Algo Check',
  description: '3 free tools that rank and hook: viral hook generator (33K/mo), title scorer, algo vs human checker. No login. Used by 127K creators.',
}

export default function Page() {
  return (
    <main className="mx-auto max-w-[1080px] px-6 pt-12 pb-20">
      <h1 className="font-display font-extrabold text-[40px] leading-[0.9] tracking-tight">Free Traffic Tools<br/><span className="text-zinc-500">That Rank + Hook</span></h1>
      <p className="text-zinc-400 mt-4 max-w-[640px]">Every tool targets a high-volume keyword and delivers instant value. Built to be linked to.</p>

      <div className="mt-10 grid md:grid-cols-3 gap-4">
        {[
          { href: '/tools/hook-generator', name: 'Hook Generator', kw: 'hook generator • 33K/mo', desc: '8 viral hooks in 0.8s. Niche-tuned. Scores for human + algo.' },
          { href: '/tools/title-scorer', name: 'Title Scorer', kw: 'headline analyzer • 18K/mo', desc: 'Paste title → Human Hook + Algo Rank + fixes. Instant.' },
          { href: '/tools/algo-check', name: 'Algo vs Human Check', kw: 'seo title checker • 12K/mo', desc: 'Dual engine. See why Google loves it but humans scroll.' },
        ].map(t => (
          <a key={t.href} href={t.href} className="rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-6 hover:bg-white/[0.07] transition">
            <div className="text-[11px] font-mono tracking-widest text-[#a3ff12]">{t.kw}</div>
            <h2 className="font-bold text-[18px] mt-3">{t.name}</h2>
            <p className="text-[13px] text-zinc-400 mt-2 leading-relaxed">{t.desc}</p>
            <div className="mt-4 text-[12px] font-semibold">Open tool →</div>
          </a>
        ))}
      </div>

      <div className="mt-16 rounded-2xl border border-white/[0.08] bg-[#111113] p-6">
        <h3 className="font-mono text-[11px] tracking-widest text-zinc-500">INTERNAL LINKING GRAPH (FOR CRAWLERS)</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {['youtube','tiktok','fitness','finance','saas','podcast','newsletter','ecommerce','ai','coaching'].map(s => (
            <a key={s} href={`/hooks/${s}`} className="text-[12px] px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.10]">{s} hooks</a>
          ))}
        </div>
      </div>
    </main>
  )
}
