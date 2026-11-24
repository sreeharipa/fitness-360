# Dev server with caching disabled (python3 tools/serve.py [port]).
# Set SHOT_DIR to let the page POST canvas captures to /__shot?name=x (debugging only).
import http.server, os, sys, urllib.parse

SHOT_DIR = os.environ.get('SHOT_DIR')

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_POST(self):
        u = urllib.parse.urlparse(self.path)
        if not SHOT_DIR or u.path != '/__shot':
            self.send_error(404)
            return
        name = os.path.basename(urllib.parse.parse_qs(u.query).get('name', ['shot'])[0]) or 'shot'
        data = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        with open(os.path.join(SHOT_DIR, name + '.png'), 'wb') as f:
            f.write(data)
        self.send_response(204)
        self.end_headers()

http.server.ThreadingHTTPServer(('', int(sys.argv[1]) if len(sys.argv) > 1 else 5173), H).serve_forever()
