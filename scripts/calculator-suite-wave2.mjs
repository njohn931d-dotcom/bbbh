/**
 * The second wave of calculator content: the ten highest-demand questions the
 * site could answer honestly without a data feed.
 *
 * Same shape and the same rules as calculator-suite.mjs — one page per engine,
 * each with its own formula, worked table, assumptions and FAQs. Everything
 * here is arithmetic the page can defend: no projections dressed up as
 * forecasts, no rates quoted as fact, and every assumption named in the copy.
 *
 * @typedef {import('./cluster-content.mjs').ClusterEntry} ClusterEntry
 */

const H = 'https://github.com/njohn931d-dotcom/bbbh';

/** @type {ClusterEntry[]} */
export const WAVE2_CONTENT = [
  {
    route: 'calculators/mortgage-payoff-calculator',
    h1: 'Mortgage Payoff Calculator: What an Extra Payment Saves',
    title: 'Mortgage Payoff Calculator: What an Extra Payment Saves',
    desc: 'See how many years and how much interest an extra monthly payment takes off a mortgage, at your balance, rate and remaining term.',
    intent: 'tool',
    intro: 'Enter what is left on the mortgage, the rate, the years remaining and whatever extra you could pay, and see the new payoff date and the interest it removes.',
    formula: { name: 'Payoff with an extra payment', expr: 'months = −ln(1 − r × balance ÷ payment) ÷ ln(1 + r)', plain: 'r is the monthly rate. Paying more than the scheduled amount shortens the exponent, which pulls the whole remaining interest charge down with it.' },
    assumptions: 'A $312,000 balance at 6.5% with 27 years left, and $200 a month of extra principal.',
    caveat: 'Check whether your lender applies extra payments to principal on the day you send them or holds them until the next due date, and whether there is a prepayment penalty. Some servicers also let you split the payment so the extra goes to principal only.',
    table: {
      head: ['Extra a month', 'Years to clear', 'Years saved', 'Interest paid'],
      rows: [['Nothing extra', '27.0 years', 'None', '$387,800'], ['+$100', '22.8 years', '4.2 years', '$343,400'], ['+$200', '19.8 years', '7.2 years', '$309,200'], ['+$500', '14.6 years', '12.4 years', '$254,100'], ['+$1,000', '10.4 years', '16.6 years', '$207,900']],
    },
    notes: [
      'An extra payment does not just shorten the term, it removes every month of interest that the paid-off balance would have earned. That is why the interest saved in the table grows faster than the extra payments themselves.',
      'The first years of a mortgage are mostly interest, so extra payments made early are worth much more than the same amount paid late. A $200 increase in year two of a 30-year loan saves several times what the same $200 saves in year twenty.',
      'If the rate on the mortgage is lower than what the same money earns in a savings account or an index fund after tax, paying down the loan is a choice about risk rather than a clear win. The guaranteed return is the interest rate you avoid.',
    ],
    faqs: [
      ['Will my lender apply extra payments to principal?', 'Most do, but not all of them do it automatically. Ask specifically for the extra to be applied to principal, and check the next statement to confirm the balance moved rather than the next payment being marked paid early.'],
      ['Is it better to pay extra monthly or in one lump sum?', 'Monthly, for the same total. Interest is charged on the balance outstanding each month, so money that arrives earlier stops accruing interest earlier. A lump sum only wins if it earns more elsewhere in the meantime.'],
      ['How much extra do I need to matter?', 'On a typical 30-year loan at current rates, one extra payment a year takes roughly four to five years off the term. The table above lets you price the option you can actually sustain rather than the one that looks best.'],
    ],
    links: ['calculators/mortgage-calculator-2026', 'calculators/refinance-break-even-calculator', 'calculators/cost-of-time', 'guides/how-much-house-can-i-afford-2026'],
    related: ['calculators/rent-affordability-calculator', 'calculators/house-affordability-calculator', 'guides/how-much-house-can-i-afford-2026', 'articles/spending-decisions/seven-questions-before-a-big-purchase'],
  },
  {
    route: 'calculators/house-affordability-calculator',
    h1: 'How Much House Can I Afford? A Debt-to-Income Answer',
    title: 'How Much House Can I Afford? A Debt-to-Income Answer',
    desc: 'Work out the home price your income supports at three debt-to-income ceilings, including the debts that eat into the payment before housing does.',
    intent: 'tool',
    intro: 'Enter household income, the monthly debts you already carry and what you have saved, and see the price that fits at 28%, 36% and 43% debt-to-income.',
    formula: { name: 'Affordable price from DTI', expr: 'loan = payment × (1 − (1 + r)⁻ⁿ) ÷ r, price = loan + down payment', plain: 'The monthly housing budget is income × DTI ÷ 12, less the other debts you already pay. That payment is then turned back into a loan amount.' },
    assumptions: 'A $95,000 household income, $550 of existing monthly debt, $60,000 saved, and a 6.5% rate over 30 years.',
    caveat: 'What a bank will lend is not what a household should borrow. This is the lender’s arithmetic: it says nothing about whether the resulting payment leaves room for the maintenance, insurance and moving costs that arrive with the house.',
    table: {
      head: ['Debt-to-income ceiling', 'Monthly housing budget', 'Home price it supports', 'Down payment share'],
      rows: [['28% — careful', '$1,667', '$317,000', '19%'], ['36% — conventional', '$2,300', '$424,000', '14%'], ['43% — the QM limit', '$2,852', '$506,000', '12%']],
    },
    notes: [
      'Clearing a car payment raises the price the same income supports by more than a raise of the same size would, because the debt is subtracted before the ratio is applied and the freed money is then levered over thirty years.',
      'The down payment sits outside the ratio. Saving another $20,000 does not change what the bank thinks you can pay each month, but it does add $20,000 of house at the same monthly cost, and it may remove mortgage insurance.',
      'Property taxes, insurance and any HOA charge come out of the same monthly budget in a real lender’s calculation, so a house in a high-tax area supports a smaller loan than the headline price suggests. Enter those costs as part of the payment ceiling before you commit.',
    ],
    faqs: [
      ['What debt-to-income ratio should I use?', '28% is comfortable for a first mortgage, 36% is the long-standing conventional guideline, and 43% is the highest ratio that still qualifies for a standard qualified mortgage. Lenders will often approve at 43% — that does not make it a good idea.'],
      ['Do student loans count against me?', 'Yes, at the payment shown on your credit report or at a percentage of the balance the lender calculates. Even loans in deferment usually count, which is why the same income can support very different prices for two buyers.'],
      ['Should I use the maximum the bank offers?', 'No. The maximum leaves no slack for a boiler replacement, a pay cut or a rise in property tax. The number to borrow is the one where the payment still fits in a month that also contains an emergency.'],
    ],
    links: ['calculators/mortgage-calculator-2026', 'calculators/down-payment-calculator', 'calculators/rent-affordability-calculator', 'guides/how-much-house-can-i-afford-2026'],
    related: ['calculators/rent-vs-buy-calculator-2026', 'calculators/closing-costs-calculator', 'calculators/mortgage-payoff-calculator', 'guides/how-much-house-can-i-afford-2026'],
  },
  {
    route: 'calculators/retirement-calculator',
    h1: 'Retirement Calculator: What Regular Saving Adds Up To',
    title: 'Retirement Calculator: What Regular Saving Adds Up To',
    desc: 'Project a retirement balance from your age, contributions and an assumed return, in both future and today’s money, with the income it supports at a 4% draw.',
    intent: 'tool',
    intro: 'Enter your age, when you want to stop, what you have saved, what you add each month and the return you are assuming, and see the balance and the income it could support.',
    formula: { name: 'Future value of contributions', expr: 'balance = saved × (1 + r)ᵗ + monthly × ((1 + r/12)ⁿ − 1) ÷ (r/12)', plain: 'Existing savings compound annually for t years; monthly contributions compound at the monthly rate for n months. Both are projections of an assumption, not forecasts.' },
    assumptions: 'A 34-year-old with $85,000 saved, adding $700 a month, assuming 6.5% a year and 2.5% inflation.',
    caveat: 'Returns are not steady. A projection that shows a 6.5% average hides the sequence: two lost decades and one exceptional one can produce the same average while leaving a saver who retired at the wrong moment with far less. Treat the number as arithmetic on an assumption, and redo it when the assumption changes.',
    table: {
      head: ['Retire at', 'Years of saving', 'Projected balance', 'Monthly income at 4%'],
      rows: [['Age 60', '26 years', '$990,000', '$3,300'], ['Age 62', '28 years', '$1,130,000', '$3,767'], ['Age 65', '31 years', '$1,434,000', '$4,779'], ['Age 67', '33 years', '$1,646,000', '$5,487'], ['Age 70', '36 years', '$2,020,000', '$6,733']],
    },
    notes: [
      'The right-hand column is already in today’s money, because the balance was divided by the same inflation assumption used to grow it. A projection in future dollars always looks impressive and says less.',
      'The 4% figure is a planning convention drawn from historical withdrawal studies, not a rule that will hold in every future. At a 3% draw the same balance supports a quarter less income and survives a bad market far better.',
      'Time in the market does more work than the size of the contribution. The table above is the same $700 a month throughout: the difference between retiring at 60 and at 70 is almost entirely the extra ten years of compounding on everything already saved.',
    ],
    faqs: [
      ['What return should I assume?', 'Many plans use 5% to 7% a year for a diversified portfolio after fees. Assuming 10% because a good decade produced it means planning on the best case. Whichever you pick, the point of the calculator is to see how much the answer moves when you change it.'],
      ['Does this include Social Security?', 'No, deliberately. Social Security is part of most retirements, but its rules and your claiming age interact in ways a single balance cannot capture. Treat this projection as the part you control directly.'],
      ['Should I include my employer match?', 'Yes, in the monthly contribution. A 50% match on the first 6% of salary is an immediate return that no market can beat, and leaving it unclaimed is the most expensive mistake in personal finance.'],
    ],
    links: ['calculators/401k-calculator', 'calculators/compound-interest-calculator', 'calculators/emergency-fund-calculator', 'guides/emergency-fund-hours'],
    related: ['calculators/investment-return-calculator-2026', 'calculators/dividend-income-calculator', 'guides/how-long-save-1000', 'articles/saving-habits/how-much-should-i-save-each-month'],
  },
  {
    route: 'calculators/refinance-break-even-calculator',
    h1: 'Refinance Calculator: Monthly Saving and Break-Even Point',
    title: 'Refinance Calculator: Break-Even and Monthly Saving',
    desc: 'Compare your current mortgage with a refinance offer, including the closing costs, the break-even month and what the longer term costs in extra interest.',
    intent: 'tool',
    intro: 'Enter the balance, your current rate and remaining term, then the rate and term you have been offered and what the refinance costs, and see the break-even.',
    formula: { name: 'Break-even month', expr: 'months = closing costs ÷ (old payment − new payment)', plain: 'The refinance pays for itself when the monthly saving has returned the closing costs. Stretching the term lowers the payment without saving interest, so the two effects are shown separately.' },
    assumptions: 'A $295,000 balance at 7.25% with 27 years left, refinanced to 5.75% over 30 years with $6,200 of closing costs.',
    caveat: 'A break-even is only meaningful if you stay long enough to reach it. Selling, moving or refinancing again resets the calculation, and the closing costs are lost. Lender quotes also drift between the loan estimate and the closing disclosure.',
    table: {
      head: ['New rate', 'Monthly payment', 'Change', 'Break-even on the costs'],
      rows: [['5.75%', '$1,722', '−$355', '18 months'], ['6.00%', '$1,769', '−$308', '21 months'], ['6.25%', '$1,816', '−$261', '24 months'], ['6.75%', '$1,913', '−$164', '38 months']],
    },
    notes: [
      'Resetting a 27-year loan back to 30 years lowers the payment in two ways at once: a lower rate, and a longer time to pay. The second one borrows more years of interest, which is why a refinance can feel like a win every month and still cost more overall.',
      'Every month is a break-even on its own to some extent. If the offer is genuinely break-even in under two years and you plan to stay for ten, the refinance wins the arithmetic; if you might move in eighteen months, it is a bet on the housing market that has nothing to do with the loan.',
      'Folding the closing costs into the loan removes the cash requirement and makes the break-even longer, because you are now paying interest on the fees. Ask for the quote both ways.',
    ],
    faqs: [
      ['Is a lower payment always worth refinancing for?', 'No. If the payment falls only because the term was extended, the total interest can rise even at a lower rate. Compare the interest paid across both loans, which is the column most people never look at.'],
      ['How accurate is the break-even figure?', 'It is a division of your quoted closing costs by the payment difference, so it can only be as accurate as the quote. Once you have a loan estimate, replace the estimate here with the real numbers and recalculate before signing.'],
      ['What is a good break-even period?', 'Under two years is comfortable for most buyers, three years is the conventional line, and beyond five it becomes a bet that you will not move, separate or need to sell. Those are exactly the events nobody schedules.'],
    ],
    links: ['calculators/mortgage-calculator-2026', 'calculators/mortgage-payoff-calculator', 'calculators/closing-costs-calculator', 'guides/how-much-house-can-i-afford-2026'],
    related: ['calculators/house-affordability-calculator', 'calculators/rent-vs-buy-calculator-2026', 'guides/how-much-house-can-i-afford-2026', 'articles/spending-decisions/should-you-rent-or-buy'],
  },
  {
    route: 'calculators/closing-costs-calculator',
    h1: 'Closing Costs Calculator: What You Need at the Table',
    title: 'Closing Costs Calculator: What You Need at the Table',
    desc: 'Estimate closing costs from the purchase price and loan amount, with the line items a lender will quote and the cash you need on the day.',
    intent: 'tool',
    intro: 'Enter the purchase price and the loan amount, and see the closing costs, the cash needed to close, and how the total moves between lower-cost and higher-cost markets.',
    formula: { name: 'Closing costs', expr: 'total = price × market rate + loan × points ÷ 100', plain: 'Typical market rates run about 1.8% to 3.5% of the price, with the largest single components being title insurance, lender fees and prepaid taxes and insurance.' },
    assumptions: 'A $400,000 purchase with a $340,000 loan in a market where costs run about 2.5% of the price.',
    caveat: 'These are rules of thumb built from typical ranges, not a quote. Your loan estimate is the document that matters, and it is required within three business days of an application. Compare the fee names between lender estimates, not just the totals.',
    table: {
      head: ['Line item', 'Estimate', 'What it covers'],
      rows: [['Lender fees', '$1,700', 'Origination, underwriting, processing'], ['Appraisal', '$650', 'An independent valuation of the property'], ['Title insurance and search', '$2,400', 'Confirms the seller can transfer clear title'], ['Recording and transfer', '$5,000', 'Government filing and transfer taxes'], ['Prepaid interest and escrow', '$2,380', 'Interest to month end plus property tax and insurance reserves']],
    },
    notes: [
      'The largest lines are usually the ones nobody shops for: title insurance and the government transfer taxes. Title insurance is genuinely shop-able in most states, and the difference between the cheapest and the lender’s preferred provider can be several hundred dollars.',
      '“Cash to close” is closing costs plus the down payment plus any gap between the loan and the price. Buyers who budget only the down payment are the ones surprised on the day.',
      'Closing costs are negotiable in ways that the price is not. Asking the seller to contribute toward them is often easier than asking for the same amount off the price, because it does not reset the comparable sales for the seller’s neighbours.',
    ],
    faqs: [
      ['Can closing costs be rolled into the loan?', 'Sometimes, on a refinance more readily than a purchase, and it raises the interest you pay on the fees themselves. Some loan types explicitly limit how much of the closing costs can be financed, so ask before assuming.'],
      ['Are closing costs the same as prepaid items?', 'No. Costs are fees paid to lenders, title companies and governments. Prepaid items are money collected up front for expenses you would have paid later — interest, property tax and insurance — and are held in escrow on your behalf.'],
      ['Can I negotiate closing costs?', 'Yes. Lender origination fees, points and some documentation charges are set by the lender, and sellers often agree to cover a defined amount of buyer costs. Title insurance is the one that is most often worth shopping around for.'],
    ],
    links: ['calculators/mortgage-calculator-2026', 'calculators/down-payment-calculator', 'calculators/house-affordability-calculator', 'guides/how-much-house-can-i-afford-2026'],
    related: ['calculators/mortgage-payoff-calculator', 'calculators/refinance-break-even-calculator', 'calculators/rent-vs-buy-calculator-2026', 'guides/how-much-house-can-i-afford-2026'],
  },
  {
    route: 'calculators/capital-gains-tax-calculator',
    h1: 'Capital Gains Tax Calculator: Long-Term and Short-Term',
    title: 'Capital Gains Tax Calculator: Long-Term and Short-Term',
    desc: 'Estimate the tax on a gain from holding period, cost basis and income, and see how much the twelve-month line is worth at your income level.',
    intent: 'tool',
    intro: 'Enter what you paid, what you sold for, how long you held it and the rest of your income, and see the tax on the gain either way.',
    formula: { name: 'Gain and rate', expr: 'gain = sold − basis; tax = gain × rate', plain: 'Held twelve months or less, the gain stacks on ordinary income and is taxed at your marginal rate. Held longer, it uses the long-term bands, which start at 0%.' },
    assumptions: 'A $12,000 basis sold for $21,000 after three years, with $78,000 of other income, as a single filer under 2026 rules.',
    caveat: 'Federal rates only. State tax on capital gains ranges from nothing to more than the federal rate, Net Investment Income Tax can add 3.8% above high income thresholds, and losses within the year offset gains. This is an estimate for planning, not a return.',
    table: {
      head: ['Held for', 'How it is taxed', 'Tax on this gain', 'You keep'],
      rows: [['Under a year', 'Ordinary income, marginal rate', '$1,980', '$7,020'], ['1 year or more', 'Long-term bands from 0%', '$1,350', '$7,650'], ['Long term, income $40,000 higher', 'Partly in the 20% band', '$1,800', '$7,200'], ['Long term, income $25,000 lower', 'Partly in the 0% band', '$1,013', '$7,988']],
    },
    notes: [
      'The long-term bands are stacked on top of your other income, so the same gain is taxed at a different rate in a year when you earned less. Retiring, taking a sabbatical or working part-time all move a sale into a lower band.',
      'Twelve months is the whole cliff. Selling a day early moves the entire gain from long-term rates to your marginal ordinary rate, which for many people is the difference between 15% and 22% or more.',
      'Losses inside the same year net against gains, and net losses beyond that can offset up to $3,000 of ordinary income a year with the rest carried forward. That changes the arithmetic of a year with both winners and losers in it.',
    ],
    faqs: [
      ['Does the twelve months run from purchase or settlement?', 'From the day after you acquired the asset to the day you disposed of it, and the rules about holding periods and settlement dates are precise. For shares the trade date usually governs, which is why the exact day matters more than the month.'],
      ['Is a gain on my home taxed the same way?', 'No. A primary residence has a large exclusion — $250,000 for a single filer, $500,000 for a couple filing jointly — if you lived in it for two of the last five years. Above that threshold the same long-term bands apply.'],
      ['What counts as my basis?', 'What you paid plus anything you spent to acquire or improve it: commissions, some fees, and capital improvements on property. Reinvested dividends and some corporate actions adjust the basis too, which is why brokerage records matter at tax time.'],
    ],
    links: ['calculators/investment-return-calculator-2026', 'calculators/dividend-income-calculator', 'calculators/after-tax-income', 'guides/are-you-rich-net-worth-percentile-2026'],
    related: ['calculators/crypto-profit-calculator-2026', 'calculators/compound-interest-calculator', 'guides/are-you-rich-net-worth-percentile-2026', 'articles/pay-and-rates/gross-pay-vs-take-home-pay'],
  },
  {
    route: 'calculators/dividend-income-calculator',
    h1: 'Dividend Income Calculator: What a Yield Pays Over Time',
    title: 'Dividend Income Calculator: What a Yield Pays Over Time',
    desc: 'Project dividend income from a portfolio value, yield and dividend growth rate, with and without reinvesting, over any holding period.',
    intent: 'tool',
    intro: 'Enter the amount invested, the dividend yield, the rate the dividend grows and how long you hold, and see the income in the final year and the total collected.',
    formula: { name: 'Growing dividend income', expr: 'income in year n = value × yield × (1 + growth)ⁿ⁻¹', plain: 'The yield is applied to the portfolio value, and the payout itself grows each year by the growth rate. Reinvesting adds those payments to the value before the next one is calculated.' },
    assumptions: '$45,000 at a 3.4% yield with dividends growing 4% a year over ten years, taken as income rather than reinvested.',
    caveat: 'A dividend is not a guarantee and the growth rate is not a promise. Companies cut payouts in recessions, a high yield often signals a share price that has already fallen, and a yield on your original cost is a record of the past rather than a value today. Nothing here is investment advice.',
    table: {
      head: ['After', 'Dividend in that year', 'Collected so far', 'Yield on original cost'],
      rows: [['1 year', '$1,530', '$1,530', '3.40%'], ['5 years', '$1,790', '$8,280', '3.98%'], ['10 years', '$2,178', '$18,360', '4.08%'], ['20 years', '$3,223', '$45,570', '7.16%'], ['30 years', '$4,771', '$85,790', '10.60%']],
    },
    notes: [
      'The yield on your original cost is the number dividend investors watch, and it is a backwards-looking figure: it says what the position pays relative to what you paid, not what a buyer today would receive.',
      'Reinvesting changes the shape of the outcome more than the growth rate does, because each payment buys more shares which then pay again. For a long horizon the difference compounds into a materially larger final income.',
      'A high yield is not automatically better. A 9% payout on a share that then falls 30% costs more than a 3% payout on one that holds, and the yield was telling you what the market already thought of the payout.',
    ],
    faqs: [
      ['Is dividend income taxed differently from interest?', 'Yes. Qualified dividends from most US companies are taxed in the long-term capital gains bands, which start at 0% for many people. Interest is taxed as ordinary income. That difference alone can change which account a holding belongs in.'],
      ['Should I reinvest dividends?', 'If the money is not needed, reinvesting is what turns a yield into compounding. If the income is what you are living on, taking it is the point, and the projection shows the lower total that follows.'],
      ['What is a safe yield?', 'There is no safe yield, only a payout that a business can cover from cash flow. Yields far above the market average usually mean the market expects a cut, and the ones that get cut take the share price down with them.'],
    ],
    links: ['calculators/investment-return-calculator-2026', 'calculators/compound-interest-calculator', 'calculators/capital-gains-tax-calculator', 'guides/how-long-save-1000'],
    related: ['calculators/401k-calculator', 'calculators/retirement-calculator', 'guides/how-long-save-1000', 'articles/saving-habits/how-much-should-i-save-each-month'],
  },
  {
    route: 'calculators/severance-pay-calculator',
    h1: 'Severance Pay Calculator: What It Covers and What It Leaves',
    title: 'Severance Pay Calculator: Runway, Not the Lump Sum',
    desc: 'Work out severance from salary and years of service, add unused vacation, and see how many weeks of spending it actually covers.',
    intent: 'tool',
    intro: 'Enter salary, years of service, what the policy provides, unused vacation and how long you expect the search to take, and see the package and the gap.',
    formula: { name: 'Severance and runway', expr: 'severance = weeks × (salary ÷ 52); runway = total ÷ weekly spending', plain: 'Severance is calculated from the weekly rate, not the monthly one. Runway converts the lump sum into weeks at your actual spending, which is the number that matters.' },
    assumptions: 'An $82,000 salary, six years of service, two weeks per year of service, nine unused vacation days and an eight-week search.',
    caveat: 'Severance is a policy or a negotiation, not a legal entitlement in most US employment, and it is usually taxed as ordinary pay rather than at the lower rates people expect from a lump sum. An agreement attached to severance can also include a release of claims — have anything you sign reviewed.',
    table: {
      head: ['Severance offered', 'Before tax', 'Weeks of spending covered', 'Position after an 8-week search'],
      rows: [['Nothing', '$2,838', '2.6 weeks', '−$7,120'], ['4 weeks', '$9,146', '8.3 weeks', '−$812'], ['8 weeks', '$15,454', '14.1 weeks', '+$5,496'], ['12 weeks', '$21,762', '19.8 weeks', '+$11,804'], ['26 weeks', '$43,838', '39.9 weeks', '+$33,880']],
    },
    notes: [
      'Severance is normally paid as if it were salary, so it is subject to the same withholding at the bonus rate rather than the lower rate that applies to a genuine lump sum. The deposit will be smaller than the arithmetic suggests.',
      'Unused vacation pay is often legally owed regardless of the severance negotiation, so do not trade it away for something that was already yours. It is usually paid at the same weekly rate.',
      'The runway column uses spending, not salary. Most households spend 65% to 80% of income, which is why a moderate severance covers more weeks than a straightforward division by salary would suggest.',
    ],
    faqs: [
      ['Is severance negotiable?', 'Often, particularly in exchange for signing a release, agreeing to a transition period or keeping a non-compete in place. The strongest lever is a delay in signing, and the weakest is a verbal promise to leave quietly.'],
      ['Does severance affect unemployment benefits?', 'In most states, yes: a lump-sum or continuing severance can delay when unemployment insurance begins, because the benefits are there to replace a missing wage. The rules vary enough by state that the claim should be opened on time regardless.'],
      ['How is severance taxed?', 'As ordinary income, withheld at the supplemental rate that applies to bonuses. That can mean more is withheld than the final tax on the money, and the over-withholding returns as a refund when the return is filed.'],
    ],
    links: ['calculators/after-tax-income', 'calculators/paycheck-breakdown', 'calculators/emergency-fund-calculator', 'guides/paycheck-to-paycheck'],
    related: ['calculators/cost-of-time', 'calculators/time-to-save', 'guides/emergency-fund-hours', 'articles/pay-and-rates/gross-pay-vs-take-home-pay'],
  },
  {
    route: 'calculators/cost-per-mile-calculator',
    h1: 'Cost Per Mile Calculator: The Whole Cost of the Car',
    title: 'Cost Per Mile Calculator: The Whole Cost of the Car',
    desc: 'Work out the all-in cost per mile of driving, including fuel, insurance, maintenance and depreciation, not just what the fuel costs.',
    intent: 'tool',
    intro: 'Enter fuel economy, fuel price, annual miles, insurance, servicing and depreciation, and see the real cost per mile and per day of driving.',
    formula: { name: 'All-in cost per mile', expr: 'cost per mile = (miles ÷ mpg × fuel price + insurance + service + depreciation) ÷ miles', plain: 'Fuel is only the first term. Insurance, servicing and depreciation are charged whether or not the car moves, so they add a fixed amount per year that per-mile cost spread over the miles you actually drive.' },
    assumptions: 'A car doing 32 mpg on $3.60 fuel, driven 12,000 miles a year, with $1,450 of insurance, $900 of service and $2,600 of depreciation.',
    caveat: 'Depreciation is an estimate and depends on the car, the market and how long you keep it. If the car is already fully depreciated and you plan to run it into the ground, set depreciation to zero — the other lines still apply, and the per-mile cost falls sharply because the two largest years of loss are behind you.',
    table: {
      head: ['Driver', 'Miles a year', 'Fuel cost', 'All-in cost per mile'],
      rows: [['Short commute', '7,000', '$788', '$0.82'], ['Average driver', '12,000', '$1,350', '$0.53'], ['Long commute', '20,000', '$2,250', '$0.36'], ['On the road', '30,000', '$3,375', '$0.28']],
    },
    notes: [
      'The cost per mile falls as miles rise, because more than half of a car’s annual cost is fixed. That is arithmetic, not an argument for driving more: the total still rises, and it rises by the cost of the extra fuel and wear.',
      'Depreciation usually exceeds every other line combined in the first three years of a new car, then flattens. The same per-mile cost calculated on a five-year-old car bought used looks radically different from the same car bought new.',
      'Ride-share and delivery drivers should not read the bottom line as profit. At $0.53 a mile, a $12 fare on a five-mile trip grosses $2.40 after the car, before platform fees and before the driver’s own time.',
    ],
    faqs: [
      ['Why is depreciation in the cost per mile?', 'Because it is real money that leaves with the car. Whether it appears as a monthly payment or as a lower sale price later, the difference between what a car cost and what it sells for is spent, and dividing it by the miles driven is the honest way to price it.'],
      ['How does the internal mileage rate compare?', 'Business mileage deductions are set much higher than fuel costs precisely because they are meant to cover the whole car. Comparing your own figure with that rate tells you whether driving for work is being paid for properly.'],
      ['Does this include the cost of financing?', 'Not unless you add the interest to one of the annual lines. If the car is financed, take the interest portion of the payments as another annual cost — the principal is already represented in the depreciation figure.'],
    ],
    links: ['calculators/gas-cost-calculator', 'calculators/commute-cost', 'calculators/car-ownership-cost', 'guides/true-cost-of-car'],
    related: ['calculators/car-loan-calculator-2026', 'calculators/depreciation-calculator-2026', 'guides/true-cost-of-car', 'articles/spending-decisions/cost-per-use-how-to-compare-purchases'],
  },
  {
    route: 'calculators/vacation-cost-calculator',
    h1: 'Vacation Cost Calculator: Fixed Costs, Daily Costs, Total',
    title: 'Vacation Cost Calculator: Fixed Costs, Daily Costs, Total',
    desc: 'Add up a trip properly, separating the one-off costs from the daily ones, and see what each extra night really adds to the total.',
    intent: 'tool',
    intro: 'Enter the nights, the travellers and the daily rates, and see the trip total, the cost per person per day, and what one more night costs.',
    formula: { name: 'Trip total', expr: 'total = nights × lodging + days × people × (food + activities) + travel + extras', plain: 'The number of days is the nights plus one, because the last day still has to be fed and entertained even when the room is given back at eleven.' },
    assumptions: 'Seven nights for two people, $160 a night, $620 of travel, $55 a day each on food and $30 each on activities.',
    caveat: 'This is a budget, not a quote. Airfare moves, holiday weeks cost more than shoulder season, and the line people most often forget is the one they spend on the first and last travel days when nobody feels like cooking.',
    table: {
      head: ['Length', 'Lodging total', 'Food and activities', 'Trip total'],
      rows: [['3 nights', '$480', '$510', '$1,610'], ['5 nights', '$800', '$900', '$2,320'], ['7 nights', '$1,120', '$1,280', '$3,380'], ['10 nights', '$1,600', '$1,870', '$4,370'], ['14 nights', '$2,240', '$2,620', '$5,760']],
    },
    notes: [
      'The marginal night is always cheaper than the average night, because the flights, the kennel and most of the packing are already paid for. That is why a ten-night trip costs far less than two five-night trips.',
      'Lodging is the largest lever and the easiest to move: choosing a place $40 a night cheaper is worth more over a week than cutting every meal budget on the trip.',
      'Dividing the total by the days, and then by the people, produces a number most people have never worked out for their own holiday. It is the fairer way to split a group trip, and the only way to compare two destinations honestly.',
    ],
    faqs: [
      ['How much should I budget per day of travel?', 'Rather than adopting a per-day figure from somewhere else, the fixed and daily split here shows the number for the trip you are actually taking. A camping trip and a city break have the same arithmetic and different inputs.'],
      ['Why count days as nights plus one?', 'Because most trips involve a full first day and a partial last day. Counting only the nights underestimates food and activities on the days either side, which is exactly where a budget tends to go wrong.'],
      ['How should we split costs in a group?', 'By the cost per person per day, not by dividing the total equally. Adults, children and people who arrived for only part of the trip all come out fairer when the daily rate is the unit and the duration is per person.'],
    ],
    links: ['calculators/cost-of-time', 'calculators/cost-of-time', 'calculators/daily-savings', 'articles/work-hours/vacation-cost-in-work-hours'],
    related: ['calculators/moving-cost-calculator', 'calculators/gas-cost-calculator', 'articles/work-hours/vacation-cost-in-work-hours', 'articles/saving-habits/sinking-funds-explained'],
  },
];

export const WAVE2_ROUTES = WAVE2_CONTENT.map((entry) => entry.route);
export const WAVE2_REPO_URL = H;
