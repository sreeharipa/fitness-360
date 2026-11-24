# Dev server with caching disabled (python3 tools/serve.py [port]).
import http.server, sys

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

http.server.ThreadingHTTPServer(('', int(sys.argv[1]) if len(sys.argv) > 1 else 5173), H).serve_forever()
