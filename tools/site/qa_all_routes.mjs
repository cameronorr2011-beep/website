import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
export default async function(page){
 const base=new URL(page.url()).origin;
 const inventory=JSON.parse(await readFile('docs/redesign-seo/pages.json','utf8'));
 const list=Array.isArray(inventory)?inventory:inventory.pages;
 const routes=list.map(p=>new URL(p.url||p.canonical).pathname);
 const errors=[];const failed=[];
 page.on('pageerror',e=>errors.push({url:page.url(),message:e.message}));
 page.on('console',message=>{if(message.type()==='error')errors.push({url:page.url(),message:message.text()});});
 page.on('response',r=>{if(r.status()>=400&&['script','stylesheet','image'].includes(r.request().resourceType()))failed.push({url:r.url(),status:r.status()});});
 let checks=0;
 for(const width of [390,1280]){
  await page.setViewportSize({width,height:850});
  for(const route of routes){
   const r=await page.goto(base+route,{waitUntil:'load'});assert.equal(r.status(),200,route);
   const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,nav:document.querySelectorAll('#nav').length,heading:document.querySelectorAll('h1').length}));
   assert.equal(layout.overflow,false,`${route} at ${width}`);assert.equal(layout.nav,1);assert.equal(layout.heading,1);
   checks++;
  }
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 return {passed:true,routes:routes.length,checks,errors,failed};
}
