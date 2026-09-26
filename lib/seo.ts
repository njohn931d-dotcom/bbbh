export const niches = [
  { slug: 'fitness', name: 'Fitness', kw: 'fitness content hooks', volume: '12K', desc: 'Stop scrollers mid-rep. Hooks that turn workouts into watch-time.' },
  { slug: 'finance', name: 'Finance', kw: 'finance hooks', volume: '18K', desc: 'Make money talk actually get clicks. Hooks for finance creators.' },
  { slug: 'saas', name: 'SaaS & Startups', kw: 'saas content hooks', volume: '9K', desc: 'From 0 to PMF: hooks that make founders stop scrolling.' },
  { slug: 'podcast', name: 'Podcast', kw: 'podcast hooks', volume: '15K', desc: 'Titles that triple your downloads. Tested on 10K+ shows.' },
  { slug: 'youtube', name: 'YouTube', kw: 'youtube title hooks', volume: '33K', desc: 'Beat the algorithm with titles that humans actually click.' },
  { slug: 'tiktok', name: 'TikTok', kw: 'tiktok hooks', volume: '27K', desc: 'First 1.2 seconds matter. Hooks built for zero skip.' },
  { slug: 'newsletter', name: 'Newsletter', kw: 'newsletter subject lines', volume: '22K', desc: 'Open rates from 21% to 58% with one line change.' },
  { slug: 'ecommerce', name: 'E-commerce', kw: 'ecommerce hooks', volume: '11K', desc: 'Product hooks that convert browsers to buyers.' },
  { slug: 'ai', name: 'AI Tools', kw: 'ai tool hooks', volume: '14K', desc: 'Launch in a noisy market. Hooks that cut through AI hype.' },
  { slug: 'coaching', name: 'Coaching', kw: 'coaching business hooks', volume: '8K', desc: 'Authority without cringe. Hooks that book calls.' },
  { slug: 'real-estate', name: 'Real Estate', kw: 'real estate hooks', volume: '10K', desc: 'Listings that get saved, not scrolled past.' },
  { slug: 'food', name: 'Food & Recipe', kw: 'food content hooks', volume: '16K', desc: 'Make them hungry in 7 words or less.' },
] as const;

export const hookTemplates: Record<string, string[]> = {
  fitness: [
    "I did {topic} for 30 days and this broke me: {twist}",
    "The {topic} mistake keeping you at {pain} (fix in 23 sec)",
    "POV: You finally fix {topic} and {result}",
    "Why your {topic} isn't working - and it's not {common_myth}",
    "Steal my {topic} system: {number} rules, {result} in {time}",
  ],
  finance: [
    "I tracked every dollar for {time} - here's what {shocking}",
    "The {topic} lie costing you ${number}/mo",
    "If I had to build {topic} from $0 again, I'd do this",
    "Rich people don't do {common_myth}. They do this:",
    "{number} {topic} rules I wish I knew at {age}",
  ],
  saas: [
    "We hit ${number} MRR with this {topic} hack (no ads)",
    "I wasted {time} building {topic} nobody wanted. Here's the fix.",
    "The {topic} teardown that made us {result}",
    "Stop building {common_myth}. Build this instead:",
    "Our {topic} went viral after we changed 1 line: {twist}",
  ],
  default: [
    "The {topic} trick nobody tells you (until now)",
    "I tried {topic} for {time} - {result} was insane",
    "Why {common_myth} is killing your {topic}",
    "{number} {topic} secrets that feel illegal to share",
    "This {topic} changed everything: {twist}",
    "POV: You stop doing {common_myth} and finally get {result}",
    "The dark truth about {topic} no one wants to admit",
  ]
};

export function generateHooks(topic: string, nicheSlug: string = 'default') {
  const templates = [...(hookTemplates[nicheSlug] || []), ...hookTemplates.default];
  const vars = {
    topic: topic || 'this',
    twist: ['my bank account doubled', 'I got 10x more views', 'everything clicked', 'people started paying attention'][Math.floor(Math.random()*4)],
    pain: ['stuck', 'broke', 'invisible', 'burned out'][Math.floor(Math.random()*4)],
    result: ['$10K/mo', '100K followers', 'sold out', 'viral'][Math.floor(Math.random()*4)],
    common_myth: ['posting daily', 'going viral', 'hustling harder', 'perfect branding'][Math.floor(Math.random()*4)],
    number: ['3', '5', '7', '11'][Math.floor(Math.random()*4)],
    time: ['7 days', '30 days', '90 days', '6 months'][Math.floor(Math.random()*4)],
    age: ['22', '25', '30'][Math.floor(Math.random()*3)],
    shocking: ['shocked me', 'changed my business', 'made me quit my job'][Math.floor(Math.random()*3)],
  };
  
  return templates.slice(0, 8).map(t => {
    let hook = t;
    Object.entries(vars).forEach(([k,v]) => {
      hook = hook.replaceAll(`{${k}}`, v);
    });
    // capitalize first
    return hook.charAt(0).toUpperCase() + hook.slice(1);
  });
}

export function scoreTitle(title: string) {
  const len = title.length;
  const words = title.split(' ').length;
  
  // Algorithm score factors
  let algo = 50;
  if (len >= 40 && len <= 60) algo += 15;
  if (len > 60 && len < 90) algo += 10;
  if (title.match(/\d+/)) algo += 10; // numbers rank
  if (title.match(/\b(how|why|what|when|where)\b/i)) algo += 8;
  if (title.includes(':') || title.includes('-')) algo += 5;
  if (words >= 6 && words <= 12) algo += 12;
  
  // Human hook factors
  let human = 50;
  if (title.match(/\b(you|your|we|I)\b/i)) human += 10;
  if (title.match(/\(.*\)/)) human += 8; // curiosity gap
  if (title.match(/\b(secret|mistake|truth|lie|hack|steal)\b/i)) human += 15;
  if (title.match(/[!?]/)) human += 5;
  if (title.toLowerCase().includes('pov')) human += 10;
  if (title.match(/\b(this|that)\b/i)) human += 5;

  algo = Math.min(98, Math.max(12, algo + Math.floor(Math.random()*6 - 3)));
  human = Math.min(98, Math.max(12, human + Math.floor(Math.random()*6 - 3)));

  return { algo, human, total: Math.round((algo*0.4 + human*0.6)), len, words };
}
