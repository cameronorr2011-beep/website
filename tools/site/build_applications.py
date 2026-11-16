"""Curated Applications pillars: open-source biotechnology for the bench.

Deterministic: identical content, identical bytes. No build dates, no randomness.
Each topic is a mini-pillar: a practical main guide plus honest sub-articles.
Every claim is bounded and every source is credited. The shared interface
(header/footer, CSS, skip link) is applied afterwards by build_seo.py.
"""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SITE = 'https://orrbiologicals.com'
ACCENT = '#111A15'


def head(rel, title, desc, og_image, schema_type, crumbs):
    if rel == 'applications/index.html':
        page_url = f'{SITE}/applications/'
    else:
        page_url = f'{SITE}/{rel.rsplit("/index.html", 1)[0]}/'
    og_title = html.escape(title.split(' | ')[0], quote=True)
    breadcrumb = {
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': i + 1, 'name': name, 'item': f'{SITE}{path}'}
            for i, (name, path) in enumerate(crumbs)
        ],
    }
    graph = [
        {'@type': schema_type, '@id': f'{page_url}#page', 'url': page_url,
         'name': title.split(' | ')[0], 'description': desc,
         'isPartOf': {'@id': f'{SITE}/#site'}},
        breadcrumb,
    ]
    ld = json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False)
    return ('<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            f'<title>{html.escape(title)}</title>\n'
            f'<meta name="description" content="{html.escape(desc)}">\n'
            f'<meta name="theme-color" content="{ACCENT}">\n'
            f'<link rel="canonical" href="{page_url}">\n'
            '<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">\n'
            '<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">\n'
            '<meta property="og:type" content="article">\n'
            f'<meta property="og:title" content="{og_title}">\n'
            f'<meta property="og:description" content="{html.escape(desc)}">\n'
            f'<meta property="og:url" content="{page_url}">\n'
            f'<meta property="og:image" content="{SITE}{og_image}">\n'
            '<meta property="og:site_name" content="Orr Biologicals">\n'
            '<meta name="twitter:card" content="summary_large_image">\n'
            f'<meta name="twitter:title" content="{og_title}">\n'
            f'<meta name="twitter:description" content="{html.escape(desc)}">\n'
            f'<meta name="twitter:image" content="{SITE}{og_image}">\n'
            f'<script type="application/ld+json">\n{ld}\n</script>\n</head>')


def page(rel, title, desc, og_image, schema_type, cat, crumbs, body, next_links):
    crumb_html = '<a href="/">Orr Biologicals</a>'
    for name, path in crumbs:
        crumb_html += f' / <a href="{path}">{html.escape(name)}</a>'
    nxt = ''.join(f'<a href="{h}">{t}</a>' for h, t in next_links)
    nxt_block = f'<div class="kit-next">{nxt}</div>' if nxt else ''
    out = f'''<!doctype html>
<html lang="en">
{head(rel, title, desc, og_image, schema_type, crumbs)}
<body class="art-body kit-guide">
<a class="skip" href="#main">Skip to content</a>
<header class="nav" id="nav"></header>
<main id="main" class="art-shell kit-page">
<nav class="art-top" aria-label="Breadcrumb">{crumb_html}</nav>
<p class="art-cat">{cat}</p>
{body}
{nxt_block}
</main>
</body></html>
'''
    target = ROOT / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(out, encoding='utf-8')


APP = '/applications/'
def rel(*parts):
    return '/'.join(('applications', *parts, 'index.html'))

