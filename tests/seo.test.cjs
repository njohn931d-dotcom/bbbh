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
 assert.equal(urls.length,53);
 const titles=new Set();const descriptions=new Set();
 for(const url of urls){const path=new URL(url).pathname;const html=fs.readFileSync(path==='/'?'.generated/home.html':'.'+path+'index.html','utf8');const dom=new JSDOM(html);const d=dom.window.document;
 assert.equal(d.querySelector('link[rel=canonical]').href,url);assert.equal(d.querySelector('meta[name=robots]'),null);assert.equal(d.querySelectorAll('h1').length,1);titles.add(d.title);descriptions.add(d.querySelector('meta[name=description]').content);assert.ok(d.querySelector('main').textContent.length>1000);if(path.startsWith('/guides/'))assert.equal(d.querySelectorAll('article h2').length,4);assert.ok(JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent)['@graph'].length>=2);
 for(const a of d.querySelectorAll('a[href^="/"]')){const target=new URL(a.getAttribute('href'),'https://worth.example').pathname;assert.ok(target==='/'||fs.existsSync('.'+target+'index.html'),'Broken link '+target);}
 if(path.startsWith('/articles/')&&path.split('/').length>4){const art=d.querySelector('article.seo-article');assert.ok(art.textContent.length>1500,'thin article '+path);assert.ok(art.querySelectorAll('table,ul,ol').length>=2,'no data blocks '+path);assert.ok(d.querySelectorAll('a[href^="/articles/"]').length>=3,'not enough internal article links '+path);assert.ok(JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent)['@graph'].some(n=>n['@type']==='Article'),'missing Article schema '+path);}
 if(path.includes('subscription-cost')){assert.equal(d.getElementById('price').value,'15');assert.equal(d.getElementById('hours').textContent,'7.2');}
 if(path.includes('daily-savings'))assert.equal(d.getElementById('hours').textContent,'$1,825');
 dom.window.close();}
 assert.equal(titles.size,53);assert.equal(descriptions.size,53);assert.match(fs.readFileSync('public/robots.txt','utf8'),/Sitemap: https:\/\/worth.example\/sitemap.xml/);
 }finally{execFileSync(process.execPath,['scripts/generate-seo.mjs'],{env:{...process.env,SITE_URL:''}});}
});
test('unconfigured previews are noindex and cannot pass production guard',()=>{const html=fs.readFileSync('.generated/home.html','utf8');assert.match(html,/noindex, nofollow/);assert.equal(fs.existsSync('public/sitemap.xml'),false);assert.throws(()=>execFileSync(process.execPath,['scripts/generate-seo.mjs'],{env:{...process.env,SITE_URL:'',REQUIRE_SITE_URL:'1'},stdio:'pipe'}));});
