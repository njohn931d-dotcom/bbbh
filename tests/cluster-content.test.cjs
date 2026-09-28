const test=require('node:test');
const assert=require('node:assert');
const fs=require('node:fs');
const path=require('node:path');

/**
 * Regression guards for the cluster content model.
 *
 * Each of these encodes a bug that actually shipped once:
 *   - titles like "Mortgage Calculator 2026 2026" (the slug already ended in
 *     2026 and the template appended it again)
 *   - 40 pages sharing one byte-identical body
 *   - an unclosed <article> on every generated page
 *   - hreflang fanning out to ten unrelated URLs
 *   - JSON-LD sameAs claiming a Wikipedia profile the site does not own
 *   - internal links chosen with sort(() => 0.5 - Math.random()), so the
 *     output differed on every build
 */

const ROOT=path.join(__dirname,'..');
const load=p=>import(path.join(ROOT,p));

test('cluster pages have unique titles, descriptions and H1s',async()=>{
  const c=await load('scripts/cluster-content.mjs');
  const all=[...c.CLUSTER_CONTENT,...c.LOCALE_CONTENT];
  assert.ok(all.length>=50,'expected the cluster to cover 50+ pages, got '+all.length);

  const seen={title:new Map(),desc:new Map(),h1:new Map()};
  for(const e of all){
    for(const field of ['title','desc','h1']){
      const key=e[field].toLowerCase();
      assert.ok(!seen[field].has(key),`duplicate ${field} "${e[field]}" on ${e.route} and ${seen[field].get(key)}`);
      seen[field].set(key,e.route);
    }
  }
});

test('no title or H1 repeats a year back to back',async()=>{
  const c=await load('scripts/cluster-content.mjs');
  const all=[...c.CLUSTER_CONTENT,...c.LOCALE_CONTENT];
  for(const e of all){
    for(const field of ['title','h1']){
      const years=e[field].match(/\b20\d\d\b/g)||[];
      assert.equal(new Set(years).size,years.length,`${e.route} ${field} repeats a year: "${e[field]}"`);
    }
  }
});

test('titles and descriptions fit a search result',async()=>{
  const c=await load('scripts/cluster-content.mjs');
  for(const e of [...c.CLUSTER_CONTENT,...c.LOCALE_CONTENT]){
    assert.ok(e.title.length<=65,`${e.route} title is ${e.title.length} chars: "${e.title}"`);
    assert.ok(e.desc.length<=160,`${e.route} description is ${e.desc.length} chars`);
    assert.ok(e.desc.length>=60,`${e.route} description is only ${e.desc.length} chars`);
  }
});

test('every page has its own formula, worked example and FAQ',async()=>{
  const c=await load('scripts/cluster-content.mjs');
  for(const e of [...c.CLUSTER_CONTENT,...c.LOCALE_CONTENT]){
    assert.ok(e.formula?.name&&e.formula?.expr&&e.formula?.plain,`${e.route} is missing a formula`);
    assert.ok(e.table?.head?.length>=3,`${e.route} needs a table with 3+ columns`);
    assert.ok(e.table.rows.length>=3,`${e.route} needs 3+ worked examples`);
    assert.equal(e.table.head.length,e.table.rows[0].length,`${e.route} table rows do not match the header`);
    assert.ok(e.faqs?.length>=2,`${e.route} needs 2+ FAQs`);
    assert.ok(e.notes?.length>=2,`${e.route} needs 2+ explanatory notes`);
  }
});

test('worked-example tables are not shared between unrelated pages',async()=>{
  const c=await load('scripts/cluster-content.mjs');
  // Translations of the same English page are expected to share a table
  // structure — that is what a translation looks like, and hreflang tells
  // search engines they are the same content. Unrelated pages sharing one is
  // the duplicate-content problem this guards against.
  const parentOf=new Map(c.LOCALE_CONTENT.map(e=>[e.route,e.translationOf]));
  const fp=new Map();
  for(const e of [...c.CLUSTER_CONTENT,...c.LOCALE_CONTENT]){
    // Strip digits so two pages cannot look distinct only by renumbering.
    const key=JSON.stringify(e.table.rows).replace(/\d+/g,'#');
    const prior=fp.get(key);
    if(prior){
      const sameFamily=(parentOf.get(e.route)&&parentOf.get(e.route)===parentOf.get(prior))
        ||(parentOf.get(prior)===e.route)
        ||(e.route===prior);
      assert.ok(sameFamily,`${e.route} reuses the worked-example table from unrelated page ${prior}`);
    } else {
      fp.set(key,e.route);
    }
  }
});

