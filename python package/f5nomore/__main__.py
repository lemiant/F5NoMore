from __future__ import print_function
from __future__ import unicode_literals
from __future__ import absolute_import
import threading, time, argparse, os, json, sys
import itertools
import traceback
print(sys.version)
py3 = sys.version > '3'
from io import BytesIO
if py3:
    import queue as Queue
    import socketserver as SocketServer
    import http.server as BaseHTTPServer
else:
    import Queue
    import SocketServer
    import BaseHTTPServer

########################################################
#
#  Serving the file system
#
########################################################

import cgi, shutil

class FileSystemServer(BaseHTTPServer.BaseHTTPRequestHandler):
    server_version = "SimpleHTTP/0.6"
            
    def do_POST(self):
        form = cgi.FieldStorage(
        fp=self.rfile,
        headers=self.headers,
        environ={'REQUEST_METHOD':'POST',
                 'CONTENT_TYPE':self.headers['Content-Type'],
                 })
        path = form['path'].value
        
        try:
            list = os.listdir(path)
        except os.error:
            list = []
        
        objs = []
        for name in list:
            obj = dict()
            objs.append(obj)
            fullname = (path if path != '/' else '') + '/' + name
            obj['id'] = fullname
            obj['text'] = name
            
            if os.path.isdir(fullname):
                obj['children'] = True
            else:    
                obj['icon'] = "jstree-file"
                
        f = BytesIO()    
        f.write(json.dumps(objs).encode('utf-8'))
        length = f.tell()
        f.seek(0)
           
        self.send_response(200)
        encoding = sys.getfilesystemencoding()
        self.send_header("Content-type", "json charset=%s" % encoding)
        self.send_header("Content-Length", str(length))
        self.end_headers()
        
        shutil.copyfileobj(f, self.wfile)
        f.close()

        
server_address = ('localhost', 9876)
FileSystemServer.protocol_version = "HTTP/1.0"
httpd = BaseHTTPServer.HTTPServer(server_address, FileSystemServer)

sa = httpd.socket.getsockname()
print("Serving File System over http on "+str(sa[0])+":"+str(sa[1]))
file_system_thread = threading.Thread(target=httpd.serve_forever, args=())
file_system_thread.daemon = True
file_system_thread.start()


########################################################
#
#  File system watching code
#
########################################################

import watchdog.events, watchdog.observers
import time
        
def check_path(path, tree):
    if len(path) == 0 or path[0] not in tree: return tree["*"]
    else: return check_path(path[1:], tree[path[0]])
        
        
class FSHandler(watchdog.events.FileSystemEventHandler):
    def __init__(self, watch, tree, shadow=0.05, *args, **kwargs):
        self.watch = watch
        self.tree = tree
        self.shadow = shadow
        self.last = 0
        watchdog.events.FileSystemEventHandler.__init__(self, *args, **kwargs)
    
    def dispatch(self, e): # Bypass the default dispatcher 
        if check_path(e.src_path.replace('\\','/').split('/')[1:], self.tree):
            if time.time()-self.last > self.shadow:
                self.last = time.time()
                print("Files changed, sending update... ("+e.src_path+")")
                for client in ws_server.connections.values():
                    client.sendMessage('update')
            self.last = time.time()
    
    
    
########################################################
#
#  Web Socket code
#
########################################################  

from .SimpleWebSocketServer import WebSocket, SimpleWebSocketServer

global observer, obs_lock
observer = False
obs_lock = threading.Lock()

def get_root_path(prefix, tree):
    if tree["*"] == True or len(tree) > 2: return prefix
    else:
        node = [segment for segment in tree.keys() if segment != "*"][0]
        path = os.path.join(prefix,node)
        if not os.path.isdir(path): return prefix
        return get_root_path(path, tree[node])

        
class ExtensionServer(WebSocket):
    def handleMessage(self):
        global observer, obs_lock
        try:
            project = json.loads(self.data.decode())
            tree = project['file_tree']
            print("Watching filesystem for '"+project['name']+"' project")
            obs_lock.acquire()
            if observer: observer.stop()
            if tree != {"*": False}:
                root_path = get_root_path(os.path.abspath('/'), tree)
                print(root_path)
                observer = watchdog.observers.Observer()
                observer.schedule(FSHandler(root_path, tree), root_path, recursive=True)
                observer.start()
            else: observer = False
            obs_lock.release()
        except:
            traceback.print_exc()

    def handleConnected(self):
        print("Extension connected on "+self.address[0]+' socket #'+str(self.address[1]))

    def handleClose(self):
        print("Extension disconnected from "+self.address[0]+' socket #'+str(self.address[1]))

        

WS_PORT = 9875
ws_server = SimpleWebSocketServer('', WS_PORT, ExtensionServer)
ws_thread = threading.Thread(target = ws_server.serveforever, args=())
ws_thread.daemon = True
ws_thread.start() #
print("Starting WebSocket on 127.0.0.1:"+str(WS_PORT))
print("Wating for F5NoMore Google Chrome extension to connect...")

while 1:
    time.sleep(0.1)
