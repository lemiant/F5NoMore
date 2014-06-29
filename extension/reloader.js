try {
	var host = "ws://localhost:9546/stuff";
	console.log("Host:", host);
	
	var s = new WebSocket(host);
	
	s.onopen = function (e) {
		console.log("Socket opened.");
	};
	
	s.onclose = function (e) {
		console.log("Socket closed.");
	};
	
	var cid = 0;
	
	s.onmessage = function (e) {
		console.log("Socket message:", e.data);
		if(e.data == "update"){
			window.location.reload()
		}
	};
	
	s.onerror = function (e) {
		console.log("Socket error:", e);
	};
	
	chrome.runtime.onMessage.addListener(function(msg){
		if(msg == "kill"){
			s.close()
		}
	})
} catch (ex) {
	console.log("Socket exception:", ex);
}