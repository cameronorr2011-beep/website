"""Assemble the current homepage from sections/head.html and home-body.html.
Both PowerShell entrypoints delegate here through build_seo.py.
No legacy source splitting or generated-page edits are required.
"""
from seo_audit import ROOT, Page


def render():
    head = (ROOT / 'sections/head.html').read_text(encoding='utf-8').rstrip()
    body = (ROOT / 'sections/home-body.html').read_text(encoding='utf-8').rstrip()
    if not head.endswith('</head>') or '<body' not in body:
        raise ValueError('Homepage source must contain a closed head and complete body')
    text = head + '\n' + body + '\n'
    page = Page(text)
    if len(page.headings['h1']) != 1 or page.canonical != 'https://orrbiologicals.com/':
        raise ValueError('Homepage source has invalid H1/canonical')
    if page.schema_errors or any(x.get('@type') == 'Product' or 'offers' in x for x in page.schemas):
        raise ValueError('Homepage source has invalid or misleading research metadata')
    return text


def build():
    text = render()
    (ROOT / 'index.html').write_text(text, encoding='utf-8')
    print('Rebuilt index.html from authoritative homepage partials')


if __name__ == '__main__': build()
