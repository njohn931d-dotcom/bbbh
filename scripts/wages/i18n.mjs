// Wage & salary conversion cluster — per-locale content definitions.
// Every locale uses its own real-world payroll conventions (weekly hours,
// monthly divisor, minimum-wage / median anchors, rough effective tax),
// because copy-pasted US math is what gets programmatic pages ignored.

const money = (locale, currency, opts = {}) => (n) => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency', currency,
      maximumFractionDigits: opts.dec ?? 0,
      minimumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${Math.round(n)}`;
  }
};

// ─────────────────────────────── ENGLISH (US) ───────────────────────────────
const en = {
  code: 'en', htmlLang: 'en', currency: 'USD', numberLocale: 'en-US',
  hours: { year: 2080, month: 173.33, week: 40, day: 8, note: '40 hours a week × 52 weeks = 2,080 paid hours a year' },
  labels: { hour: 'Per hour', day: 'Per day (8 h)', week: 'Per week', biweek: 'Every two weeks', month: 'Per month', quarter: 'Per quarter', year: 'Per year' },
  sec: { answer: 'Quick answer', table: 'Full conversion table', tax: 'After-tax estimate (2026)', compare: 'Is it good pay?', method: 'How the math works', faq: 'Frequently asked questions' },
  eff: null, // EN/ES use the real 2026 US federal estimate instead of a flat rate
  pages: {
    hourly: [7.25, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 32, 33, 34, 35, 36, 38, 40, 42, 44, 45, 48, 50, 52, 55, 58, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120, 125, 150],
    annual: [18000, 20000, 22000, 24000, 25000, 26000, 28000, 30000, 32000, 34000, 35000, 36000, 38000, 40000, 42000, 44000, 45000, 46000, 48000, 50000, 52000, 54000, 55000, 58000, 60000, 62000, 65000, 68000, 70000, 72000, 75000, 78000, 80000, 85000, 90000, 95000, 100000, 105000, 110000, 115000, 120000, 125000, 130000, 140000, 150000, 160000, 175000, 180000, 200000, 250000],
  },
  slugFor(kind, v) {
    if (kind === 'hourly') return `${String(v).replace('.', '-')}-an-hour-is-how-much-a-year`;
    return `${v}-a-year-is-how-much-an-hour`;
  },
  hub: {
    slug: 'wages', h1: 'Wage conversion tables: hourly to salary and back (2026)',
    title: 'Wage Conversion Tables: “X an Hour Is How Much a Year?” (2026) | Worth',
    desc: 'Every “how much is $X an hour a year” conversion in one place: hourly to annual, annual to hourly, after-tax tables for 2026, and the hours-of-your-life view.',
    intro: 'One question, a thousand phrasings: what does this wage really pay? Pick your number — every page shows the full-time math, the after-tax estimate and the time perspective no other calculator gives you.',
    compareHead: 'The 10 most-searched conversions',
  },
  copy: {
    title(c) { return c.kind === 'hourly'
      ? `$${c.v} an Hour Is How Much a Year? 2026 Salary + Tax Table`
      : `$${c.num(c.v)} a Year Is How Much an Hour? 2026 Before & After Tax`; },
    desc(c) { return c.kind === 'hourly'
      ? `$${c.v} an hour is ${c.money(c.gross.year)} a year before tax (40 h/week). See day, week, month, 2026 after-tax take-home, and what it means in work hours.`
      : `$${c.num(c.v)} a year is ${c.money(c.gross.hour)} an hour before tax (2,080 hours). Full 2026 table: month, week, day, after-tax take-home, and the hours behind the number.`; },
    h1(c) { return c.kind === 'hourly'
      ? `$${c.v} an hour is how much a year?`
      : `$${c.num(c.v)} a year is how much an hour?`; },
    answer(c) {
      if (c.kind === 'hourly') return `<strong>$${c.v} an hour is ${c.money(c.gross.year)} per year</strong> before tax — a full-time schedule of 40 hours a week for 52 weeks (${c.num(2080)} hours). That is ${c.money(c.gross.week)} a week, ${c.money(c.gross.biweek)} every two weeks, or ${c.money(c.gross.month)} a month. After federal income tax and FICA, a single filer keeps roughly ${c.money(c.net.year)}, about ${c.money(c.net.hour)} per working hour.`;
      return `<strong>$${c.num(c.v)} a year is ${c.money(c.gross.hour)} an hour</strong> before tax, using the standard 2,080-hour work year (40 hours × 52 weeks). That is ${c.money(c.gross.month)} a month, ${c.money(c.gross.week)} a week and ${c.money(c.gross.day)} a day. After federal income tax and FICA, a single filer keeps about ${c.money(c.net.year)} — roughly ${c.money(c.net.hour)} of take-home per working hour.`;
    },
    compare(c) {
      const mult = (c.v / 7.25).toFixed(1);
      if (c.kind === 'hourly') return `At $${c.v} an hour you earn <strong>${mult}× the federal minimum wage</strong> ($7.25). For context, the median U.S. full-time wage is roughly $30 an hour (2025), and MIT’s living-wage estimate for a single adult sits near $25 an hour. So $${c.v} an hour ${c.v >= 30 ? 'is above the typical full-time wage' : c.v >= 25 ? 'sits close to what a single adult needs to cover basics' : 'is below the typical full-time wage — every budgeting decision matters more'}.`;
      const hourly = Math.round(c.gross.hour);
      return `A $${c.num(c.v)} salary works out to about $${hourly} an hour. The median U.S. full-time wage is roughly $62,000–$65,000 a year (2025), and the median household income is around $80,000. So $${c.num(c.v)} ${c.v >= 65000 ? 'is around or above the median for a full-time worker' : 'is below the full-time median — common for early-career and part-year roles'}.`;
    },
    timeBlock(c) {
      if (c.kind === 'hourly') return `The Worth view: rent of $1,600 costs <strong>${c.num(Math.round(1600 / c.v))} work hours</strong> a month; a $12,000 used car costs ${c.num(Math.round(12000 / c.v))} hours; a $3,000 vacation, ${c.num(Math.round(3000 / c.v))} hours. Price tags lie less when you read them in hours.`;
      return `The Worth view: this salary is <strong>${c.num(2080)} hours of your year</strong> — 52 full workdays. A $1,600 rent takes ${c.num(Math.round(1600 / c.gross.hour))} hours a month; a $3,000 vacation takes ${c.num(Math.round(3000 / c.gross.hour))} hours. Read every price tag in hours.`;
    },
    taxIntro: 'Rough 2026 estimate for a W-2 employee: federal income tax on the standard deduction, plus 7.65% FICA (Social Security up to the wage base, plus Medicare). State income tax (0%–13%) is not included. Not tax advice.',
    method(c) { return c.kind === 'hourly'
      ? `<strong>Annual = hourly × 2,080.</strong> Forty hours a week across 52 weeks is the standard U.S. full-time year. Monthly pay divides the year by 12 (about 173.33 hours). Working 50 weeks, or 30-hour weeks? Hourly × hours × weeks is the honest formula — our <a href="/calculators/hourly-to-salary/">hourly to salary calculator</a> lets you change the assumptions.`
      : `<strong>Hourly = annual ÷ 2,080.</strong> That is 40 hours a week for 52 weeks. A $${c.num(c.v)} salary divides to ${c.money(c.gross.hour)} an hour. If you work 2,000 hours (two weeks unpaid), the real rate is ${c.money(c.v / 2000)} — run your own numbers in the <a href="/calculators/salary-to-hourly/">salary to hourly calculator</a>.`; },
    faqs(c) {
      if (c.kind === 'hourly') return [
        [`$${c.v} an hour is how much a month?`, `${c.money(c.gross.month)} a month before tax (${c.money(c.gross.year)} ÷ 12). After federal tax and FICA, a single filer keeps roughly ${c.money(c.net.month)}.`],
        [`Is $${c.v} an hour good pay in 2026?`, `It is ${(c.v / 7.25).toFixed(1)}× the $7.25 federal minimum wage. Against the roughly $30/hour median full-time wage, $${c.v} ${c.v >= 30 ? 'is above the median' : 'is somewhat below the median'} — context and location decide the rest.`],
        [`What about part-time hours?`, `At 20 hours a week, $${c.v} an hour is ${c.money(c.v * 20 * 52)} a year; at 30 hours, ${c.money(c.v * 30 * 52)}. The tables here assume 40 hours.`],
        [`Does 2,080 hours include vacation?`, `Only paid vacation. Two unpaid weeks off means 2,000 paid hours — hourly × 2,000 is your real annual figure.`],
      ];
      return [
        [`$${c.num(c.v)} a year is how much an hour?`, `${c.money(c.gross.hour)} an hour before tax (salary ÷ 2,080 hours). Take-home after federal tax and FICA is roughly ${c.money(c.net.hour)} an hour.`],
        [`What is the biweekly paycheck on $${c.num(c.v)}?`, `${c.money(c.gross.year / 26)} gross every two weeks (26 pay periods). Monthly it is ${c.money(c.gross.month)} before tax.`],
        [`Is $${c.num(c.v)} a good salary in 2026?`, `${c.v >= 65000 ? 'It is around or above' : 'It is below'} the U.S. full-time median (roughly $62k–$65k). Local cost of living decides whether it feels good.`],
        [`How much rent does $${c.num(c.v)} support?`, `The 30% rule points to about ${c.money(c.gross.month * 0.3)} a month in rent. Use the <a href="/calculators/cost-of-time/">cost-of-time calculator</a> to see that rent in work hours.`],
      ];
    },
  },
};

// ─────────────────────── ESPAÑOL (hispanos en EE. UU., USD) ───────────────────────
const es = {
  code: 'es', htmlLang: 'es', currency: 'USD', numberLocale: 'es-US',
  hours: { year: 2080, month: 173.33, week: 40, day: 8, note: '40 horas por semana × 52 semanas = 2,080 horas al año' },
  labels: { hour: 'Por hora', day: 'Por día (8 h)', week: 'Por semana', biweek: 'Cada dos semanas', month: 'Por mes', quarter: 'Por trimestre', year: 'Por año' },
  sec: { answer: 'Respuesta rápida', table: 'Tabla de conversión completa', tax: 'Estimación después de impuestos (2026)', compare: '¿Es un buen salario?', method: 'Cómo se hace el cálculo', faq: 'Preguntas frecuentes' },
  eff: null,
  pages: { hourly: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 28, 30, 35, 40], annual: [] },
  slugFor(kind, v) { return `${v}-dolares-la-hora-al-ano`; },
  hub: {
    slug: 'es/salarios', h1: '¿Cuánto son los dólares por hora al año? Tablas 2026',
    title: '¿Cuánto Son $X Dólares la Hora al Año? Tablas 2026 | Worth',
    desc: 'Todas las conversiones de pago por hora a anual en español: cuánto es $15, $20 o $25 la hora al año, con impuestos estimados de 2026 y el valor en horas de trabajo.',
    intro: 'La misma pregunta con mil números: ¿cuánto ganas de verdad por hora? Elige tu tarifa: cada página muestra el cálculo a tiempo completo, el estimado después de impuestos y cuántas horas de tu vida cuestan las cosas.',
    compareHead: 'Las conversiones más buscadas',
  },
  copy: {
    title(c) { return `¿$${c.v} la Hora Cuánto Es al Año? Tabla 2026 Con Impuestos`; },
    desc(c) { return `$${c.v} dólares la hora son ${c.money(c.gross.year)} al año antes de impuestos (40 h/semana). Pago por día, semana y mes, más el neto estimado de 2026.`; },
    h1(c) { return `¿Cuánto son $${c.v} dólares la hora al año?`; },
    answer(c) { return `<strong>$${c.v} la hora son ${c.money(c.gross.year)} al año</strong> antes de impuestos, con jornada completa de 40 horas por semana durante 52 semanas. Equivale a ${c.money(c.gross.week)} semanales o ${c.money(c.gross.month)} mensuales. Tras el impuesto federal y FICA, una persona soltera se queda con unos ${c.money(c.net.year)} al año.`; },
    compare(c) { return `Con $${c.v} la hora ganas <strong>${(c.v / 7.25).toFixed(1)} veces el salario mínimo federal</strong> ($7.25). El salario típico a tiempo completo en EE. UU. ronda los $30 la hora, así que $${c.v} ${c.v >= 30 ? 'está por encima del promedio' : 'queda algo por debajo del promedio'}.`; },
    timeBlock(c) { return `La vista Worth: una renta de $1,600 cuesta <strong>${c.num(Math.round(1600 / c.v))} horas de trabajo</strong> al mes; un carro usado de $12,000, ${c.num(Math.round(12000 / c.v))} horas. Los precios engañan menos cuando se leen en horas.`; },
    taxIntro: 'Estimación aproximada 2026 para empleado en EE. UU.: impuesto federal con la deducción estándar más 7.65% de FICA. No incluye el impuesto estatal (0%–13%). No es asesoría fiscal.',
    method(c) { return `<strong>Anual = tarifa × 2,080.</strong> Cuarenta horas semanales por 52 semanas es el año estándar a tiempo completo. El salario mensual divide el año entre 12 (unas 173.33 horas). Calcula con tus propias horas en la <a href="/calculators/hourly-to-salary/">calculadora de por hora a anual</a>.`; },
    faqs(c) { return [
      [`¿$${c.v} la hora cuánto es al mes?`, `${c.money(c.gross.month)} al mes antes de impuestos (${c.money(c.gross.year)} ÷ 12). Después de impuestos federales, quedan unos ${c.money(c.net.month)}.`],
      [`¿Es bueno ganar $${c.v} la hora?`, `Es ${(c.v / 7.25).toFixed(1)} veces el mínimo federal. Frente al salario típico de unos $30 la hora, $${c.v} ${c.v >= 30 ? 'está arriba' : 'está algo abajo'}; el costo de vida de tu ciudad decide el resto.`],
      [`¿Cuánto es a medio tiempo?`, `A 20 horas semanales: ${c.money(c.v * 20 * 52)} al año; a 30 horas: ${c.money(c.v * 30 * 52)}. Las tablas asumen 40 horas.`],
      [`¿Las 2,080 horas incluyen vacaciones?`, `Solo las vacaciones pagadas. Si pierdes dos semanas sin pago, son 2,000 horas: multiplica tu tarifa por 2,000.`],
    ]; },
  },
};

// ─────────────────────────────── PORTUGUÊS (BR) ───────────────────────────────
const pt = {
  code: 'pt', htmlLang: 'pt-BR', currency: 'BRL', numberLocale: 'pt-BR',
  hours: { year: 2640, month: 220, week: 44, day: 8.8, note: 'Divisor CLT de 220 horas mensais (44 h/semana)' },
  labels: { hour: 'Por hora', day: 'Por dia', week: 'Por semana', biweek: 'Quinzena', month: 'Por mês', quarter: 'Por trimestre', year: 'Por ano' },
  sec: { answer: 'Resposta rápida', table: 'Tabela completa', tax: 'Estimativa líquida (2026)', compare: 'É um bom salário?', method: 'Como o cálculo funciona', faq: 'Perguntas frequentes' },
  eff: (c) => (c.gross.month <= 2500 ? 22 : c.gross.month <= 4000 ? 25 : c.gross.month <= 7000 ? 27 : 30),
  pages: {
    hourly: [12, 15, 18, 20, 25, 30, 35, 40, 50, 60],
    monthly: [1412, 1518, 2000, 2200, 2500, 3000, 3500, 4000, 5000, 7000],
  },
  slugFor(kind, v) { return kind === 'hourly' ? `${v}-reais-por-hora` : `salario-de-${v}-por-mes`; },
  hub: {
    slug: 'pt/salarios', h1: 'Salário por mês dá quanto por hora? Tabelas 2026',
    title: 'Salário por Mês Dá Quanto por Hora? Tabelas 2026 | Worth',
    desc: 'Conversões salário ↔ hora em reais: quanto vale R$ 2.000, R$ 3.000 ou R$ 5.000 por mês na hora, com divisor CLT e estimativa de INSS e IRRF.',
    intro: 'Quanto vale o seu salário na hora? Escolha o valor: cada página traz a conta completa no divisor CLT, o líquido estimado e quantas horas de trabalho cada despesa custa.',
    compareHead: 'As conversões mais buscadas',
  },
  copy: {
    title(c) { return c.kind === 'monthly'
      ? `${c.money(c.v)} por Mês Dá Quanto por Hora? Tabela 2026 CLT`
      : `${c.money(c.v)} por Hora Dá Quanto por Mês? Tabela 2026`; },
    desc(c) { return c.kind === 'monthly'
      ? `Ganhando ${c.money(c.v)} por mês você recebe cerca de ${c.money(c.gross.hour)} por hora (divisor 220 h). Veja semanal, anual e o líquido estimado de INSS e IRRF.`
      : `${c.money(c.v)} por hora equivale a cerca de ${c.money(c.gross.month)} por mês (220 h CLT) e ${c.money(c.gross.year)} por ano. Tabela completa e líquido estimado de 2026.`; },
    h1(c) { return c.kind === 'monthly'
      ? `Salário de ${c.money(c.v)} por mês dá quanto por hora?`
      : `Quanto é ${c.money(c.v)} por hora em salário mensal?`; },
    answer(c) { return c.kind === 'monthly'
      ? `<strong>Ganhando ${c.money(c.v)} por mês, você recebe cerca de ${c.money(c.gross.hour)} por hora</strong> usando o divisor CLT de 220 horas mensais. No ano soma ${c.money(c.gross.year)} brutos. Descontando INSS e IRRF, o líquido fica em torno de ${c.money(c.net.month)} por mês.`
      : `<strong>${c.money(c.v)} por hora dá cerca de ${c.money(c.gross.month)} por mês</strong> (220 horas no divisor CLT) e ${c.money(c.gross.year)} por ano. Estimando INSS e IRRF, o líquido fica perto de ${c.money(c.net.month)} mensais.`; },
    compare(c) { const mult = (c.v / 1518).toFixed(1); return c.kind === 'monthly'
      ? `É cerca de <strong>${mult}× o salário mínimo de R$ 1.518 (2025)</strong> — o piso de 2026 fica na casa de R$ 1.6 mil. A remuneração média do trabalhador formal brasileiro ronda R$ 3.300 por mês.`
      : `${c.money(c.v)} por hora equivale a ${((c.v * 220) / 1518).toFixed(1)}× o mínimo mensal em 220 horas. A média do trabalho formal fica perto de R$ 15 por hora.`; },
    timeBlock(c) { return `O jeito Worth: um aluguel de R$ 1.500 custa <strong>${c.num(Math.round(1500 / c.gross.hour))} horas de trabalho</strong> por mês; um carro de R$ 45.000, ${c.num(Math.round(45000 / c.gross.hour))} horas. Preço em hora muda a decisão.`; },
    taxIntro: 'Estimativa simples de descontos CLT: INSS progressivo + IRRF. Não inclui dependentes, VT ou outros benefícios. Não é consultoria tributária.',
    method(c) { return c.kind === 'monthly'
      ? `<strong>Hora = salário mensal ÷ 220.</strong> O divisor 220 (44 h/semana) é o padrão CLT para salário-hora. Anual = mensal × 12? Não exatamente: com 13º e férias, o total anual é maior — por isso a tabela usa 2.640 h/ano pagas.`
      : `<strong>Mês = hora × 220</strong> e o ano soma 2.640 horas pagas (incluindo a média do 13º). Ajuste para sua jornada real na <a href="/calculators/salary-to-hourly/">calculadora salário por hora</a>.`; },
    faqs(c) { return c.kind === 'monthly' ? [
      [`Quanto é ${c.money(c.v)} por dia?`, `Cerca de ${c.money(c.gross.day)} por dia útil (220 h ÷ 22 dias).`],
      [`Quanto sobra líquida de ${c.money(c.v)}?`, `Estimando INSS e IRRF, cerca de ${c.money(c.net.month)} por mês — a alíquota efetiva fica em torno de ${c.eff}% para CLT.`],
      [`Esse valor inclui 13º e férias?`, `Não. A conversão por 220 h cobre o salário mensal; 13º, férias + 1/3 e demais verbas vêm por cima.`],
      [`É um bom salário?`, `Compara com a média formal de ~R$ 3.300: ${c.v >= 3300 ? 'você está acima da média' : 'você está abaixo da média'}. O custo de vida da sua cidade decide.`],
    ] : [
      [`${c.money(c.v)} por hora é bom?`, `Equivalente a ${c.money(c.gross.month)} por mês (220 h) — ${c.v >= 15 ? 'acima' : 'próximo'} do piso médio do trabalho formal por hora.`],
      [`Quanto dá por ano?`, `Cerca de ${c.money(c.gross.year)} em 2.640 horas pagas, sem contar 13º e férias proporcionais.`],
      [`Como calcular INSS e IRRF?`, `A tabela usa uma alíquota efetiva aproximada de ${c.eff}%. Para o valor exato, use o holerite ou a calculadora da Receita.`],
      [`Quanto vale na prática em horas de vida?`, `Um aluguel de R$ 1.500 custa ${c.num(Math.round(1500 / c.v))} horas do seu trabalho por mês.`],
    ]; },
  },
};

// ─────────────────────────────── DEUTSCH ───────────────────────────────
const de = {
  code: 'de', htmlLang: 'de', currency: 'EUR', numberLocale: 'de-DE',
  hours: { year: 2080, month: 173.33, week: 40, day: 8, note: '40-Stunden-Woche × 52 Wochen = 2.080 Stunden pro Jahr' },
  labels: { hour: 'Pro Stunde', day: 'Pro Tag (8 h)', week: 'Pro Woche', biweek: 'Alle zwei Wochen', month: 'Pro Monat', quarter: 'Pro Quartal', year: 'Pro Jahr' },
  sec: { answer: 'Kurze Antwort', table: 'Gesamte Umrechnungstabelle', tax: 'Nettoschätzung (2026)', compare: 'Ist das ein gutes Gehalt?', method: 'So funktioniert die Rechnung', faq: 'Häufige Fragen' },
  eff: (c) => (c.gross.month <= 1800 ? 30 : c.gross.month <= 2800 ? 37 : c.gross.month <= 4200 ? 42 : 45),
  pages: { hourly: [12, 13, 14, 15, 16, 17, 18, 20, 22, 25, 30], monthly: [] },
  slugFor(kind, v) { return `${v}-euro-stundenlohn`; },
  hub: {
    slug: 'de/loehne', h1: 'Stundenlohn-Rechner-Tabellen: Was ist mein Lohn im Monat? (2026)',
    title: 'Stundenlohn: Monat, Jahr & Netto — Alle Tabellen 2026 | Worth',
    desc: 'Alle Umrechnungen: Was sind 13 €, 15 € oder 20 € Stundenlohn im Monat und im Jahr? Bruttolohn, Nettoschätzung 2026 und die Stunden-Perspektive.',
    intro: 'Was ist dein Lohn wirklich wert? Jede Seite zeigt die volle Rechnung: brutto pro Monat und Jahr, Nettoschätzung nach Lohnsteuer und Sozialabgaben — und was Dinge in Arbeitsstunden kosten.',
    compareHead: 'Die meistgesuchten Umrechnungen',
  },
  copy: {
    title(c) { return `${c.money(c.v)} Stundenlohn: Monat, Jahr & Netto 2026 (Tabelle)`; },
    desc(c) { return `${c.money(c.v)} Stundenlohn sind rund ${c.money(c.gross.month)} brutto im Monat und ${c.money(c.gross.year)} im Jahr (40-h-Woche). Netto-Schätzung 2026 inklusive.`; },
    h1(c) { return `${c.money(c.v)} Stundenlohn — was ist das im Monat und im Jahr?`; },
    answer(c) { return `<strong>${c.money(c.v)} Stundenlohn ergeben etwa ${c.money(c.gross.month)} brutto im Monat</strong> und ${c.money(c.gross.year)} brutto im Jahr (40 Stunden × 52 Wochen). Nach Lohnsteuer und Sozialabgaben bleiben bei Steuerklasse I ungefähr ${c.money(c.net.month)} netto pro Monat.`; },
    compare(c) { const mult = (c.v / 13.9).toFixed(1); return `Zum Vergleich: Der gesetzliche Mindestlohn 2026 liegt bei <strong>13,90 € pro Stunde</strong> — du verdienst ${mult}× so viel. Der Median für Vollzeitbeschäftigte in Deutschland liegt bei grob 25 €/h brutto.`; },
    timeBlock(c) { return `Die Worth-Sicht: Eine Miete von 1.200 € kostet <strong>${c.num(Math.round(1200 / c.v))} Arbeitsstunden</strong> pro Monat; ein Gebrauchtwagen für 10.000 €, ${c.num(Math.round(10000 / c.v))} Stunden. Preise in Stunden lesen lohnt sich.`; },
    taxIntro: 'Grobe Schätzung 2026: Lohnsteuer (Steuerklasse I, ohne Kirchensteuer) plus Sozialversicherungsbeiträge (~20 %). Keine Steuerberatung.',
    method(c) { return `<strong>Jahr = Stundenlohn × 2.080.</strong> 40 Stunden pro Woche über 52 Wochen. Monatlich teilt man durch 12 (rund 173,33 Stunden). Tarifverträge rechnen oft mit 13 Gehältern — dann ist das Jahresbrutto höher. Eigene Werte rechnen: <a href="/calculators/salary-to-hourly/">Gehaltsrechner</a>.`; },
    faqs(c) { return [
      [`${c.money(c.v)} Stundenlohn — wie viel netto?`, `Ungefähr ${c.money(c.net.month)} netto pro Monat bei Steuerklasse I (effektive Abgaben rund ${c.eff} %). Genau rechnet der offizielle Nettorechner des BMF.`],
      [`Was ist das im Jahr?`, `Rund ${c.money(c.gross.year)} brutto bei 2.080 Stunden. Mit 13. Gehalt (Tarifbereich) entsprechend mehr.`],
      [`Ist ${c.money(c.v)} ein guter Stundenlohn?`, `${c.v >= 20 ? 'Über' : c.v >= 15 ? 'Rund um' : 'Unter'} dem Vollzeit-Median von etwa 25 €. Gegenüber dem Mindestlohn 2026 (13,90 €) sind es ${mult0(c.v)}×.`],
      [`Wie viele Stunden sind 2.000 € Miete?`, `Bei ${c.money(c.v)} pro Stunde: ${c.num(Math.round(2000 / c.v))} Stunden pro Monat. Genau dieser Perspektivwechsel ist unser Ding.`],
    ]; },
  },
};
const mult0 = (v) => (v / 13.9).toFixed(1);

// ─────────────────────────────── FRANÇAIS ───────────────────────────────
const fr = {
  code: 'fr', htmlLang: 'fr', currency: 'EUR', numberLocale: 'fr-FR',
  hours: { year: 1820, month: 151.67, week: 35, day: 7, note: '35 heures par semaine (durée légale) = 1.820 heures par an' },
  labels: { hour: 'Par heure', day: 'Par jour (7 h)', week: 'Par semaine', biweek: 'Toutes les deux semaines', month: 'Par mois', quarter: 'Par trimestre', year: 'Par an' },
  sec: { answer: 'Réponse courte', table: 'Tableau de conversion complet', tax: 'Estimation nette (2026)', compare: 'Est-ce un bon salaire ?', method: 'Le détail du calcul', faq: 'Questions fréquentes' },
  eff: (c) => (c.gross.month <= 2000 ? 20 : c.gross.month <= 3000 ? 23 : 27),
  pages: { hourly: [11, 12, 13, 14, 15, 16, 18, 20, 22, 25], monthly: [] },
  slugFor(kind, v) { return `${v}-euros-de-lheure`; },
  hub: {
    slug: 'fr/salaires', h1: 'Combien rapporte X € de l’heure par mois ? Tableaux 2026',
    title: 'Salaire Horaire → Mensuel : Tous les Tableaux 2026 | Worth',
    desc: 'Combien font 12 €, 15 € ou 20 € de l’heure par mois et par an ? Taux horaire, salaire net estimé et vue en heures de travail — la conversion complète.',
    intro: 'Combien vaut vraiment votre heure ? Chaque page donne la conversion complète en 35 h/semaine : brut par mois et par an, net estimé après prélèvements, et le prix des choses en heures de travail.',
    compareHead: 'Les conversions les plus recherchées',
  },
  copy: {
    title(c) { return `${c.v} € de l’Heure = Combien par Mois et par An ? Barème 2026`; },
    desc(c) { return `${c.v} € de l’heure représentent environ ${c.money(c.gross.month)} par mois (35 h/semaine), soit ${c.money(c.gross.year)} brut par an. Estimation nette après prélèvements 2026.`; },
    h1(c) { return `${c.v} € de l’heure, ça fait combien par mois ?`; },
    answer(c) { return `<strong>${c.v} € de l’heure font environ ${c.money(c.gross.month)} par mois</strong> sur la base des 35 heures (151,67 h/mois), soit ${c.money(c.gross.year)} brut par an. Après prélèvements, le net tourne autour de ${c.money(c.net.month)} par mois pour un célibataire.`; },
    compare(c) { const mult = (c.v / 11.88).toFixed(1); return `Pour situer : le <strong>SMIC est d’environ 11,88 € brut de l’heure</strong> — vous gagnez ${mult}× le SMIC. Le salaire médian à temps plein tourne autour de 17 €/h brut.`; },
    timeBlock(c) { return `La vue Worth : un loyer de 800 € coûte <strong>${c.num(Math.round(800 / c.v))} heures de travail</strong> par mois ; des vacances à 1.500 €, ${c.num(Math.round(1500 / c.v))} heures. Lire les prix en heures change tout.`; },
    taxIntro: 'Estimation 2026 : passage brut → net (~22 % de cotisations salariales) puis prélèvement à la source d’un célibataire. Non contractuel.',
    method(c) { return `<strong>Salaire horaire = mensuel brut ÷ 151,67.</strong> C’est la base légale des 35 heures. Sur un an : 1.820 heures. Le 13ᵉ mois et les primes s’ajoutent par-dessus. Faites vos propres calculs avec le <a href="/calculators/salary-to-hourly/">convertisseur salaire ↔ horaire</a>.`; },
    faqs(c) { return [
      [`${c.v} € de l’heure, combien par an ?`, `Environ ${c.money(c.gross.year)} brut par an en 1.820 heures (35 h/semaine). Avec un 13ᵉ mois, davantage.`],
      [`${c.v} € brut de l’heure, c’est combien net ?`, `Près de ${c.money(c.net.month)} net par mois, soit environ ${c.money(c.v * 0.78)} net de l’heure — les cotisations salariales représentent ~22 %.`],
      [`Est-ce au-dessus du SMIC ?`, `Oui : ${(c.v / 11.88).toFixed(1)}× le SMIC horaire (~11,88 € brut). Le médian à temps plein est vers 17 €/h.`],
      [`Combien d’heures pour un loyer de 800 € ?`, `${c.num(Math.round(800 / c.v))} heures de travail par mois à ${c.v} € de l’heure. C’est notre façon de lire un prix.`],
    ]; },
  },
};

// ─────────────────────────────── 日本語 ───────────────────────────────
const ja = {
  code: 'ja', htmlLang: 'ja', currency: 'JPY', numberLocale: 'ja-JP',
  hours: { year: 2088, month: 174, week: 40, day: 8, note: '1日8時間 × 月174時間（21.75日）= 年2,088時間' },
  labels: { hour: '時給', day: '日給（8時間）', week: '週給', biweek: '半月給', month: '月給', quarter: '四半期', year: '年収' },
  sec: { answer: 'すぐわかる答え', table: '換算表（フルタイム）', tax: '手取りの目安（2026年）', compare: 'この時給は高い？安い？', method: '計算方法', faq: 'よくある質問' },
  eff: (c) => (c.gross.month <= 160000 ? 12 : c.gross.month <= 220000 ? 17 : c.gross.month <= 290000 ? 21 : c.gross.month <= 400000 ? 26 : 31),
  pages: { hourly: [1000, 1100, 1200, 1300, 1400, 1500, 1600, 1800, 2000, 2200, 2500, 3000], monthly: [] },
  slugFor(kind, v) { return `時給${v}円`; },
  hub: {
    slug: 'ja/時給', h1: '時給から月収・年収へ：換算表まとめ（2026年）',
    title: '時給→月収・年収 換算表まとめ｜手取りの目安つき（2026年）',
    desc: '時給1,000円〜3,000円の月収・年収・手取りを一気に確認。月174時間のフルタイム換算で、社会保険料・税引き後の目安も掲載。',
    intro: 'あなたの時給は月でいくら？各ページでフルタイム換算（月174時間）の月収・年収、社会保険料と税を引いた手取りの目安、そして「お金=時間」の視点で家計を見直せます。',
    compareHead: 'よく検索される時給',
  },
  copy: {
    title(c) { return `時給${c.num(c.v)}円の月収・年収はいくら？手取り早見表（2026年）`; },
    desc(c) { return `時給${c.num(c.v)}円は月収約${c.man(c.gross.month)}・年収約${c.man(c.gross.year)}（月174時間勤務）。社会保険料・所得税を引いた手取りの目安も表で確認できます。`; },
    h1(c) { return `時給${c.num(c.v)}円は月収・年収でいくら？`; },
    answer(c) { return `<strong>時給${c.num(c.v)}円は月収約${c.man(c.gross.month)}、年収約${c.man(c.gross.year)}です</strong>（1日8時間・月174時間のフルタイム想定）。週では${c.man(c.gross.week)}、日給は約${c.num(c.gross.day)}円。社会保険料と所得税・住民税を引いた手取りは月${c.man(c.net.month)}前後です。`; },
    compare(c) { const mult = (c.v / 1121).toFixed(1); return `比較の目安：<strong>全国平均の最低賃金は1,121円</strong>（2025年度）なので約${mult}倍。正社員の平均月収は約35万円です。`; },
    timeBlock(c) { return `Worthの見方：家賃8万円は<strong>月${c.num(Math.round(80000 / c.v))}時間の労働</strong>。15万円のスマホなら${c.num(Math.round(150000 / c.v))}時間。値札を「時間」で読むと判断が変わります。`; },
    taxIntro: '概算です：社会保険料（健保・厚年・雇用・労災は事業主負担含む）と所得税・住民税を含めた実効負担率を段階的に適用。正確な額は給与試算ツールや源泉徴収票で確認を。',
    method(c) { return `<strong>月収 = 時給 × 174時間</strong>（1日8時間 × 21.75日）。年収は月収 × 12 = 約2,088時間分。残業や賞与は含みません。自分の条件で試すなら<a href="/calculators/hourly-to-salary/">時給→年収の計算機</a>。`; },
    faqs(c) { return [
      [`時給${c.num(c.v)}円の月収は？`, `約${c.man(c.gross.month)}です（月174時間）。手取りは概ね${c.man(c.net.month)}前後になります。`],
      [`年収はいくらになる？`, `約${c.man(c.gross.year)}（2,088時間換算）。賞与や残業代は含みません。`],
      [`時給${c.num(c.v)}円は高い？`, `最低賃金平均1,121円の約${(c.v / 1121).toFixed(1)}倍${c.v >= 1500 ? 'で、都心の水準に近い' : 'で、地域によっては標準的'}です。`],
      [`家賃8万円は何時間働くと？`, `時給${c.num(c.v)}円なら月${c.num(Math.round(80000 / c.v))}時間分。生活費を「時間」で見るのがWorth流です。`],
    ]; },
  },
};
// 万円 helper is attached to every ja context in the generator.

// ─────────────────────────────── 한국어 ───────────────────────────────
const ko = {
  code: 'ko', htmlLang: 'ko', currency: 'KRW', numberLocale: 'ko-KR',
  hours: { year: 2508, month: 209, week: 40, day: 8, note: '월 209시간 기준(통상임금 산정 관행), 연 2,508시간' },
  labels: { hour: '시급', day: '일급(8시간)', week: '주급', biweek: '반월급', month: '월급', quarter: '분기', year: '연봉' },
  sec: { answer: '핵심 답변', table: '전체 환산표', tax: '실수령액 추정 (2026)', compare: '좋은 급여일까?', method: '계산 방식', faq: '자주 묻는 질문' },
  eff: (c) => (c.gross.month <= 2000000 ? 10 : c.gross.month <= 3000000 ? 13 : c.gross.month <= 4000000 ? 15 : c.gross.month <= 5000000 ? 18 : 21),
  pages: { hourly: [9860, 10000, 10030, 10320, 11000, 12000, 13000, 15000, 20000, 25000], monthly: [] },
  slugFor(kind, v) { return `시급-${num0(v)}원`; },
  hub: {
    slug: 'ko/급여', h1: '시급 → 월급·연봉 환산표 모음 (2026)',
    title: '시급 월급 환산표 모음: 실수령액까지 한 번에 (2026) | Worth',
    desc: '시급 1만원·10,320원·1만5천원의 월급과 실수령액을 월 209시간 기준으로 계산. 4대보험·근로소득세 추정치와 생활비 "시간" 관점까지.',
    intro: '내 시급이 월급으로 얼마? 각 페이지에서 월 209시간 기준 월급·연봉, 4대보험과 세금을 뺀 실수령액 추정, 그리고 돈을 "노동 시간"으로 보는 Worth식 시각까지 확인하세요.',
    compareHead: '많이 찾는 시급',
  },
  copy: {
    title(c) { return `시급 ${c.man0(c.v)}원 월급 얼마? 실수령액 계산 (2026)`; },
    desc(c) { return `시급 ${c.man0(c.v)}원은 월급 약 ${c.man(c.gross.month)}(월 209시간), 연봉 약 ${c.man(c.gross.year)}입니다. 4대보험·세금 뺀 실수령액 표도 확인하세요.`; },
    h1(c) { return `시급 ${c.man0(c.v)}원이면 월급은 얼마?`; },
    answer(c) { return `<strong>시급 ${c.man0(c.v)}원은 월급 약 ${c.man(c.gross.month)}</strong>(월 209시간 기준), 연봉으로는 약 ${c.man(c.gross.year)}입니다. 4대보험과 근로소득세를 제외한 실수령액은 월 ${c.man(c.net.month)} 안팎으로 추정됩니다.`; },
    compare(c) { const mult = (c.v / 10320).toFixed(1); return `비교 기준: <strong>2026년 최저시급은 10,320원</strong>으로, 이 시급의 약 ${mult}배입니다. 상용직 평균 월급여는 400만 원 수준입니다.`; },
    timeBlock(c) { return `Worth식 시각: 월세 70만 원은 <strong>한 달에 ${c.num(Math.round(700000 / c.v))}시간 노동</strong>입니다. 100만 원짜리 노트북은 ${c.num(Math.round(1000000 / c.v))}시간. 가격을 '시간'으로 읽어보세요.`; },
    taxIntro: '추정치입니다: 4대보험(약 9%)과 근로소득세를 합친 실효 부담률을 구간별로 적용. 정확한 실수령액은 급여명세서나 국세청 계산기를 이용하세요.',
    method(c) { return `<strong>월급 = 시급 × 209시간.</strong> 주 40시간 근로 기준 통상임금 산정에 쓰이는 월 209시간 환산(유급휴일·연차 포함 관행)입니다. 연봉은 209 × 12 = 2,508시간 기준. 내 조건으로 계산하려면 <a href="/calculators/salary-to-hourly/">연봉 시급 계산기</a>.`; },
    faqs(c) { return [
      [`시급 ${c.man0(c.v)}원 월급은?`, `약 ${c.man(c.gross.month)}입니다(월 209시간). 실수령은 대략 ${c.man(c.net.month)} 수준으로 봅니다.`],
      [`연봉으로는 얼마?`, `약 ${c.man(c.gross.year)}(연 2,508시간). 수당·상여금은 별도입니다.`],
      [`시급 ${c.man0(c.v)}원은 좋은 편?`, `2026년 최저시급 10,320원의 약 ${(c.v / 10320).toFixed(1)}배${c.v >= 15000 ? '로 상위권' : '수준'}입니다. 생활비 대비로 판단하세요.`],
      [`월세 70만 원은 몇 시간?`, `시급 ${c.man0(c.v)}원이면 ${c.num(Math.round(700000 / c.v))}시간 분량입니다.`],
    ]; },
  },
};
const num0 = (v) => String(v);

// ─────────────────────────────── العربية (السعودية) ───────────────────────────────
const ar = {
  code: 'ar', htmlLang: 'ar', currency: 'SAR', numberLocale: 'ar-SA-u-nu-latn',
  hours: { year: 2496, month: 208, week: 48, day: 8, note: '8 ساعات × 26 يوم عمل ≈ 208 ساعات شهرياً' },
  labels: { hour: 'بالساعة', day: 'يومياً (8 ساعات)', week: 'أسبوعياً', biweek: 'كل أسبوعين', month: 'شهرياً', quarter: 'ربع سنوياً', year: 'سنوياً' },
  sec: { answer: 'الإجابة السريعة', table: 'جدول التحويل الكامل', tax: 'صافي الراتب (2026)', compare: 'هل هذا راتب جيد؟', method: 'طريقة الحساب', faq: 'أسئلة شائعة' },
  eff: () => 0,
  pages: { hourly: [20, 25, 30, 35, 40, 50], monthly: [3000, 4000, 5000, 6000, 8000, 10000, 12000] },
  slugFor(kind, v) { return kind === 'monthly' ? `راتب-${v}-ريال-شهرياً` : `أجرة-${v}-ريال-الساعة`; },
  hub: {
    slug: 'ar/رواتب', h1: 'كم يعادل الراتب الشهري بالساعة؟ جداول 2026',
    title: 'تحويل الراتب الشهري إلى ساعات: جداول 2026 | Worth',
    desc: 'حوّل أي راتب شهري إلى أجر بالساعة: كم يعادل 4,000 أو 6,000 ريال شهرياً بالساعة، مع الصافي بعد الاستقطاعات والقيمة بالساعات الكاملة.',
    intro: 'كم تساوي ساعة عملك فعلياً؟ كل صفحة تعرض التحويل الكامل شهرياً وسنوياً، الصافي التقديري بعد الاستقطاعات، وكلفة الأشياء بساعات عملك.',
    compareHead: 'أكثر الرواتب بحثاً',
  },
  copy: {
    title(c) { return c.kind === 'monthly'
      ? `راتب ${c.num(c.v)} ريال شهرياً كم بالساعة؟ حسبة 2026`
      : `${c.num(c.v)} ريال بالساعة كم شهرياً؟ 2026`; },
    desc(c) { return c.kind === 'monthly'
      ? `راتب ${c.num(c.v)} ريال شهرياً يعادل نحو ${c.money(c.gross.hour)} بالساعة (8 ساعات × 26 يوماً). الأسبوعي والسنوي والصافي التقديري في جدول واحد.`
      : `${c.num(c.v)} ريال بالساعة تعادل نحو ${c.money(c.gross.month)} شهرياً و${c.money(c.gross.year)} سنوياً. جدول كامل مع الصافي التقديري.`; },
    h1(c) { return c.kind === 'monthly' ? `راتب ${c.num(c.v)} ريال شهرياً كم بالساعة؟` : `${c.num(c.v)} ريال بالساعة كم يعادل شهرياً؟`; },
    answer(c) { return c.kind === 'monthly'
      ? `<strong>راتب ${c.num(c.v)} ريال شهرياً يساوي تقريباً ${c.money(c.gross.hour)} بالساعة</strong> على أساس 8 ساعات عمل × 26 يوماً. أي ${c.money(c.gross.week)} أسبوعياً و${c.money(c.gross.year)} سنوياً. ولا ضريبة على الدخل في السعودية، فيبقى الصافي قريباً من هذا المبلغ.`
      : `<strong>${c.num(c.v)} ريال بالساعة تعادل نحو ${c.money(c.gross.month)} شهرياً</strong> (208 ساعات) و${c.money(c.gross.year)} سنوياً. وفي السعودية لا ضريبة دخل، لذا يبقى الصافي مرتفعاً مقارنة بدول أخرى.`; },
    compare(c) { return c.kind === 'monthly'
      ? `للمقارنة: متوسط الأجور في القطاع الخاص يتراوح نحو 5,000–6,000 ريال شهرياً، وراتب ${c.num(c.v)} ريال ${c.v >= 5500 ? 'أعلى من المتوسط' : 'قريب من المتوسط'}.`
      : `${c.num(c.v)} ريال بالساعة تعادل ${c.money(c.gross.month)} شهرياً — ${c.v >= 26 ? 'أعلى من الأجر النموذجي' : 'قريب من الأجر النموذجي'} في القطاع الخاص.`; },
    timeBlock(c) { return `منظور Worth: إيجار شقة بـ 2,500 ريال يكلف <strong>${c.num(Math.round(2500 / c.gross.hour))} ساعة عمل</strong> شهرياً؛ وجوال بقيمة 4,000 ريال ${c.num(Math.round(4000 / c.gross.hour))} ساعة. اقرأ الأسعار بالساعات.`; },
    taxIntro: 'لا توجد ضريبة على دخل الأفراد في السعودية. يحسم السعوديون اشتراك التأمينات الاجتماعية (SANED ونحو 9.75% تقديراً)؛ غير السعوديون لا يساهمون من الراتب أساساً في أغلب الحالات. ليست استشارة مالية.',
    method(c) { return c.kind === 'monthly'
      ? `<strong>الأجر بالساعة = الراتب ÷ 208 ساعات</strong> (8 ساعات × 26 يوم عمل). الأسبوعي = الشهري ÷ 4.33 تقريباً. احسب بنفسك عبر <a href="/calculators/salary-to-hourly/">حاسبة تحويل الراتب</a>.`
      : `<strong>الشهري = الأجر بالساعة × 208</strong> (8 ساعات × 26 يوماً)، والسنوي ≈ × 12. عدّل الساعات حسب عقدك عبر <a href="/calculators/hourly-to-salary/">حاسبة الأجر والراتب</a>.`; },
    faqs(c) { return c.kind === 'monthly' ? [
      [`كم يعادل ${c.num(c.v)} ريال بالساعة؟`, `نحو ${c.money(c.gross.hour)} بالساعة على أساس 208 ساعات شهرياً.`],
      [`هل يُخصم ضريبة من الراتب؟`, `لا توجد ضريبة دخل على الأفراد في السعودية؛ الاستقطاع الأساسي للتأمينات يخص السعوديين بوجه عام.`],
      [`كم أسوي أسبوعياً؟`, `حوالي ${c.money(c.gross.week)} أسبوعياً (الشهري ÷ 4.33).`],
      [`كم ساعة أشغل لسداد إيجار 2,500 ريال؟`, `${c.num(Math.round(2500 / c.gross.hour))} ساعة عمل شهرياً بهذا الراتب.`],
    ] : [
      [`كم يعادل ${c.num(c.v)} ريال بالساعة شهرياً؟`, `نحو ${c.money(c.gross.month)} شهرياً (208 ساعات).`],
      [`وكم سنوياً؟`, `تقريباً ${c.money(c.gross.year)} سنوياً قبل أي استقطاعات.`],
      [`هل الأجر جيد؟`, `${c.v >= 30 ? 'أعلى من الأجر النموذجي' : 'قريب من الأجر النموذجي'} في القطاع الخاص السعودي (نحو 26–32 ريالاً/ساعة).`],
      [`كم ساعة عمل تساوي جوالاً بـ 4,000 ريال؟`, `${c.num(Math.round(4000 / c.v))} ساعة بهذا الأجر.`],
    ]; },
  },
};

// ─────────────────────────────── BAHASA INDONESIA ───────────────────────────────
const id = {
  code: 'id', htmlLang: 'id', currency: 'IDR', numberLocale: 'id-ID',
  hours: { year: 2076, month: 173, week: 40, day: 8, note: '40 jam/minggu ≈ 173 jam per bulan' },
  labels: { hour: 'Per jam', day: 'Per hari (8 jam)', week: 'Per minggu', biweek: 'Dua mingguan', month: 'Per bulan', quarter: 'Per triwulan', year: 'Per tahun' },
  sec: { answer: 'Jawaban singkat', table: 'Tabel konversi lengkap', tax: 'Perkiraan gaji bersih (2026)', compare: 'Termasuk gaji bagus?', method: 'Cara menghitung', faq: 'Pertanyaan umum' },
  eff: (c) => (c.gross.month <= 5000000 ? 4 : c.gross.month <= 10000000 ? 6 : 8),
  pages: { hourly: [25000, 30000, 35000, 40000, 50000, 60000], monthly: [3500000, 4000000, 4500000, 5000000, 6000000, 7000000, 8000000] },
  slugFor(kind, v) { return kind === 'monthly' ? `gaji-${v}-per-bulan` : `upah-${v}-per-jam`; },
  hub: {
    slug: 'id/gaji', h1: 'Gaji per bulan berapa per jam? Tabel lengkap 2026',
    title: 'Konversi Gaji Bulanan ke Per Jam: Tabel 2026 | Worth',
    desc: 'Hitung gaji Rp4–8 juta per bulan jadi upah per jam (173 jam/bulan), plus perkiraan potongan PPh 21 & BPJS dan sudut pandang "jam kerja".',
    intro: 'Berapa sebenarnya nilai satu jam kerjamu? Tiap halaman menampilkan konversi lengkap per bulan dan tahun, perkiraan gaji bersih, dan harga barang dalam jam kerja.',
    compareHead: 'Konversi yang paling dicari',
  },
  copy: {
    title(c) { return c.kind === 'monthly'
      ? `Gaji ${c.money(c.v)} per Bulan Berapa per Jam? Tabel 2026`
      : `Upah ${c.money(c.v)} per Jam Berapa per Bulan? 2026`; },
    desc(c) { return c.kind === 'monthly'
      ? `Gaji ${c.money(c.v)} per bulan ≈ ${c.money(c.gross.hour)} per jam (173 jam/bulan). Lihat harian, mingguan, tahunan dan perkiraan bersih setelah PPh 21 & BPJS.`
      : `Upah ${c.money(c.v)} per jam ≈ ${c.money(c.gross.month)} per bulan (173 jam) dan ${c.money(c.gross.year)} setahun. Tabel lengkap + perkiraan gaji bersih 2026.`; },
    h1(c) { return c.kind === 'monthly' ? `Gaji ${c.money(c.v)} per bulan, berapa per jam?` : `Upah ${c.money(c.v)} per jam, berapa gaji sebulan?`; },
    answer(c) { return c.kind === 'monthly'
      ? `<strong>Gaji ${c.money(c.v)} per bulan setara sekitar ${c.money(c.gross.hour)} per jam</strong> (asumsi 173 jam kerja per bulan). Per tahun totalnya sekitar ${c.money(c.gross.year)}. Setelah potongan PPh 21 dan BPJS, bersihnya kira-kira ${c.money(c.net.month)} per bulan.`
      : `<strong>Upah ${c.money(c.v)} per jam setara ${c.money(c.gross.month)} per bulan</strong> (173 jam kerja) atau sekitar ${c.money(c.gross.year)} per tahun. Setelah PPh 21 dan BPJS, kira-kira bersih ${c.money(c.net.month)} per bulan.`; },
    compare(c) { return c.kind === 'monthly'
      ? `Sebagai pembanding: <strong>UMP nasional 2026 sekitar Rp3,2 juta</strong> dan UMP DKI Jakarta sekitar Rp5,8 juta. Gaji ${c.money(c.v)} ${c.v >= 5800000 ? 'di atas UMP DKI' : c.v >= 3200000 ? 'di atas UMP nasional' : 'di sekitar UMP nasional'}.`
      : `${c.money(c.v)} per jam ≈ ${c.money(c.gross.month)} sebulan — ${c.v >= 33500 ? 'di atas' : 'di sekitar'} upah per jam UMP DKI (≈Rp33 ribu/jam).`; },
    timeBlock(c) { return `Cara Worth: sewa kamar Rp1,5 juta berarti <strong>${c.num(Math.round(1500000 / c.gross.hour))} jam kerja</strong> per bulan; motor kredit Rp2 juta per bulan ${c.num(Math.round(2000000 / c.gross.hour))} jam. Harga terasa berbeda kalau dibaca dalam jam.`; },
    taxIntro: 'Perkiraan kasar: PPh 21 tarif efektif bulanan + iuran BPJS Kesehatan & Ketenagakerjaan bagian karyawan (~4%). Bukan konsultasi pajak.',
    method(c) { return c.kind === 'monthly'
      ? `<strong>Upah per jam = gaji bulanan ÷ 173.</strong> Asumsi 40 jam kerja per minggu (8 jam × 5 hari ≈ 173 jam/bulan). Hitung versimu di <a href="/calculators/salary-to-hourly/">kalkulator gaji per jam</a>.`
      : `<strong>Gaji bulanan = upah per jam × 173</strong> (± 2.076 jam/tahun). Sesuaikan dengan jam kerja contratmu lewat <a href="/calculators/hourly-to-salary/">kalkulator upah</a>.`; },
    faqs(c) { return c.kind === 'monthly' ? [
      [`Gaji ${c.money(c.v)} per hari berapa?`, `Sekitar ${c.money(c.gross.day)} per hari kerja (173 jam ÷ 21,6 hari).`],
      [`Berapa bersih setelah potongan?`, `Kira-kira ${c.money(c.net.month)} — tarif efektif PPh 21 + BPJS sekitar ${c.eff}% pada kisaran ini.`],
      [`Sudah termasuk THR?`, `Belum. THR dan bonus di luar hitungan; umumnya setara satu bulan gaji per tahun.`],
      [`Termasuk gaji bagus?`, `Dibanding UMP DKI (±Rp5,8 juta): ${c.v >= 5800000 ? 'di atasnya' : 'di bawahnya'}. Cek juga biaya hidup kotamu.`],
    ] : [
      [`${c.money(c.v)} per jam masuk UMP?`, `Setara ${c.money(c.gross.month)} per bulan — ${c.v >= 33500 ? 'di atas' : 'sekitar'} upah/jam UMP DKI (≈Rp33 ribu).`],
      [`Per tahun berapa?`, `Sekitar ${c.money(c.gross.year)} (±2.076 jam), di luar THR.`],
      [`Berapa potongan pajaknya?`, `Perkiraan tarif efektif ${c.eff}% (PPh 21 terhitung kecil pada upah sebatas ini) + BPJS.`],
      [`Sewa Rp1,5 juta berapa jam kerja?`, `${c.num(Math.round(1500000 / c.v))} jam per bulan pada upah ini.`],
    ]; },
  },
};

// ─────────────────────────────── TÜRKÇE ───────────────────────────────
const tr = {
  code: 'tr', htmlLang: 'tr', currency: 'TRY', numberLocale: 'tr-TR',
  hours: { year: 2700, month: 225, week: 45, day: 9, note: '45 saatlik çalışma haftası = ayda 225 saat (4857 sayılı Kanun)' },
  labels: { hour: 'Saat ücreti', day: 'Günlük (9 saat)', week: 'Haftalık', biweek: 'İki haftalık', month: 'Aylık', quarter: 'Üç aylık', year: 'Yıllık' },
  sec: { answer: 'Kısa cevap', table: 'Tam dönüşüm tablosu', tax: 'Net tahmini (2026)', compare: 'İyi bir maaş mı?', method: 'Hesap nasıl yapılır', faq: 'Sık sorulanlar' },
  eff: (c) => (c.gross.month <= 25000 ? 24 : c.gross.month <= 45000 ? 30 : 33),
  pages: { hourly: [100, 120, 150, 180, 200, 250, 300], monthly: [22104, 26000, 30000, 35000, 40000, 50000, 60000] },
  slugFor(kind, v) { return kind === 'monthly' ? `aylik-${v}-tl-maas-saat-basi` : `saat-ucreti-${v}-tl`; },
  hub: {
    slug: 'tr/maaslar', h1: 'Maaş saat başı ne kadar? Tüm dönüşüm tabloları (2026)',
    title: 'Maaş ↔ Saat Ücreti Dönüşüm Tabloları (2026) | Worth',
    desc: 'Aylık maaşın saat ücreti karşılığı: 22.104 TL, 30.000 TL, 50.000 TL kaç TL/saat eder? SGK+gelir vergisi net tahmini ve "çalışma saati" perspektifi.',
    intro: 'Bir saatine ne kadar kazanıyorsun? Her sayfada tam hesap: aylık ve yıllık brüt, SGK ve vergi sonrası net tahmini, ve her harcamanın kaç çalışma saati ettiği.',
    compareHead: 'En çok aranan dönüşümler',
  },
  copy: {
    title(c) { return c.kind === 'monthly'
      ? `Aylık ${c.num(c.v)} TL Maaş Saat Başı Ne Kadar? Tablo (2026)`
      : `Saat Ücreti ${c.num(c.v)} TL Aylık Maaşı Ne Kadar? (2026)`; },
    desc(c) { return c.kind === 'monthly'
      ? `Aylık ${c.num(c.v)} TL maaş, saat başı yaklaşık ${c.money(c.gross.hour)} eder (ayda 225 saat). Günlük, haftalık, yıllık ve net tahmin tablodaki gibi.`
      : `Saat ücreti ${c.num(c.v)} TL ≈ aylık ${c.money(c.gross.month)} (225 saat) ve yıllık ${c.money(c.gross.year)}. SGK + vergi sonrası net tahminiyle.`; },
    h1(c) { return c.kind === 'monthly' ? `Aylık ${c.num(c.v)} TL maaş saat başı ne eder?` : `Saat ücreti ${c.num(c.v)} TL ise aylık maaş ne kadar?`; },
    answer(c) { return c.kind === 'monthly'
      ? `<strong>Aylık ${c.num(c.v)} TL maaş, saat başı yaklaşık ${c.money(c.gross.hour)} eder</strong> (45 saatlik hafta, ayda 225 saat). Yılda toplam ${c.money(c.gross.year)} brüt. SGK işçi payı, işsizlik ve gelir vergisi sonrası net ise ayda yaklaşık ${c.money(c.net.month)}.`
      : `<strong>Saat ücreti ${c.num(c.v)} TL, aylık yaklaşık ${c.money(c.gross.month)} eder</strong> (ayda 225 saat) ve yıllık ${c.money(c.gross.year)} brüt. Net tahmini ayda ${c.money(c.net.month)} civarındadır.`; },
    compare(c) { return c.kind === 'monthly'
      ? `Kıyas için: <strong>2025 net asgari ücret 22.104 TL</strong> idi; 2026 rakamını güncel açıklamadan doğrulayın. Maaş ${c.num(c.v)} TL ${c.v >= 26000 ? 'asgarinin üzerinde' : 'asgariye yakın'} bir seviyede.`
      : `${c.num(c.v)} TL/saat ≈ aylık ${c.money(c.gross.month)} — 2025 asgari ücretin saatlik karşılığı (≈98 TL) ile kıyaslanabilir.`; },
    timeBlock(c) { return `Worth bakışı: 15.000 TL kira, bu maaşla <strong>ayda ${c.num(Math.round(15000 / c.gross.hour))} saat çalışma</strong> demek; 300.000 TL ikinci el araba ${c.num(Math.round(300000 / c.gross.hour))} saat. Fiyatı saatle okumak her şeyi değiştirir.`; },
    taxIntro: 'Kaba tahmin: SGK işçi payı (%14) + işsizlik (%1) + gelir vergisi ve damga vergisi dahil etkin oran dilimlere göre uygulanır. Kesin net için Gelir İdaresi hesaplayıcısını kullanın.',
    method(c) { return c.kind === 'monthly'
      ? `<strong>Saat ücreti = aylık maaş ÷ 225.</strong> Kanunda haftalık çalışma süresi en çok 45 saat; aylık karşılığı 225 saattir. Kendi değerlerinle <a href="/calculators/salary-to-hourly/">maaş saat hesaplayıcı</a> ile oynayabilirsin.`
      : `<strong>Aylık = saat ücreti × 225</strong> (yılda 2.700 saat). Mesaisi farklıysa <a href="/calculators/hourly-to-salary/">ücret hesaplayıcı</a> ile hesapla.`; },
    faqs(c) { return c.kind === 'monthly' ? [
      [`${c.num(c.v)} TL maaş günlüğü ne kadar?`, `Yaklaşık ${c.money(c.gross.day)} günlük (225 saat ÷ 25 gün).`],
      [`Net ne kadar kalıyor?`, `Tahminen ${c.money(c.net.month)} — bu dilimde etkin kesinti oranı ~%${c.eff}.`],
      [`Bu maaş asgari ile kıyas?`, `2025 net asgari 22.104 TL idi: ${c.v >= 26000 ? 'netizin üzerinde' : 'yaklaşık asgari seviyesinde'}.`],
      [`15.000 TL kira kaç saat?`, `Bu maaşla ayda ${c.num(Math.round(15000 / c.gross.hour))} saat çalışma demek.`],
    ] : [
      [`${c.num(c.v)} TL/saat aylık ne eder?`, `Yaklaşık ${c.money(c.gross.month)} (225 saat/ay).`],
      [`Yıllık toplam?`, `Brüt olarak ~${c.money(c.gross.year)} (2.700 saat).`],
      [`Bu saat ücreti iyi mi?`, `2025 asgari saatlik karşılığı ≈98 TL: ${c.v >= 150 ? 'oldukça üzerinde' : 'üzerinde'}.`],
      [`15.000 TL kira kaç saat?`, `Saat ücretinle ayda ${c.num(Math.round(15000 / c.v))} saat.`],
    ]; },
  },
};

// ─────────────────────────────── РУССКИЙ ───────────────────────────────
const ru = {
  code: 'ru', htmlLang: 'ru', currency: 'RUB', numberLocale: 'ru-RU',
  hours: { year: 1974, month: 164.5, week: 40, day: 8, note: '40-часовая неделя ≈ 1 974 рабочих часа в год (производственный календарь)' },
  labels: { hour: 'В час', day: 'В день (8 ч)', week: 'В неделю', biweek: 'Раз в две недели', month: 'В месяц', quarter: 'В квартал', year: 'В год' },
  sec: { answer: 'Короткий ответ', table: 'Полная таблица перевода', tax: 'Оценка на руки (2026)', compare: 'Это хорошая зарплата?', method: 'Как считается', faq: 'Частые вопросы' },
  eff: (c) => (c.gross.year <= 2400000 ? 13 : 15),
  pages: { hourly: [200, 250, 300, 350, 400, 500, 600], monthly: [40000, 50000, 60000, 70000, 80000, 90000, 100000, 120000, 150000, 200000] },
  slugFor(kind, v) { return kind === 'monthly' ? `зарплата-${v}-в-месяц-сколько-в-час` : `${v}-рублей-в-час-сколько-в-месяц`; },
  hub: {
    slug: 'ru/зарплата-в-час', h1: 'Зарплата в месяц — сколько в час? Все таблицы 2026',
    title: 'Зарплата в час: перевод месячной зарплаты (2026) | Worth',
    desc: 'Сколько в час составляют 50 000, 80 000 или 120 000 ₽ в месяц? Перевод зарплаты в часовую ставку, день, неделю, год и сумма на руки после НДФЛ.',
    intro: 'Сколько стоит час вашей работы? Каждая страница — полный перевод: час, день, неделя, месяц, год, сумма на руки после НДФЛ и покупки, переведённые в часы работы.',
    compareHead: 'Самые частые запросы',
  },
  copy: {
    title(c) { return c.kind === 'monthly'
      ? `${c.num(c.v)} ₽ в месяц — сколько в час? Таблица 2026`
      : `${c.num(c.v)} ₽ в час — сколько в месяц? Расчёт 2026`; },
    desc(c) { return c.kind === 'monthly'
      ? `Зарплата ${c.num(c.v)} ₽ в месяц — это около ${c.money(c.gross.hour)} в час при 40-часовой неделе. День, неделя, год и сумма на руки после НДФЛ — в таблице.`
      : `${c.num(c.v)} ₽ в час — это примерно ${c.money(c.gross.month)} в месяц (≈164,5 ч) и ${c.money(c.gross.year)} в год. Таблица с расчётом на руки.`; },
    h1(c) { return c.kind === 'monthly' ? `${c.num(c.v)} ₽ в месяц — сколько это в час?` : `${c.num(c.v)} ₽ в час — сколько это в месяц?`; },
    answer(c) { return c.kind === 'monthly'
      ? `<strong>Зарплата ${c.num(c.v)} ₽ в месяц — это примерно ${c.money(c.gross.hour)} в час</strong> при стандартной 40-часовой неделе (≈164,5 рабочих часов в месяц). В год выходит около ${c.money(c.gross.year)} до налога. После НДФЛ 13% на руки остаётся порядка ${c.money(c.net.month)} в месяц.`
      : `<strong>${c.num(c.v)} ₽ в час — это примерно ${c.money(c.gross.month)} в месяц</strong> (≈164,5 ч) и около ${c.money(c.gross.year)} в год до налога. После НДФЛ остаётся порядка ${c.money(c.net.month)} в месяц.`; },
    compare(c) { return c.kind === 'monthly'
      ? `Для сравнения: <strong>МРОТ в 2026 году — 27 093 ₽ в месяц</strong>, медианная зарплата по стране ≈ 75–80 тыс. ₽. Значит ${c.num(c.v)} ₽ — ${c.v >= 80000 ? 'выше медианы' : 'около или ниже медианы'}.`
      : `${c.num(c.v)} ₽/час ≈ ${c.money(c.gross.month)} в месяц — против медианных ~45 ₽/час это ${c.v >= 45 ? 'выше' : 'ниже'} среднего уровня.`; },
    timeBlock(c) { return `Взгляд Worth: аренда 45 000 ₽ — это <strong>${c.num(Math.round(45000 / c.gross.hour))} рабочих часов</strong> в месяц; smartphone за 80 000 ₽ — ${c.num(Math.round(80000 / c.gross.hour))} часов. Цены честнее читать в часах.`; },
    taxIntro: 'Оценка: НДФЛ 13% (при годовом доходе до 2,4 млн ₽; выше — 15% и более по прогрессивной шкале). Страховые взносы платит работодатель сверх зарплаты. Не налоговая консультация.',
    method(c) { return c.kind === 'monthly'
      ? `<strong>Часовая ставка = зарплата ÷ 164,5 ч</strong> (среднее число рабочих часов в месяце по производственному календарю; в году ≈ 1 974 ч). Пересчитать под свой график: <a href="/calculators/salary-to-hourly/">калькулятор зарплаты</a>.`
      : `<strong>Месяц = ставка × 164,5 ч</strong>, год ≈ × 1 974 ч. Свой график можно подставить в <a href="/calculators/hourly-to-salary/">калькуляторе</a>.`; },
    faqs(c) { return c.kind === 'monthly' ? [
      [`${c.num(c.v)} ₽ в месяц — сколько в день?`, `Около ${c.money(c.gross.day)} за восьмичасовой день (≈20,7 рабочих дней в месяце).`],
      [`Сколько остаётся на руки?`, `Порядка ${c.money(c.net.month)} после НДФЛ — это ${c.eff}% налога у источника.`],
      [`Это хорошая зарплата?`, `Медиана по стране ≈ 75–80 тыс. ₽: ${c.v >= 80000 ? 'выше медианы' : 'около или ниже медианы'}. Многое решает город.`],
      [`Сколько часов работы стоит аренда 45 000 ₽?`, `${c.num(Math.round(45000 / c.gross.hour))} часов в месяц при такой ставке.`],
    ] : [
      [`${c.num(c.v)} ₽ в час — сколько в месяц?`, `Примерно ${c.money(c.gross.month)} при ≈164,5 рабочих часах.`],
      [`А в год?`, `Около ${c.money(c.gross.year)} до вычета НДФЛ.`],
      [`НДФЛ сколько удержат?`, `${c.eff}% с этой суммы (13% до 2,4 млн ₽ в год, дальше прогрессивная шкала).`],
      [`Аренда 45 000 ₽ — это сколько часов?`, `${c.num(Math.round(45000 / c.v))} часов работы в месяц.`],
    ]; },
  },
};

// ─────────────────────────────── 中文 ───────────────────────────────
const zh = {
  code: 'zh', htmlLang: 'zh-CN', currency: 'CNY', numberLocale: 'zh-CN',
  hours: { year: 2088, month: 174, week: 40, day: 8, note: '每月计薪 21.75 天 × 8 小时 = 174 小时' },
  labels: { hour: '每小时', day: '每天（8小时）', week: '每周', biweek: '每两周', month: '每月', quarter: '每季度', year: '每年' },
  sec: { answer: '快速答案', table: '完整换算表', tax: '税后估算（2026）', compare: '这算高工资吗？', method: '计算方法', faq: '常见问题' },
  eff: (c) => (c.gross.month <= 10000 ? 12 : c.gross.month <= 20000 ? 16 : 20),
  pages: { hourly: [20, 25, 30, 35, 40, 50, 60, 80], monthly: [4000, 5000, 6000, 7000, 8000, 9000, 10000, 12000, 15000, 20000] },
  slugFor(kind, v) { return kind === 'monthly' ? `月薪${v}元时薪多少` : `时薪${v}元月薪多少`; },
  hub: {
    slug: 'zh/工资换算', h1: '月薪换算时薪：2026 全表汇总',
    title: '月薪↔时薪换算表汇总（2026）| Worth',
    desc: '月薪5000、8000、10000元分别等于时薪多少？含日薪、周薪、年薪换算与五险一金、个税后的估算，全部用"工作小时"看懂工资。',
    intro: '你的时间到底值多少钱？每页给出完整换算：时薪、日薪、月薪、年薪，扣除五险一金和个税后的估算，并把消费换算成你的工作小时。',
    compareHead: '热搜换算',
  },
  copy: {
    title(c) { return c.kind === 'monthly'
      ? `月薪${c.num(c.v)}元时薪多少？2026 工资换算表`
      : `时薪${c.num(c.v)}元月薪多少？2026 换算表`; },
    desc(c) { return c.kind === 'monthly'
      ? `月薪${c.num(c.v)}元约等于时薪${c.money(c.gross.hour)}（月计薪174小时）。含日薪、周薪、年薪与五险一金、个税后的估算。`
      : `时薪${c.num(c.v)}元约合月薪${c.money(c.gross.month)}（174小时）、年薪${c.money(c.gross.year)}。完整换算表与税后估算。`; },
    h1(c) { return c.kind === 'monthly' ? `月薪${c.num(c.v)}元，时薪是多少钱？` : `时薪${c.num(c.v)}元，月薪是多少钱？`; },
    answer(c) { return c.kind === 'monthly'
      ? `<strong>月薪${c.num(c.v)}元约等于时薪${c.money(c.gross.hour)}</strong>（每月计薪174小时），每周约${c.money(c.gross.week)}，每年约${c.money(c.gross.year)}。扣除五险一金和个人所得税后，到手大约${c.money(c.net.month)}每月。`
      : `<strong>时薪${c.num(c.v)}元约合月薪${c.money(c.gross.month)}</strong>（月计薪174小时），年薪约${c.money(c.gross.year)}。扣除五险一金和个税后，到手约${c.money(c.net.month)}每月。`; },
    compare(c) { return c.kind === 'monthly'
      ? `参考：全国多数城市<strong>最低工资标准在每月2,000–2,740元之间</strong>（上海最高）。月薪${c.num(c.v)}元${c.v >= 8000 ? '明显高于多数城市的最低线' : '处于常见工资区间'}；城镇私营单位平均月薪约6,000元。`
      : `时薪${c.num(c.v)}元约合月薪${c.money(c.gross.month)}——${c.v >= 34 ? '高于' : '接近'}典型城市的工资水平。`; },
    timeBlock(c) { return `Worth 视角：房租2,500元等于<strong>每月${c.num(Math.round(2500 / c.gross.hour))}个工作小时</strong>；一部8,000元的手机是${c.num(Math.round(8000 / c.gross.hour))}小时。用"小时"看价格，决定会不一样。`; },
    taxIntro: '粗略估算：个人缴纳的五险一金（约10%–13%）加个人所得税速算扣除后的实际负担率，按收入分档估计。非税务建议，精确数字请用个税APP。',
    method(c) { return c.kind === 'monthly'
      ? `<strong>时薪 = 月薪 ÷ 174</strong>（每月计薪天数21.75天 × 8小时），年薪 = 月薪 × 12。用自己的数据算：<a href="/calculators/salary-to-hourly/">月薪时薪换算器</a>。`
      : `<strong>月薪 = 时薪 × 174</strong>（年约2,088小时）。调整工时请用<a href="/calculators/hourly-to-salary/">时薪月薪计算器</a>。`; },
    faqs(c) { return c.kind === 'monthly' ? [
      [`月薪${c.num(c.v)}元，日薪多少？`, `约${c.money(c.gross.day)}（月计薪21.75天）。`],
      [`到手有多少？`, `扣除五险一金和个税后约${c.money(c.net.month)}，这一档的实际负担率约${c.eff}%。`],
      [`这算高工资吗？`, `多数城市最低工资为2,000–2,740元/月，城镇私营平均约6,000元：${c.v >= 8000 ? '你的月薪高于平均' : '处于常见区间'}。`],
      [`房租2,500元等于多少小时？`, `这份工资下等于每月${c.num(Math.round(2500 / c.gross.hour))}个工作小时。`],
    ] : [
      [`时薪${c.num(c.v)}元月薪多少？`, `约${c.money(c.gross.month)}（月计薪174小时）。`],
      [`年薪呢？`, `约${c.money(c.gross.year)}（约2,088小时），不含年终奖。`],
      [`到手大约多少？`, `税后约${c.money(c.net.month)}每月，实际负担率约${c.eff}%。`],
      [`一部8,000元的手机是多少小时？`, `${c.num(Math.round(8000 / c.v))}个小时的工作。`],
    ]; },
  },
};

// ─────────────────────────────── हिन्दी ───────────────────────────────
const hi = {
  code: 'hi', htmlLang: 'hi', currency: 'INR', numberLocale: 'en-IN',
  hours: { year: 2496, month: 208, week: 48, day: 8, note: 'रोज़ 8 घंटे × महीने में 26 दिन = 208 घंटे' },
  labels: { hour: 'प्रति घंटा', day: 'प्रति दिन (8 घंटे)', week: 'प्रति सप्ताह', biweek: 'पखवाड़े में', month: 'प्रति माह', quarter: 'प्रति तिमाही', year: 'प्रति वर्ष' },
  sec: { answer: 'तुरंत जवाब', table: 'पूरी कन्वर्ज़न टेबल', tax: 'टैक्स के बाद अनुमान (2026)', compare: 'क्या ये अच्छी सैलरी है?', method: 'कैसे कैलकुलेट होता है', faq: 'अक्सर पूछे सवाल' },
  eff: (c) => (c.gross.year <= 1275000 ? 0 : c.gross.year <= 1600000 ? 5 : 10),
  pages: { hourly: [150, 200, 250, 300, 400, 500], monthly: [15000, 20000, 25000, 30000, 40000, 50000, 60000, 80000, 100000] },
  slugFor(kind, v) { return kind === 'monthly' ? `${v}-mahina-salary-per-hour` : `${v}-rupaye-per-hour-monthly`; },
  hub: {
    slug: 'hi/salary', h1: 'महीने की सैलरी प्रति घंटा कितनी? 2026 टेबल्स',
    title: 'महीना सैलरी ↔ प्रति घंटा कन्वर्ज़न टेबल (2026) | Worth',
    desc: '₹20,000 या ₹50,000 महीना सैलरी प्रति घंटा कितनी? रोज़, हफ़्ता, साल की कमाई, टैक्स के बाद की रकम और हर खर्च आपकी कितने घंटों की कमाई है — सब एक जगह.',
    intro: 'आपकी एक घंटे की कमाई कितनी है? हर पेज पर पूरा हिसाब: घंटा, दिन, हफ़्ता, महीना, साल — और नई टैक्स व्यवस्था में हाथ में आने वाली रकम.',
    compareHead: 'सबसे ज़्यादा सर्च होने वाले कन्वर्ज़न',
  },
  copy: {
    title(c) { return c.kind === 'monthly'
      ? `₹${c.num(c.v)} महीना सैलरी = प्रति घंटा कितनी? 2026 टेबल`
      : `₹${c.num(c.v)} प्रति घंटा = महीना कितना? 2026`; },
    desc(c) { return c.kind === 'monthly'
      ? `₹${c.num(c.v)} महीने की सैलरी लगभग ₹${c.num(Math.round(c.gross.hour))} प्रति घंटा (26 दिन × 8 घंटे)। दैनिक, साप्ताहिक, वार्षिक और टैक्स के बाद की कमाई।`
      : `₹${c.num(c.v)} प्रति घंटा ≈ ₹${c.num(Math.round(c.gross.month))} महीना (208 घंटे) और ₹${c.num(Math.round(c.gross.year))} साल। पूरी टेबल और टैक्स अनुमान।`; },
    h1(c) { return c.kind === 'monthly' ? `₹${c.num(c.v)} महीना सैलरी है, तो प्रति घंटा कितनी?` : `₹${c.num(c.v)} प्रति घंटा है, तो महीने की कमाई कितनी?`; },
    answer(c) { return c.kind === 'monthly'
      ? `<strong>₹${c.num(c.v)} महीने की सैलरी लगभग ₹${c.num(Math.round(c.gross.hour))} प्रति घंटा है</strong> (रोज़ 8 घंटे, महीने में 26 दिन = 208 घंटे)। साल में कुल ₹${c.num(Math.round(c.gross.year))}। नई टैक्स व्यवस्था में इस स्तर पर टैक्स नगण्य/कम है, इसलिए हाथ में लगभग ${c.money(c.net.month)} प्रति माह आता है।`
      : `<strong>₹${c.num(c.v)} प्रति घंटा की कमाई लगभग ₹${c.num(Math.round(c.gross.month))} प्रति माह</strong> (208 घंटे) और साल में ₹${c.num(Math.round(c.gross.year))} है। टैक्स के बाद हाथ में लगभग ${c.money(c.net.month)} महीना आता है।`; },
    compare(c) { return c.kind === 'monthly'
      ? `तुलना के लिए: औपचारिक क्षेत्र का औसत वेतन ≈ <strong>₹22–25 हज़ार/माह</strong> है और राष्ट्रीय न्यूनतम मजदूरी ≈ ₹178/दिन। ₹${c.num(c.v)} महीना ${c.v >= 25000 ? 'औसत से ऊपर है' : 'औसत के आसपास/नीचे है'}।`
      : `₹${c.num(c.v)}/घंटा ≈ ₹${c.num(Math.round(c.gross.month))} महीना — दिहाड़ी आधारित न्यूनतम मजदूरी (≈₹178/दिन) से ${c.v >= 23 ? 'काफ़ी ऊपर' : 'ऊपर'}।`; },
    timeBlock(c) { return `Worth नज़रिया: ₹15,000 का किराया इस सैलरी पर <strong>महीने के ${c.num(Math.round(15000 / c.gross.hour))} काम के घंटे</strong> हैं; ₹80,000 का फ़ोन ${c.num(Math.round(80000 / c.gross.hour))} घंटे। क़ीमतें घंटों में पढ़िए।`; },
    taxIntro: 'अनुमान: नई कर व्यवस्था (नया रेज़िम) FY 2025-26 में ₹12.75 लाख सैलरी तक रिबेट के कारण टैक्स लगभग शून्य; उससे ऊपर स्लैब दरें। सटीक हिसाब के लिए income tax कैलकुलेटर देखें।',
    method(c) { return c.kind === 'monthly'
      ? `<strong>प्रति घंटा = मासिक वेतन ÷ 208</strong> (26 दिन × 8 घंटे)। वार्षिक = मासिक × 12। अपने घंटों के हिसाब से <a href="/calculators/salary-to-hourly/">सैलरी-टू-आवर कैलकुलेटर</a> में डालें।`
      : `<strong>मासिक = प्रति घंटा × 208</strong> (साल में ≈2,496 घंटे)। <a href="/calculators/hourly-to-salary/">आवर-टू-सैलरी कैलकुलेटर</a> से अपना हिसाब करें।`; },
    faqs(c) { return c.kind === 'monthly' ? [
      [`₹${c.num(c.v)} महीना सैलरी का दैनिक हिसाब?`, `लगभग ${c.money(c.gross.day)} प्रति दिन (208 ÷ 26)।`],
      [`टैक्स के बाद कितना आता है?`, `इस स्तर पर नए रेज़िम में टैक्स ${c.eff}% है — हाथ में लगभग ${c.money(c.net.month)} प्रति माह।`],
      [`क्या ये अच्छी सैलरी है?`, `औसत औपचारिक वेतन ₹22–25 हज़ार के मुक़ाबले ${c.v >= 25000 ? 'ऊपर है' : 'आसपास है'}। शहर की लागत तय करेगी।`],
      [`₹15,000 किराया कितने घंटे?`, `इस सैलरी पर हर महीने ${c.num(Math.round(15000 / c.gross.hour))} घंटे की कमाई।`],
    ] : [
      [`₹${c.num(c.v)}/घंटा से महीने की कमाई?`, `लगभग ₹${c.num(Math.round(c.gross.month))} (208 घंटे)।`],
      [`साल का हिसाब?`, `लगभग ₹${c.num(Math.round(c.gross.year))} (टैक्स से पहले)।`],
      [`टैक्स कितना?`, `इस स्तर पर लगभग ${c.eff}% — ₹12.75 लाख सैलरी तक रिबेट से नगण्य।`],
      [`₹80,000 का फ़ोन कितने घंटे?`, `${c.num(Math.round(80000 / c.v))} घंटे की कमाई।`],
    ]; },
  },
};

export const LOCALES = { en, es, pt, de, fr, ja, ko, ar, id, tr, ru, zh, hi };
export const LANG_ORDER = ['en', 'es', 'pt', 'de', 'fr', 'ja', 'ko', 'ar', 'id', 'tr', 'ru', 'zh', 'hi'];
