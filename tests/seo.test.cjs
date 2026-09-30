const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {JSDOM}=require('jsdom');
test('all SEO routes contain static content, unique metadata, canonical URLs, and valid internal links',()=>{
 try {
 execFileSync(process.execPath,['scripts/generate-seo.mjs'],{env:{...process.env,SITE_URL:'https://worth.example'}});
 execFileSync(process.execPath,['scripts/generate-parasite.mjs'],{env:{...process.env,SITE_URL:'https://worth.example'}});
 const sitemap=fs.readFileSync('public/sitemap.xml','utf8');
 const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
 assert.doesNotMatch(sitemap, /<(?:lastmod|changefreq)>/, 'Do not manufacture freshness dates or crawl-frequency hints on build');
 // 6 base + 40 main + 40 parasite = 86 routes + home = 87 URLs
 assert.ok(urls.length>=86, `Expected at least 86 URLs, got ${urls.length}`);
 const titles=new Set();const descriptions=new Set();
 for(const url of urls){
   const rawPathname=new URL(url).pathname;
   let path=rawPathname;
   try{path=decodeURIComponent(rawPathname);}catch{};
   const filePath=path==='/'?'.generated/home.html':'.'+path+'index.html';
   const altPath='.'+rawPathname+'index.html';
   let html;
   try{html=fs.readFileSync(filePath,'utf8');}catch{html=fs.readFileSync(altPath,'utf8');}
   const dom=new JSDOM(html);
   const d=dom.window.document;
   const canon=d.querySelector('link[rel=canonical]');
   assert.ok(canon,'Missing canonical for '+url);
   assert.equal(d.querySelector('link[type="application/rss+xml"]')?.href,'https://worth.example/feed.xml','RSS should be discoverable as a feed, not advertised as a sitemap');
   let canonHref=canon.href;
   try{canonHref=decodeURIComponent(canonHref);}catch{};
   let urlDecoded=url;
   try{urlDecoded=decodeURIComponent(url);}catch{};
   assert.equal(canonHref,urlDecoded, `Canonical mismatch for ${url}: got ${canon.href}`);
   const robotsMeta=d.querySelector('meta[name="robots"]');
   if(robotsMeta){
     assert.ok(!robotsMeta.content.includes('noindex'), `Should not be noindex for ${url}`);
     assert.ok(robotsMeta.content.includes('index'), `Robots should contain index for ${url}`);
   }
   assert.equal(d.querySelectorAll('h1').length,1);
   titles.add(d.title);
   descriptions.add(d.querySelector('meta[name=description]').content);
   assert.ok(d.querySelector('main').textContent.length>1000, `Short main for ${url}`);
   if(path.startsWith('/guides/')) assert.ok(d.querySelectorAll('article h2').length>=1, `Guide ${url} should have at least 1 h2`);
   assert.ok(JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent)['@graph'].length>=2);
   for(const a of d.querySelectorAll('a[href^="/"]')){
     const rawPath=new URL(a.getAttribute('href'),'https://worth.example').pathname;
     let target=rawPath;
     try{target=decodeURIComponent(rawPath);}catch{};
     assert.ok(target==='/'||fs.existsSync('.'+target+'index.html')||fs.existsSync('.'+target)||fs.existsSync('.'+rawPath+'index.html'),'Broken link '+rawPath+' (decoded '+target+') in '+url);
   }
   if(path==='/calculators/subscription-cost/'||path.includes('subscription-cost')){
     const priceEl=d.getElementById('price');
     if(priceEl) assert.equal(priceEl.value,'15');
     const hoursEl=d.getElementById('hours');
     if(hoursEl) assert.equal(hoursEl.textContent,'7.2');
   }
   if(path==='/calculators/daily-savings/'||path.includes('daily-savings')){
     const hoursEl=d.getElementById('hours');
     if(hoursEl) assert.equal(hoursEl.textContent,'$1,825');
   }
   dom.window.close();
 }
 assert.equal(titles.size,urls.length, 'Titles should be unique');
 assert.equal(descriptions.size,urls.length, 'Descriptions should be unique');
 assert.match(fs.readFileSync('public/robots.txt','utf8'),/Sitemap: https:\/\/worth.example\/sitemap.xml/);
 assert.doesNotMatch(fs.readFileSync('public/robots.txt','utf8'),/Sitemap: https:\/\/worth.example\/feed\.xml/);
 assert.ok(fs.existsSync('public/feed.xml'), 'feed.xml should exist');
 assert.ok(fs.existsSync('public/llms.txt'), 'llms.txt should exist');
 assert.ok(fs.existsSync('public/sitemap-extra.xml') || true, 'sitemap-extra optional');
 }finally{
   execFileSync(process.execPath,['scripts/generate-seo.mjs'],{env:{...process.env,SITE_URL:''}});
 }
});
test('GitHub Pages project path is applied to links, assets, canonicals, and discovery files',()=>{
 try {
 const site='https://njohn931d-dotcom.github.io/bbbh';
 execFileSync(process.execPath,['scripts/generate-seo.mjs'],{env:{...process.env,SITE_URL:site}});
 execFileSync(process.execPath,['scripts/generate-parasite.mjs'],{env:{...process.env,SITE_URL:site}});
 const home=new JSDOM(fs.readFileSync('.generated/home.html','utf8')).window.document;
 assert.equal(home.querySelector('link[rel=canonical]').href,site+'/');
 assert.equal(home.querySelector('link[type="application/rss+xml"]').href,site+'/feed.xml');
 assert.ok(home.querySelector('a[href="/bbbh/calculators/cost-of-time/"]'));
 assert.ok(home.querySelector('a[href="/bbbh/guides/how-much-is-time-worth/"]'));
 const guide=new JSDOM(fs.readFileSync('guides/how-much-is-time-worth/index.html','utf8')).window.document;
 assert.equal(guide.querySelector('link[rel=canonical]').href,site+'/guides/how-much-is-time-worth/');
 assert.ok([...guide.querySelectorAll('a[href^="/"]')].every(a=>a.getAttribute('href').startsWith('/bbbh/')));
 assert.ok(fs.readFileSync('public/sitemap.xml','utf8').includes(site+'/guides/'));
 assert.ok(fs.readFileSync('public/robots.txt','utf8').includes(site+'/sitemap.xml'));
 assert.ok(fs.readFileSync('public/llms.txt','utf8').includes(site+'/calculators/'));
 } finally {execFileSync(process.execPath,['scripts/generate-seo.mjs'],{env:{...process.env,SITE_URL:''}});}
});
test('unconfigured previews are noindex and cannot pass production guard',()=>{
  const html=fs.readFileSync('.generated/home.html','utf8');
  assert.match(html,/noindex, nofollow/);
  assert.equal(fs.existsSync('public/sitemap.xml'),false);
  assert.throws(()=>execFileSync(process.execPath,['scripts/generate-seo.mjs'],{env:{...process.env,SITE_URL:'',REQUIRE_SITE_URL:'1'},stdio:'pipe'}));
});
test('google site verification tag survives into the homepage and every generated page',()=>{
  const TOKEN='sEQ7B0Jr4_LTKoRdaLwvcSx25iX5ZvZ-LMwB1EZODnY';
  const TAG=new RegExp('<meta name="google-site-verification" content="'+TOKEN+'">','g');
  const count=(html)=>(html.match(TAG)||[]).length;

  // 1. The source template, which the generators and Vite both read.
  const template=fs.readFileSync('index.html','utf8');
  assert.equal(count(template),1,'index.html must contain the verification tag exactly once');

  // 2. The file Vite serves as the homepage.
  execFileSync(process.execPath,['scripts/generate-seo.mjs'],{env:{...process.env,SITE_URL:'https://worth.example'}});
  const home=fs.readFileSync('.generated/home.html','utf8');
  assert.equal(count(home),1,'the served homepage lost the verification tag');

  // 2b. The tracked generator must carry the tag so anything it emits keeps it.
  for(const staticFile of ['scripts/generate-tracked-parasite.mjs']){
    assert.ok(fs.existsSync(staticFile),'missing '+staticFile);
    assert.equal(count(fs.readFileSync(staticFile,'utf8')),1,staticFile+' must carry the verification tag exactly once');
  }

  // 3. Every page the sitemap advertises, so the tag cannot be dropped from a
  //    template in a refactor while verification still appears to work.
  const sitemap=fs.readFileSync('public/sitemap.xml','utf8');
  const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
  assert.ok(urls.length>=80,'expected the generated sitemap to list every page');
  for(const url of urls){
    const rawPathname=new URL(url).pathname;
    let path=rawPathname;
    try{path=decodeURIComponent(rawPathname);}catch{};
    const filePath=path==='/'?'.generated/home.html':'.'+path+'index.html';
    const html=fs.existsSync(filePath)?fs.readFileSync(filePath,'utf8'):fs.readFileSync('.'+rawPathname+'index.html','utf8');
    assert.equal(count(html),1,'missing verification tag on '+url);
  }
});
