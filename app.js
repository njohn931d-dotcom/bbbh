const $ = id => document.getElementById(id);
let mode = document.body.dataset.mode || 'purchase', current, saved = [];
try { saved = JSON.parse(localStorage.getItem('worth-thoughts') || '[]'); if (!Array.isArray(saved)) saved = []; } catch { saved = []; }
const money = n => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', maximumFractionDigits: n % 1 ? 2 : 0}).format(n);
const number = n => new Intl.NumberFormat('en-US', {maximumFractionDigits:1}).format(n);
const configs = {
 purchase: {title:'Is it worth your time?', desc:'That price tag has a story. Let’s put it in hours.', label:'How much does it cost?', suffix:'USD', placeholder:'e.g. A new pair of sneakers'},
 subscription: {title:'Small monthly. Big yearly.', desc:'See what a recurring charge really adds up to.', label:'Monthly subscription cost', suffix:'/ mo', placeholder:'e.g. My streaming subscriptions'},
 saving: {title:'Little habits. More possibility.', desc:'What could one small daily change free up?', label:'Daily amount to set aside', suffix:'/ day', placeholder:'e.g. My afternoon coffee'}
};
function setMode(next) { mode = next; const c = configs[mode]; $('tool-title').textContent = c.title; $('tool-desc').textContent = c.desc; $('price-label').textContent = c.label; $('cost-suffix').textContent = c.suffix; $('item').placeholder = c.placeholder; document.querySelectorAll('[data-mode]').forEach(b => { b.setAttribute('aria-selected', b.dataset.mode === mode); b.tabIndex = b.dataset.mode === mode ? 0 : -1; }); calculate(); }
function calculate() {
 const price = Number($('price').value), income = Number($('income').value), period = $('pay-period').value;
 if (!$('calc-form').checkValidity()) return false;
 const rate = income / (period === 'month' ? 2080 / 12 : period === 'year' ? 2080 : 1);
 const total = price * (mode === 'subscription' ? 12 : mode === 'saving' ? 365 : 1), hours = total / rate;
 current = {mode, price, income, period, item:$('item').value.trim(), hours, total};
 $('result-intro').textContent = mode === 'purchase' ? 'That purchase costs you' : mode === 'subscription' ? 'That subscription costs you each year' : 'That daily habit could free up';
 $('hours').textContent = mode === 'saving' ? money(total) : number(hours);
 $('unit').textContent = mode === 'saving' ? '/ year' : hours === 1 ? 'hour' : 'hours';
 $('hours').parentElement.style.fontSize = (mode === 'saving' ? money(total).length : number(hours).length) > 6 ? '36px' : '';
 $('result-subtitle').textContent = mode === 'saving' ? `equivalent to ${number(hours)} hours of your working life.` : 'of your working life.';
 const blocks = Math.min(32, Math.max(0, Math.round(hours / 8 * 32)));
 $('time-track').replaceChildren(...Array.from({length:32}, (_, i) => {const el = document.createElement('i'); if (i < blocks) el.className = 'filled'; return el;}));
 const days = hours / 8;
 $('track-caption').textContent = hours === 6 ? '¾ of a workday' : hours === 4 ? '½ of a workday' : hours < 8 ? `${number(hours)} of 8 working hours` : `${number(days)} workday${days === 1 ? '' : 's'}`;
 $('track-end').textContent = hours > 8 ? '8 hours per workday' : '8-hour day';
 $('result-message').replaceChildren();
 if (mode === 'purchase') { $('result-message').append('Not good. Not bad. Just perspective.', document.createElement('br'), 'Only you can decide if it’s worth it.'); }
 else if (mode === 'subscription') $('result-message').textContent = `${money(price)} a month is ${money(total)} a year. If it adds value to your life, it might be time well spent.`;
 else $('result-message').textContent = `${money(price)} a day, for 365 days. No investment returns assumed—just a small change adding up.`;
 return true;
}
$('calc-form').addEventListener('submit', e => {e.preventDefault(); if(calculate()) { toast('A fresh perspective. The choice is yours.'); if(innerWidth < 581) document.querySelector('.result').scrollIntoView({behavior:'smooth',block:'center'}); }});
document.querySelectorAll('[data-mode]').forEach(b => {b.addEventListener('click', () => setMode(b.dataset.mode)); b.addEventListener('keydown',e => { if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) return; e.preventDefault(); const tabs=[...document.querySelectorAll('[data-mode]')]; let i=tabs.indexOf(b); i=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3; tabs[i].click();tabs[i].focus();});});
let toastTimer;
function toast(text) {$('toast').textContent = text; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3500);}
function store() {try {localStorage.setItem('worth-thoughts', JSON.stringify(saved)); return true;} catch {toast('Browser storage is unavailable. Thoughts are saved for this visit only.');return false;}}
function updateCount() {$('saved-count').textContent = saved.length;}
$('save').addEventListener('click', () => {if(!calculate()) return $('calc-form').reportValidity(); if(saved.some(s => s.mode===current.mode && s.price===current.price && s.income===current.income && s.period===current.period && s.item===current.item)) return toast('This thought is already saved.'); saved.unshift({...current, id:Date.now()}); const persisted=store(); updateCount();if(persisted)toast('Thought saved. A little perspective for later.');});
$('share').addEventListener('click', async () => {if(!calculate()) return $('calc-form').reportValidity(); const params = new URLSearchParams({mode,price:current.price,income:current.income,period:current.period,item:current.item}); const url = `${location.origin}${location.pathname}#${params}`; try {await navigator.clipboard.writeText(url); toast('Link copied. It includes the numbers you entered.');} catch {openModal(); const heading=document.createElement('h2'); heading.textContent='Share your perspective';const note=document.createElement('p');note.textContent='This link includes your calculator inputs. Copy it to share:';const input=document.createElement('input');input.value=url; input.readOnly=true; $('modal-content').append(heading,note,input);input.select();}});
/* One-click embed code. Every visitor that arrives through a widget on someone
   else's page is a visitor we did not have to rank for, so this button is the
   cheapest growth lever on the site. `data-slug` is set on the widget pages
   themselves; anywhere else the route tells us which tool is on screen. */
