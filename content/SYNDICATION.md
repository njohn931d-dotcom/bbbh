# Distribution playbook (the legitimate version of "parasite SEO")

Publishing on someone else's domain to borrow their ranking signals is the tactic usually called parasite SEO. There are two very different versions of it, and only one is worth doing.

## The version that gets sites demoted

Publishing third-party pages on a domain you do not control *primarily to exploit that domain's ranking signals* — injected pages, compromised subdomains, expired-domain redirects, unauthorised contributor accounts, or paying a publisher to host pages they have not reviewed. Google calls this **site reputation abuse** and enforces it manually and algorithmically [3](https://bulkbase.ai/seo/understanding-googles-scaled-content-abuse-policy). The penalty lands on the host domain, and the publisher's cleanup usually lands on you.

Not doing that here.

## The version that works

Publishing your own work, under your own name, on platforms that explicitly invite it — with a canonical or author link back to the original. This is syndication, it has been standard practice in journalism for a century, and it produces three things:

1. **Referral traffic** from platforms with large existing audiences.
2. **Discovery** — new domains get crawled and cited faster when other established sites link to them.
3. **Links you earned** rather than bought, which is the only durable kind.

## Platform rules (check each one before publishing — they change)

| Platform | Allowed? | Canonical support | Notes |
| --- | --- | --- | --- |
| Medium | Yes | Import tool sets `rel="canonical"` to your original | Use *Import a story* so the canonical points at your site; publish under your own account |
| Dev.to | Yes | Front matter `canonical_url` | Technical/quantitative angles work best; disclose it is your own blog |
| Hashnode | Yes | Canonical field, or custom domain mapping | Good for the formula/how-to pieces |
| LinkedIn Articles | Yes | No canonical control | Paste an adapted excerpt with a clear link to the original; do not paste whole articles |
| Reddit / forums | Yes, where on-topic | N/A | Answer the question in the thread, link only where genuinely relevant; most subreddits ban self-promotion |
| Quora | Yes | N/A | Answer, then cite; do not post link-only answers |

Cross-posting the *same* article to several platforms is fine when each platform's rules permit it and the canonical points home. Publishing identical unattributed copies across many sites with no editorial oversight is what scaled-content enforcement looks for.

## The workflow

1. **Ship on your own domain first.** The canonical must exist before anything else references it. Wait for it to be indexed (Search Console → URL Inspection).
2. **Wait 3–7 days** before syndicating, so the original is established as the source.
3. **Publish an adapted version**, not a byte-identical copy: a new headline aimed at that platform's audience, a trimmed or expanded intro, and the same tables.
4. **Set the canonical** to your URL on every platform that supports it.
5. **Add one contextual link** to the original plus one to a sibling guide. Not five.
6. **Track it**: annotate the launch date, then check Search Console for new referring domains and referral traffic after 30 days.

## Which pages suit which platform

| Content type | Best platforms |
| --- | --- |
| Formula/how-to (`price-to-hours-formula`, `how-many-working-hours-in-a-year`) | Dev.to, Hashnode |
| Numbers with a takeaway (`20-dollars-an-hour-is-how-much-a-year`, `52-week-savings-challenge`) | Medium, LinkedIn |
| Checklists and scripts (`how-to-audit-your-subscriptions`, `how-to-cancel-a-subscription-and-get-a-refund`) | Medium, LinkedIn |
| Opinion-tinged pieces (`the-latte-factor-what-it-gets-right`, `buy-it-nice-or-buy-it-twice`) | LinkedIn, relevant subreddits as a genuine answer |

## Also worth doing (cheap, legitimate, often skipped)

- **`/sitemap.xml`** — submitted in Search Console and Bing Webmaster Tools. Generated automatically on production builds.
- **`/feed.xml`** — RSS is crawled by aggregators and AI tools; generated with all 40 guides.
- **`/llms.txt`** — a plain-text index of every guide and its one-line summary, for AI crawlers that request it. Generated automatically.
- **Answer-first formatting** — every guide opens with a two-sentence direct answer, which is what gets extracted into AI Overviews and featured snippets.
- **Original data** — the tables are computed here, so they are quotable. Cite-worthy numbers attract links on their own.

## Ranking expectations

None are promised. Typical timelines for a brand-new domain with 40 substantive pages: first impressions within 2–6 weeks, meaningful traffic in 3–6 months, and a long tail that keeps growing as pages age. Anyone who promises specific rankings or timelines is selling something.
