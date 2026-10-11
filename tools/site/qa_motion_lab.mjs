import assert from 'node:assert/strict';
export default async function(page){
 const base=new URL(page.url()).origin;
 const results=[];
 for(const suffix of ['', '?render=2d']){
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base+'/game/'+suffix);
  await page.waitForSelector('[data-lab-boot="ready"]');
  await page.locator('#labCanvas').scrollIntoViewIfNeeded();await page.waitForFunction(()=>Number(document.querySelector('#labCanvas').dataset.renderFrames)>0);
  await page.waitForFunction(()=>document.querySelector('#labCanvas').dataset.motionState==='idle');
  const before=await page.locator('#labCanvas').getAttribute('data-renderFrames');await page.waitForTimeout(400);
  assert.equal(await page.locator('#labCanvas').getAttribute('data-renderFrames'),before,'reduced renderer keeps drawing');
  await page.getByRole('button',{name:'+15 min',exact:true}).click();
  await page.waitForFunction(n=>Number(document.querySelector('#labCanvas').dataset.renderFrames)>Number(n),before);
  await page.locator('.science-footer').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('#labCanvas').dataset.motionState==='offscreen');
  const hidden=await page.locator('#labCanvas').getAttribute('data-renderFrames');await page.waitForTimeout(300);assert.equal(await page.locator('#labCanvas').getAttribute('data-renderFrames'),hidden);
  results.push({renderer:await page.locator('#labCanvas').getAttribute('data-renderer'),reducedMotionStable:true,stateUpdateRendered:true,offscreenStable:true});
 }
 return {passed:true,results};
}
