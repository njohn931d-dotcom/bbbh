import { NextRequest, NextResponse } from 'next/server'
import { generateHooks } from '@/lib/seo'

export async function POST(req: NextRequest) {
  const { topic, niche } = await req.json()
  if (!topic) return NextResponse.json({ error: 'topic required' }, { status: 400 })
  const hooks = generateHooks(topic, niche || 'default')
  return NextResponse.json({ hooks })
}
