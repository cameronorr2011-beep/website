import assert from 'node:assert/strict';
export default async function(page) {
  const base = new URL(page.url()).origin;
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('ob-cookie-consent',JSON.stringify({v:'1',choice:'essential'})));
  const routes=['/','/algaephyte/','/cyanoflow','/research/','/blog/','/glossary','/privacy','/terms','/disclaimer','/downloads/','/game/'];
  const layouts=[];
  for(const width of [390,1280]) {
    await page.setViewportSize({width,height:850});
    for(const route of routes) {
      const response=await page.goto(base+route);assert.equal(response.status(),200,route);
      await page.locator('h1').waitFor();
      if(route==='/blog/') await page.waitForFunction(()=>[...document.querySelectorAll('.pick-card')].some(e=>!e.hidden)||!document.getElementById('pkFail').hidden);
      await page.waitForFunction(()=>[...document.images].filter(i=>i.loading!=='lazy').every(i=>i.complete));
      const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,h1:document.querySelectorAll('h1').length,nav:document.querySelectorAll('#nav').length,menus:document.querySelectorAll('#mobileMenu').length,footer:document.querySelectorAll('.science-footer').length,broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)}));
      assert.equal(state.overflow,false,`${width} ${route} overflows`);assert.equal(state.nav,1);assert.equal(state.menus,1);assert.equal(state.footer,1);assert.equal(state.h1,1);assert.deepEqual(state.broken,[]);
      layouts.push({width,route,...state});
    }
  }
  await page.setViewportSize({width:390,height:850});await page.goto(base+'/');
  await page.getByRole('button',{name:'Menu',exact:true}).click();assert.equal(await page.locator('#mobileMenu').isVisible(),true);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#mobileMenu').isVisible(),false);
  assert.equal(await page.locator('#navToggle').evaluate(e=>document.activeElement===e),true);
  const light=page.getByRole('slider',{name:'Light at vessel wall'});
  const initial=await page.locator('#oBio').innerText();await light.focus();await page.keyboard.press('End');
  assert.notEqual(await page.locator('#oBio').innerText(),initial);
  await page.getByRole('button',{name:'Reset model'}).click();assert.equal(await page.locator('#oBio').innerText(),initial);
  await page.locator('#cultureSim').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.getElementById('cultureSim').dataset.motionState==='idle');
  const frames=await page.locator('#cultureSim').getAttribute('data-frames');await page.waitForTimeout(300);assert.equal(await page.locator('#cultureSim').getAttribute('data-frames'),frames,'idle canvas keeps drawing');
  await page.goto(base+'/#system');assert.equal(await page.locator('#technical-notes').getAttribute('open'),'');
  await page.locator('#dVol').fill('20');assert.match(await page.locator('#doseOut').innerText(),/56\.0/);
  await page.locator('#dVol').fill('-2');assert.match(await page.locator('#doseOut').innerText(),/valid values/);
  await page.goto(base+'/#stack');const culture=page.getByRole('tab',{name:'01 Culture'});await culture.focus();await page.keyboard.press('ArrowDown');assert.equal(await page.getByRole('tab',{name:'02 Sense'}).getAttribute('aria-selected'),'true');
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base+'/');await page.locator('#cultureSim').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.getElementById('cultureSim').dataset.motionState==='idle');
  const reducedFrames=await page.locator('#cultureSim').getAttribute('data-frames');await page.waitForTimeout(300);assert.equal(await page.locator('#cultureSim').getAttribute('data-frames'),reducedFrames);
  assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
  await page.goto(base+'/cyanoflow');assert.equal(await page.locator('#simToggle').isDisabled(),true);
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(base+'/cyanoflow');
  const sliders=page.locator('input[type=range]');const sliderCount=await sliders.count();assert.ok(sliderCount>=2);
  for(let i=0;i<sliderCount;i++){await sliders.nth(i).focus();await page.keyboard.press('ArrowRight');}
  await page.setViewportSize({width:1280,height:850});await page.goto(base+'/');await page.screenshot({path:'docs/redesign-desktop.png',fullPage:false});
  await page.setViewportSize({width:390,height:850});await page.screenshot({path:'docs/redesign-mobile.png',fullPage:false});
  assert.deepEqual(errors,[]);
  return {passed:true,layouts:layouts.length,controls:'menu, keyboard sliders, reset, calculator, tabs, deep links',motion:'idle and reduced-motion canvases stable; no active reduced-motion animations',errors};
}
