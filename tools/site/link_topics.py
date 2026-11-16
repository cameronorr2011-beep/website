"""Idempotent topic links; stable article/pillar URLs remain intact."""
import html
import re
from seo_audit import ROOT


def block_for(path):
    if path.parent == ROOT / 'applications' and path.name == 'index.html':
        return '<p>Choose a starting question: <a href="/algae-biotechnology/">what algae biotechnology includes</a>, <a href="/microalgae-cultivation/">how cultivation inputs interact</a>, or <a href="/photobioreactors/">how reactor geometry changes the environment</a>. Open an application above to connect that background to a repeatable bench protocol.</p>'
    if ROOT / 'applications' in path.parents:
        topic = path.parent.name
        current = html.escape(path.parent.parent.name + '/' + path.parent.name + '/', quote=False)
        return f'<p>This protocol connects to <a href="/algae-biotechnology/">algae biotechnology fundamentals</a>, <a href="/microalgae-cultivation/">cultivation conditions and monitoring</a>, and <a href="/research/">how we separate observations from guesses</a>. Protocols are educational starting points — not validated production protocols.</p>'
    imaging = path.stem in ('vision-contamination-detection', 'edge-ai-biological-systems')
    if imaging:
        return '<p>Image measurements connect <a href="/cyanoflow">Cyanoflow single-cell research</a> and <a href="/algaephyte/">Algaephyte cultivation monitoring</a>, but the questions differ. Read <a href="/blog/single-cell-microalgae-microfluidics">single-cell tracking and phenotype validation</a> before interpreting image-derived candidates.</p>'
    return '<p>This supporting note connects to <a href="/microalgae-cultivation/">microalgae cultivation fundamentals</a>, <a href="/photobioreactors/">photobioreactor design and measurement</a>, and <a href="/algaephyte/">Algaephyte’s proposed cultivation architecture</a>. Follow those pillars for related light, chemistry, sensor and control explanations.</p>'


TRAILER = '<p><a href="/research/">Methodology and evidence status</a> · <a href="/glossary">Scientific definitions</a> · <a href="/disclaimer">Safety and scope</a>.</p><!-- SEO:TOPICS:END --></section>\n'


def section(inner):
    return '<section class="prose" aria-label="Connected topics"><!-- SEO:TOPICS:START --><h2>Connect this guide to the wider research</h2>' + inner + TRAILER


def build():
    paths = (sorted((ROOT / 'applications').rglob('*.html'))
             + sorted((ROOT / 'blog').glob('*.html'))
             + [ROOT / 'microalgae-cultivation' / 'index.html'])
    for path in paths:
        if path == ROOT / 'blog/index.html' or path.stem == 'single-cell-microalgae-microfluidics':
            continue
        text = path.read_text(encoding='utf-8')
        block = section(block_for(path))
        if '<!-- SEO:TOPICS:START -->' in text:
            text = re.sub(r'<section class="prose" aria-label="Connected topics">.*?<!-- SEO:TOPICS:END --></section>\n?', block, text, flags=re.S)
        else:
            marker = '</main>'
            if marker not in text:
                raise ValueError('Missing topic insertion point: ' + str(path))
            text = text.replace(marker, block + marker, 1)
        path.write_text(text, encoding='utf-8')
    print('Built contextual topic links across applications, pillars and supporting notes')


if __name__ == '__main__':
    build()