# ------------------------------------------------------------- sourdough --
def build_sourdough():
    crumbs = [('Applications', APP), ('Sourdough', '/diy/sourdough/')]
    page(rel='diy/sourdough/index.html',
         title='Sourdough Starter: Start, Feed &amp; Keep One | Orr Biologicals',
         desc='A practical, honest guide to a sourdough starter: flour and water ratios, a seven-day rhythm, what a healthy jar looks like, and when to throw it out.',
         og_image='/assets/kitchen/loaf.jpg', schema_type='Article',
         cat='Applications · Fermentation',
         crumbs=crumbs,
         body='''<h1>A sourdough starter, kept simply.</h1>
<p class="kit-page-dek">A starter is flour and water holding a community of wild yeasts and lactic acid bacteria. You do not need a scale with a hundred settings — you need a routine you can repeat and a way to notice what changed.</p>
<div class="kit-page-art"><img src="/assets/kitchen/starter.jpg" width="768" height="1376" alt="Generated image of a sourdough starter in a cloth-covered glass jar, risen and bubbly, on a floured wooden counter."></div>
<p class="kit-page-meta"><span>Generated image</span><span>Educational guide, not food-safety certification</span></p>

<div class="prose">
<h2>What is actually in the jar</h2>
<p>Flour carries wild yeasts and bacteria. Add water and the population begins to grow: yeasts produce carbon dioxide, and lactic and acetic acid bacteria produce the acidity that gives sourdough its character and helps hold back some unwanted organisms. The community is not one species — it shifts with your flour, water, temperature and feeding rhythm, which is why two honest starters behave differently.</p>

<h2>Start one, day by day</h2>
<div class="kit-table-wrap"><table class="kit-table">
<thead><tr><th>Day</th><th>Do this</th><th>What you may see</th></tr></thead>
<tbody>
<tr><td>1</td><td>Mix 50 g flour with 50 g water. Cover loosely.</td><td>A thick paste. Nothing else yet.</td></tr>
<tr><td>2</td><td>Keep 50 g, add 50 g flour and 50 g water.</td><td>A few bubbles, a faintly sour smell.</td></tr>
<tr><td>3–4</td><td>Repeat once a day, same amounts.</td><td>More bubbles, a rise after feeding; a nail-polish smell is common now.</td></tr>
<tr><td>5–7</td><td>Feed once a day at roughly 22–26 °C.</td><td>A predictable rise and fall, fresh yoghurt-like smell, a domed top after feeding.</td></tr>
</tbody></table></div>
<p>A starter is ready when it roughly doubles within four to eight hours of a feed and repeats that for several days. Slower usually means cooler ambient temperature, not failure.</p>
<h2>The short version</h2>
<ol><li><a href="/diy/sourdough/reading-your-starter/">Reading your starter — temperature, hydration and the peak</a></li><li><a href="/diy/sourdough/when-to-discard/">When to throw the jar out — hooch, streaks and mold</a></li></ol>

<div class="kit-note-box"><strong>Safety, plainly.</strong> This is an educational guide, not food-safety certification. Mould is not flavour. If you see fuzzy growth or pink/orange discolouration, discard the culture and clean the jar. Do not rely on smell alone to judge a ferment; when in doubt, discard it. Nothing here is a health claim or medical advice.</div>
<h2>Sources</h2>
<ol>
<li>De Vuyst L, Neysens P. “The sourdough microflora: biodiversity and metabolic interactions.” <em>Trends in Biotechnology</em>, 2005 — accessible review of the yeast and LAB communities in sourdough.</li>
<li>Gobbetti M, Gänzle M (eds.). <em>Handbook on Sourdough Biotechnology.</em> Springer, 2013 — strain ecology, fermentation physiology and craft practice.</li>
<li>University extension guidance on home fermentation and preservation safety (land-grant extension services) — plain-language safety limits.</li>
</ol>
</div>''',
         next_links=[('/applications/', 'All applications'),
                     ('/diy/kombucha/', 'Brew kombucha next'),
                     ('/diy/spirulina/', 'Spirulina cultivation'),
                     ('/blog/reading-your-culture', 'The journal: reading a jar')])

    page(rel='diy/sourdough/reading-your-starter/index.html',
         title='Reading Your Starter: Temperature, Hydration and the Peak | Orr Biologicals',
         desc='How hydration ratio, ambient temperature and feeding rhythm change a sourdough starter’s timing and character — and the signs a feed has peaked.',
         og_image='/assets/kitchen/starter.jpg', schema_type='Article',
         cat='Applications · Sourdough / Reading it',
         crumbs=[('Applications', APP), ('Sourdough', '/diy/sourdough/'), ('Reading your starter', '/diy/sourdough/reading-your-starter/')],
         body='''<h1>Reading your starter.</h1>
<p class="kit-page-dek">Temperature and hydration move a starter’s clock more than flour brand does. Learn the two dials and the jar becomes predictable.</p>
<div class="prose">
<h2>The two dials</h2>
<p><strong>Hydration.</strong> Equal flour and water by weight is 100% hydration and the everyday default. Stiffer doughs (lower hydration) ferment more slowly and tend toward sharper, more acetic character; looser doughs ferment faster and read milder. Ratio changes timing before it changes flavour.</p>
<p><strong>Temperature.</strong> Warm rooms speed everything up; a cold bench slows a starter by hours. Treat 22–26 °C as a friendly band for an all-purpose kitchen starter. A jar that peaks in three hours wants a cooler spot or a smaller refresh; one that peaks after ten wants a warmer one or a larger feed of fresh flour.</p>
<h2>What “peak” actually looks like</h2>
<p>A peaked starter is bubbly throughout, domed on top, smells pleasantly tangy, and has just begun to settle — a rubber-band mark at the starting level will tell you it doubled and held. A starter that only creeps up is usually cold or underfed; one that rockets and collapses is overfed heat plus a rich feed.</p>
<div class="kit-table-wrap"><table class="kit-table">
<thead><tr><th>Signal</th><th>Likely read</th><th>Adjust</th></tr></thead>
<tbody>
<tr><td>Peaks at 3–4 h, sharp smell</td><td>Warm, loose, hungry base culture</td><td>Lower hydration or move cooler; reduce starter fraction</td></tr>
<tr><td>Peaks at 8–10 h, domed and fruity</td><td>Cool or stiff</td><td>Warmer spot or a looser feed (1:2:2)</td></tr>
<tr><td>Flat at 24 h, streaks of liquid</td><td>Hungry — not dead</td><td>Discard most, feed 1:2:2, two feeds a day</td></tr>
<tr><td>Grey water and no rise after feeds</td><td>Stalled — feeding again rarely fixes it in place</td><td>Double-discard and refresh; reassess after 3 feeds</td></tr>
</tbody></table></div>
<h2>A note on honesty</h2>
<p>These are tendencies reported across sourdough literature and home practice, not guarantees for your particular flour. Winter flour, chlorine, and water hardness all shift the clock. Record your own timings; that record — not the internet’s median — is your starter’s specification.</p>
<div class="kit-note-box"><strong>Not a diagnosis.</strong> Temperature and hydration tune a healthy starter. Fuzzy growth or pink/orange colour is not a “timing” problem — see <a href="/diy/sourdough/when-to-discard/">when to throw the jar out</a>.</div>
<h2>Sources</h2>
<ol>
<li>De Vuyst L, Neysens P. “The sourdough microflora: biodiversity and metabolic interactions.” <em>Trends in Biotechnology</em>, 2005.</li>
<li>Gobbetti M, Gänzle M (eds.). <em>Handbook on Sourdough Biotechnology.</em> Springer, 2013.</li>
</ol>
</div>''',
         next_links=[('/diy/sourdough/', 'Back to the sourdough guide')])

    page(rel='diy/sourdough/when-to-discard/index.html',
         title='When to Throw the Jar Out | Orr Biologicals',
         desc='Hooch is not death, but mold is mold: the plain rulebook for keeping — and abandoning — a sourdough starter, without false confidence.',
         og_image='/assets/kitchen/hero-portrait.jpg', schema_type='Article',
         cat='Applications · Sourdough / Safety',
         crumbs=[('Applications', APP), ('Sourdough', '/diy/sourdough/'), ('When to discard', '/diy/sourdough/when-to-discard/')],
         body='''<h1>When to throw the jar out.</h1>
<p class="kit-page-dek">The complete rulebook fits in one line: if in doubt, discard. Here is what doubt looks like.</p>
<div class="prose">
<h2>Not a problem</h2>
<p><strong>Hooch.</strong> A layer of dark, alcoholic-smelling liquid on top means the starter ate its flour and is waiting. Pour it off (or stir it in), discard most of the culture, feed, and watch for recovery.</p>
<p><strong>Nail-polish smell at days 3–4.</strong> A young starter often smells of solvent before the lactic community dominates. It fades with consistent feeding.</p>
<p><strong>Separation or thinning after a fridge week.</strong> Cold neglect weakens a starter; two or three room-temperature feeds usually restore it.</p>
<h2>A problem</h2>
<p><strong>Fuzzy, dry, coloured growth</strong> — green, blue-black, orange or stark white — sitting on top. Mould penetrates, and the culture underneath is not rescued by skimming. Discard the whole jar, wash with hot soapy water, rinse and dry.</p>
<p><strong>Pink or orange streaks or a swirled tinge</strong> through the culture. Do not wait for fuzzy tufts. Discard.</p>
<p><strong>Persistent acetone <em>with</em> discolouration.</strong> Sharp solvent smell alone usually means a stalled, over-fermented starter; combined with any colour change, it is a discard.</p>
<h2>The one rule</h2>
<p>Appearance and smell are screening tools, not diagnostics. They cannot certify identity, purity or safety of any ferment. When the evidence is ambiguous, flour is cheaper than illness — throw it out.</p>
<div class="kit-note-box"><strong>Not food-safety certification.</strong> These limits are a citizen’s rulebook, not laboratory clearance. Immunocompromised people, pregnant people and people on restricted diets should be more conservative, not less.</div>
<h2>Sources</h2>
<ol>
<li>Gobbetti M, Gänzle M (eds.). <em>Handbook on Sourdough Biotechnology.</em> Springer, 2013.</li>
<li>De Vuyst L, Neysens P. “The sourdough microflora: biodiversity and metabolic interactions.” <em>Trends in Biotechnology</em>, 2005.</li>
<li>Land-grant university extension guidance on home ferment safety — discard criteria for mould and colour changes.</li>
</ol>
</div>''',
         next_links=[('/diy/sourdough/', 'Back to the sourdough guide')])

