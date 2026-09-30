/**
 * Small, honest US federal tax estimator used for worked examples.
 *
 * Scope is deliberately narrow and stated on every page that uses it:
 *  - tax year 2026, single filer, standard deduction, wages only;
 *  - federal income tax + employee FICA; no state or local tax, no credits,
 *    no pre-tax deductions, no other income.
 *
 * Figures: IRS Rev. Proc. 2025-32 (2026 brackets and standard deduction) and
 * the SSA 2026 contribution and benefit base. Check them against irs.gov before
 * relying on any output for a real filing.
 */

export const TAX_YEAR = 2026;
export const STANDARD_DEDUCTION_SINGLE = 16100;

/** [upper bound of the bracket, marginal rate] for a single filer. */
export const BRACKETS_SINGLE = [
  [12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [256225, 0.32], [640600, 0.35], [Infinity, 0.37],
];

export const SS_WAGE_BASE = 184500;
export const SS_RATE = 0.062;
export const MEDICARE_RATE = 0.0145;
export const ADDITIONAL_MEDICARE_RATE = 0.009;
export const ADDITIONAL_MEDICARE_THRESHOLD = 200000;

/** Overtime deduction, tax years 2025-2028 (One Big Beautiful Bill Act). */
export const OVERTIME_DEDUCTION = { maxSingle: 12500, maxJoint: 25000, phaseOutSingle: 150000, phaseOutJoint: 300000, reducePerThousand: 100 };

export const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;

export function taxableIncome(gross, extraDeduction = 0) {
  return Math.max(0, gross - STANDARD_DEDUCTION_SINGLE - extraDeduction);
}

/** Federal income tax on taxable income for a single filer. */
export function bracketTax(taxable) {
  let tax = 0; let lower = 0;
  for (const [upper, rate] of BRACKETS_SINGLE) {
    if (taxable > lower) tax += (Math.min(taxable, upper) - lower) * rate;
    lower = upper;
  }
  return round2(tax);
}

/** Marginal federal rate that applies to the next dollar of wages. */
export function marginalRate(gross, extraDeduction = 0) {
  const t = taxableIncome(gross, extraDeduction);
  for (const [upper, rate] of BRACKETS_SINGLE) if (t <= upper) return rate;
  return 0.37;
}

export function fica(gross) {
  const ss = Math.min(gross, SS_WAGE_BASE) * SS_RATE;
  const medicare = gross * MEDICARE_RATE + Math.max(0, gross - ADDITIONAL_MEDICARE_THRESHOLD) * ADDITIONAL_MEDICARE_RATE;
  return round2(ss + medicare);
}

/** Wages only, single filer, standard deduction. */
export function estimateTakeHome(gross, extraDeduction = 0) {
  const federal = bracketTax(taxableIncome(gross, extraDeduction));
  const payroll = fica(gross);
  return { gross, federal, fica: payroll, net: round2(gross - federal - payroll), marginal: marginalRate(gross, extraDeduction) };
}

/**
 * Qualified overtime compensation is only the premium half of time-and-a-half
 * (the part above the regular rate), for overtime that the FLSA requires.
 * @returns {{premium:number, deduction:number, taxSaved:number, phasedOut:boolean}}
 */
export function overtimeDeduction({ regularRate, overtimeHours, otherWages = 0, filing = 'single' }) {
  const d = OVERTIME_DEDUCTION;
  const premium = round2(regularRate * 0.5 * overtimeHours);
  const cap = filing === 'joint' ? d.maxJoint : d.maxSingle;
  const floor = filing === 'joint' ? d.phaseOutJoint : d.phaseOutSingle;
  const gross = otherWages + regularRate * 1.5 * overtimeHours;
  const reduction = Math.max(0, Math.ceil((gross - floor) / 1000)) * d.reducePerThousand;
  const deduction = Math.max(0, Math.min(premium, cap) - reduction);
  const before = estimateTakeHome(gross).federal;
  const after = estimateTakeHome(gross, deduction).federal;
  return { premium, deduction: round2(deduction), taxSaved: round2(before - after), phasedOut: reduction > 0 };
}

// ---- plain pay conversion ----------------------------------------------------

export const HOURS_PER_YEAR = 2080; // 40 h x 52 weeks

export const hourlyToAnnual = (rate, hoursPerWeek = 40, weeks = 52) => round2(rate * hoursPerWeek * weeks);
export const annualToHourly = (salary, hoursPerWeek = 40, weeks = 52) => round2(salary / (hoursPerWeek * weeks));
/** Hours of work a price costs at a given hourly take-home rate. */
export const hoursFor = (price, hourlyTakeHome) => price / hourlyTakeHome;
