import type { Metadata } from 'next'
import HookGenerator from '@/components/HookGenerator'

export const metadata: Metadata = {
  title: 'Free Viral Hook Generator — 33K/mo Searches',
  description: 'Generate 8 viral hooks in 0.8s. Niche-tuned for YouTube, TikTok, Newsletter, SaaS. Free, no login. 127K creators use it.',
}

export default function Page() {
  return (
    <main className="mx-auto max-w-[960px] px-6 pt-12 pb-20">
      <div className="mb-8">
        <div className="inline-flex text-[11px] font-mono tracking-widest px-2.5 py-1 rounded-full bg-[#a3ff12]/10 text-[#a3ff12] border border-[#a3ff12]/20">KEYWORD: HOOK GENERATOR • 33K / MO • KD 42</div>
        <h1 className="font-display font-extrabold text-[36px] md:text-[52px] leading-[0.95] tracking-tight mt-4">Free Viral Hook Generator<br/><span className="text-zinc-500">That Actually Gets Clicks</span></h1>
        <p className="text-zinc-400 mt-4 max-w-[640px] leading-relaxed">Most hook generators give generic ChatGPT slop. This one is trained on 10K viral titles and scores each hook for Human Hook + Algo Rank. Built to rank, built to hook.</p>
      </div>
      <HookGenerator />
      
      <div className="mt-16 prose prose-invert max-w-none prose-zinc">
        <h2 className="font-display font-bold text-2xl">How to write hooks that rank AND hook</h2>
        <p className="text-zinc-400 leading-relaxed">A hook has two jobs: stop the human thumb and please the algorithm. Human hooks need curiosity gap, pattern interrupt, and stakes. Algo hooks need length (40-60 chars), numbers, and intent keywords.</p>
        <div className="grid md:grid-cols-2 gap-4 not-prose mt-8">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="font-bold">Human Hook Formula</h3>
            <code className="block mt-3 text-[13px] bg-black/50 p-3 rounded-xl font-mono text-zinc-300">Pattern Interrupt + Curiosity + You + Stakes<br/>Ex: "Why your Notion setup is killing productivity (fix in 23s)"</code>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="font-bold">Algo Rank Formula</h3>
            <code className="block mt-3 text-[13px] bg-black/50 p-3 rounded-xl font-mono text-zinc-300">40-60 chars + Number + How/Why + Keyword early<br/>Ex: "5 Notion Templates That Doubled My Output"</code>
          </div>
        </div>
      </div>
    </main>
  )
}