# -------------------------------------------------------------- kombucha --
def build_kombucha():
    crumbs = [('Applications', APP), ('Kombucha', '/diy/kombucha/')]
    page(rel='diy/kombucha/index.html',
         title='Kombucha: Brew &amp; Bottle It | Orr Biologicals',
         desc='Sweet tea, a SCOBY and time: a practical, honest kombucha guide — the first ferment, bottling without a geyser, and what a pellicle does and does not tell you.',
         og_image='/assets/kitchen/kombucha.jpg', schema_type='Article',
         cat='Applications · Fermentation',
         crumbs=crumbs,
         body='''<h1>Kombucha, kept simply.</h1>
<p class="kit-page-dek">Kombucha is sweet tea fermented by a symbiotic culture of bacteria and yeast (a SCOBY) into a lightly effervescent, acidic drink. The craft is timing and attention, not mystique.</p>
<div class="kit-page-art"><img src="/assets/kitchen/kombucha.jpg" width="768" height="1376" alt="Generated image of amber kombucha with a pale pellicle floating in a wide glass jar on a wooden counter."></div>
<p class="kit-page-meta"><span>Generated image</span><span>Educational guide, not food-safety certification</span></p>

<div class="prose">
<h2>What the culture is doing</h2>
<p>Yeasts convert tea sugars into ethanol and carbon dioxide; bacteria then oxidise that ethanol into organic acids — principally acetic and gluconic acids — producing kombucha’s tang. Two organisms are doing opposite halves of the work, and both are held together in a cellulose pellicle. Analysis of the drink’s composition across studies shows its chemistry tracks fermentation time and ingredients rather than any fixed recipe.</p>
<h2>The short version</h2>
<ol><li><a href="/diy/kombucha/first-ferment/">The first ferment, step by step — sugar, tea, temperature and the 7–10 day clock</a></li><li><a href="/diy/kombucha/mould-or-pellicle/">Mould or pellicle — reading the surface without guessing</a></li></ol>
<h2>Typical ranges, honestly labelled</h2>
<div class="kit-table-wrap"><table class="kit-table">
<thead><tr><th>Dial</th><th>Common practice range</th><th>Notes</th></tr></thead>
<tbody>
<tr><td>Sugar</td><td>~50–70 g per litre of tea</td><td>Feeds the culture; little remains in the finished drink when fermentation runs long.</td></tr>
<tr><td>Tea</td><td>Black or green, 1–2 tbsp leaves per litre</td><td>Tea supplies nitrogen; herbal-only bases starve the culture.</td></tr>
<tr><td>Temperature</td><td>Roughly 21–30 °C</td><td>Below ~18 °C the ferment slows dramatically; above ~35 °C the culture can be damaged.</td></tr>
<tr><td>Acidity</td><td>Finished pH typically ≤ 3.5</td><td>pH at or below ~3.5 is the conventional marker that the ferment stayed dominated by the right organisms.</td></tr>
<tr><td>Time</td><td>7–10 days, first ferment</td><td>Taste from day 5; sweetness is your timer.</td></tr>
</tbody></table></div>
<p>These are literature-informed typicals, not certified limits. Your water, tea strength and SCOBY history will move them.</p>
<div class="kit-note-box"><strong>Safety, plainly.</strong> Kombucha is acidic food, not medicine. Pregnant people, young children, and anyone immunocompromised should be conservative. Ferment in clean glass, never in reactive metal. If a batch grows fuzzy or smells putrid, discard it — do not taste “a little to check”.</div>
<h2>Sources</h2>
<ol>
<li>Jayabalan R, Malbasa RV, Loncar ES, Vitas JS, Sathishkumar M. “A Review on Kombucha Tea — Microbiology, Composition, Fermentation, Beneficial Effects, Toxicity, and Tea Fungus.” <em>Comprehensive Reviews in Food Science and Food Safety</em>, 2014. DOI: <a href="https://doi.org/10.1111/1541-4337.12073">10.1111/1541-4337.12073</a>.</li>
<li>Watawana MI, Jayawardena N, Gunawardhana CB, Waisundara VY. “Health, wellness, and safety aspects of the consumption of kombucha.” <em>Journal of Chemistry</em>, 2015. DOI: <a href="https://doi.org/10.1155/2015/591869">10.1155/2015/591869</a>.</li>
</ol>
</div>''',
         next_links=[('/applications/', 'All applications'),
                     ('/diy/sourdough/', 'Start a sourdough starter'),
                     ('/diy/spirulina/', 'Spirulina cultivation')])

    page(rel='diy/kombucha/first-ferment/index.html',
         title='The First Ferment, Step by Step | Orr Biologicals',
         desc='From kettle to jar: sugar quantities, tea choices, SCOBY handling, the 7–10 day clock, and bottling without a geyser.',
         og_image='/assets/kitchen/kombucha.jpg', schema_type='Article',
         cat='Applications · Kombucha / Protocol',
         crumbs=[('Applications', APP), ('Kombucha', '/diy/kombucha/'), ('First ferment', '/diy/kombucha/first-ferment/')],
         body='''<h1>The first ferment, step by step.</h1>
<p class="kit-page-dek">One reproducible loop, logged. If you can make tea, you can make kombucha — the skill is noticing the batch.</p>
<div class="prose">
<h2>Protocol</h2>
<ol>
<li>Boil water, dissolve ~50–70 g sugar per litre, add black or green tea (1–2 tbsp leaves per litre), steep 10–15 min, then remove the leaves and <strong>cool completely</strong>. Never add a live culture to hot tea.</li>
<li>Pour into clean glass. Add your SCOBY and ~10–15% starter liquid from a previous healthy batch (free acidity from the start suppresses the wrong organisms).</li>
<li>Cover with tight-weave cloth or paper and a band — the culture breathes but dust and insects stay out.</li>
<li>Rest at roughly 21–30 °C, out of direct sun, for 7–10 days. Taste from day 5: stop when the sweetness has dropped but not vanished.</li>
<li>pH at or below ~3.5 is the conventional finish line. A basic pH strip is enough.</li>
</ol>
<h2>Bottling</h2>
<p>Strain into pressure-safe bottles (swing-top or PET that can take carbonation), optionally with a spoon of juice or tea for a light second ferment, 1–3 days at room temperature. Open daily over the sink; glass bombs are a real failure mode. Refrigerate to halt the ferment.</p>
<h2>What you will actually see</h2>
<p>A new pellicle forms and thickens on the surface — that is cellulose and it is supposed to be there. Brown fibrils hanging into the liquid are normal yeast strands. Bubbling, a faint vinegar aroma and a fizz on the tongue arrive mid-ferment. None of this certifies safety; it describes a healthy-looking process, not a lab result.</p>
<div class="kit-note-box"><strong>Not food-safety certification.</strong> Worried about a batch? Do not taste “just to check”. Discard and start fresh with clean equipment and new starter liquid.</div>
<h2>Sources</h2>
<ol>
<li>Jayabalan R, et al. “A Review on Kombucha Tea.” <em>Compr Rev Food Sci Food Saf</em>, 2014. DOI: <a href="https://doi.org/10.1111/1541-4337.12073">10.1111/1541-4337.12073</a>.</li>
<li>Watawana MI, et al. “Health, wellness, and safety aspects of the consumption of kombucha.” <em>Journal of Chemistry</em>, 2015. DOI: <a href="https://doi.org/10.1155/2015/591869">10.1155/2015/591869</a>.</li>
</ol>
</div>''',
         next_links=[('/diy/kombucha/', 'Back to the kombucha guide'),
                     ('/diy/kombucha/mould-or-pellicle/', 'Mould or pellicle?')])

    page(rel='diy/kombucha/mould-or-pellicle/index.html',
         title='Mould or Pellicle? Reading the Surface | Orr Biologicals',
         desc='A wet, wrinkled cellulose pellicle is normal; fuzzy, dry, coloured growth is not. How to tell them apart — and when to discard the batch.',
         og_image='/assets/kitchen/kombucha.jpg', schema_type='Article',
         cat='Applications · Kombucha / Safety',
         crumbs=[('Applications', APP), ('Kombucha', '/diy/kombucha/'), ('Mould or pellicle', '/diy/kombucha/mould-or-pellicle/')],
         body='''<h1>Mould or pellicle?</h1>
<p class="kit-page-dek">The surface tells you almost everything — if you know what you are looking at.</p>
<div class="prose">
<h2>Pellicle — normal</h2>
<p>A wet, glossy, wrinkled sheet or disc of cellulose, white to beige. It can be thin and new or thick as a dinner plate; both are healthy. It wrinkles, folds, even sinks and regrows. Browning at the rim is harmless. Yeast “legs” — brown filaments hanging down into the liquid — are the companion yeast strands doing their half of the work.</p>
<h2>Mould — discard</h2>
<p>Fuzzy, dry, powdery or downy growth that sits <em>on top of</em> the pellicle, in white, green, blue-black, pink or orange patches. Mould looks velvety or dusty and dry, not wet and glossy. Interesting smells (fruity, cheesy) are not reassuring signals.</p>
<div class="kit-table-wrap"><table class="kit-table">
<thead><tr><th>Observation</th><th>Read</th><th>Action</th></tr></thead>
<tbody>
<tr><td>Wet, wrinkled sheet; brown rim</td><td>Normal pellicle</td><td>Continue fermenting</td></tr>
<tr><td>Dry, fuzzy, coloured patches on top</td><td>Mould</td><td>Discard batch + SCOBY; clean jar thoroughly</td></tr>
<tr><td>Wet blobs floating that sink when nudged</td><td>Usually yeast strands</td><td>Monitor one more day; no fuzzy dry growth → continue</td></tr>
<tr><td>Putrid, feculent or rotten smell</td><td>Failed ferment</td><td>Discard regardless of pellicle</td></tr>
</tbody></table></div>
<h2>Prevention</h2>
<p>Start with 10–15% healthy starter liquid, keep the jar covered with cloth (insects are the usual mold courier), avoid reactive metal, and retire any batch that sat in a warm, dusty place uncovered.</p>
<div class="kit-note-box"><strong>Not food-safety certification.</strong> Surface reading is triage, not clearance. When the call is ambiguous, throw it out and brew again.</div>
<h2>Sources</h2>
<ol>
<li>Jayabalan R, et al. “A Review on Kombucha Tea.” <em>Compr Rev Food Sci Food Saf</em>, 2014. DOI: <a href="https://doi.org/10.1111/1541-4337.12073">10.1111/1541-4337.12073</a>.</li>
<li>Watawana MI, et al. “Health, wellness, and safety aspects of the consumption of kombucha.” <em>Journal of Chemistry</em>, 2015. DOI: <a href="https://doi.org/10.1155/2015/591869">10.1155/2015/591869</a>.</li>
</ol>
</div>''',
         next_links=[('/diy/kombucha/', 'Back to the kombucha guide')])

