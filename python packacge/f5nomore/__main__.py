import threading, time, server, SocketServer, argparse, os, json
import Queue
import itertools
import traceback

########################################################
#
#  File system watching code
#
########################################################

import watchdog.events, watchdog.observers

def async(func):
    """A decorator to make a function run in its own thread and return its result on .join()"""
    def launch(*args, **kwargs):
        target = ThreadedFunction(func, *args, **kwargs)
        target.start()
        return target
    return launch
class ThreadedFunction(threading.Thread):
    def __init__(self, func, *args, **kwargs):
        self.args = args
        self.kwargs = kwargs
        self.func = func
        threading.Thread.__init__(self)
    def run(self):
        self.result = self.func(*self.args, **self.kwargs)
    def join(self):
        threading.Thread.join(self)
        return self.result
        
def check_path(path, tree):
    if len(path) == 0 or path[0] not in tree: return tree["*"]
    else: return check_path(path[1:], tree[path[0]])
        
class FSHandler(watchdog.events.PatternMatchingEventHandler):
    def __init__(self, tree, shadow=0.01, *args, **kwargs):
        self.tree = tree
        self.shadow = shadow
        self.stack = []
        watchdog.events.PatternMatchingEventHandler.__init__(self, *args, **kwargs)
    
    @async
    def do_it(self, e):
        #print e.src_path[1:].split('/')
        print check_path(e.src_path.replace('\\','/').split('/')[1:], self.tree)
        if not check_path(e.src_path.replace('\\','/').split('/')[1:], self.tree): return
        else:
            self.stack.append(e)
            time.sleep(self.shadow)
            self.stack.pop()
            if len(self.stack) == 0:
                print "Throw"
                for client in ws_server.connections.itervalues():
                    client.sendMessage('update')
            
    def on_modified(self, e): self.do_it(e) 
    def on_moved(self, e): self.do_it(e) 
    def on_created(self, e): self.do_it(e) 
    def on_deleted(self, e): self.do_it(e) 
    
    
    
########################################################
#
#  Web Socket code 
#
########################################################  

from SimpleWebSocketServer import WebSocket, SimpleWebSocketServer

global observer, obs_lock
observer = False
obs_lock = threading.Lock()

def root_path(tree):
    if tree["*"] == True or len(tree) > 2: return ''
    else: 
        root = [segment for segment in tree.keys() if segment != "*"][0]
        return '/' + root + root_path(tree[root])

class ExtensionServer(WebSocket):
    def handleMessage(self):
        global observer
        try:
            tree = json.loads(str(self.data))
            obs_lock.acquire()
            if observer: observer.stop()
            observer = watchdog.observers.Observer()
            observer.schedule(FSHandler(tree), root_path(tree), recursive=True)
            observer.start()
            obs_lock.release()
        except:
            traceback.print_exc()

    def handleConnected(self):
        print self.address, 'connected'

    def handleClose(self):
        print self.address, 'closed'

WS_PORT = 9546
ws_server = SimpleWebSocketServer('', WS_PORT, ExtensionServer)#
ws_thread = threading.Thread(target = ws_server.serveforever, args=())
ws_thread.daemon = True
ws_thread.start() #
print "Starting WebSocket on",WS_PORT

while 1:
    time.sleep(0.1)
