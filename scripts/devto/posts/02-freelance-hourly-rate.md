---
key: freelance-hourly-rate
order: 2
title: "Your salary is not your hourly rate: the math to run before quoting a freelance rate"
description: "Salary ÷ 2080 is not your hourly rate. Here is the chain freelancers actually need: taxes, unbilled hours, unpaid leave, and the 2.5–3x multiplier that falls out of it."
tags: freelance, career, productivity, money
canonical: https://njohn931d-dotcom.github.io/bbbh/calculators/freelance-rate-calculator-2026/
cover: devto/freelance-hourly-rate.jpg
---

Most engineers who go freelance do this calculation once:

```
$70,000 salary ÷ 2,080 hours = $33.65/hour
```

Then they quote $45/hour, feel like they gave themselves a raise, and discover eight months later that they are working more and keeping less. The arithmetic was fine. The model was wrong.

## What the 2080 number hides

`2,080` is 40 hours × 52 weeks. It is the number HR uses for payroll, and it is wrong for pricing in at least four ways:

1. **Not every working hour is billable.** Admin, invoicing, proposals, sales calls, learning, and the client email that turns into a 90-minute call. A realistic ratio for a solo consultant is 20–25 billable hours in a 40-hour week.
2. **Nobody pays you for vacation.** Paid leave was an employee benefit. As a contractor, 5 weeks off means 47 billable weeks, not 52.
3. **You now pay both halves of payroll tax**, plus your own health insurance, software, hardware, accountant, and the occasional month with no work.
4. **Your rate has to fund the dry spells** between contracts, which is risk compensation, not greed.

## The chain I actually run

Working backwards from the take-home you want:

| Step | Example |
| --- | --- |
| Personal income you want to take out | $70,000 |
| Add tax overhead (assume ~30% effective) | $100,000 |
| Add business costs (insurance, tools, accounting) | $108,000 |
| Billable hours: 46 weeks × 25 h/week | 1,150 h |
| **Required rate** | **≈ $94/hour** |

So the "$70k job" is not a $34/hour contract. It is roughly a **$95/hour** contract, and that is before you decide whether the risk is worth it at all.

The shortcut version: `salary ÷ 2080 × 2.5 to 3`. It lands in the same place without the table, and it is the number I use when someone asks for a ballpark on a call.

Two honest caveats. Tax treatment is jurisdiction-specific — self-employment tax, VAT/GST registration thresholds and deductions vary enormously, so plug in your own numbers rather than mine. And the tax rate above is a rough effective figure for illustration, not advice.

## The part freelancers underprice most

Rate isn't only about income. It is about **what you will say no to**.

At $45/hour you accept a 4-hour meeting-heavy project because it is billable. At $95/hour the same project is a $380 decision, and "is this worth my Tuesday?" becomes a question you can answer honestly. Underpricing does not just cost money; it removes your ability to filter.

## Do the math with your own numbers

I put a free calculator together that runs this chain in the browser, no signup:

- Freelance rate calculator: https://njohn931d-dotcom.github.io/bbbh/calculators/freelance-rate-calculator-2026/ — target income in, required rate out
- Cost of time: https://njohn931d-dotcom.github.io/bbbh/calculators/cost-of-time/ — the same model for buying decisions
- Salary to hourly: https://njohn931d-dotcom.github.io/bbbh/calculators/salary-to-hourly/ — the payroll conversion, so you can see how far it is from a contracting rate
- Source: https://github.com/njohn931d-dotcom/bbbh

Disclosure: those are my own tools, they are free, and the math is in a single readable file if you would rather copy the formula than visit the site.

If you take one thing: never quote from `salary ÷ 2080`. Quote from the hours you can actually sell, after the costs that used to be someone else's problem.