# ------------------------------------------------------------- spirulina --
def build_spirulina():
    crumbs = [('Applications', APP), ('Spirulina', '/diy/spirulina/')]
    page(rel='diy/spirulina/index.html',
         title='Spirulina at Home: Start &amp; Keep It | Orr Biologicals',
         desc='An honest home guide to Arthrospira/Spirulina: what it is, alkaline water chemistry, light and feeding, realistic expectations, and food-safety limits.',
         og_image='/assets/kitchen/spirulina.jpg', schema_type='Article',
         cat='Applications · Cultivation',
         crumbs=crumbs,
         body='''<h1>Spirulina, kept simply.</h1>
<p class="kit-page-dek">Spirulina is a warm, alkaline water culture — a cyanobacterium, not a pond weed — that rewards patience, light and a notebook more than equipment.</p>
<div class="kit-page-art"><img src="/assets/kitchen/spirulina.jpg" width="768" height="1376" alt="Generated image of a bottle of deep green spirulina culture on a wooden table beside a notebook."></div>
<p class="kit-page-meta"><span>Generated image</span><span>Educational guide, not food-safety certification</span></p>

<div class="prose">
<h2>Know the organism first</h2>
<p><em>Arthrospira platensis</em> (marketed as “spirulina”) is a filamentous cyanobacterium that evolved in alkaline lakes. It is not the same organism as the spirally coiled <em>Spirulina</em> sensu stricto, and it is definitely not the green growth on any random pond — a green bottle is suggestive, never conclusive. Keep your inoculum from a documented culture, not from the wild.</p>
<h2>What the culture wants</h2>
<div class="kit-table-wrap"><table class="kit-table">
<thead><tr><th>Requirement</th><th>Typical working range</th><th>Watch for</th></tr></thead>
<tbody>
<tr><td>pH</td><td>Roughly 9–10.5, bicarbonate-buffered</td><td>Drifting downward means carbonate/bicarbonate depleted — feed with sodium bicarbonate</td></tr>
<tr><td>Temperature</td><td>Roughly 25–35 °C</td><td>Growth stalls under ~20 °C; sustained heat over ~38 °C kills it</td></tr>
<tr><td>Light</td><td>Bright but not harsh direct midday sun</td><td>Pale or olive culture = too little light or too much self-shading</td></tr>
<tr><td>Mixing</td><td>Gentle, daily swirling or aeration</td><td>Settling at the bottom = feed the surface light and re-mix</td></tr>
<tr><td>Medium</td><td>Zarrouk-type bicarbonate medium</td><td>See <a href="/blog/zarrouk-medium-and-nutrients">our medium notes</a></td></tr>
</tbody></table></div>
<h2>The short version</h2>
<ol><li><a href="/diy/spirulina/first-culture/">Your first culture, weeks 1–4 — a documented inoculum and a feeding rhythm</a></li><li><a href="/diy/spirulina/reading-the-culture/">Reading the culture — colour, foam and sediment as field signs</a></li></ol>
<h2>What spirulina is not</h2>
<p>It is not a protein shake you grow in a jam jar, not proof of safety by appearance, and not a licensed drug or supplement. Home cultures are a citizen-science exercise with a harvestable by-product; identity, purity and safety need laboratory verification. Treat homegrown biomass as an experiment, never as a tested supplement — especially if immunocompromised.</p>
<div class="kit-note-box"><strong>Safety, plainly.</strong> Spirulina is a cyanobacterium; wild blooms can contain cyanotoxins. Do not harvest from unverified natural waters. Do not feed homegrown culture to infants or as medicine. Educational guide — not food-safety certification, identity verification or medical advice.</div>
<h2>Sources</h2>
<ol>
<li>Vonshak A (ed.). <em>Spirulina Platensis Arthrospira: Physiology, Cell-biology and Biotechnology.</em> Taylor &amp; Francis, 1997 — the standard reference on the organism.</li>
<li>Schagerl M, et al. “Estimating biomass and vitality of microalgae.” <em>J Plant Biotechnol</em>, 2022. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9368473/">PMC9368473</a> — measurement proxies and their limits.</li>
<li>Benner SM, et al. “Lab-scale photobioreactor systems: principles, applications, and scalability.” 2022. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9033726/">PMC9033726</a>.</li>
</ol>
</div>''',
         next_links=[('/applications/', 'All applications'),
                     ('/microalgae-cultivation/', 'The technical cultivation pillar'),
                     ('/blog/spirulina-is-a-cyanobacterium', 'Journal: why spirulina is a cyanobacterium')])

    page(rel='diy/spirulina/first-culture/index.html',
         title='Your First Spirulina Culture, Weeks 1–4 | Orr Biologicals',
         desc='A realistic four-week start for home spirulina: inoculum sourcing, bicarbonate medium, light and warmth, and the doubling rhythm to expect.',
         og_image='/assets/kitchen/spirulina.jpg', schema_type='Article',
         cat='Applications · Spirulina / Protocol',
         crumbs=[('Applications', APP), ('Spirulina', '/diy/spirulina/'), ('First culture', '/diy/spirulina/first-culture/')],
         body='''<h1>Your first culture.</h1>
<p class="kit-page-dek">Four weeks, not four days. Spirulina rewards a weekly rhythm and a written record far more than gadgets.</p>
<div class="prose">
<h2>Before you start</h2>
<p>Obtain a <strong>documented starter</strong> — a small live culture from a reputable supplier or a gifted culture with provenance you trust. Do not attempt “wild spirulina” from ponds; you cannot verify species or toxins, and the containment rules for culturing unknown organisms belong in an institution, not a kitchen.</p>
<h2>Set-up</h2>
<ol><li>Medium: a Zarrouk-type bicarbonate base (roughly 16 g sodium bicarbonate per litre, with trace nutrients) — see <a href="/blog/zarrouk-medium-and-nutrients">our medium walk-through</a>. Make a litre, dissolve well, rest at room temperature overnight.</li><li>Vessel: clean wide-mouth glass bottle or flat flask, loosened cap, out of direct sun but in a bright, warm spot (25–30 °C ideal).</li><li>Inoculate: 10–20% v/v from the live culture. Mark the fill line and date it.</li><li>Daily: 30 seconds of swirling. Weekly: check colour against the mark, note temperature, top up evaporated water with bicarbonate solution (not plain water) if the culture has dropped below the line.</li></ol>
<h2>What weeks 1–4 look like</h2>
<div class="kit-table-wrap"><table class="kit-table">
<thead><tr><th>Week</th><th>Typical state</th></tr></thead>
<tbody>
<tr><td>1</td><td>Colour barely changes; filaments settle between mixes; nothing looks like failure yet.</td></tr>
<tr><td>2</td><td>Noticeable deepening to blue-green; first hint of a swirl when mixed.</td></tr>
<tr><td>3–4</td><td>Opaque forest-green; steady growth; first partial harvest (strain through fine cloth) if density is heavy.</td></tr>
</tbody></table></div>
<p>Doubling time is measured in days, not hours. If nothing visibly improves after two weeks, check temperature first — cold is the most common silent failure.</p>
<div class="kit-note-box"><strong>Not food-safety certification.</strong> Identity and purity cannot be confirmed by eye. Homegrown biomass is an educational harvest; treat it that way.</div>
<h2>Sources</h2>
<ol>
<li>Vonshak A (ed.). <em>Spirulina Platensis Arthrospira.</em> Taylor &amp; Francis, 1997.</li>
<li><a href="/blog/zarrouk-medium-and-nutrients">Orr Biologicals — Zarrouk medium and nutrients</a> and <a href="/blog/how-to-start-home-spirulina-culture">starting a home culture</a>, our field notes.</li>
</ol>
</div>''',
         next_links=[('/diy/spirulina/', 'Back to the spirulina guide'),
                     ('/diy/spirulina/reading-the-culture/', 'Reading the culture')])

    page(rel='diy/spirulina/reading-the-culture/index.html',
         title='Reading the Spirulina Culture | Orr Biologicals',
         desc='Colour, foam, sediment and smell: the field signs of a working spirulina culture — and the limits of judging one by eye.',
         og_image='/assets/kitchen/spirulina.jpg', schema_type='Article',
         cat='Applications · Spirulina / Observation',
         crumbs=[('Applications', APP), ('Spirulina', '/diy/spirulina/'), ('Reading the culture', '/diy/spirulina/reading-the-culture/')],
         body='''<h1>Reading the culture.</h1>
<p class="kit-page-dek">Four field signs carry most of the information: colour, foam, sediment and smell. None of them certifies anything — they tell you where to look next.</p>
<div class="prose">
<h2>Colour</h2>
<p>Healthy Arthrospira is a deep blue-green (“forest green”). Olive or browning tones suggest ageing cells, light stress or declining alkalinity; a pale, watery green means too little pigment density or too much self-shading; grey turbidity hints at contamination or debris. Colour tracks health only roughly — never trust it alone.</p>
<h2>Foam and surface</h2>
<p>Gentle swirling foam that settles quickly is normal. Persistent greasy, foul-smelling foam, or a skin of mucus-like material, is not — those point to contamination and the culture should be isolated, not harvested.</p>
<h2>Sediment and clarity</h2>
<p>Filaments settling between mixes are fine; a thick permanent layer on the bottom with a clear top means the working volume is smaller than it looks. Swirl daily and keep the culture shallow enough that light reaches most cells — a flat tray beats a tall bottle.</p>
<h2>Smell</h2>
<p>Earthy, grassy, faintly ocean-like is typical. Rotten, sewage or putrid smells mean discard the culture — do not “treat” it with bicarbonate and continue.</p>
<h2>When it goes wrong</h2>
<p>For crashes, contamination crashes and restarts, see <a href="/blog/troubleshooting-contamination-crashes">our troubleshooting notes</a>. The honest summary: microscope or discard — there is no safe eyeball test, only exclusion decisions.</p>
<div class="kit-note-box"><strong>Not identity or safety verification.</strong> Visual signs never certify species identity, purity or the absence of cyanotoxins. Only laboratory analysis does. When in doubt, discard.</div>
<h2>Sources</h2>
<ol>
<li>Vonshak A (ed.). <em>Spirulina Platensis Arthrospira.</em> Taylor &amp; Francis, 1997.</li>
<li>Schagerl M, et al. 2022. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9368473/">PMC9368473</a> — biomass and vitality proxies, and their limits.</li>
<li><a href="/blog/troubleshooting-contamination-crashes">Orr Biologicals — spirulina culture failure modes</a>, field notes.</li>
</ol>
</div>''',
         next_links=[('/diy/spirulina/', 'Back to the spirulina guide')])

