var out;

var background = chrome.extension.getBackgroundPage();
if(background.click_in_transit){
    background.clearTimeout(background.click_in_transit)   
}

projects = JSON.parse(localStorage['projects']);

function get_path_state(path, tree){
    if(path.length == 0){
        var sel = tree["*"]
        var und = (Object.keys(tree).length > 1)
    }
    else{
        segment = path.shift()
        if(segment in tree) return get_path_state(path, tree[segment])
        else{
            var sel = tree["*"]
            var und = false
        }
    }
    return {selected: sel, undetermined: und}
}

function get_tree(jstree, root){
    root = jstree.get_node(root)
    var tree = {}
    tree["*"] = root.state.selected || false;
    if(root.state.undetermined || root.id == "#"){
        for(var i=0; i<root.children.length; i++){
            var child = jstree.get_node(root.children[i])
            if(child.state.selected != !!(root.state.selected) || child.state.undetermined){
                tree[child.id.split('/').pop()] = get_tree(jstree, child)
            }
        }
    }
    return tree
}

function store_tree(heading){
    var id = heading.attr('id')
    projects[id]['file_tree'] = get_tree(heading.next().find('.jstree_div').jstree(true), '#')
    localStorage['projects'] = JSON.stringify(projects)
}

function initialize_jstree(target){
    var wrapper = target.closest('.jstree_wrapper')
    var project_id = target.data('id')
    var file_tree = projects[project_id]['file_tree']
    
    target.jstree({
        core : {
			animation: false,
            data : {
                url : 'http://localhost:8000/list_dir',
                data: function (node) {
                   return { path: ((node.id=='#') ? '/' : node.id) };
                },
                method : "post",
				"success" : function(nodes) {
                    if(nodes.length){
                        var node = nodes[0];
                        var path = node.id.slice(1).split('/')
                        var undetermined_parent = false;
                        if(path.length == 1) undetermined_parent = true
                        else{
                            var parent_path = '/'+path.slice(0,-1).join('/')
                            var parent = target.jstree(true).get_node(parent_path);
                            if(parent.state.undetermined)
                                undetermined_parent = true
                        }
                        nodes = $.map(nodes, function(node){
                            if(undetermined_parent){
                                    var path = node.id.slice(1).split('/')
                                    node.state = get_path_state(path, file_tree)
                            }
                            else{
                                node.state = {
                                    selected: parent.state.selected,
                                    undetermined: false
                                }
                            }
                            return node
                        })
                    }
                    console.log(nodes)
					return nodes
				}
            }
        },
        plugins : ['checkbox'],
        checkbox : {
            visible: true,
        }
    });
    
    target
		.on('open_node.jstree', function(e, node){
			node = target.jstree(true).get_node(node.node.id, true)
			var relative_pos = node.offset().top - $('.jstree_wrapper').offset().top
			if(wrapper[0].clientHeight - relative_pos - node.height() < 48){
				if(wrapper[0].clientHeight - node.height() < 48){
					wrapper.animate({scrollTop: wrapper.scrollTop() +relative_pos}, 400)
				}
				else {
					wrapper.animate({scrollTop: wrapper.scrollTop() +relative_pos + node.height() + 48 - wrapper[0].clientHeight}, 200)
				}
			}
		})
}


function edit_project(e){
    $('#arrow_down').closest('h3').map(function(i,e){ close_project.apply(e, []) })// Close any open projects
    var project = $(this).closest('h3')
    project.find('.arrow')
        .addClass('arrow_down')
        .removeClass('arrow')

    var jstree_wrapper = $('<div class="jstree_wrapper"></div>')
    var jstree_div = $('<div class="jstree_div"></div>')
    jstree_div.data('id', project.attr('id'))
    jstree_wrapper.append(jstree_div)
    initialize_jstree(jstree_div)
    project.after(jstree_wrapper)

    var relative_pos = project.offset().top - $('#wrapper').offset().top
    $('#wide-wrapper').animate(
        {top: ($('#wide-wrapper').css('top').slice(0,-2) - relative_pos)+"px" }
    )
    jstree_wrapper.animate({ height: '565px' })
}
function close_project(){
    var project = $(this).closest('h3')
    store_tree(project)
    project.find('.arrow_down')
        .addClass('arrow')
        .removeClass('arrow_down')

    $('#wide-wrapper').animate({top: 0})
    project.next().animate({height: 0}, null, function(){ $(this).remove() })
}

