'use client'
import { useState, useEffect } from 'react'
import { generateHooks, scoreTitle } from '@/lib/seo'

export default function HookGenerator({ initialTopic = '', initialNiche = 'youtube' }: { initialTopic?: string, initialNiche?: string }) {
  const [topic, setTopic] = useState(initialTopic)
  const [niche, setNiche] = useState(initialNiche)
  const [hooks, setHooks] = useState<string[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [copied, setCopied] = useState<number | null>(null)

  const gen = () => {
    if (!topic.trim()) return
    setHooks(generateHooks(topic, niche))
    setSelected(null)
    // fake dopamine hit
    if (typeof window !== 'undefined') {
      (window as any).gtag?.('event', 'generate_hook', { topic, niche })
    }
  }

  useEffect(() => { if (initialTopic) { setHooks(generateHooks(initialTopic, initialNiche)) } }, [])

  const copy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopied(idx)
    setTimeout(() => setCopied(null), 1200)
  }

  return (
    <div className="w-full">
      <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] backdrop-blur p-2">
        <div className="rounded-[18px] bg-[#111113] border border-white/[0.06] p-5 md:p-7">
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="flex-1 min-w-[220px]">
              <label className="text-[11px] font-mono tracking-widest text-zinc-500 mb-2 block">WHAT'S YOUR TOPIC?</label>
              <input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && gen()}
                placeholder="e.g. notion templates, morning routine, ai agents"
                className="w-full h-12 rounded-full bg-white/[0.06] border border-white/[0.08] px-5 text-[15px] placeholder:text-zinc-600 focus:outline-none focus:border-[#a3ff12]/50 focus:bg-white/[0.08] transition"
              />
            </div>
            <div className="w-full md:w-[200px]">
              <label className="text-[11px] font-mono tracking-widest text-zinc-500 mb-2 block">NICHE / PLATFORM</label>
              <select value={niche} onChange={e => setNiche(e.target.value)} className="w-full h-12 rounded-full bg-white/[0.06] border border-white/[0.08] px-5 text-[14px] focus:outline-none focus:border-[#a3ff12]/50">
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="fitness">Fitness</option>
                <option value="finance">Finance</option>
                <option value="saas">SaaS</option>
                <option value="podcast">Podcast</option>
                <option value="newsletter">Newsletter</option>
                <option value="ecommerce">E-commerce</option>
                <option value="ai">AI Tools</option>
                <option value="coaching">Coaching</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={gen} className="h-12 rounded-full bg-[#a3ff12] text-black px-7 font-bold text-[14px] hover:bg-[#b6ff3a] active:scale-[0.98] transition-all">Generate Hooks →</button>
            </div>
          </div>

          {hooks.length === 0 ? (
            <div className="py-14 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center mb-4 text-xl">⚡</div>
              <p className="text-zinc-400 text-sm">Type a topic and hit generate. Instant viral hooks, no login.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {['morning routine', 'notion setup', 'ai agents', 'side hustle'].map(t => (
                  <button key={t} onClick={() => { setTopic(t); setTimeout(() => setHooks(generateHooks(t, niche)), 10) }} className="text-[12px] px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.10] text-zinc-300">{t}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {hooks.map((hook, i) => {
                const s = scoreTitle(hook)
                const isSel = selected === i
                return (
                  <div key={i} onClick={() => setSelected(isSel ? null : i)} className={`group relative rounded-[16px] border p-4 pr-[110px] cursor-pointer transition-all ${isSel ? 'bg-white text-black border-white' : 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.12]'}`}>
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 text-[11px] font-mono px-1.5 py-0.5 rounded ${isSel ? 'bg-black text-white' : 'bg-[#a3ff12] text-black'}`}>{i+1}</span>
                      <p className={`text-[15px] leading-[1.35] font-medium ${isSel ? 'text-black' : 'text-zinc-100'}`}>{hook}</p>
                    </div>
                    {isSel && (
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-black/[0.06] p-3">
                          <div className="text-[10px] font-mono tracking-widest opacity-60">HUMAN HOOK</div>
                          <div className="text-[22px] font-black leading-none mt-1">{s.human}%</div>
                          <div className="h-1.5 mt-2 rounded-full bg-black/10 overflow-hidden"><div className="h-full bg-black" style={{ width: `${s.human}%` }} /></div>
                        </div>
                        <div className="rounded-xl bg-black/[0.06] p-3">
                          <div className="text-[10px] font-mono tracking-widest opacity-60">ALGO RANK</div>
                          <div className="text-[22px] font-black leading-none mt-1">{s.algo}%</div>
                          <div className="h-1.5 mt-2 rounded-full bg-black/10 overflow-hidden"><div className="h-full bg-black" style={{ width: `${s.algo}%` }} /></div>
                        </div>
                        <div className="rounded-xl bg-[#a3ff12] p-3 text-black">
                          <div className="text-[10px] font-mono tracking-widest opacity-70">TOTAL CTR POTENTIAL</div>
                          <div className="text-[22px] font-black leading-none mt-1">{s.total}%</div>
                          <div className="text-[11px] font-medium mt-1">{s.total > 75 ? '🔥 Viral potential' : s.total > 55 ? '✓ Good hook' : '→ Needs punch'}</div>
                        </div>
                      </div>
                    )}
                    <div className="absolute right-3 top-3 flex gap-1.5">
                      <button onClick={(e) => { e.stopPropagation(); copy(hook, i) }} className={`h-8 px-3 rounded-full text-[12px] font-semibold border transition ${isSel ? 'bg-black text-white border-black hover:bg-zinc-800' : 'bg-white text-black border-white hover:bg-zinc-200'}`}>{copied === i ? 'Copied!' : 'Copy'}</button>
                    </div>
                    {!isSel && (
                      <div className="absolute right-3 bottom-3 flex gap-1.5">
                        <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-white/[0.08] text-zinc-400">H:{s.human} A:{s.algo}</span>
                      </div>
                    )}
                  </div>
                )
              })}
              <div className="pt-3 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span>{hooks.length} HOOKS GENERATED • AVG SCORE {Math.round(hooks.map(h=>scoreTitle(h).total).reduce((a,b)=>a+b,0)/hooks.length)}%</span>
                <button onClick={gen} className="underline hover:text-zinc-300">Regenerate ↻</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
