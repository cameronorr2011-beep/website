"""Local browser preview only; does NOT execute or validate Apache .htaccess."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
from seo_audit import ROOT


class Preview(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs): super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        parsed = urlsplit(self.path)
        path = parsed.path
        if any(path.startswith('/' + prefix + '/') for prefix in ('sections', 'tools', 'docs', '.git')):
            self.send_error(403); return
        file = ROOT / path.lstrip('/')
        if not file.exists() and not path.endswith('/') and file.with_suffix('.html').is_file():
            self.path = path + '.html' + ('?' + parsed.query if parsed.query else '')
        super().do_GET()


if __name__ == '__main__':
    print('Preview ready on http://127.0.0.1:8876 (Apache redirects not emulated)', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8876), Preview).serve_forever()
