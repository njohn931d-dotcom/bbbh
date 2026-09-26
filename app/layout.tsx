import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://hooked.engineering'),
  title: {
    default: 'HOOKED — Tools Built for Humans, Optimized for Algorithms',
    template: '%s | HOOKED'
  },
  description: 'Free viral hook generator, title scorer & algorithm checker. Built to rank on Google and stop thumbs on feeds. 127K+ creators use it to get traffic that sticks.',
  keywords: ['hook generator', 'viral title generator', 'youtube title checker', 'tiktok hooks', 'headline analyzer', 'content hooks', 'viral hooks', 'seo title checker'],
  authors: [{ name: 'HOOKED' }],
  creator: 'HOOKED',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://hooked.engineering',
    title: 'HOOKED — Tools Built for Humans, Optimized for Algorithms',
    description: 'Free tools that rank on Google and stop thumbs on feeds. Generate hooks, score titles, beat the algorithm.',
    siteName: 'HOOKED',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'HOOKED - Traffic Engine' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HOOKED — Tools Built for Humans, Optimized for Algorithms',
    description: 'Free tools that rank on Google and stop thumbs on feeds.',
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
  verification: { google: 'hooked-engineering' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0a0a0b] text-zinc-100 selection:bg-[#a3ff12] selection:text-black">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-[#0a0a0b] to-[#0a0a0b]" />
          <div className="noise absolute inset-0" />
        </div>
        <div className="relative z-10">
          <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/40 backdrop-blur-2xl">
            <div className="mx-auto max-w-[1280px] px-6 h-[64px] flex items-center justify-between">
              <a href="/" className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-[10px] bg-[#a3ff12] flex items-center justify-center text-black font-black text-[14px]">H</div>
                <span className="font-display font-extrabold tracking-tight text-[18px]">HOOKED</span>
                <span className="hidden sm:inline-flex ml-2 text-[10px] font-mono tracking-widest px-2 py-1 rounded-full bg-white/[0.08] border border-white/[0.08]">TRAFFIC ENGINE v1</span>
              </a>
              <div className="flex items-center gap-2">
                <a href="/tools/hook-generator" className="hidden md:inline-flex text-[13px] font-medium text-zinc-400 hover:text-white transition px-3 py-2">Tools</a>
                <a href="#hooks" className="hidden md:inline-flex text-[13px] font-medium text-zinc-400 hover:text-white transition px-3 py-2">Niches</a>
                <a href="/tools/hook-generator" className="inline-flex h-9 items-center rounded-full bg-white text-black px-4 text-[13px] font-semibold hover:bg-zinc-200 transition">Start Hooking — Free</a>
              </div>
            </div>
          </nav>
          {children}
          <footer className="border-t border-white/[0.06] mt-24">
            <div className="mx-auto max-w-[1280px] px-6 py-16 grid md:grid-cols-4 gap-10">
              <div className="col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-[10px] bg-[#a3ff12] flex items-center justify-center text-black font-black">H</div>
                  <span className="font-display font-bold text-lg">HOOKED</span>
                </div>
                <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">Built for humans. Optimized for algorithms. The free traffic toolkit that actually ranks and actually hooks. No login. No BS. Just traffic.</p>
                <div className="mt-6 flex gap-2">
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-[#a3ff12]/10 text-[#a3ff12] border border-[#a3ff12]/20">127K+ HOOKS GENERATED</span>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white/[0.06] text-zinc-400 border border-white/[0.08]">AVG CTR +34%</span>
                </div>
              </div>
              <div>
                <h4 className="text-[12px] font-mono tracking-widest text-zinc-500 mb-4">TOOLS</h4>
                <div className="space-y-2.5 text-sm text-zinc-400">
                  <a href="/tools/hook-generator" className="block hover:text-white">Hook Generator</a>
                  <a href="/tools/title-scorer" className="block hover:text-white">Viral Title Scorer</a>
                  <a href="/tools/algo-check" className="block hover:text-white">Algo vs Human Check</a>
                  <a href="/#hooks" className="block hover:text-white">Niche Hook Libraries</a>
                </div>
              </div>
              <div>
                <h4 className="text-[12px] font-mono tracking-widest text-zinc-500 mb-4">RANK FOR</h4>
                <div className="space-y-2.5 text-sm text-zinc-400">
                  <div>hook generator</div>
                  <div>viral title generator</div>
                  <div>youtube title checker</div>
                  <div>tiktok hook ideas</div>
                  <div>headline analyzer</div>
                </div>
              </div>
            </div>
            <div className="mx-auto max-w-[1280px] px-6 pb-10 text-[11px] font-mono text-zinc-600 flex justify-between">
              <span>© 2026 HOOKED ENGINEERING — BUILT TO RANK. BUILT TO HOOK.</span>
              <span className="hidden md:block">FORGE CONTROL PLANE</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
