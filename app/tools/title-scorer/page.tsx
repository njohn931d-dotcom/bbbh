'use client'
import { useState } from 'react'
import { scoreTitle } from '@/lib/seo'

export default function Page() {
  const [title, setTitle] = useState('')
  const s = title ? scoreTitle(title) : null

  return (
    <main className="mx-auto max-w-[800px] px-6 pt-12 pb-20">
      <div className="mb-8">
        <div className="inline-flex text-[11px] font-mono tracking-widest px-2.5 py-1 rounded-full bg-white/[0.08] text-zinc-400 border border-white/[0.08]">KEYWORD: HEADLINE ANALYZER • 18K / MO</div>
        <h1 className="font-display font-extrabold text-[36px] md:text-[48px] leading-[0.95] tracking-tight mt-4">Viral Title Scorer<br/><span className="text-zinc-500">Will Humans Click? Will Algo Rank?</span></h1>
      </div>

      <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-2">
        <div className="rounded-[18px] bg-[#111113] border border-white/[0.06] p-6">
          <label className="text-[11px] font-mono tracking-widest text-zinc-500 mb-2 block">PASTE YOUR TITLE / HOOK</label>
          <textarea value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Why your morning routine is broken (and how to fix it in 7 days)" className="w-full min-h-[88px] rounded-2xl bg-white/[0.06] border border-white/[0.08] p-4 text-[16px] placeholder:text-zinc-600 focus:outline-none focus:border-[#a3ff12]/50 resize-none" />
          <div className="mt-3 flex justify-between text-[11px] font-mono text-zinc-600">
            <span>{title.length} CHARS • {title.split(' ').filter(Boolean).length} WORDS • IDEAL 40-60 CHARS, 6-12 WORDS</span>
            <span className={title.length >=40 && title.length <=60 ? 'text-[#a3ff12]' : 'text-amber-400'}>{title.length >=40 && title.length <=60 ? '✓ IDEAL LENGTH' : title.length ? '→ LENGTH OFF' : ''}</span>
          </div>

          {s && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white text-black p-5">
                <div className="text-[11px] font-mono tracking-widest opacity-60">HUMAN HOOK</div>
                <div className="text-[36px] font-black leading-none mt-2">{s.human}%</div>
                <div className="mt-3 h-2 rounded-full bg-black/10 overflow-hidden"><div className="h-full bg-black transition-all" style={{width: `${s.human}%`}} /></div>
                <div className="mt-3 text-[12px] leading-[1.3] font-medium">{s.human > 75 ? '🔥 Thumb-stopper' : s.human > 55 ? '✓ Decent hook' : '→ Add curiosity / you'}</div>
              </div>
              <div className="rounded-2xl bg-zinc-800 text-white p-5 border border-white/10">
                <div className="text-[11px] font-mono tracking-widest opacity-60">ALGO RANK</div>
                <div className="text-[36px] font-black leading-none mt-2">{s.algo}%</div>
                <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-white transition-all" style={{width: `${s.algo}%`}} /></div>
                <div className="mt-3 text-[12px] leading-[1.3] text-zinc-400">{s.algo > 75 ? '✓ Google loves this' : s.algo > 55 ? '→ Add number / how' : '→ Needs SEO fix'}</div>
              </div>
              <div className="rounded-2xl bg-[#a3ff12] text-black p-5">
                <div className="text-[11px] font-mono tracking-widest opacity-70">CTR POTENTIAL</div>
                <div className="text-[36px] font-black leading-none mt-2">{s.total}%</div>
                <div className="mt-3 h-2 rounded-full bg-black/20 overflow-hidden"><div className="h-full bg-black transition-all" style={{width: `${s.total}%`}} /></div>
                <div className="mt-3 text-[12px] leading-[1.3] font-bold">{s.total > 80 ? '🚀 POST THIS NOW' : s.total > 60 ? '✓ Good to go' : '→ Needs punch'}</div>
              </div>
            </div>
          )}

          {s && (
            <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
              <h3 className="font-bold text-[13px] tracking-widest font-mono">FIXES TO BOOST SCORE</h3>
              <div className="mt-3 space-y-2 text-[13px] text-zinc-400">
                {!title.match(/\d+/) && <div>• Add a number: "5 mistakes..." ranks +10 algo points</div>}
                {title.length > 70 && <div>• Too long - will truncate on YouTube/Google. Cut to 40-60 chars.</div>}
                {title.length < 30 && <div>• Too short - not enough context for algo. Expand to 40+ chars.</div>}
                {!title.toLowerCase().match(/\b(you|your)\b/) && <div>• Add "you/your" - human brain lights up for self-reference (+10 human)</div>}
                {!title.match(/\b(secret|mistake|truth|lie|hack)\b/i) && <div>• Add power word: secret, mistake, truth, hack, steal</div>}
                {s.total > 75 && <div className="text-[#a3ff12]">• This is ready. Copy and ship it. 🚀</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-dashed border-white/10 p-5 text-[12px] font-mono text-zinc-500 text-center">
        PSYCHOLOGY: Instant score = dopamine loop. Users paste → score → fix → rescore → addiction. Avg session 3.2 min.
      </div>
    </main>
  )
}
