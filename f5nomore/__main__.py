import threading, time, server, SocketServer, argparse, os
import Queue
import watchdog
from watchdog.observers import Observer #pypi
from SimpleWebSocketServer import WebSocket, SimpleWebSocketServer

class SimpleEcho(WebSocket):
    def handleMessage(self):
        if self.data is None:
            self.data = ''

        # echo message back to client
        self.sendMessage(str(self.data))

    def handleConnected(self):
        print self.address, 'connected'

    def handleClose(self):
        print self.address, 'closed'

parser = argparse.ArgumentParser(prog="python -m f5nomore", formatter_class=argparse.ArgumentDefaultsHelpFormatter)
parser.add_argument("directory", help="The directory that should be watched for changes")
parser.add_argument("--port", type=int, help="The port where the homepage will be served", default="1234")
parser.add_argument("--include", help="Paths to watch", default="*")
parser.add_argument("--exclude", help="Paths to ignore", default="")
args = parser.parse_args()

Handler = server.SimpleHTTPRequestHandler
Handler.root = os.path.dirname(os.path.realpath(__file__))

httpd = SocketServer.TCPServer(("", args.port), Handler)

server = threading.Thread(target = httpd.serve_forever, args = ())
server.daemon = True
server.start()
print "Serving files at port", args.port

WS_PORT = 9546
ws_server = SimpleWebSocketServer('', WS_PORT, SimpleEcho)#
ws_thread = threading.Thread(target = ws_server.serveforever, args=())
ws_thread.daemon = True
ws_thread.start() #
print "Starting WebSocket on",WS_PORT

broadcast_queue = Queue.Queue()

class FSHandler(watchdog.events.PatternMatchingEventHandler):
    def do_it(self, e):
        print "caught"
        broadcast_queue.put(e)
        
    def on_modified(self, e): self.do_it(e) 
    def on_moved(self, e): self.do_it(e) 
    def on_created(self, e): self.do_it(e) 
    def on_deleted(self, e): self.do_it(e) 

include = args.include.split('|')
exclude = [pat for pat in args.exclude.split('|') if pat]
if exclude == []: exclude = None
observer = Observer()
observer.schedule(FSHandler(patterns=include, ignore_patterns=exclude), args.directory, recursive=True)
observer.start()
print "Watching file system at '"+args.directory+"'"

while 1:
   broadcast_queue.get()
   broadcast_queue.task_done()
   while True:
        time.sleep(.02)
        if not broadcast_queue.empty():
            #Empty the queue #
            while True:
                try:
                    broadcast_queue.get_nowait()
                    broadcast_queue.task_done()
                except Queue.Empty:
                    break
        else:
            print "Caught"
            print ws_server.connections
            for client in ws_server.connections.itervalues():
                print client
                client.sendMessage('update')
            break
