"""Daily static SEO build. The editorial index.html is authoritative.
Legacy PowerShell assembly is deliberately not used. No API keys required.
"""
import html
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'blog'))
from build_kb_index import parse_articles
from seo_audit import ROOT, SITE, Page, pages, route


def build():
    articles = parse_articles()
    kb = {'counts': {'algaephyte': sum(a['product'] != 'Cyanoflow' for a in articles),
                     'cyanoflow': sum(a['product'] == 'Cyanoflow' for a in articles), 'total': len(articles)},
          'algaephyte': [a for a in articles if a['product'] != 'Cyanoflow'],
          'cyanoflow': [a for a in articles if a['product'] == 'Cyanoflow']}
    (ROOT / 'blog/data/kb.json').write_text(json.dumps(kb, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    directory = []
    for key, label in (('algaephyte', 'Algaephyte — cultivation, sensing and bounded control'),
                       ('cyanoflow', 'Cyanoflow and shared imaging methods')):
        directory.append('<h3 class="kb-h">' + label + '</h3>\n<div class="rot-grid kb-grid">')
        for a in kb[key]:
            directory.append('<a class="rot-card kb-card" href="' + html.escape(a['url'], quote=True) + '"><span class="rt-body">'
                + '<span class="kb-tag">' + html.escape(a['product']) + '</span><h3>' + html.escape(a['title']) + '</h3>'
                + '<p>' + html.escape(a['dek']) + '</p><span class="rt-foot"><b>' + html.escape(a['date'])
                + '</b><span class="rt-go">Read the note</span></span></span></a>')
        directory.append('</div>')
    path = ROOT / 'blog/index.html'; text = path.read_text(encoding='utf-8')
    text, n = re.subn(r'<!-- SEO:KNOWLEDGE:START -->.*?<!-- SEO:KNOWLEDGE:END -->',
        '<!-- SEO:KNOWLEDGE:START -->\n' + '\n'.join(directory) + '\n<!-- SEO:KNOWLEDGE:END -->', text, flags=re.S)
    if n != 1: raise ValueError('Blog requires exactly one static directory marker pair')
    path.write_text(text, encoding='utf-8')
    cyano = ROOT / 'cyanoflow.html'
    text = cyano.read_text(encoding='utf-8')
    links = '\n'.join('<a href="' + html.escape(a['url'], quote=True) + '" style="display:block;padding:16px 18px;border:1px solid var(--rule);border-radius:12px">' + html.escape(a['title']) + '</a>' for a in kb['cyanoflow'])
    text, n = re.subn(r'<!-- SEO:CYANO:START -->.*?<!-- SEO:CYANO:END -->', '<!-- SEO:CYANO:START -->\n' + links + '\n<!-- SEO:CYANO:END -->', text, flags=re.S)
    if n != 1: raise ValueError('Cyanoflow requires one static research marker pair')
    cyano.write_text(text, encoding='utf-8')
    ns = 'http://www.sitemaps.org/schemas/sitemap/0.9'
    ET.register_namespace('', ns); tree = ET.Element('{' + ns + '}urlset')
    count = 0; seen = set()
    for path in pages():
        page = Page(path.read_text(encoding='utf-8-sig'))
        if 'noindex' in page.robots: continue
        canonical = SITE + route(path)
        if page.canonical != canonical: raise ValueError(f'Canonical mismatch: {path.name}: {page.canonical}')
        if canonical in seen: raise ValueError('Duplicate canonical: ' + canonical)
        seen.add(canonical); count += 1
        item = ET.SubElement(tree, '{' + ns + '}url')
        ET.SubElement(item, '{' + ns + '}loc').text = canonical
        # Only explicit dates: never use filesystem mtime or today's build date.
        modified = page.meta.get('article:modified_time', '')
        if modified:
            if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', modified): raise ValueError('Invalid modified date: ' + canonical)
            ET.SubElement(item, '{' + ns + '}lastmod').text = modified
    ET.indent(tree, space='  ')
    ET.ElementTree(tree).write(ROOT / 'sitemap.xml', encoding='utf-8', xml_declaration=True)
    print(f'SEO build: {len(articles)} static knowledge notes; {count} canonical indexable sitemap URLs')


if __name__ == '__main__': build()
