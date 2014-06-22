import threading, time, server, SocketServer, argparse, os
from watchdog.observers import Observer #pypi
import ws

parser = argparse.ArgumentParser(prog="python -m f5nomore", formatter_class=argparse.ArgumentDefaultsHelpFormatter)
parser.add_argument("directory", help="The directory that should be watched for changes")
parser.add_argument("--port", type=int, help="The port where the refreshing page will be served", default="1234")
args = parser.parse_args()
#
Handler = server.SimpleHTTPRequestHandler
Handler.root = os.path.dirname(os.path.realpath(__file__))

httpd = SocketServer.TCPServer(("", args.port), Handler)

server = threading.Thread(target = httpd.serve_forever, args = ())
server.daemon = True
server.start()
print "Serving files at port", args.port

WS_PORT = 9546
ws_server = threading.Thread(target = ws.start_server, args = (WS_PORT,))
ws_server.daemon = True
ws_server.start()
print "Starting WebSocket on",WS_PORT

class handler(object):
    def dispatch(self, e):
        ws.broadcast('update')

observer = Observer()
observer.schedule(handler(), args.directory, recursive=True)
observer.start()
print "Watching file system at '"+args.directory+"'"

while 1:
   time.sleep(50)
