"""Apply editorial navigation updates once, repeatably; never generate findings.
Dates below refer to this explicit 2026-10-04 editorial change, not execution time.
"""
import html
import json
import re
from datetime import date
from seo_audit import ROOT, SITE, Page

SHARED = {'vision-contamination-detection', 'edge-ai-biological-systems', 'single-cell-microalgae-microfluidics'}


def build():
    for path in sorted((ROOT / 'blog').glob('*.html')):
        if path.stem in ('index', 'single-cell-microalgae-microfluidics'): continue
        text = path.read_text(encoding='utf-8'); page = Page(text)
        published = page.meta.get('article:published_time', '')
        # Visible publication date must agree with the original machine-readable date.
        if published:
            d = date.fromisoformat(published)
            shown = d.strftime('%B') + ' ' + str(d.day) + ', ' + str(d.year)
            text = re.sub(r'<p class="art-meta">.*?</p>',
                '<p class="art-meta">By <a href="/research/">Orr Biologicals</a> · Published <time datetime="' + published + '">' + shown + '</time> · Navigation and context updated <time datetime="2026-10-04">October 4, 2026</time></p>', text, count=1, flags=re.S)
        if 'article:modified_time' not in text:
            text = text.replace('</head>', '<meta property="article:modified_time" content="2026-10-04">\n</head>', 1)
        if '<!-- SEO:CONTEXT:START -->' not in text:
            concept = 'Cyanoflow and shared imaging methods' if path.stem in SHARED else 'Algaephyte cultivation and control'
            context = '\n<section class="prose" aria-label="Research context"><!-- SEO:CONTEXT:START -->\n'
            context += '<h2>Research context and limitations</h2><p>This note belongs to <a href="/research/">' + concept + '</a>. Algaephyte and Cyanoflow are research concepts in development. Architecture descriptions are design goals; simulations are not laboratory measurements. Older numerical, biological and safety statements need checking against the relevant source and conditions.</p>\n'
            context += '<h2>Source-linked reading</h2><p>For optical measurements and biomass proxies, see <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9368473/">Schagerl et al. (2022), the roadmap for reliable microalgal biomass and vitality measurements</a>. This is methodological background, not verification of every claim in this note.</p>\n'
            if path.stem in SHARED:
                context += '<p>For experimentally studied single-cell methods, see <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7467707/">Behrendt et al. (2020), PhenoChip</a>. This is a different research group’s work, not evidence of Cyanoflow performance.</p>\n'
            context += '<h2>Continue the topic</h2><p><a href="/research/">Research methods and topic directory</a> · <a href="/glossary">Definitions of cultivation, sensing and single-cell terms</a> · '
            if path.stem in SHARED:
                context += '<a href="/blog/single-cell-microalgae-microfluidics">Single-cell microalgae microfluidics and validation</a> · <a href="/cyanoflow">The proposed Cyanoflow workflow</a>'
            else:
                context += '<a href="/#inside">The proposed Algaephyte cultivation architecture</a> · <a href="/blog/#kb">All cultivation and control notes</a>'
            context += '</p><p><a href="/disclaimer">Scientific and safety limitations</a>: visual appearance and high pH do not certify culture identity or food safety.</p>\n<!-- SEO:CONTEXT:END --></section>\n'
            text = text.replace('  <nav class="art-foot"', context + '  <nav class="art-foot"', 1)
        # Existing commercial CTA conflicts with the current project status.
        text = text.replace('Reserve a reactor', 'Discuss the research concept')
        text = text.replace('href="/#deploy">Pilot access', 'href="/#deploy">Contact')
        # Preserve original schema author/publication, align updated navigation date.
        def schema(match):
            data = json.loads(match.group(1)); graph = data.get('@graph', [data])
            for item in graph:
                if item.get('@type') in ('Article', 'BlogPosting'):
                    item['dateModified'] = '2026-10-04'
                    item['author'] = {'@type': 'Organization', 'name': 'Orr Biologicals', 'url': SITE + '/research/'}
            return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + '</script>'
        text = re.sub(r'<script type="application/ld\+json">(.*?)</script>', schema, text, flags=re.S)
        page = Page(text)
        if not any(x.get('@type') == 'BreadcrumbList' for x in page.schemas):
            crumb = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
                {'@type': 'ListItem', 'position': 1, 'name': 'Orr Biologicals', 'item': SITE + '/'},
                {'@type': 'ListItem', 'position': 2, 'name': 'Research notes', 'item': SITE + '/blog/'},
                {'@type': 'ListItem', 'position': 3, 'name': page.headings['h1'][0], 'item': page.canonical}]}
            text = text.replace('</head>', '<script type="application/ld+json">' + json.dumps(crumb, ensure_ascii=False) + '</script>\n</head>', 1)
        # Breadcrumbs must exist visibly, not only in JSON-LD.
        text = re.sub(r'<nav class="art-top" aria-label="Breadcrumb">.*?</nav>',
            '<nav class="art-top" aria-label="Breadcrumb"><a href="/">Orr Biologicals</a> / <a href="/blog/">Research notes</a> / <span>' + html.escape(page.headings['h1'][0]) + '</span></nav>', text, count=1, flags=re.S)
        path.write_text(text, encoding='utf-8')
    print('Enriched existing research notes without deleting routes or findings')


if __name__ == '__main__': build()
