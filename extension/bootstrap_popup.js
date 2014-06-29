function check_path(path, tree){
    if(tree == 7) return true
	if(path.length == 0) return false
    var segment = path.shift()
    if(segment in tree) return check_path(path, tree[segment])
    else return false
}
function check_intermediate(path, tree){
    if(tree == 7) return false
	if(path.length == 0) return true
    var segment = path.shift()
    if(segment in tree) return check_intermediate(path, tree[segment])
    else return false
}

function add_to_tree(path, tree){
	 if(tree == 7 || path.length == 0) return 7
	 var segment = path.shift()
	 var base = (segment in tree) ? tree[segment] : {}
	 tree[segment] = add_to_tree(path, base)
	 return tree
}

function get_tree(){
    var checked = $('#jstree').jstree("get_selected")
	checked = $.map(checked, function(path){ return [path.slice(1).split('/')] }) //Double wrap the list for jquery
    var tree = {}
	for(var index in checked){
		add_to_tree(checked[index], tree)
	}
	return tree
}

function store_tree(){
	localStorage['file_tree'] = JSON.stringify(get_tree())
}

var out;

$(function () { 
    $('#jstree').jstree({
        core : {
			animation: false,
            data : {
                url : 'http://localhost:8000/list_dir',
                data: function (node) {
                   return { path: ((node.id=='#') ? '/' : node.id) };
                },
                method : "post",
				"success" : function(nodes) {
					var file_tree = ('file_tree' in localStorage) ? JSON.parse(localStorage['file_tree']) : {}
					nodes = $.map(nodes, function(node){
						var path = node.id.slice(1).split('/')
						if(check_path(path.slice(0), file_tree)) node.state = {selected: true}
						if(check_intermediate(path.slice(0), file_tree)){
							//node.state = {undetermined: true}
							setTimeout( function(){ $('#jstree').jstree(true).load_node(node.id) }, 20)
						}
						return node
					})
					return nodes
				}
            }
        },
        plugins : ['checkbox'],
        checkbox : {
            visible: true,
        }
    });
	
    $("#jstree")
		.on('open_node.jstree', function(e, node){
			node = $('#jstree').jstree(true).get_node(node.node.id, true)
			var relative_pos = node.offset().top - $('#wrapper').offset().top
			/*$('#wrapper').animate({ 
				scrollTop: relative_pos + $('#wrapper').scrollTop(),
			})*/
			if($('#wrapper')[0].clientHeight - relative_pos - node.height() < 48){
				if($('#wrapper')[0].clientHeight - node.height() < 48){
					$('#wrapper').animate({scrollTop: $('#wrapper').scrollTop() +relative_pos}, 200)
				}
				else {
					$('#wrapper').animate({scrollTop: $('#wrapper').scrollTop() +relative_pos + node.height() + 48 - $('#wrapper')[0].clientHeight}, 350)
				}
			}
		})
		.on('select_node.jstree', store_tree)
		.on('deselect_node.jstree', store_tree)
});

var background = chrome.extension.getBackgroundPage();
addEventListener("unload", function (event) {
	//store_tree()
	background.set_watch()
    background.console.log(event.type);
}, true);