function change_active_project(){
    $('h3.active').removeClass('active')
    var current = $(this)
    current.addClass('active')
    localStorage['current_project'] = current.attr('id')
}

function add_project_shell(){
    var new_project = $('<h3><form><input type="text" /></form></h3>');
    new_project.find('form').on('submit', function(e){
        e.preventDefault()
        var project_name = $(this).find('input').val()
        if(project_name){
            $(this).remove()
            add_project(new_project, project_name)
        }
    })
    $('#projects').append(new_project)
}
function add_project(heading, name){
    var key_nums = $.map(Object.keys(projects), function(e){ return parseInt(e) })
    var id = 1
    if(key_nums.length) id = (Math.max.apply(null, key_nums)+1).toString()
    heading.attr('id', id)
    projects[id] = {name: name, file_tree: {"*": false}}
    localStorage['projects'] = JSON.stringify(projects)
    make_project_ui(heading, name)
}
function start_rename_project(e){
    if(e.which == 113){ //F2
        var current_heading = $('h3.active');
        if(current_heading.length){
            var id = current_heading.attr('id');
            var name = current_heading.find('span').text()
            current_heading.empty()
            var form = $('<form><input type="text" /></form>');
            form.on('submit', do_rename_project)
            current_heading.append(form)
            var input = form.find('input')
            input.val(name)
            input.data('original', name)
            input.focus()
            input.on('focusout', function(e){ do_rename_project.apply(this, [e, true]) } )
        }
    }
}
function do_rename_project(e, bubble){
    if(!bubble) e.preventDefault()
    var current_heading = $(this).closest('h3')
    var form = current_heading.find('form')
    var name = form.find('input').val()
    if(!name) name = form.find('input').data('original')
    form.remove()
    projects[current_heading.attr('id')]['name'] = name
    localStorage['projects'] = JSON.stringify(projects)
    make_project_ui(current_heading, name)
}
function make_project_ui(heading, name){
    heading.append($('<div class="arrow" />'))
    heading.append($('<span>'+name+'</span>'))
    heading.addClass('project')
    change_active_project.apply(heading)
}
function remove_project(){
    var heading = $(this)
    var id = heading.attr('id')
    delete projects[id]
    heading.remove()
    localStorage['projects'] = JSON.stringify(projects)
    delete localStorage['current_project']
}

function update_connection_status(){
    if(background.ws && background.ws.readyState == 1){
        $('#connection').html('Connected')
        $('#connection').removeClass('error')
    }
    else{
        $('#connection').html('Not connected.<br />Have you installed and started<br />the <a href="http://pypi.com">Python Script</a>?')
        $('#connection').addClass('error')
    }
}

addEventListener("unload", function (event) {
    var open_projects = $('.arrow_down').closest('.jstree_wrapper').prev()
    if(open_projects.length)
    open_projects.map(function(i,e){
        store_tree(e)
    })
	background.send_watch()
}, true);

$(function () {
    $('#close').on('click', function(){ window.close() })
    
    for(id in projects){
        $('#projects').append($('<h3 id="'+id+'" class="project '+((id==localStorage['current_project'])?'active':'')+'"><div class="arrow"></div><span class="name">'+projects[id]['name']+'</span></h3>'))
    }    
    $('body').on('click', '.arrow', edit_project)
    $('body').on('click', '.arrow_down', close_project)
    $('body').on('click', '.remove', remove_project)
    $('body').on('click', '#projects h3.project', change_active_project)
    $('h3.add').on('click', add_project_shell)
    $('body').contextMenu("delete_menu", {selector: "#projects h3", bindings: {delete: remove_project}})
    $('body').on('keydown', start_rename_project)
    $('body').on('click', 'a', function(){  
     chrome.tabs.create({url: $(this).attr('href')});
     return false; })
    
    setInterval(update_connection_status, 400)
});