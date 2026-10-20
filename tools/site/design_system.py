"""Apply the shared scientific interface to every public HTML route, idempotently."""
import re
from seo_audit import ROOT, pages

VERSION = '20261019'


def migrate_legacy_application_links(text):
    """Keep the journal as the living index after retiring /applications/."""
    replacements = (
        ('/applications/species/arthrospira', '/blog/spirulina-is-a-cyanobacterium'),
        ('/applications/species/chlorella', '/glossary#microalgae'),
        ('/applications/#species', '/blog/'),
        ('/applications/#aquaculture', '/blog/'),
    )
    for old, new in replacements:
        text = text.replace(old, new)
    # Retire deep application slugs instead of manufacturing /blog/<slug>
    # articles that do not exist. The methodology hub is the honest fallback.
    text = re.sub(r'/applications/[^"\'\s<]+', '/research/', text)
    text = text.replace('/applications/', '/blog/')
    text = text.replace('<a href="/game/">Play Algae Living</a>', '<a href="/research/">Read the research methods</a>')
    text = text.replace('<a class="chip" href="/game/">Algae Living game</a>', '<a class="chip" href="/research/">Research methods</a>')
    text = text.replace('/game/', '/research/')
    # Retarget anchors from the retired long-form homepage to the new
    # editorial sections and the retained standalone simulation.
    text = text.replace('/#systemss', '/#systems')
    for old, new in (
        ('/#inside', '/#thesis'),
        ('/#system', '/#systems'),
        ('/#simulation', '/Simulation/'),
        ('/#stack', '/#systems'),
    ):
        text = re.sub(re.escape(old) + r'(?=["\'\s#<])', new, text)
    return text


def apply(text):
    text = migrate_legacy_application_links(text)
    header = (ROOT / 'sections/header.html').read_text(encoding='utf-8').strip()
    footer = (ROOT / 'sections/footer.html').read_text(encoding='utf-8').strip()
    # All pages use the same static markup, including without JavaScript.
    text = re.sub(r'<header\b[^>]*\bid="nav"[^>]*>.*?</header>\s*(?:<(?:div|nav) class="(?:mobile-menu|orr-mobile-nav)"[^>]*>.*?</(?:div|nav)>)?', header, text, count=1, flags=re.S)
    if 'id="nav"' not in text:
        text = re.sub(r'(<body\b[^>]*>)', lambda m: m[0] + '\n' + header, text, count=1)
    text = re.sub(r'\s*<footer\b[^>]*>.*?</footer>\s*', '\n', text, flags=re.S)
    text = text.replace('</body>', footer + '\n</body>')
    # Eliminate per-page external font families and repeated token definitions.
    text = re.sub(r'<link[^>]+href="https://fonts.googleapis.com/[^>]+>\s*', '', text)
    text = re.sub(r'<link[^>]+href="/?css/(?:global|header|animations)\.css[^>]+>\s*', '', text)
    text = re.sub(r'<script[^>]+src="/?js/animations\.js[^>]*>\s*</script>\s*', '', text)
    text = re.sub(r'<link[^>]+href="/?css/orr-home\.css[^>]+>\s*', '', text)
    text = re.sub(r'<link[^>]+href="/?css/home-premium\.css[^>]+>\s*', '', text)
    css = '\n'.join(f'<link rel="stylesheet" href="/css/{name}.css?v={VERSION}">' for name in ('global', 'header', 'orr-home', 'animations'))
    if 'class="orr-home' in text:
        css += f'\n<link rel="stylesheet" href="/css/home-premium.css?v={VERSION}">'
    text = text.replace('</head>', css + '\n</head>')
    text = text.replace('</body>', f'<script defer src="/js/animations.js?v={VERSION}"></script>\n</body>')
    if '/js/navigation.js' not in text and './navigation.js' not in text:
        text = text.replace('</body>', f'<script defer src="/js/navigation.js?v={VERSION}"></script>\n</body>')
    text = re.sub(r'(<(?:link|script)\b[^>]*(?:href|src)="/?(?:css|js)/[^"?]+)(?:\?[^" ]*)?("[^>]*>)', r'\1?v=' + VERSION + r'\2', text)
    text = re.sub(r'(<meta name="theme-color" content=")[^"]+', r'\g<1>#f6f2e8', text)
    # Preserve existing main targets; older article pages used a div shell.
    if '<main' not in text:
        text = text.replace('<div class="art-shell">', '<main id="main" class="art-shell">', 1)
        if '<main id="main"' in text:
            # Last shell closing div immediately before page scripts.
            text = re.sub(r'</div>(\s*<script)', r'</main>\1', text, count=1)
    text = re.sub(r'<main(?![^>]*\bid=)([^>]*)>', r'<main id="main"\1>', text, count=1)
    if 'href="#main"' not in text and 'id="main"' in text:
        text = re.sub(r'(<body\b[^>]*>)', r'\1\n<a class="skip" href="#main">Skip to content</a>', text, count=1)
    return text


def build():
    count = 0
    for path in pages():
        old = path.read_text(encoding='utf-8-sig')
        new = apply(old)
        if old != new:
            path.write_text(new, encoding='utf-8')
        count += 1
    print(f'Shared scientific interface: {count} public pages')


if __name__ == '__main__':
    build()
