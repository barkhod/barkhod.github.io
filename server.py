import functools
import os
import sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PORT = 25565
class NoCacheHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "application/javascript",
        ".mjs": "application/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
        ".json": "application/json",
        ".woff2": "font/woff2",
        ".woff": "font/woff",
        ".mp4": "video/mp4",
        ".webm": "video/webm",
    }
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()
    def log_message(self, fmt, *args):
        sys.stdout.write("%s - %s\n" % (self.address_string(), fmt % args))
def main():
    os.chdir(BASE_DIR)
    handler = functools.partial(NoCacheHandler, directory=BASE_DIR)
    try:
        httpd = ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    except OSError as e:
        print(f"[Barkhod] Could not bind 127.0.0.1:{PORT}: {e}")
        print("[Barkhod] Is another Start.bat already running? Close it and try again.")
        input("Press Enter to exit...")
        sys.exit(1)
    print(f"[Barkhod] Serving {BASE_DIR}")
    print(f"[Barkhod] Open http://localhost:{PORT}")
    print("[Barkhod] CTRL+C to stop")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
        print("\n[Barkhod] Stopped.")
if __name__ == "__main__":
    main()
