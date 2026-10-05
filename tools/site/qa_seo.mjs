import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

export default async function run(page) {
  const live = new URL(page.url()).hostname === 'orrbiologicals.com';
  const base = live ? 'https://orrbiologicals.com' : 'http://127.0.0.1:8876';
  const out = live ? 'docs/seo/live-browser.json' : 'docs/seo/local-browser.json';
  const errors = [], failures = [], results = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('requestfailed', request => failures.push({url: request.url(), error: request.failure()?.errorText}));
  await page.context().addInitScript(() => {
    window.__seoMetrics = {lcp: null, cls: 0, longTasks: []};
    new PerformanceObserver(list => {for (const x of list.getEntries()) window.__seoMetrics.lcp = x.startTime;}).observe({type: 'largest-contentful-paint', buffered: true});
    new PerformanceObserver(list => {for (const x of list.getEntries()) if (!x.hadRecentInput) window.__seoMetrics.cls += x.value;}).observe({type: 'layout-shift', buffered: true});
    new PerformanceObserver(list => {for (const x of list.getEntries()) window.__seoMetrics.longTasks.push(x.duration);}).observe({type: 'longtask', buffered: true});
  });
  const localURLs = JSON.parse(readFileSync('docs/seo/current/pages.json', 'utf8')).filter(x => x.indexability === 'indexable').map(x => new URL(x.url).pathname);
  const routes = live ? ['/', '/cyanoflow', '/blog/', '/applications/', '/blog/spirulina-is-a-cyanobacterium'] : localURLs;
  for (const path of routes) {
    const response = await page.goto(base + path, {waitUntil: 'load'});
    if (response.status() !== 200) throw new Error(`${path}: ${response.status()}`);
    // Collect buffered lab entries in the page itself (portable across runners).
    await page.evaluate(async () => {
      window.__seoMetrics = {lcp:null,cls:0,longTasks:[]};
      const observers = [];
      for (const [type, collect] of [
        ['largest-contentful-paint', x => {window.__seoMetrics.lcp=x.startTime;}],
        ['layout-shift', x => {if(!x.hadRecentInput)window.__seoMetrics.cls+=x.value;}],
        ['longtask', x => {window.__seoMetrics.longTasks.push(x.duration);}]
      ]) {const observer=new PerformanceObserver(list => list.getEntries().forEach(collect)); observer.observe({type,buffered:true});observers.push(observer);}
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      observers.forEach(x => x.disconnect());
    });
    const data = await page.evaluate(() => ({title: document.title,
      h1: [...document.querySelectorAll('h1')].map(x => x.textContent.trim()),
      canonical: document.querySelector('[rel=canonical]')?.href,
      schemas: [...document.querySelectorAll('script[type="application/ld+json"]')].map(x => JSON.parse(x.textContent)),
      nav: performance.getEntriesByType('navigation').map(x => ({ttfb: x.responseStart, domContentLoaded: x.domContentLoadedEventEnd})),
      metrics: window.__seoMetrics,
      payload: performance.getEntriesByType('resource').reduce((a, x) => {
        a.requests++; a.transferred += x.transferSize;
        if (/\.js(?:\?|$)/.test(x.name)) a.js += x.transferSize;
        if (/\.css(?:\?|$)/.test(x.name)) a.css += x.transferSize;
        if (/\.(jpg|png|svg)(?:\?|$)/.test(x.name)) a.images += x.transferSize;
        return a;
      }, {requests: 0, transferred: 0, js: 0, css: 0, images: 0})}));
    if (!data.title || data.h1.length !== 1 || !data.canonical) throw new Error(`Metadata missing: ${path}`);
    results.push({path, status: response.status(), ...data});
  }
  const mobile = [];
  const checkpoint = () => {mkdirSync('docs/seo', {recursive:true}); writeFileSync(out, JSON.stringify({target:base,results,mobile,errors,failures,incomplete:true},null,2));};
  checkpoint();
  await page.setViewportSize({width: 390, height: 844});
  for (const path of live ? ['/', '/cyanoflow', '/blog/'] : ['/', '/cyanoflow', '/blog/', '/research/', '/glossary', '/blog/single-cell-microalgae-microfluidics', '/algae-biotechnology/', '/microalgae-cultivation/', '/photobioreactors/', '/algaephyte/', '/applications/', '/applications/species/pavlova']) {
    await page.goto(base + path, {waitUntil: 'load'});
    const measure = await page.evaluate(() => ({width: innerWidth, scrollWidth: document.documentElement.scrollWidth}));
    mobile.push({path, ...measure}); checkpoint();
    if (measure.scrollWidth > measure.width + 1) throw new Error(`Mobile overflow: ${path}: ${JSON.stringify(measure)}`);
    const menu = page.locator('#navToggle');
    await menu.click();
    if (await menu.getAttribute('aria-expanded') !== 'true') throw new Error(`Mobile menu failed: ${path}`);
    await menu.click();
  }
  await page.goto(base + '/', {waitUntil: 'load'});
  const before = await page.locator('#oBio').textContent();
  await page.locator('[data-ctl="light"] input').evaluate(input => {input.value = '0.1'; input.dispatchEvent(new Event('input', {bubbles: true}));});
  const after = await page.locator('#oBio').textContent();
  if (before === after) throw new Error('Cultivation simulation did not respond to slider input');
  await page.setViewportSize({width:1280, height:900});
  await page.goto(base + '/cyanoflow', {waitUntil: 'load'});
  const toggle = page.locator('#simToggle');
  // The card has a continuous float animation; use the accessible keyboard
  // interface rather than a pointer action that waits for geometric stability.
  await toggle.focus(); await toggle.press('Space');
  const pauseLabel = await toggle.textContent();
  if (!/RESUME|PLAY|RUN/i.test(pauseLabel)) throw new Error(`Cyanoflow simulation did not pause: ${pauseLabel}`);
  const noJS = await page.context().browser().newContext({javaScriptEnabled: false});
  const plain = await noJS.newPage(); await plain.goto(base + '/blog/');
  const staticLinks = await plain.locator('#kb a[href^="/blog/"]').count();
  if (!live && staticLinks !== 23) throw new Error(`Static directory missing: ${staticLinks}`);
  await noJS.close();
  const redirects = [];
  if (live) {
    for (const path of ['/index.html', '/blog/index.html', '/cyanoflow.html', '/control-loop-architecture', '/pavlova-lutheri', '/cyanoflow/', '/seo-audit-nonexistent-20261004']) {
      const response = await page.goto(base + path, {waitUntil: 'domcontentloaded'});
      const chain = []; let request = response.request();
      while (request) {chain.unshift(request.url()); request = request.redirectedFrom();}
      redirects.push({path, status: response.status(), finalURL: page.url(), chain});
    }
  }
  const report = {testedAt: new Date().toISOString(), target: base, results, mobile,
    simulation: {before, after, pauseLabel}, staticKnowledgeLinksWithoutJS: staticLinks,
    redirects, errors, failures, fieldINP: 'Not available: these are lab/browser checks, not real-user field metrics'};
  mkdirSync('docs/seo', {recursive: true}); writeFileSync(out, JSON.stringify(report, null, 2));
  if (errors.length || (!live && failures.length)) throw new Error(`Browser errors: ${JSON.stringify({errors, failures})}`);
  return {report: out, pages: results.length, mobile, simulation: report.simulation, staticLinks, redirects, errors, failures};
}
