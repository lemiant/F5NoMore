var monitored_tabs = {}

function delete_tab(tabId){
	var tab_str = tabId.toString()
	if(tab_str in monitored_tabs) delete monitored_tabs[tab_str]
}

var click_in_transit = false;

chrome.browserAction.onClicked.addListener(function(tab){
	// Double Click pop-ups (what a bad API)
	chrome.browserAction.setPopup({tabId: tab.id, popup: "popup.html"})
	setTimeout(function(){ chrome.browserAction.setPopup({tabId: tab.id, popup: ""}) }, 400)
	
	var tab_str = tab.id.toString()
	
	if(!(tab_str in monitored_tabs)){
		monitored_tabs[tab_str] = 1;
		chrome.browserAction.setIcon({path: "triangle.png", tabId:tab.id})
		chrome.tabs.onRemoved.addListener(delete_tab)
	} else {
        click_in_transit = setTimeout( function(){
            click_in_transit = false;
            delete monitored_tabs[tab_str];
            chrome.browserAction.setIcon({path: "triangle_off.png", tabId:tab.id})
            chrome.tabs.onRemoved.addListener(delete_tab)
        }, 400)
	}
	console.log(monitored_tabs)
})

chrome.tabs.onUpdated.addListener(function(tabId){
    console.log(tabId)
    if(tabId.toString() in monitored_tabs) chrome.browserAction.setIcon({path: "triangle.png", tabId:tabId});
})


try {
	var host = "ws://localhost:9546/stuff";
	console.log("Host:", host);
	
	var s = new WebSocket(host);
	
	s.onopen = function (e) { console.log("Socket opened.")	};
	s.onclose = function (e) { console.log("Socket closed.") };
	s.onerror = function (e) { console.log("Socket error:", e) };
	
	var cid = 0;
	s.onmessage = function (e) {
		console.log("Socket message:", e.data);
		if(e.data == "update"){
			for(var tabId in monitored_tabs){
				chrome.tabs.executeScript(parseInt(tabId), {code: 'window.location.reload()'})
			}
		}
	};
} catch (ex) {
	console.log("Socket exception:", ex);
}

var watch_id = 0
function set_watch(){
    var projects = JSON.parse(localStorage['projects'])
	setTimeout(function(){ 
		s.send(JSON.stringify(projects[localStorage['current_project']]['file_tree']))
	}, 0)
}