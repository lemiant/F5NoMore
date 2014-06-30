var out;

var background = chrome.extension.getBackgroundPage();
if(background.click_in_transit){
    background.clearTimeout(background.click_in_transit)   
}

projects = JSON.parse(localStorage['projects']);

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

function get_tree(target){
    var checked = target.jstree("get_selected")
	checked = $.map(checked, function(path){ return [path.slice(1).split('/')] }) //Double wrap the list for jquery
    var tree = {}
	for(var index in checked){
		add_to_tree(checked[index], tree)
	}
	return tree
}

function store_tree(heading){
    var id = heading.attr('id')
    projects[id]['file_tree'] = get_tree(heading.next().find('.jstree_div'))
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
                    var undetermined_parent = false;
                    if(nodes.length){
                        var node = nodes[0];
                        var path = node.id.slice(1).split('/')
                        if(path.length > 1){
                            var parent_path = '/'+path.slice(0,-1).join('/')
                            var parent = target.jstree(true).get_node(parent_path);
                            if(parent.state.undetermined)
                                undetermined_parent = true
                        }
                        else undetermined_parent = true
                        if(undetermined_parent){
                            nodes = $.map(nodes, function(node){
                            var path = node.id.slice(1).split('/')
                                if(check_path(path.slice(0), file_tree)) node.state = {selected: true}
                                else if(check_intermediate(path.slice(0), file_tree)){ 
                                    node.state = {undetermined: true}
                                    setTimeout( function(){ target.jstree(true).load_node(node.id) }, 20)
                                }
                                else node.state = {selected: false}
                                return node
                            })
                        }
                    }
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
			var relative_pos = node.offset().top - $('#wrapper').offset().top
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
    var id = (Math.max.apply(null, key_nums)+1).toString()
    heading.attr('id', id)
    projects[id] = {name: name, file_tree: {}}
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
}

addEventListener("unload", function (event) {
    var open_projects = $('.arrow_down').closest('.jstree_wrapper').prev()
    if(open_projects.length)
    open_projects.map(function(i,e){
        store_tree(e)
    })
	background.set_watch()
}, true);

$(function () { 
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
});