# --------------------------------------------- phytoplankton for bivalves --
BV_CRUMBS = [('Applications', APP), ('Phytoplankton for bivalves', '/applications/phytoplankton-for-bivalves/')]

def build_bivalves():
    page(rel='applications/phytoplankton-for-bivalves/index.html',
         title='Phytoplankton for Bivalves: Feeding Shellfish Honestly | Orr Biologicals',
         desc='How bivalve hatcheries feed live microalgae to oyster, clam, scallop and mussel larvae — species choices, ratios, water quality and the limits of home-scale success.',
         og_image='/assets/kitchen/bivalves.jpg', schema_type='Article',
         cat='Applications · Aquaculture',
         crumbs=BV_CRUMBS,
         body='''<h1>Phytoplankton for bivalves.</h1>
<p class="kit-page-dek">Oyster, clam, scallop and mussel larvae will not eat flake, pellet or powder — they filter live microalgae, and hatchery success rises or falls on feeding them the right cells at the right size. This is the aquaculture bench, written down.</p>
<div class="kit-page-art"><img src="/assets/kitchen/bivalves.jpg" width="1376" height="768" loading="lazy" alt="Generated image of a shallow hatchery tray with young bivalves under a work lamp beside two small flasks of green live phytoplankton culture."></div>
<p class="kit-page-meta"><span>Generated image</span><span>Educational guide, not an aquaculture or veterinary certification</span></p>

<div class="prose">
<h2>Why live feed</h2>
<p>Bivalve larvae are non-selective filter feeders: they capture suspended cells between roughly 1 and 10 micrometres, and survival through larval stages tracks ration, cell size and nutritional quality. D-larvae through to pediveligers consume mixed live diets in virtually all commercial hatcheries — dried algae and yeast-based feeds have not displaced live phytoplankton at larval stages. That is an empirical fact of the industry, not a marketing position.</p>

<h2>A workable mixed diet</h2>
<p>Hatcheries rarely rely on one species. A common pairing is one golden/chrysophyte strain (<em>Tisochrysis lutea</em> “T-ISO” or <em>Isochrysis galbana</em>) plus a flagellate or diatom — <em>Pavlova lutheri</em> or small <em>Chaetoceros</em> spp. — because nutritional profiles complement each other and size ranges bracket larval prey capture. Details: <a href="/applications/phytoplankton-for-bivalves/species-selection/">species and stage matching</a>.</p>

<h2>The four skills that matter</h2>
<ol>
<li><a href="/applications/phytoplankton-for-bivalves/species-selection/">Species selection — matching cell size and nutrition to larval stage</a></li>
<li><a href="/applications/phytoplankton-for-bivalves/feeding-protocol/">The feeding protocol — concentration, frequency and siphoning</a></li>
<li><a href="/applications/phytoplankton-for-bivalves/water-quality/">Water quality — salinity, temperature, filtration and why copper kills tanks</a></li>
<li><a href="/applications/phytoplankton-for-bivalves/troubleshooting/">Troubleshooting — crashes, mortality, settlement failure</a></li>
</ol>

<h2>Home-scale, honestly</h2>
<p>Hobbyists can maintain a few algal cultures (T-ISO and Pavlova are forgiving) and grow a small batch of juvenile oysters or clams from purchased seed — often a few dozen animals. Expect 30–60 days from fertilisation to spat for warmwater oysters, high natural mortality, and strict water discipline. Yields are educational more than economic. <strong>Do not release farmed stock into open waters, and do not move broodstock across regions</strong> — biosecurity and hatchery regulations (including disease and genetic rules) apply; your local fisheries authority is the binding source, not this page.</p>
<h2>What this is not</h2>
<p>Not a business plan, not a certification, not legal advice and not a substitute for a working hatchery. Production data below are order-of-magnitude literature values, not Orr Biologicals measurements.</p>
<div class="kit-note-box"><strong>Scope and biosecurity.</strong> Regulations on culturing, moving and releasing bivalves and their gametes vary by jurisdiction and carry real penalties. This page is educational background for supervised or hobby settings only.</div>
<h2>Sources</h2>
<ol>
<li>Helm MM, Bourne N, Lovatelli A. <em>Hatchery culture of bivalves — A practical manual.</em> FAO Fisheries Technical Paper No. 471, Rome, 2004. <a href="https://www.fao.org/4/y5720e/y5720e00.htm">FAO</a>.</li>
<li>Brown MR. “Nutritional value of microalgae for aquaculture.” Chapter in algal-culture literature; use FAO 471 as the operational reference.</li>
<li>FAO Fisheries Technical Papers on hatchery management — see FAO Legal Office and your national fisheries authority for binding rules.</li>
</ol>
</div>''',
         next_links=[('/applications/', 'All applications'),
                     ('/algae-biotechnology/', 'Algae biotechnology overview'),
                     ('/diy/guides/', 'The guide shelf')])

    page(rel='applications/phytoplankton-for-bivalves/species-selection/index.html',
         title='Species Selection: Match the Cell to the Larva | Orr Biologicals',
         desc='T-ISO, Pavlova, Chaetoceros, Tetraselmis: what each live feed is good for, cell-size ranges, and why hatcheries mix diets instead of betting on one species.',
         og_image='/assets/kitchen/bivalves.jpg', schema_type='Article',
         cat='Applications · Bivalves / Nutrition',
         crumbs=BV_CRUMBS + [('Species selection', '/applications/phytoplankton-for-bivalves/species-selection/')],
         body='''<h1>Species selection.</h1>
<p class="kit-page-dek">Larvae eat what fits and what feeds them. Two criteria rule the choice: cell size and biochemical profile.</p>
<div class="prose">
<h2>The usual suspects</h2>
<div class="kit-table-wrap"><table class="kit-table">
<thead><tr><th>Species (common name)</th><th>Cell size (approx.)</th><th>Notes</th></tr></thead>
<tbody>
<tr><td><em>Tisochrysis lutea</em> (“T-ISO”, golden algae)</td><td>~2–6 µm</td><td>Rich in DHA/EPA; forgiving to culture; widely used for larvae</td></tr>
<tr><td><em>Isochrysis galbana</em> (Tahitian golden)</td><td>~3–8 µm</td><td>Similar profile; classic hatchery backbone</td></tr>
<tr><td><em>Pavlova lutheri</em> ( Pavlova, flagellate)</td><td>~2–4 µm</td><td>Small, flagellated, good for early larvae; complements T-ISO</td></tr>
<tr><td><em>Chaetoceros calcitrans / C. muelleri</em> (diatoms)</td><td>~4–7 µm</td><td>Require silicate; dense nutrition; watch frustule size vs. larvae</td></tr>
<tr><td><em>Tetraselmis suecica</em> (green flagellate)</td><td>~7–12 µm</td><td>Larger, hardy; useful for juveniles and conditioning broodstock</td></tr>
</tbody></table></div>
<p>Sizes are order-of-magnitude and strain-dependent; ask your supplier for the specific strain’s dimensions. Silicate dependence and culture maintenance differ — diatoms are nutritionally excellent but add a mineral discipline.</p>
<h2>Mix, don’t bet</h2>
<p>A two-species mix routinely outperforms either alone because essential fatty acid and sterol profiles complement; DHA-rich T-ISO plus a robust diatom or Pavlova covers early through late larval stages. Keep at least one culture on standby — single-culture crashes at the wrong week are a classic hobbyist heartbreak.</p>
<h2>What “best” cannot mean</h2>
<p>“Best” changes with water temperature, shellfish species, larval stage and whether you measure survival, growth or spat yield. No single species wins universally; published hatchery manuals converge on <em>tested mixes of two to three strains</em>, not a magic strain.</p>
<h2>Sources</h2>
<ol>
<li>Helm MM, Bourne N, Lovatelli A. <em>Hatchery culture of bivalves — A practical manual.</em> FAO Fisheries Technical Paper No. 471, Rome, 2004. <a href="https://www.fao.org/4/y5720e/y5720e00.htm">FAO</a> — species tables and rationing.</li>
</ol>
</div>''',
         next_links=[('/applications/phytoplankton-for-bivalves/', 'Back to bivalves overview'),
                     ('/applications/phytoplankton-for-bivalves/feeding-protocol/', 'The feeding protocol')])

    page(rel='applications/phytoplankton-for-bivalves/feeding-protocol/index.html',
         title='The Feeding Protocol: Concentration, Frequency, Siphoning | Orr Biologicals',
         desc='How hatcheries practise live feeding: algal density targets, feeding frequency, larval density checks, siphoning and water exchange — as a repeatable routine.',
         og_image='/assets/kitchen/bivalves.jpg', schema_type='Article',
         cat='Applications · Bivalves / Protocol',
         crumbs=BV_CRUMBS + [('Feeding protocol', '/applications/phytoplankton-for-bivalves/feeding-protocol/')],
         body='''<h1>The feeding protocol.</h1>
<p class="kit-page-dek">Feeding is a closed loop: measure the larvae, feed what they clear, keep the tank clean. Guessing cell counts is where most hobby failures begin.</p>
<div class="prose">
<h2>The loop</h2>
<ol>
<li><strong>Count larvae.</strong> Sample a measured volume daily; estimate larvae per mL. Sudden drops signal water problems, not hunger.</li>
<li><strong>Feed to clearance.</strong> A common practice is dosing algae so most of it is cleared within a few hours of feeding; if the tank is still brightly green at the next feed, halve the dose. Target algal densities are strain- and stage-dependent — suppliers publish cell/mL; working range for practical purposes is on the order of 10<sup>6</sup>–10<sup>7</sup> cells/mL at feeding.</li>
<li><strong>Feed twice daily</strong> for fast-growing warmwater larvae; once daily can suffice for coldwater species.</li>
<li><strong>Siphon daily.</strong> Exchange 30–50% of tank volume every 1–2 days, siphoning larval settlement debris — bacterial load, not food, is what usually crashes young larvae.</li>
<li><strong>Log everything.</strong> Date, ration, water temperature, counts, mortality. The notebook is the instrument.</li>
</ol>
<h2>Culture management</h2>
<p>Maintain at least two algal stock cultures in continuous or semi-continuous culture; a third on standby covers crashes. T-ISO in 1–2 L flasks with gentle aeration and cool-white fluorescent light is the classic hobby setup; scale up by weekly doubling, never by sudden 5× jumps.</p>
<h2>What not to do</h2>
<p>Do not dose “clear tank” doses of algae continuously; do not feed rotten or stagnant algal culture; do not skip water exchange because the tank “looks clean”; do not raise larval densities beyond what your algal capacity feeds comfortably.</p>
<div class="kit-note-box"><strong>Scope.</strong> This is an educational routine adapted from published hatchery practice, not veterinary or production certification. Follow local regulations on culturing and releasing bivalves.</div>
<h2>Sources</h2>
<ol>
<li>Helm MM, Bourne N, Lovatelli A. <em>Hatchery culture of bivalves — A practical manual.</em> FAO Fisheries Technical Paper No. 471, Rome, 2004. <a href="https://www.fao.org/4/y5720e/y5720e00.htm">FAO</a> — rationing, siphoning and larval husbandry.</li>
</ol>
</div>''',
         next_links=[('/applications/phytoplankton-for-bivalves/', 'Back to bivalves overview'),
                     ('/applications/phytoplankton-for-bivalves/water-quality/', 'Water quality')])

    page(rel='applications/phytoplankton-for-bivalves/water-quality/index.html',
         title='Water Quality for Bivalve Larvae | Orr Biologicals',
         desc='Salinity, temperature, pH, filtration — and the single most toxic mistake in a shellfish room: copper anywhere near the system.',
         og_image='/assets/kitchen/bivalves.jpg', schema_type='Article',
         cat='Applications · Bivalves / Water',
         crumbs=BV_CRUMBS + [('Water quality', '/applications/phytoplankton-for-bivalves/water-quality/')],
         body='''<h1>Water quality.</h1>
<p class="kit-page-dek">Bivalves breathe with their gills and leak ammonia through them too. The tank is a small, honest chemistry problem that behaves exactly like chemistry.</p>
<div class="prose">
<h2>The non-negotiables</h2>
<div class="kit-table-wrap"><table class="kit-table">
<thead><tr><th>Parameter</th><th>Typical marine working range</th><th>Why it matters</th></tr></thead>
<tbody>
<tr><td>Salinity</td><td>~28–34 psu for marine species</td><td>Osmoregulation failure kills larvae slowly, then completely</td></tr>
<tr><td>Temperature</td><td>Species-specific; warmwater oysters ~20–30 °C</td><td>Larval development clock runs on temperature; wrong band = no settlement</td></tr>
<tr><td>pH</td><td>~7.8–8.3</td><td>Algal growth and shell formation both depend on carbonate balance</td></tr>
<tr><td>Filtration</td><td>1 µm then UV for rearing water</td><td>Removes wild pathogens and competing grazers</td></tr>
<tr><td>Copper</td><td><strong>Zero, ever</strong></td><td>Copper is acutely toxic to shellfish larvae at trace levels; one brass fitting can write off the tank</td></tr>
</tbody></table></div>
<h2>The quiet problem: ammonia</h2>
<p>Larvae excrete ammonia; a crowded tank accumulates it between exchanges. Watch for lethargy, gaping valves and stalled growth. Exchange 30–50% of water every 1–2 days, siphon dung carefully, and never rely on a “cycle” from gravel filters — marine larvae live downstream of water discipline, not biological magic.</p>
<h2>Copper, again</h2>
<p>No copper pipes, no brass valves, no copper-based algaecides, no copper-leaching hoses. If your water comes through household plumbing, test it or treat it as suspect; dedicated RO/DI + synthetic marine salt is the reliable bench path.</p>
<h2>Sources</h2>
<ol>
<li>Helm MM, Bourne N, Lovatelli A. <em>Hatchery culture of bivalves — A practical manual.</em> FAO Fisheries Technical Paper No. 471, Rome, 2004. <a href="https://www.fao.org/4/y5720e/y5720e00.htm">FAO</a> — water treatment, salinity and larval husbandry.</li>
</ol>
</div>''',
         next_links=[('/applications/phytoplankton-for-bivalves/', 'Back to bivalves overview'),
                     ('/applications/phytoplankton-for-bivalves/troubleshooting/', 'Troubleshooting')])

    page(rel='applications/phytoplankton-for-bivalves/troubleshooting/index.html',
         title='Troubleshooting Bivalve Larvae | Orr Biologicals',
         desc='Crashing cultures, larval mortality, failure to settle: the common failure modes of small-scale bivalve rearing — and which ones you cannot fix at a bench.',
         og_image='/assets/kitchen/bivalves.jpg', schema_type='Article',
         cat='Applications · Bivalves / Failure modes',
         crumbs=BV_CRUMBS + [('Troubleshooting', '/applications/phytoplankton-for-bivalves/troubleshooting/')],
         body='''<h1>Troubleshooting.</h1>
<p class="kit-page-dek">Most failures announce themselves early. The bench skill is reading which failure you have before the tank decides for you.</p>
<div class="prose">
<h2>Common failure modes</h2>
<div class="kit-table-wrap"><table class="kit-table">
<thead><tr><th>Symptom</th><th>Likely cause</th><th>Bench response</th></tr></thead>
<tbody>
<tr><td>Algal culture turns brown/crashing</td><td>Contamination, light or nutrient exhaustion</td><td>Restart from reserve stock; never “rescue” into larvae</td></tr>
<tr><td>Larvae clear none of the ration</td><td>Ciliates/rotifers grazing the dose, or larvae stressed</td><td>Siphon immediately; check counts; consider a water change</td></tr>
<tr><td>Sudden overnight mortality</td><td>Temperature spike, oxygen crash, ammonia spike</td><td>Audit heater, aeration and last water change — usually environmental, not disease</td></tr>
<tr><td>Shells malform or stay thin</td><td>pH/alkalinity off, or trace metal issue</td><td>Test pH and salinity; remove any brass/copper; RO water + proper salt mix</td></tr>
<tr><td>Larvae never settle onto spat cultch</td><td>Wrong temperature/salinity window or unconditioned cultch</td><td>Match species’ spawning window; use conditioned shell or spat catchers</td></tr>
<tr><td>Progressive mortality over days</td><td>Bacterial vibrio load</td><td>Stop feeding, exchange 50%+ water, consult local hatchery/Extension — home fixes are limited</td></tr>
</tbody></table></div>
<h2>The honest limit</h2>
<p>Beyond basic husbandry, larval culture involves bacterial disease, genetic broodstock quality and regulatory disease controls that no home bench can properly resolve. Use your national fisheries institute or local extension service for persistent failure; ask for pathogen screening, not folklore.</p>
<h2>Biosecurity</h2>
<p>Never move larvae, cultch or broodstock between estuaries or states without approval; pathogens such as <em>Perkinsus</em> and <em>Bonamia</em> have devastated fisheries across borders. Hobby practice belongs in contained systems with purchased seed of known provenance.</p>
<h2>Sources</h2>
<ol>
<li>Helm MM, Bourne N, Lovatelli A. <em>Hatchery culture of bivalves — A practical manual.</em> FAO Fisheries Technical Paper No. 471, Rome, 2004. <a href="https://www.fao.org/4/y5720e/y5720e00.htm">FAO</a> — disease, mortality and husbandry baselines.</li>
<li>Your national fisheries / aquaculture extension service — binding rules and local pathogen advice.</li>
</ol>
</div>''',
         next_links=[('/applications/phytoplankton-for-bivalves/', 'Back to bivalves overview')])

