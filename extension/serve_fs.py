import os, posixpath, BaseHTTPServer
import urllib, cgi, sys, shutil, mimetypes, json
try:
    from cStringIO import StringIO
except ImportError:
    from StringIO import StringIO

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
                
        f = StringIO()    
        f.write(json.dumps(objs))
        length = f.tell()
        f.seek(0)
           
        self.send_response(200)
        encoding = sys.getfilesystemencoding()
        self.send_header("Content-type", "json charset=%s" % encoding)
        self.send_header("Content-Length", str(length))
        self.end_headers()
        
        shutil.copyfileobj(f, self.wfile)
        f.close()

        
server_address = ('', 8000)

FileSystemServer.protocol_version = "HTTP/1.0"
httpd = BaseHTTPServer.HTTPServer(server_address, FileSystemServer)

sa = httpd.socket.getsockname()
print "Serving HTTP on", sa[0], "port", sa[1], "..."
httpd.serve_forever()