"""Homepage build guard.

The redesigned homepage is authored directly in index.html. The older
sections/head.html and home-body.html partials describe the previous site
and must not overwrite it during a build. Keeping this module as a no-op
lets the existing build entrypoints remain compatible without resurrecting
the retired homepage.
"""
from seo_audit import ROOT


def render():
    return (ROOT / 'index.html').read_text(encoding='utf-8').rstrip() + '\n'


def build():
    render()
    print('Preserved authored homepage index.html')


if __name__ == '__main__': build()
