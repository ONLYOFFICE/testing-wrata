/**
 * Created by lobashov-2 on 18.05.17.
 */

function htmlFileTree(treeNode) {
    var resultHtml = '';
    var name = treeNode.name;
    if ('children' in treeNode) {
        var children = treeNode.children;
        resultHtml += '<div class="folder">';
        resultHtml += '<div class="add-button-folder active" data-test="' + name + '" style="">add</div>';
        resultHtml += '<div class="folder-name"><i class="fa fa-folder"></i>' + name + "</div>";
        resultHtml += '<div class="folder-inside" style="display: none">';
        for (var i = 0, len = children.length; i < len; i++) {
            resultHtml += htmlFileTree(children[i]);
        }
        resultHtml += '</div>';
        resultHtml += '</div>';
    } else if (treeNode.constructor === Array) {
        for (var i = 0, len = treeNode.length; i < len; i++) {
            resultHtml += htmlFileTree(treeNode[i]);
        }
    }
    else {
        resultHtml += '<div class="file">';
        resultHtml += '<div class="add-button-file active" data-test="' + name + '" style="">add</div>';
        resultHtml += '<div class="file-name">';
        resultHtml += '<i class="fa fa-file"></i>' + name;
        resultHtml += '<i class="add-file fa fa-plus-circle"></i>';
        resultHtml += '</div>';
        resultHtml += '</div>';
    }
    return resultHtml;
}

function renderFileTree(project, ref) {
    if (project === undefined) {
        project = activeProject();
    }
    if (ref === undefined) {
        ref = getDocBranch();
    }
    $.ajax({
        url: 'runner/file_tree',
        type: 'GET',
        data: {
            'project': project,
            'refs': ref
        },
        beforeSend: function () {
            showFileTreeOverlay();
        },
        complete: function () {
            hideFileTreeOverlay();
        },
        success: function (data) {
            var dataJson = JSON.parse(data);
            var html_data = htmlFileTree(dataJson.children);
            var fileTab = $(".tests-block .tab-content .tab-pane");
            fileTab.html(html_data);
            setEventToOpenFolder();
            eventToAddFile();
            selectProject(project);
            eventToAddTestInQueue(fileTab.find('.add-button-file'));
            eventToAddFolderInQueue(fileTab.find('.add-button-folder'));
            addFullPaths(fileTab);
        },
        error: function (xhr, type, errorThrown) {
            ajaxErrorUnlessPageRefresh(xhr, type, errorThrown);
        }
    });
}

function activeProject() {
    return $('#projects_0 option:selected').val();
}

function showFileTreeOverlay() {
    $(".section-overlay.file-tree-overlay").show();
}

function hideFileTreeOverlay() {
    $(".section-overlay.file-tree-overlay").hide();
}

function fetchBranchesAndShowFiles() {
    fetchBranches(activeProject(), $('#docs-branches'));
}

function fetchBranches(project, control) {
    $.ajax({
        url: 'runner/branches',
        context: this,
        async: true,
        type: 'GET',
        data: {
            project: project
        },
        beforeSend: function () {
            showFileTreeOverlay();
        },
        success: function (data) {
            setGitReferences(control, data.branches, data.tags);
            renderFileTree(project, getDocBranch());
        },
        error: function (xhr, type, errorThrown) {
            ajaxErrorUnlessPageRefresh(xhr, type, errorThrown);
        }
    });
}


function setGitReferences(control, branches, tags) {
    clearElementInside(control);
    control.append($("<option disabled>Branches</option>"));
    for(var i = 0; i < branches.length; i++) {
        control.append($("<option>" + branches[i] + "</option>"));
    }
    control.append($("<option disabled>Tags</option>"));
    for(var i = 0; i < tags.length; i++) {
        control.append($("<option>" + tags[i] + "</option>"));
    }
}