"""Serve sample audio and the deck locally for preview and rendering."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8766), partial(Handler, directory=str(Path(__file__).resolve().parent)))
    print("Sample assets: http://127.0.0.1:8766", flush=True)
    server.serve_forever()