# ------------------------------------------------------------ applications hub --
def build_applications_hub():
    page(rel='applications/index.html',
         title='Applications: Biotechnology for Real-World Problems | Orr Biologicals',
         desc='Evidence-led application dossiers: aquaculture live feeds for bivalve hatcheries, and honest maps of bioprocessing, biological materials and environmental biotechnology — mechanism, evidence, limits, sources.',
         og_image='/assets/kitchen/bivalves.jpg', schema_type='CollectionPage',
         cat='Applications · Evidence-led dossiers',
         crumbs=[('Applications', APP)],
         body='''<h1>The mechanism, the evidence, <em>the limits.</em></h1>
<p class="kit-page-dek">Applications is where biology meets a job to be done. Every dossier here states the biological mechanism, what research has actually demonstrated, what has not, and what it would take — with primary literature, clearly attributed. Where a domain is only ready to be mapped, the dossier says so instead of performing depth it does not have.</p>
<div class="prose">
<p class="kit-div-note"><span class="mono">This division</span> Applications explains real problems and the evidence around them — if you want to build something on your bench, that is <a href="/diy/">DIY</a>; the literature index lives under <a href="/articles/">Articles</a>; our own engineering lives under <a href="/inventions/">Inventions</a>.</p>

<div class="kit-dossier">
  <a class="kit-dossier-row" href="/applications/phytoplankton-for-bivalves/">
    <div><p class="kit-tag">01 · Aquaculture biotechnology <span class="kit-status live">Live dossier</span></p>
    <h3>Phytoplankton for bivalve hatcheries</h3>
    <p><strong>The problem:</strong> bivalve larvae only eat live microalgae, and hatcheries live or die on feed quality and stability. <strong>The mechanism:</strong> species, cell size and fatty-acid profile matched to larval stage. <strong>The evidence:</strong> established hatchery practice (FAO Fisheries Technical Paper 471). <strong>The limits:</strong> strain-dependent; not validated by Orr Biologicals; educational starting point, not a licensed hatchery protocol.</p>
    </div><span class="kit-dossier-go" aria-hidden="true">↗</span>
  </a>
  <div class="kit-dossier-row static">
    <div><p class="kit-tag">02 · Advanced microbiology &amp; bioprocessing <span class="kit-status map">Evidence map</span></p>
    <h3>Microbial cultivation systems &amp; process monitoring</h3>
    <p><strong>The mechanism:</strong> selection pressure, carbon and nitrogen management, gas exchange and mixing, monitored honestly. <strong>The evidence:</strong> lab-scale photobioreactor practice (Schagerl 2022; Benner 2022) and our <a href="/microalgae-cultivation/">cultivation pillar</a> and <a href="/photobioreactors/">reactor engineering explainer</a>. <strong>The limits:</strong> scale-up alters illumination and transport; no Orr Biologicals process is validated; see <a href="/research/">research approach</a>.</p>
    </div><span class="kit-dossier-go dim" aria-hidden="true">○</span>
  </div>
  <div class="kit-dossier-row static">
    <div><p class="kit-tag">03 · Spider silk &amp; biological materials <span class="kit-status dev">Dossier in development</span></p>
    <h3>Recombinant silk proteins &amp; biological fiber engineering</h3>
    <p><strong>The mechanism:</strong> spidroins combine crystalline strength with amorphous elasticity; recombinant expression (e.g. in <em>E. coli</em>) and protein assembly are the active engineering levers. <strong>The evidence:</strong> literature map only — start with Lewis, “Spider silk: the unraveling of a mystery,” <em>Accounts of Chemical Research</em>, 2006, and Kluge et al., “Spider silks and their applications,” <em>Trends in Biotechnology</em>, 2008. <strong>The limits:</strong> this page maps the field; it does not present Orr Biologicals results, protocols or products. A sourced dossier is written before it is published.</p>
    </div><span class="kit-dossier-go dim" aria-hidden="true">○</span>
  </div>
  <div class="kit-dossier-row static">
    <div><p class="kit-tag">04 · Environmental biotechnology <span class="kit-status dev">Dossier in development</span></p>
    <h3>Microalgae and nutrient recovery</h3>
    <p><strong>The mechanism:</strong> microalgae fix nitrogen and phosphorus from wastewater streams while producing harvestable biomass — the same organism treated as a nutrient sink and as a product. <strong>The evidence:</strong> literature map only — see Christenson &amp; Sims, “Production and harvesting of microalgae for wastewater treatment,” <em>Biotechnology Advances</em>, 2011. <strong>The limits:</strong> coupling ecology to engineered systems is hard; nothing here is a treatment system, and no removal percentage is claimed.</p>
    </div><span class="kit-dossier-go dim" aria-hidden="true">○</span>
  </div>
</div>

<div class="kit-note-box"><strong>A note on dossier maturity.</strong> A dossier ships when it can carry its claims: mechanism, evidence, limits and sources, or it stays labelled as a map. Aspiration is not evidence — the same rule we apply on bench protocols.</div>
<p>Citations here are indexes into the literature, not verified measurements by Orr Biologicals. Verify before you rely on them; <a href="/literature/">literature search</a> checks a DOI against public records.</p>
</div>''',
         next_links=[('/diy/', 'The DIY bench'),
                     ('/articles/', 'Read the literature'),
                     ('/research/', 'Our research approach')])


