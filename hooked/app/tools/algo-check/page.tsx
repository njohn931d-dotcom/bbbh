'use client'
import { useState } from 'react'
import { scoreTitle } from '@/lib/seo'

export default function Page() {
  const [text, setText] = useState('5 Notion templates that doubled my output (steal them)')
  const s = scoreTitle(text)

  return (
    <main className="mx-auto max-w-[900px] px-6 pt-12 pb-20">
      <h1 className="font-display font-extrabold text-[36px] leading-[0.95]">Algo vs Human Check<br/><span className="text-zinc-500 text-[24px]">Dual scoring engine</span></h1>

      <div className="mt-8 grid md:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6">
          <textarea value={text} onChange={e=>setText(e.target.value)} className="w-full h-[120px] rounded-2xl bg-[#111113] border border-white/[0.08] p-4 text-[15px] focus:outline-none focus:border-white/20" />

          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between text-[11px] font-mono tracking-widest mb-2"><span className="text-zinc-500">HUMAN ATTENTION</span><span className={s.human > 70 ? 'text-[#a3ff12]' : 'text-amber-400'}>{s.human}%</span></div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-[#a3ff12] transition-all" style={{width: `${s.human}%`}} /></div>
              <div className="mt-2 text-[12px] text-zinc-500">Curiosity gap, you-language, power words, pattern interrupt. This is why humans stop scrolling.</div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-mono tracking-widest mb-2"><span className="text-zinc-500">ALGORITHM RANK</span><span className="text-white">{s.algo}%</span></div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-white transition-all" style={{width: `${s.algo}%`}} /></div>
              <div className="mt-2 text-[12px] text-zinc-500">Length, keywords, numbers, structure. This is why Google/YouTube shows it to more people.</div>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-xl bg-[#a3ff12] text-black">
            <div className="text-[11px] font-mono tracking-widest">VERDICT</div>
            <div className="font-bold text-[18px] mt-1">{s.total > 80 ? '🚀 Ship it. This will rank AND hook.' : s.human > s.algo ? '👀 Humans love it, algo hates it. Add keywords + number.' : s.algo > s.human ? '🤖 Algo loves it, humans scroll past. Add curiosity + you.' : '→ Needs work on both. See fixes.'}</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-white/[0.08] bg-[#111113] p-5">
            <h3 className="font-mono text-[11px] tracking-widest text-zinc-500">HUMAN BRAIN CHECK</h3>
            <div className="mt-3 space-y-2 text-[13px]">
              <div className="flex justify-between"><span className="text-zinc-400">Curiosity gap ( )</span><span>{text.includes('(') ? '✓' : '✗'}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">You / Your</span><span>{/you|your/i.test(text) ? '✓' : '✗'}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Power word</span><span>{/secret|mistake|truth|lie|hack|steal/i.test(text) ? '✓' : '✗'}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">POV / Pattern break</span><span>{/pov|why|stop/i.test(text) ? '✓' : '✗'}</span></div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-[#111113] p-5">
            <h3 className="font-mono text-[11px] tracking-widest text-zinc-500">ALGORITHM CHECK</h3>
            <div className="mt-3 space-y-2 text-[13px]">
              <div className="flex justify-between"><span className="text-zinc-400">40-60 chars</span><span>{text.length >=40 && text.length <=60 ? '✓' : `${text.length} ✗`}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">6-12 words</span><span>{text.split(' ').length >=6 && text.split(' ').length <=12 ? '✓' : '✗'}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Number</span><span>{/\d/.test(text) ? '✓' : '✗'}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">How/Why/What</span><span>{/how|why|what/i.test(text) ? '✓' : '✗'}</span></div>
            </div>
          </div>
          <div className="rounded-2xl border border-[#a3ff12]/20 bg-[#a3ff12]/10 p-5">
            <h3 className="font-mono text-[11px] tracking-widest text-[#a3ff12]">TRAFFIC MATH</h3>
            <div className="mt-2 text-[13px] leading-relaxed text-zinc-300">If CTR goes from 2.1% → 3.4% (+62%), and impressions stay same, traffic 1.62x. That's what a +15 point human score does. Algo rank gets you impressions, human hook gets you clicks.</div>
          </div>
        </div>
      </div>
    </main>
  )
}
