// Pay converter: progressive enhancement for the markup rendered by
// scripts/growth/widget.mjs. The server already printed the results; this only
// recomputes them when a field changes. No network, no storage, no globals.
const PERIOD_TO_HOURLY = {
  hour: (a) => a,
  day: (a, h) => a / (h / 5),
  week: (a, h) => a / h,
  biweek: (a, h) => a / (2 * h),
  month: (a, h, w) => (a * 12) / (h * w),
  year: (a, h, w) => a / (h * w),
};

function fromHourly(hourly, h, w) {
  const weekly = hourly * h;
  const annual = weekly * w;
  return { hourly, daily: weekly / 5, weekly, biweekly: weekly * 2, monthly: annual / 12, annual };
}

function init(root) {
  const locale = root.dataset.locale || 'en-US';
  const currency = root.dataset.currency || 'USD';
  const money = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 });
  const hours = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const priceText = root.dataset.priceText || '{h}';
  const form = root.querySelector('.gx-conv-form');
  const priceForm = root.querySelector('.gx-conv-price');
  const field = (f, name) => Number(f.elements[name].value);

  const update = () => {
    const amount = field(form, 'amount');
    const h = field(form, 'hours');
    const w = field(form, 'weeks');
    const period = form.elements.period.value;
    const valid = amount >= 0 && h > 0 && w > 0 && PERIOD_TO_HOURLY[period];
    if (!valid || !Number.isFinite(amount)) return;
    const hourly = PERIOD_TO_HOURLY[period](amount, h, w);
    const res = fromHourly(hourly, h, w);
    for (const [key, value] of Object.entries(res)) {
      const cell = root.querySelector(`[data-out="${key}"]`);
      if (cell) cell.textContent = money.format(value);
    }
    const price = field(priceForm, 'price');
    const out = root.querySelector('[data-out="priceHours"]');
    if (out && hourly > 0 && price >= 0) out.textContent = priceText.replace('{h}', hours.format(price / hourly));
  };

  for (const f of [form, priceForm]) {
    f.addEventListener('submit', (e) => e.preventDefault());
    f.addEventListener('input', update);
  }
}

const start = () => document.querySelectorAll('[data-worth-converter]').forEach(init);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();

// Click-to-load trailers: nothing is requested from YouTube until the visitor asks.
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-video-id]');
  if (!btn) return;
  const id = btn.dataset.videoId;
  if (!/^[\w-]{11}$/.test(id)) return;
  const frame = document.createElement('iframe');
  frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
  frame.title = btn.dataset.title || 'Official trailer';
  frame.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  btn.replaceWith(frame);
});

// Copy-to-clipboard buttons (emoji page).
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  const text = btn.dataset.copy;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } finally { ta.remove(); }
  }
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = `Copied ${text}`;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 1400);
  }
});

// Basket calculator (movie night and similar): quantity x price rows -> total and hours of work.
function initBasket(root) {
  const locale = root.dataset.locale || 'en-US';
  const money = new Intl.NumberFormat(locale, { style: 'currency', currency: root.dataset.currency || 'USD', maximumFractionDigits: 2 });
  const hours = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const form = root.querySelector('.gx-basket-form');
  const rows = Number(root.dataset.rows) || 0;
  const text = root.dataset.hoursText || '{h}';
  const update = () => {
    let total = 0;
    for (let i = 0; i < rows; i += 1) {
      const q = Number(form.elements[`qty-${i}`].value);
      const p = Number(form.elements[`price-${i}`].value);
      if (q >= 0 && p >= 0 && Number.isFinite(q * p)) total += q * p;
    }
    const rate = Number(form.elements.hourly.value);
    root.querySelector('[data-out="total"]').textContent = money.format(total);
    if (rate > 0) {
      root.querySelector('[data-out="hours"]').textContent = text.replace('{h}', hours.format(total / rate)).replace('{rate}', money.format(rate));
    }
  };
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('input', update);
}
const startBaskets = () => document.querySelectorAll('[data-worth-basket]').forEach(initBasket);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startBaskets);
else startBaskets();