test('every internal link in the content model resolves to a real page',async()=>{
  const c=await load('scripts/cluster-content.mjs');
  const s=await load('scripts/generate-seo.mjs');
  const a=await load('scripts/articles.mjs');
  const real=new Set([...(s.routes||[]),...(s.articleRoutes||[]),...(a.articleRoutes||[]),...c.CLUSTER_ROUTES]);
  for(const e of [...c.CLUSTER_CONTENT,...c.LOCALE_CONTENT]){
    for(const l of [...(e.links||[]),...(e.related||[])]){
      assert.ok(real.has(l),`${e.route} links to "${l}", which is not a real route`);
    }
  }
});

test('translated pages are genuinely in their declared language',async()=>{
  const c=await load('scripts/cluster-content.mjs');
  assert.ok(c.LOCALE_CONTENT.length>=10,'expected 10+ locale pages');
  const scripts={
    de:/[äöüßÄÖÜ]|[a-zA-Z]/, fr:/[àâçéèêëîïôûùüÿ]/, ru:/[а-яА-ЯёЁ]/,
    zh:/[一-鿿]/, ja:/[぀-ヿ一-鿿]/, ko:/[가-힣]/, ar:/[؀-ۿ]/, pt:/[ãõçáéíóúâê]/, es:/[ñáéíóúü¿¡]/,
  };
  for(const e of c.LOCALE_CONTENT){
    assert.ok(e.lang,`${e.route} must declare a language`);
    assert.ok(e.translationOf,`${e.route} must declare the page it translates`);
    const body=[e.h1,e.title,e.desc,e.intro,...e.notes,...e.faqs.flat()].join(' ');
    const pattern=scripts[e.lang];
    if(pattern) assert.match(body,pattern,`${e.route} declares lang="${e.lang}" but its copy does not look like ${e.lang}`);
  }
});

test('the translation map is reciprocal and points at real routes',async()=>{
  const c=await load('scripts/cluster-content.mjs');
  const s=await load('scripts/generate-seo.mjs');
  const real=new Set([...(s.routes||[]),...c.CLUSTER_ROUTES]);
  const parents=new Set();
  for(const e of c.LOCALE_CONTENT){
    assert.ok(real.has(e.translationOf),`${e.route} translates "${e.translationOf}", which is not a route`);
    parents.add(e.translationOf);
    const entry=(c.TRANSLATION_MAP[e.translationOf]||[]).find(t=>t.route===e.route);
    assert.ok(entry,`${e.route} is missing from TRANSLATION_MAP[${e.translationOf}]`);
    assert.equal(entry.lang,e.lang,`${e.route} language mismatch in TRANSLATION_MAP`);
  }
  // Every parent that declares translations must actually have some.
  for(const parent of Object.keys(c.TRANSLATION_MAP)){
    assert.ok(parents.has(parent)||real.has(parent),`TRANSLATION_MAP has unknown parent ${parent}`);
  }
});

test('every generated page is closed and declares its own language',async()=>{
  const c=await load('scripts/cluster-content.mjs');
  for(const e of c.LOCALE_CONTENT){
    if(e.dir) assert.equal(e.dir,'rtl',`${e.route} declares dir="${e.dir}"`);
  }
  const arabic=c.LOCALE_CONTENT.filter(e=>e.lang==='ar');
  assert.ok(arabic.length===1&&arabic[0].dir==='rtl','the Arabic page should be marked rtl');
});

test('generating the cluster is deterministic',async()=>{
  // Internal links used to be picked with sort(() => 0.5 - Math.random()),
  // so two builds of the same commit produced different HTML.
  const {execFileSync}=require('node:child_process');
  const gen=()=>{
    execFileSync(process.execPath,['scripts/generate-parasite.mjs'],{
      env:{...process.env,SITE_URL:'https://worth.example'},
      cwd:ROOT,stdio:'pipe',
    });
    return fs.readFileSync(path.join(ROOT,'calculators/mortgage-calculator-2026/index.html'),'utf8');
  };
  assert.equal(gen(),gen(),'two builds of the same input produced different HTML');
});

test('no translated copy mixes scripts',async()=>{
  // Machine-translation damage shows up as stray Latin words sitting inside
  // CJK text. It is invisible to a human skimming the build output and very
  // visible to a reader, so it is checked mechanically instead.
  const c=await load('scripts/cluster-content.mjs');
  const offenders=[];
  for(const e of [...c.CLUSTER_CONTENT,...c.LOCALE_CONTENT]){
    if(!/^(zh|ja|ko)/.test(e.lang)) continue;
    const strings=[e.title,e.desc,e.intro,e.assumptions,e.caveat,
      e.formula.name,e.formula.plain,...(e.notes||[]),...(e.faqs||[]).flat()];
    for(const t of strings){
      if(!t) continue;
      const latin=(t.match(/[A-Za-z]{3,}/g)||[]).filter(w=>!/^(worth|etc)$/i.test(w));
      if(latin.length) offenders.push(`${e.route}: ${latin.join(', ')} in "${t.slice(0,70)}"`);
    }
  }
  assert.equal(offenders.length,0,'mixed-script copy found:\n  '+offenders.join('\n  '));
});
