const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {JSDOM}=require('jsdom');
test('all SEO routes contain static content, unique metadata, canonical URLs, and valid internal links',()=>{
 try {
 execFileSync(process.execPath,['scripts/generate-seo.mjs'],{env:{...process.env,SITE_URL:'https://worth.example'}});
 const sitemap=fs.readFileSync('public/sitemap.xml','utf8');
 const urls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
 // 7 base + 40 parasite = 47
 assert.ok(urls.length>=47, `Expected at least 47 URLs, got ${urls.length}`);
 const titles=new Set();const descriptions=new Set();
 for(const url of urls){const rawPathname=new URL(url).pathname;let path=rawPathname;try{path=decodeURIComponent(rawPathname);}catch{};const filePath=path==='/'?'.generated/home.html':'.'+path+'index.html';const altPath='.'+rawPathname+'index.html';let html;try{html=fs.readFileSync(filePath,'utf8');}catch{html=fs.readFileSync(altPath,'utf8');}const dom=new JSDOM(html);const d=dom.window.document;
 const canon=d.querySelector('link[rel=canonical]');assert.ok(canon,'Missing canonical for '+url);let canonHref=canon.href;try{canonHref=decodeURIComponent(canonHref);}catch{};let urlDecoded=url;try{urlDecoded=decodeURIComponent(url);}catch{};assert.equal(canonHref,urlDecoded, `Canonical mismatch for ${url}: got ${canon.href}`);const robotsMeta=d.querySelector('meta[name="robots"]');if(robotsMeta){assert.ok(!robotsMeta.content.includes('noindex'), `Should not be noindex for ${url}`);assert.ok(robotsMeta.content.includes('index'), `Robots should contain index for ${url}`);}assert.equal(d.querySelectorAll('h1').length,1);titles.add(d.title);descriptions.add(d.querySelector('meta[name=description]').content);assert.ok(d.querySelector('main').textContent.length>1000, `Short main for ${url}`);if(path.startsWith('/guides/'))assert.ok(d.querySelectorAll('article h2').length>=2, `Guide ${url} should have at least 2 h2`);assert.ok(JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent)['@graph'].length>=2);
 for(const a of d.querySelectorAll('a[href^="/"]')){const rawPath=new URL(a.getAttribute('href'),'https://worth.example').pathname;let target=rawPath;try{target=decodeURIComponent(rawPath);}catch{};assert.ok(target==='/'||fs.existsSync('.'+target+'index.html')||fs.existsSync('.'+target)||fs.existsSync('.'+rawPath+'index.html'),'Broken link '+rawPath+' (decoded '+target+') in '+url);}
 if(path.includes('subscription-cost')){assert.equal(d.getElementById('price').value,'15');assert.equal(d.getElementById('hours').textContent,'7.2');}
 if(path.includes('daily-savings'))assert.equal(d.getElementById('hours').textContent,'$1,825');
 dom.window.close();}
 assert.equal(titles.size,urls.length, 'Titles should be unique');assert.equal(descriptions.size,urls.length, 'Descriptions should be unique');assert.match(fs.readFileSync('public/robots.txt','utf8'),/Sitemap: https:\/\/worth.example\/sitemap.xml/);
 // Check extra SEO files exist for parasite 24h ranking
 assert.ok(fs.existsSync('public/feed.xml'), 'feed.xml should exist');
 assert.ok(fs.existsSync('public/llms.txt'), 'llms.txt should exist');
 assert.ok(fs.existsSync('public/sitemap-extra.xml'), 'sitemap-extra.xml should exist');
 }finally{execFileSync(process.execPath,['scripts/generate-seo.mjs'],{env:{...process.env,SITE_URL:''}});}
});
test('unconfigured previews are noindex and cannot pass production guard',()=>{const html=fs.readFileSync('.generated/home.html','utf8');assert.match(html,/noindex, nofollow/);assert.equal(fs.existsSync('public/sitemap.xml'),false);assert.throws(()=>execFileSync(process.execPath,['scripts/generate-seo.mjs'],{env:{...process.env,SITE_URL:'',REQUIRE_SITE_URL:'1'},stdio:'pipe'}));});
