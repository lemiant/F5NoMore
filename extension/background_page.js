var monitored_tabs = {}

function delete_tab(tabId){
	var tab_str = tabId.toString()
	if(tab_str in monitored_tabs) delete monitored_tabs[tab_str]
}

var click_in_transit = false;

chrome.browserAction.onClicked.addListener(function(tab){
	// Double Click pop-ups (what a bad API)
	chrome.browserAction.setPopup({tabId: tab.id, popup: "popup.html"})
	setTimeout(function(){ chrome.browserAction.setPopup({tabId: tab.id, popup: ""}) }, 350)
	
	var tab_str = tab.id.toString()
	
	if(!(tab_str in monitored_tabs)){
		monitored_tabs[tab_str] = 1;
		chrome.browserAction.setIcon({path: "f5.png", tabId:tab.id})
		chrome.tabs.onRemoved.addListener(delete_tab)
	} else {
        click_in_transit = setTimeout( function(){
            click_in_transit = false;
            delete monitored_tabs[tab_str];
            chrome.browserAction.setIcon({path: "f5_off.png", tabId:tab.id})
            chrome.tabs.onRemoved.addListener(delete_tab)
        }, 350)
	}
	console.log(monitored_tabs)
})

chrome.tabs.onUpdated.addListener(function(tabId){
    console.log(tabId)
    if(tabId.toString() in monitored_tabs) chrome.browserAction.setIcon({path: "f5.png", tabId:tabId});
})

////////////////////////////////////////
//
//  WebSocket Code
//
////////////////////////////////////////

var ws;
var host = "ws://localhost:9875/stuff";

function send_watch(){
    console.log(localStorage['current_project'])
    var projects = JSON.parse(localStorage['projects'])
    if(localStorage['current_project']){     
        console.log(JSON.stringify(projects[localStorage['current_project']]))
ws.send(JSON.stringify(projects[localStorage['current_project']]))
    }
}

function connect(){
    ws = new WebSocket(host);

    ws.onopen = function (e) {
        console.log("Socket opened."); 
        send_watch()
    };
    ws.onclose = function (e) { 
        console.log("Socket closed."); 
        setTimeout(connect, 300) 
    };

    ws.onerror = function (e) { 
        console.log("Socket error:", e); 
    };

    ws.onmessage = function (e) {
        console.log("Socket message:", e.data);
        if(e.data == "update"){
            for(var tabId in monitored_tabs){
                chrome.tabs.executeScript(parseInt(tabId), {code: 'window.location.reload()'})
            }
        }
    };
}

if(!('projects' in localStorage)) localStorage['projects'] = '{}'

connect()