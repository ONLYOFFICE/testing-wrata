/**
 * Created by lobashov-2 on 17.05.17.
 */

function fullPathForFile(file) {
    var full_path = file.attr('data-test');
    var parent_folder = file.get(0).parentNode.parentNode.parentNode.children[0];
    while (parent_folder.hasAttribute('data-test')) {
        full_path = parent_folder.getAttribute('data-test') + '/' + full_path;
        parent_folder = parent_folder.parentNode.parentNode.parentNode.children[0];
    }
    return full_path;
}

function addFullPaths(root_folder) {
    var project_folder = projectFolder();
    root_folder.find('.add-button-file').each(function () {
        $(this).attr('full-path', '~/RubymineProjects/' + project_folder + '/' + fullPathForFile($(this)));
    });
}

function projectFolder() {
    var project = activeProject();
    if (project == 'ONLYOFFICE/testing-documentserver') {
        return 'OnlineDocuments';
    }
    if (project == 'ONLYOFFICE/testing-onlyoffice') {
        return 'TeamLab';
    }
    else {
        return 'unknown';
    }

}