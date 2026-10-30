"""Apply the shared scientific interface to every public HTML route, idempotently."""
import re
from seo_audit import ROOT, pages

VERSION = '20261101'


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
    text = text.replace('<a href="/game/">Play Algae Living</a>', '<a href="/game/">Play Cyanoflow</a>')
    text = text.replace('<a class="chip" href="/game/">Algae Living game</a>', '<a class="chip" href="/game/">Cyanoflow game</a>')
    # Retarget anchors from the retired long-form homepage to the new
    # editorial sections and the retained Digital Lab.
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
    # CultureTrace is retained only as private source material. It is not part
    # of the public Orr Biologicals portfolio or its crawlable navigation.
    text = re.sub(r'<a\b[^>]*href=["\']/culturetrace/["\'][^>]*>.*?</a>', '', text, flags=re.S | re.I)
    # Keep the Algaephyte workflow explicit in every generated copy. The page
    # already has four legacy step cards; normalize their labels and append the
    # verification gate without asking the scientific content author to repeat
    # the same five-stage sequence in every generated build.
    if 'class="algaephyte-loop-steps"' in text:
        if '<h3>Observe</h3>' in text:
            text = text.replace('<h3>Observe</h3>', '<h3>Sense</h3>', 1)
            text = text.replace('<h3>Interpret</h3>', '<h3>Model</h3>', 1)
            text = text.replace('<h3>Propose</h3>', '<h3>Check</h3>', 1)
            text = text.replace('<h3>Guard</h3>', '<h3>Propose</h3>', 1)
        marker = '<ol class="algaephyte-loop-steps">'
        start = text.find(marker)
        end = text.find('</ol>', start + len(marker)) if start >= 0 else -1
        if start >= 0 and end >= 0 and 'data-loop-step="verify"' not in text:
            verify = '<li data-loop-step="verify"><span>05</span><h3>Verify</h3><p>Check what happened against separate observations before considering another change.</p></li>'
            text = text[:end] + verify + text[end:]
        sequence = '<p class="algaephyte-loop-sequence">SENSE <span>→</span> MODEL <span>→</span> CHECK <span>→</span> PROPOSE <span>→</span> VERIFY</p>'
        if 'class="algaephyte-loop-sequence"' not in text:
            text = text.replace('<section class="algaephyte-loop">', '<section class="algaephyte-loop">' + sequence, 1)
    header = (ROOT / 'sections/header.html').read_text(encoding='utf-8').strip()
    footer = (ROOT / 'sections/footer.html').read_text(encoding='utf-8').strip()
    # All pages use the same static markup, including without JavaScript.
    text = re.sub(r'<header\b[^>]*\bid="nav"[^>]*>.*?</header>\s*(?:<(?:div|nav) class="(?:mobile-menu|orr-mobile-nav)"[^>]*>.*?</(?:div|nav)>)?', header, text, count=1, flags=re.S)
    if 'id="nav"' not in text:
        text = re.sub(r'(<body\b[^>]*>)', lambda m: m[0] + '\n' + header, text, count=1)
    text = re.sub(r'\s*<footer\b[^>]*>.*?</footer>\s*', '', text, flags=re.S)
    # Eliminate per-page external font families and repeated token definitions.
    text = re.sub(r'<link[^>]+href="https://fonts.googleapis.com/[^>]+>\s*', '', text)
    text = re.sub(r'<link[^>]+href="/?css/(?:global|header|animations|site-redesign|biological-cinema)\.css[^>]+>\s*', '', text)
    text = re.sub(r'<script[^>]+src="/?js/(?:animations|navigation|cell-cursor|biological-cinema)\.js[^>]*>\s*</script>\s*', '', text)
    text = re.sub(r'<link[^>]+href="/?css/orr-home\.css[^>]+>\s*', '', text)
    text = re.sub(r'<link[^>]+href="/?css/home-premium\.css[^>]+>\s*', '', text)
    # Normalize the footer seam after stripping shared scripts. Generated
    # pages can place those scripts before the footer, so doing this earlier
    # left a different newline on the first and second application.
    text = re.sub(r'\s*</body>', lambda m: footer + '</body>', text, count=1)
    css = '\n'.join(f'<link rel="stylesheet" href="/css/{name}.css?v={VERSION}">' for name in ('global', 'header', 'orr-home', 'animations', 'site-redesign', 'biological-cinema'))
    if 'class="orr-home' in text:
        css += f'\n<link rel="stylesheet" href="/css/home-premium.css?v={VERSION}">'
    text = text.replace('</head>', css + '\n</head>')
    text = text.replace('</body>', f'<script defer src="/js/animations.js?v={VERSION}"></script>\n</body>')
    if '/js/navigation.js' not in text and './navigation.js' not in text:
        text = text.replace('</body>', f'<script defer src="/js/navigation.js?v={VERSION}"></script>\n</body>')
    if '/js/cell-cursor.js' not in text:
        text = text.replace('</body>', f'<script defer src="/js/cell-cursor.js?v={VERSION}"></script>\n</body>')
    # Every public page carries its own quiet living background field.
    # The script is stripped above and re-injected once, at the canonical end
    # position, so apply() remains idempotent for every page regardless of
    # which historical build placed it elsewhere in the document.
    text = text.replace('</body>', f'<script defer src="/js/biological-cinema.js?v={VERSION}"></script>\n</body>')
    text = re.sub(r'(<(?:link|script)\b[^>]*(?:href|src)="/?(?:css|js)/[^"?]+)(?:\?[^" ]*)?("[^>]*>)', r'\1?v=' + VERSION + r'\2', text)
    text = re.sub(r'(<meta name="theme-color" content=")[^"]+', r'\g<1>#10251f', text)
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
        relative = path.relative_to(ROOT).as_posix()
        if relative.startswith(('algae-growth/', 'game/')):
            # Immersive interactive surfaces own their shell, controls, and
            # rendering loop. Do not wrap them in the editorial site shell.
            count += 1
            continue
        old = path.read_text(encoding='utf-8-sig')
        new = apply(old)
        if old != new:
            path.write_text(new, encoding='utf-8')
        count += 1
    print(f'Shared scientific interface: {count} public pages')


if __name__ == '__main__':
    build()