function widgetSlug() {
 if (document.body.dataset.slug) return document.body.dataset.slug;
 const parts = location.pathname.split('/').filter(Boolean);
 const i = parts.indexOf('calculators');
 return i >= 0 && parts[i + 1] ? parts[i + 1] : 'cost-of-time';
}
function widgetBase() {
 const parts = location.pathname.split('/').filter(Boolean);
 const cut = parts.indexOf('calculators') >= 0 ? parts.indexOf('calculators') : parts.length;
 return location.origin + (cut ? '/' + parts.slice(0, cut).join('/') : '');
}
function embedSnippet() {
 const state = new URLSearchParams({ mode, price: current ? current.price : $('price').value, income: current ? current.income : $('income').value, period: $('pay-period').value }).toString();
 const src = `${widgetBase()}/embed/${widgetSlug()}/#${state}`;
 return `<iframe src="${src}" title="Worth ${widgetSlug().replace(/-/g, ' ')} calculator" loading="lazy" width="100%" height="620" style="max-width:760px;min-height:620px;border:1px solid #e0e4d7;border-radius:14px" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
}
const embedButton = $('embed-tool');
if (embedButton) embedButton.addEventListener('click', async () => {
 if (!$('calc-form').checkValidity()) return $('calc-form').reportValidity();
 calculate();
 const code = embedSnippet();
 try { await navigator.clipboard.writeText(code); toast('Embed code copied. Paste it into any page, post or README.'); }
 catch {
  openModal();
  const heading = document.createElement('h2'); heading.textContent = 'Put this calculator on your site';
  const note = document.createElement('p'); note.textContent = 'Free to embed, no key needed. It resizes to fit and links back here for the full version. Copy the code below:';
  const box = document.createElement('textarea'); box.value = code; box.rows = 6; box.readOnly = true;
  const more = document.createElement('p'); const link = document.createElement('a'); link.href = `${widgetBase()}/embed/`; link.textContent = 'Browse every embeddable tool with previews →'; more.append(link);
  $('modal-content').append(heading, note, box, more); box.select();
 }
});

function openModal() {$('modal-content').replaceChildren();$('modal').showModal();}
$('close-modal').addEventListener('click',()=>$('modal').close());
$('modal').addEventListener('click',e=>{const r=$('modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('modal').close();});
function renderSaved() {const target=$('modal-content'); target.replaceChildren();const title=document.createElement('h2');title.textContent='A little perspective, saved.';target.append(title);if(!saved.length){const p=document.createElement('p');p.textContent='Nothing here yet. Calculate something on your mind, then choose “Save this thought” to come back to it later.';target.append(p);return;}saved.forEach(s=>{const row=document.createElement('div');row.className='saved-item';const text=document.createElement('div');const p=document.createElement('p');p.textContent=s.item||({purchase:'A purchase',subscription:'A subscription',saving:'A daily habit'}[s.mode]);const small=document.createElement('small');small.textContent=`${money(s.total)}${s.mode==='purchase'?'':' per year'} · ${number(s.hours)} hours of work`;text.append(p,small);const remove=document.createElement('button');remove.textContent='Remove';remove.setAttribute('aria-label',`Remove ${p.textContent}`);remove.onclick=()=>{saved=saved.filter(t=>t.id!==s.id);store();updateCount();renderSaved();};row.append(text,remove);target.append(row);});}
$('open-saved').onclick=()=>{openModal();renderSaved();};
document.querySelectorAll('[data-example]').forEach(b=>b.onclick=()=>{const kind=b.dataset.example; $('price').value=kind==='coffee'?5:kind==='subscription'?15:150;$('item').value=kind==='coffee'?'My daily coffee':kind==='subscription'?'My streaming subscription':'A new pair of sneakers';setMode(kind==='coffee'?'saving':kind);$('calculator').scrollIntoView({behavior:'smooth',block:'start'});});
const articles={time:{title:'How to calculate what an hour of your life is worth',body:[['Start with what you actually take home','Your salary is one number. The money available to spend is another. Start with your pay after taxes and deductions, then divide it by the number of hours you worked to earn it. If you take home $4,000 a month and work about 173 hours, your take-home hourly rate is roughly $23.08.'],['Translate the price tag','Divide a purchase price by that hourly rate. At $25 per hour, a $150 pair of shoes represents six hours of work. This is not a scorecard for whether you deserve the shoes. It is another way to understand the exchange.'],['Make it personal','Our monthly and annual conversions assume 40 hours a week, 52 weeks a year. Work part-time or variable hours? Divide your own take-home pay by actual hours and use the hourly option. You can include commuting or unpaid overtime for an even more personal view.'],['Remember what the number cannot tell you','An hour of work is not interchangeable with an hour of free time. This calculation ignores your fixed expenses and does not measure what brings you joy. Use it as a prompt for a better question: does this purchase fit the life I want?']]},habits:{title:'The small purchases that aren’t actually small',body:[['Small is a frequency, too','A $5 coffee is a $5 coffee. Every day for a year, it is $1,825. Neither framing is more correct, but seeing both helps you make a choice instead of following a habit.'],['Look at value, not just price','Does that coffee give you a quiet moment before a difficult day? Is it a chance to meet a friend? The benefit matters. A daily purchase you love can be a better use of money than an unused subscription that costs less.'],['Try one realistic change','Skipping a $5 coffee twice a week would leave $520 over 52 weeks. That is different from cutting it out entirely. Look for a change you would actually enjoy keeping, rather than an ambitious plan you would resent.'],['Keep the assumptions visible','Our small habits calculator assumes a daily amount across 365 days. It does not assume investment returns or interest. Your actual savings depend on how often you make the change and whether you spend the difference elsewhere.']]},rule:{title:'The 24-hour rule: a little space before you spend',body:[['Give the impulse some room','For a nonessential purchase, wait a day before buying. Put it on a list, close the tab, and come back tomorrow. The point is not to make spending difficult. It is to separate a passing impulse from something you genuinely want.'],['Ask three simple questions','What will this make better? Do I already have something that does the job? Would I still want it if it were not on sale? These questions help you look past the countdown timer and focus on your own needs.'],['Turn the price into time','Put the purchase into the Worth calculator. Imagine trading those work hours for the item. If the exchange still feels good, that is useful information. If it does not, you have learned something before spending.'],['Make the rule fit your life','A day is a starting point, not a commandment. You might wait a week on expensive items and skip the pause for essential purchases. The aim is more intention, not guilt or rigid rules.']]}};
document.querySelectorAll('[data-article]').forEach(b=>b.onclick=()=>{openModal();const a=articles[b.dataset.article],h=document.createElement('h2');h.textContent=a.title;$('modal-content').append(h);a.body.forEach(([title,body])=>{const sub=document.createElement('h3'),p=document.createElement('p');sub.textContent=title;p.textContent=body;$('modal-content').append(sub,p);});});
try {const p=new URLSearchParams(location.hash.slice(1));if(configs[p.get('mode')]){for(const id of ['price','income']) {const v=p.get(id);if(v!==null && Number.isFinite(Number(v)) && Number(v)>= (id==='income'?0.01:0) && Number(v)<=1e9)$(id).value=v;}if(['hour','month','year'].includes(p.get('period')))$('pay-period').value=p.get('period');$('item').value=(p.get('item')||'').slice(0,80);mode=p.get('mode');}}catch{}
setMode(mode);updateCount();
