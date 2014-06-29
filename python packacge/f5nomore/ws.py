#!/usr/bin/env python
 
import socket, struct, hashlib, threading, cgi, base64
 
def create_hash (key):
   guid = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
   sha1 = hashlib.sha1(key + guid)
   digest = sha1.digest()
   return base64.b64encode(digest)
 
def recv_data (client, length):
   data = client.recv(length)
 
   # Decode the websocket frame.
 
   # Length is the first byte.
   length = (struct.unpack("B", data[1:2])[0]) & 127
 
   # Determine where the mask begins.
   maskStart = 2
   if length == 126:
      # Following two bytes are the length
      maskStart = 4
   elif length == 127:
      # Following eight bytes are the length
      maskStart = 10
 
   dataStart = maskStart + 4
   length = len(data) - dataStart
   masks = data[maskStart:maskStart + 4]
 
   print "data length:", len(data)
   print "maskStart:", maskStart
   print "dataStart:", dataStart
   print "message length:", length
 
   # Decode the data itself.
   j = 0
   decodedData = ""
   for i in range(dataStart, len(data)):
      val = struct.unpack("B", data[i:i + 1])[0]
      m = struct.unpack("B", masks[j:j + 1])[0]
      val = val ^ m
      j = (j + 1) % 4
      decodedData += str(unichr(val))
 
   print "decoded:", decodedData
   return decodedData
 
def send_data (client, data):
   # Encode the data into the websocket frame format.
   # HACK: First byte is always 129 because we assume we're always sending text.
   message = chr(129)
   length = len(data)
   if length <= 125:
      # Length fits into one byte.
      message = message + chr(length)
   elif length >= 126 & length <= 65535:
      # Length fits into two bytes.
      message = message + chr(126)
      message = message + chr((length >> 8) & 255)
      message = message + chr(length & 255)
   else:
      # Length goes into eight bytes.
      message = message + chr(127)
      message = message + chr((length >> 56) & 255)
      message = message + chr((length >> 48) & 255)
      message = message + chr((length >> 40) & 255)
      message = message + chr((length >> 32) & 255)
      message = message + chr((length >> 24) & 255)
      message = message + chr((length >> 16) & 255)
      message = message + chr((length >> 8) & 255)
      message = message + chr(length & 255)
 
   # Now add the data.
   message = message + data
 
   client.send(message)
 
def parse_headers (data):
   headers = {}
   lines = data.splitlines()
   for l in lines:
      parts = l.split(": ", 1)
      if len(parts) == 2:
         s = parts[1].strip()
         headers[parts[0]] = s
   return headers
 
def handshake (client):
   print 'Handshaking...'
   data = client.recv(1024)
   headers = parse_headers(data)
   print 'Got headers:'
   for k, v in headers.iteritems():
      print k, ':', '\'', v, '\''
   digest = create_hash(
      headers['Sec-WebSocket-Key']
   )
   shake = "HTTP/1.1 101 Switching Protocols\r\n"
   shake += "Upgrade: websocket\r\n" 
   shake += "Connection: Upgrade\r\n"
   shake += "Sec-WebSocket-Accept: " + digest + "\r\n\r\n"
   print shake
   return client.send(shake)
 
def handle (client, addr):
   handshake(client)
   while 1:
      data = recv_data(client, 1024)
      if not data: break
      #We literally don't care about this atm
   print 'Client closed:', addr
   client_lock.acquire()
   clients.remove(client)
   client_lock.release()
   client.close()

def broadcast(msg):
   client_lock.acquire()
   [send_data(c, msg) for c in clients]
   client_lock.release()
   
def start_server(port = 9876):
   s = socket.socket()
   s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
   s.bind(('', port))
   s.listen(5)
   while 1:
      conn, addr = s.accept()
      print 'Connection from:', addr
      client_lock.acquire()
      clients.append(conn)
      client_lock.release()
      threading.Thread(target = handle, args = (conn, addr)).start()
 
clients = []
client_lock = threading.Lock()

if __name__ == "__main__":
    start_server()
