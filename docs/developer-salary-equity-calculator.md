# Developer Salary, RSU Equity & 1099 Contractor Rate Guide (2026)

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](../LICENSE)
[![Worth Tools](https://img.shields.io/badge/Worth-Salary%20Tools-blue)](https://github.com/njohn931d-dotcom/bbbh)
[![Live Site](https://img.shields.io/badge/Live-Calculators-brightgreen)](https://njohn931d-dotcom.github.io/bbbh/)

A mathematical guide for software engineers, engineering managers, and technical freelancers evaluating Total Compensation (TC), equity packages (RSUs vs Stock Options), and W2 employee vs 1099 contractor rate parity.

---

## 📑 Table of Contents

1. [Total Compensation (TC) Formula](#1-total-compensation-tc-formula)
2. [Salary to Hourly Wage Conversion Tables](#2-salary-to-hourly-wage-conversion-tables)
3. [The W2 Employee vs 1099 Contractor Parity Formula](#3-the-w2-employee-vs-1099-contractor-parity-formula)
4. [Startup Stock Options vs Public Tech RSUs](#4-startup-stock-options-vs-public-tech-rsus)
5. [Overtime Pay Calculation & Non-Exempt Tech Roles](#5-overtime-pay-calculation--non-exempt-tech-roles)
6. [Interactive Calculation Links](#6-interactive-calculation-links)
7. [Frequently Asked Questions (PAA)](#7-frequently-asked-questions)

---

## 1. Total Compensation (TC) Formula

In technology compensation packages, base salary is often less than half of total realized pay:

$$\text{Total Compensation (TC)} = \text{Base Salary} + \text{Annual Target Bonus} + \left( \frac{\text{Total RSU Grant Value}}{4 \text{ Year Vest}} \right) + \text{Signing Bonus}$$

### Worked Example: Senior Software Engineer (L5 / IC3)
- Base Salary: **$185,000**
- Performance Bonus (15% target): **$27,750**
- 4-Year RSU Grant: **$400,000** ($100,000 / year vesting)
- 401(k) Employer Match (50% up to 6%): **$5,550**
- **First-Year Total Compensation:** $\$185,000 + \$27,750 + \$100,000 + \$5,550 = \mathbf{\$318,300}$.

---

## 2. Salary to Hourly Wage Conversion Tables

Based on the standard 2,080 working hours per year (40 hours/week × 52 weeks):

$$\text{Gross Hourly Wage} = \frac{\text{Annual Salary}}{2,080}$$

| Annual Salary | Gross Hourly Rate | Gross Bi-Weekly (80 hrs) | Estimated After-Tax Hourly (25% effective) |
|---|---|---|---|
| **$75,000** | **$36.06 / hr** | $2,884.62 | $27.05 / hr |
| **$100,000** | **$48.08 / hr** | $3,846.15 | $36.06 / hr |
| **$125,000** | **$60.10 / hr** | $4,807.69 | $45.08 / hr |
| **$150,000** | **$72.12 / hr** | $5,769.23 | $54.09 / hr |
| **$175,000** | **$84.13 / hr** | $6,730.77 | $63.10 / hr |
| **$200,000** | **$96.15 / hr** | $7,692.31 | $72.11 / hr |
| **$250,000** | **$120.19 / hr** | $9,615.38 | $90.14 / hr |
| **$300,000** | **$144.23 / hr** | $11,538.46 | $108.17 / hr |
| **$400,000** | **$192.31 / hr** | $15,384.62 | $144.23 / hr |

Calculate your exact salary breakdown at:
- 💵 [Salary to Hourly Calculator](https://njohn931d-dotcom.github.io/bbbh/calculators/salary-to-hourly/)
- 💰 [Paycheck Take-Home Pay Calculator](https://njohn931d-dotcom.github.io/bbbh/calculators/paycheck-calculator-2026/)

---

## 3. The W2 Employee vs 1099 Contractor Parity Formula

Contractors frequently undercharge by converting a W2 salary directly to an hourly rate. A 1099 contractor must personally absorb:
1. **Self-Employment Tax:** Additional 7.65% (FICA employer half).
2. **Unpaid Time Off:** 3–4 weeks vacation/holidays + sick days (~160 to 200 hours).
3. **Health, Dental & Vision Insurance:** ~$600 to $1,400/month.
4. **Unbillable Overhead:** Administrative, accounting, marketing, tooling (~25% of working time).

### The Golden Contractor Multiplier Formula

$$\text{1099 Minimum Hourly Rate} = \frac{\text{Target W2 Salary} \times 1.35}{\text{Actual Billable Hours per Year (typically 1,500 to 1,600 hrs)}}$$

*Worked Example:*
To match a **$150,000 W2 salary**:
- Baseline with benefits & taxes (1.35x): **$202,500**
- Divided by 1,500 realistic billable hours:
- $\text{Required 1099 Rate} = \frac{\$202,500}{1,500} = \mathbf{\$135.00 / \text{hr}}$.
*(Charging only the base $150k / 2,080 = $72.12/hr results in a ~45% real pay cut!)*

Run the math directly with our [Freelance Rate Calculator](https://njohn931d-dotcom.github.io/bbbh/calculators/freelance-rate/).

---

## 4. Startup Stock Options vs Public Tech RSUs

| Feature | Restricted Stock Units (RSUs) | Incentive Stock Options (ISOs) |
|---|---|---|
| **Typical Issuer** | Public Tech (Apple, Google, Microsoft, Meta) | Early to Growth Stage Startups (Series Seed - D) |
| **Upfront Purchase Cost** | **$0** (Granted as direct stock shares upon vesting) | Strike price required to exercise shares |
| **Liquidity** | Immediate cashout on public exchanges | Illiquid until IPO or secondary tender offer |
| **Tax Event at Vesting** | Ordinary income tax withheld immediately | No tax at vest; potential Alternative Minimum Tax (AMT) at exercise |
| **Downside Risk** | Stock value may drop, but never drops below $0 | Option can become completely underwater (worthless) |

---

## 5. Overtime Pay Calculation & Non-Exempt Tech Roles

Under FLSA (Fair Labor Standards Act), non-exempt developers, QA engineers, and technical support staff working over 40 hours in a workweek must receive overtime:

$$\text{Overtime Hourly Rate} = \text{Regular Hourly Rate} \times 1.5$$

For an engineer with a regular rate of **$45.00/hr**:
- Overtime rate: $45 \times 1.5 = \mathbf{\$67.50 / \text{hr}}$.
- 10 overtime hours in a week: $10 \times \$67.50 = \mathbf{\$675.00}$ gross overtime bonus.

Try the free [Overtime Pay Calculator](https://njohn931d-dotcom.github.io/bbbh/calculators/overtime-pay/).

---

## 6. Interactive Calculation Links

- 💼 [Salary to Hourly Converter](https://njohn931d-dotcom.github.io/bbbh/calculators/salary-to-hourly/)
- 🕒 [Hourly to Salary Converter](https://njohn931d-dotcom.github.io/bbbh/calculators/hourly-to-salary/)
- 🚀 [Freelance & Contractor Rate Calculator](https://njohn931d-dotcom.github.io/bbbh/calculators/freelance-rate/)
- ⏱️ [True Cost of Time Calculator](https://njohn931d-dotcom.github.io/bbbh/calculators/cost-of-time/)
- 💳 [Paycheck Breakdown Calculator](https://njohn931d-dotcom.github.io/bbbh/calculators/paycheck-breakdown/)

---

## 7. Frequently Asked Questions

### Why do tech companies prefer RSUs over cash bonuses?
RSUs align engineer retention with shareholder interests. RSUs typically vest over four years (e.g., 25% each year or back-weighted), creating strong economic incentives for engineers to remain with the company while conserving operational cash flow.

### How are RSUs taxed when they vest?
Upon vesting, RSUs are treated as ordinary supplemental wage income. Employers automatically withhold shares (typically 22% federal plus state and FICA) to cover income taxes, depositing the remaining net shares into the employee's brokerage account.

### Where can I find more open-source financial calculators?
Explore all tools on [Worth Finance](https://njohn931d-dotcom.github.io/bbbh/) and view the repository at [github.com/njohn931d-dotcom/bbbh](https://github.com/njohn931d-dotcom/bbbh).
