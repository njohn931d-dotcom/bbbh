import { MetadataRoute } from 'next'
import { niches } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://hooked.engineering'
  const now = new Date()
  
  const staticPages = [
    '', '/tools/hook-generator', '/tools/title-scorer', '/tools/algo-check'
  ].map(p => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: p === '' ? 1 : 0.8,
  }))

  const nichePages = niches.map(n => ({
    url: `${base}/hooks/${n.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...nichePages]
}
