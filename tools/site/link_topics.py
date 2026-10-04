"""Idempotent topic links; stable existing article/species URLs remain intact."""
import html
import json
import re
from seo_audit import ROOT, SITE, Page


def build():
    for path in sorted((ROOT / 'applications').rglob('*.html')) + sorted((ROOT / 'blog').glob('*.html')):
        if path == ROOT / 'blog/index.html' or path.stem == 'single-cell-microalgae-microfluidics': continue
        text = path.read_text(encoding='utf-8')
        species = path.parent.name == 'species'
        block = '<section class="prose" aria-label="Connected topics"><!-- SEO:TOPICS:START --><h2>Connect this guide to the wider research</h2>'
        if species:
            block += '<p>Use this organism profile with <a href="/microalgae-cultivation/">microalgae cultivation conditions and measurements</a>, not as a universal recipe. The <a href="/photobioreactors/">photobioreactor explainer</a> connects organism needs to light paths, mixing and gas exchange. <a href="/applications/#species">Compare the species guides</a> before transferring a protocol between strains.</p>'
            block += '<p>For population-level cultivation, see <a href="/algaephyte/">Algaephyte’s sensor and model research concept</a>. For differences between individual cells, see <a href="/blog/single-cell-microalgae-microfluidics">single-cell microalgae analysis</a> and the <a href="/cyanoflow">Cyanoflow concept</a>. Neither platform is validated for this organism.</p>'
        elif path == ROOT / 'applications/index.html':
            block += '<p>Choose a starting question: <a href="/algae-biotechnology/">what algae biotechnology includes</a>, <a href="/microalgae-cultivation/">how cultivation inputs interact</a>, or <a href="/photobioreactors/">how reactor geometry changes the environment</a>. Use the application guides below to connect that background to species and live-feed questions.</p>'
        elif path.parent.name == 'applications':
            block += '<p>Connect this application to <a href="/algae-biotechnology/">algae biotechnology fundamentals</a>, <a href="/microalgae-cultivation/">cultivation conditions and monitoring</a>, and <a href="/applications/#species">organism-specific profiles</a>. Species and strain differences can change the outcome; an educational guide is not a validated production protocol.</p>'
        else:
            imaging = path.stem in ('vision-contamination-detection', 'edge-ai-biological-systems')
            if imaging:
                block += '<p>Image measurements connect <a href="/cyanoflow">Cyanoflow single-cell research</a> and <a href="/algaephyte/">Algaephyte cultivation monitoring</a>, but the questions differ. Read <a href="/blog/single-cell-microalgae-microfluidics">single-cell tracking and phenotype validation</a> before interpreting image-derived candidates.</p>'
            else:
                block += '<p>This supporting note connects to <a href="/microalgae-cultivation/">microalgae cultivation fundamentals</a>, <a href="/photobioreactors/">photobioreactor design and measurement</a>, and <a href="/algaephyte/">Algaephyte’s proposed cultivation architecture</a>. Follow those pillars for related light, chemistry, sensor and control explanations.</p>'
        block += '<p><a href="/research/">Methodology and evidence status</a> · <a href="/glossary">Scientific definitions</a> · <a href="/disclaimer">Safety and scope</a>.</p><!-- SEO:TOPICS:END --></section>\n'
        if '<!-- SEO:TOPICS:START -->' in text:
            text = re.sub(r'<section class="prose" aria-label="Connected topics">.*?<!-- SEO:TOPICS:END --></section>\n?', block, text, flags=re.S)
        else:
            marker = '<nav class="art-foot"' if '<nav class="art-foot"' in text else '<!-- Hero -->'
            if marker not in text: raise ValueError('Missing topic insertion point: ' + str(path))
            text = text.replace(marker, block + marker, 1)
        if path == ROOT / 'applications/index.html':
            text = text.replace('<h1>Microalgae, without the guesswork</h1>', '<h1>Microalgae knowledge: cultivation, species and applications</h1>')
            text = re.sub(r'<p>The guides above describe.*?</p>', '<p>Algaephyte proposes culture-level sensing, growth modeling and bounded control. The guides connect the biological questions to that design, but no platform performance, contamination-detection accuracy or species-specific deployment has been validated.</p>', text, count=1)
            text = text.replace('Algaephyte began as a Spirulina reactor.', 'Algaephyte began as a Spirulina cultivation concept.')
            text = text.replace('<a class="cta" href="/#deploy">See how it works</a>', '<a class="cta" href="/algaephyte/">Explore the research design</a>')
        if path.parent.name in ('applications', 'species'):
            page = Page(text)
            label = 'Species' if species else 'Applications'
            crumb = '<nav class="art-top" aria-label="Breadcrumb"><a href="/">Orr Biologicals</a> / <a href="/applications/">Microalgae knowledge</a>'
            if species: crumb += ' / <a href="/applications/#species">Species</a>'
            crumb += ' / <span>' + html.escape(page.headings['h1'][0]) + '</span></nav>'
            if '<nav class="art-top" aria-label="Breadcrumb">' in text:
                text = re.sub(r'<nav class="art-top" aria-label="Breadcrumb">.*?</nav>', crumb, text, count=1, flags=re.S)
            elif path == ROOT / 'applications/index.html':
                text = text.replace('  <!-- Hero -->', crumb + '\n  <!-- Hero -->', 1)
            published = Page(text).meta.get('article:published_time')
            if 'article:modified_time' in text:
                text = re.sub(r'(property="article:modified_time" content=")[^"]*', r'\g<1>2026-10-04', text)
            else:
                text = text.replace('</head>', '<meta property="article:modified_time" content="2026-10-04">\n</head>', 1)
            def schema(m):
                data = json.loads(m.group(1))
                for node in data.get('@graph', [data]):
                    if node.get('@type') == 'Article': node['dateModified'] = '2026-10-04'
                return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + '</script>'
            text = re.sub(r'<script type="application/ld\+json">(.*?)</script>', schema, text, flags=re.S)
            if published and 'Context and links updated' not in text:
                text = re.sub(r'(<p class="art-meta">.*?)(</p>)', r'\1 · Context and links updated <time datetime="2026-10-04">October 4, 2026</time>\2', text, count=1)
        path.write_text(text, encoding='utf-8')
    print('Built contextual pillar links across applications, species and supporting notes')


if __name__ == '__main__': build()