# --------------------------------------------------------------- DIY hub --
def build_diy_hub():
    page(rel='diy/index.html',
         title='DIY: Open-Source Experimental Biology | Orr Biologicals',
         desc='Build it, grow it, keep the notes. Fermentation cultures, algae cultivation, and honest build sheets for open-source experimental biology — MIT-licensed, reproducible, educational.',
         og_image='/assets/kitchen/hero.jpg', schema_type='CollectionPage',
         cat='DIY · Open-source experimental biology',
         crumbs=[('DIY', '/diy/')],
         body='''<h1>Build it. Grow it. <em>Keep the notes.</em></h1>
<p class="kit-page-dek">Open-source experimental biology for the people who want to hold the organism in their own hands. Four collections — build your own equipment, ferment living cultures, cultivate algae, and observe like an experimentalist. Everything is written to be repeated, attributed and improved under MIT.</p>
<div class="kit-page-art"><img src="/assets/kitchen/hero.jpg" width="1584" height="672" alt="Generated image of an instrumented cultivation bench: a cloth-covered starter jar beside a brass scale, probe thermometer and a handwritten observation notebook on dark wood."></div>
<p class="kit-page-meta"><span>The bench, open</span><span>Generated image</span></p>
<div class="prose">
<p class="kit-div-note"><span class="mono">This division</span> DIY is the hands-on side — if you want the evidence story behind a real-world problem, that is <a href="/applications/">Applications</a>; papers and field notes live under <a href="/articles/">Articles</a>; our own instruments under <a href="/inventions/">Inventions</a>.</p>

<h2 id="fermentation">B · Fermentation &amp; living cultures</h2>
<p>The fastest way in. Start something alive this week, learn to read it, and write down what you saw.</p>
<div class="kit-cards kit-cards-4">
  <a class="kit-card rose" href="/diy/sourdough/"><span class="kit-card-art"><img src="/assets/kitchen/starter.jpg" width="768" height="1376" loading="lazy" alt="Generated image of a sourdough starter in a cloth-covered glass jar beside a metal scale and feeding record."></span><span class="kit-card-body"><span class="kit-tag">Fermentation · Beginner</span><h3>Sourdough starter</h3><p>Flour and water, a seven-day start, ratios that scale, and the honest rules for when to discard.</p><span class="kit-card-foot"><b>Start &amp; keep <span aria-hidden="true">↗</span></b></span></span></a>
  <a class="kit-card rose" href="/diy/kombucha/"><span class="kit-card-art"><img src="/assets/kitchen/kombucha.jpg" width="768" height="1376" loading="lazy" alt="Generated image of amber kombucha with a pale pellicle floating in a wide glass jar."></span><span class="kit-card-body"><span class="kit-tag">Fermentation · Beginner</span><h3>Kombucha</h3><p>Sweet tea, a SCOBY and time — first ferment, ready signs, bottling without a geyser.</p><span class="kit-card-foot"><b>Brew your first <span aria-hidden="true">↗</span></b></span></span></a>
  <a class="kit-card" href="/diy/guides/"><span class="kit-card-art"><img src="/assets/kitchen/loaf.jpg" width="1376" height="768" loading="lazy" alt="Generated image of a scored sourdough boule on a wooden board beside a jar of leaven."></span><span class="kit-card-body"><span class="kit-tag">The shelf · Reference</span><h3>The guide shelf</h3><p>Every protocol in one searchable place, with reading tables and discard rules kept in.</p><span class="kit-card-foot"><b>Browse the shelf <span aria-hidden="true">↗</span></b></span></span></a>
</div>

<h2 id="algae">C · Algae &amp; aquatic biotechnology</h2>
<p>Warm light, alkaline water and patience — with the measured context, not just the vibes.</p>
<div class="kit-cards kit-cards-4">
  <a class="kit-card" href="/diy/spirulina/"><span class="kit-card-art"><img src="/assets/kitchen/spirulina.jpg" width="768" height="1376" loading="lazy" alt="Generated image of a tall bottle of deep green spirulina culture beside a notebook."></span><span class="kit-card-body"><span class="kit-tag">Cyanobacteria · Patient</span><h3>Spirulina cultivation</h3><p>Warm alkaline water, bicarbonate medium, honest signs of a culture taking off — and of one that is not.</p><span class="kit-card-foot"><b>Start a culture <span aria-hidden="true">↗</span></b></span></span></a>
  <a class="kit-card" href="/microalgae-cultivation/"><span class="kit-card-art"><img src="/assets/cyano/culture.jpg" width="1536" height="1024" loading="lazy" alt="Illustrative vessels of green microalgae culture in a cultivation setup."></span><span class="kit-card-body"><span class="kit-tag">Context · Research</span><h3>Why cultivation works</h3><p>Light, carbon, pH, mixing and gas exchange — the inputs, measured, in the cultivation pillar.</p><span class="kit-card-foot"><b>Read the pillar <span aria-hidden="true">↗</span></b></span></span></a>
  <a class="kit-card" href="/applications/phytoplankton-for-bivalves/"><span class="kit-card-art"><img src="/assets/kitchen/bivalves.jpg" width="1376" height="768" loading="lazy" alt="Generated image of a hatchery tray of young bivalves under a work lamp beside flasks of green live feed."></span><span class="kit-card-body"><span class="kit-tag">Live feeds · Hatcheries</span><h3>Phytoplankton for bivalves</h3><p>When the bench matters at scale: the one complete live-feed dossier, for oyster, clam and mussel hatcheries.</p><span class="kit-card-foot"><b>Open the dossier <span aria-hidden="true">↗</span></b></span></span></a>
</div>

<h2 id="equipment">A · Build your own equipment</h2>
<p>Instrumentation you can afford is the difference between “I think it grew” and “the log says it did.” Honest status, no catalog fiction:</p>
<div class="kit-dossier">
  <div class="kit-dossier-row static"><div><p class="kit-tag">01 · DIY incubators &amp; culture chambers <span class="kit-status dev">In development</span></p><p>Design notes for an insulated, light-controlled culture chamber and a warming incubator are being written. Nothing is published until a build is documented end-to-end — no dimension set ships without photographs of an actual build.</p></div><span class="kit-dossier-go dim" aria-hidden="true">○</span></div>
  <div class="kit-dossier-row static"><div><p class="kit-tag">02 · Temperature &amp; monitoring for cultures <span class="kit-status map">Reading first</span></p><p>What to measure before you automate anything: temperature drift, light, pH — see <a href="/diy/spirulina/reading-the-culture/">reading the culture</a> and the <a href="/research/">research approach</a>. Build sheets for logging rigs follow the protocols; they are not rushed ahead of them.</p></div><span class="kit-dossier-go dim" aria-hidden="true">○</span></div>
  <a class="kit-dossier-row" href="/inventions/"><div><p class="kit-tag">03 · System-scale instrumentation <span class="kit-status live">See inventions</span></p><p>Algaephyte and Cyanoflow — our own proposed cultivation-monitoring and single-cell observation systems. Research concepts in development; not validated hardware, not for sale.</p></div><span class="kit-dossier-go" aria-hidden="true">↗</span></a>
</div>

<h2 id="observation">D · Observation &amp; experimentation</h2>
<p>The skill every bench depends on: seeing what is actually in the jar, and writing it down honestly.</p>
<div class="kit-cards kit-cards-4">
  <a class="kit-card" href="/blog/reading-your-culture"><span class="kit-card-body"><span class="kit-tag">Observation · Reference</span><h3>Learning to read a culture</h3><p>Colour, bubbles, smell — and the limits of judging by appearance alone.</p><span class="kit-card-foot"><b>Read the note <span aria-hidden="true">↗</span></b></span></span></a>
  <a class="kit-card" href="/blog/troubleshooting-contamination-crashes"><span class="kit-card-body"><span class="kit-tag">Failure · Reference</span><h3>When a culture goes wrong</h3><p>What to discard, what to keep, and why a smell test is not a diagnosis.</p><span class="kit-card-foot"><b>Read the note <span aria-hidden="true">↗</span></b></span></span></a>
  <a class="kit-card" href="/play/"><span class="kit-card-body"><span class="kit-tag">Practice · 5 minutes</span><h3>Three small puzzles</h3><p>Memory game, a starter week in order, and read-the-jar — training the eye without killing anything.</p><span class="kit-card-foot"><b>Play <span aria-hidden="true">↗</span></b></span></span></a>
</div>

<div class="kit-note-box"><strong>Scope, plainly.</strong> DIY here means home-scale, educational, openly licensed processes. It does not mean institutional facilities: nothing on this page substitutes for containment, supervision or regulation where those apply. Observe locally, discard honestly, ask before you scale.</div>
<p>Everything here is MIT-licensed. Attribution is appreciated, improvements are welcome: the same open-source rule as the rest of the site — see <a href="/developers/">developer notes</a>.</p>
</div>''',
         next_links=[('/diy/guides/', 'The guide shelf'),
                     ('/research/', 'Our research approach'),
                     ('/inventions/', 'Our inventions')])


def build():
    build_sourdough()
    build_kombucha()
    build_spirulina()
    build_bivalves()
    build_applications_hub()
    build_diy_hub()
    print('Applications hub (4 dossier rows) + DIY hub + 13 topic pages')


if __name__ == '__main__':
    build()
