// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// the compiled file.
//
// WARNING: THE FIRST BLANK LINE MARKS THE END OF WHAT'S TO BE PROCESSED, ANY BLANK LINE SHOULD
// GO AFTER THE REQUIRES BELOW.
//= require bootbox
//= require bootstrap
//= require jquery-ui
//= require jquery_ujs
//= require_tree
//
//
/*jshint esnext: true */
$.ajaxSetup({
    headers: {
        'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content')
    }
});

const STATUS = {
    UPDATE_INTERVAL: 10000,
    ONLINE: 0,
    OFFLINE: 1,
    WAIT: 2
};

const MAX_LENGTH = 26;
const MIN_LENGTH = 3;

var isPageBeingRefreshed = false;
var regionSelector;

window.onbeforeunload = function() {
    isPageBeingRefreshed = true;
};

function showInfoAlert(alertText){
    var alert = $("#info-alert");
    alertText = alertText || "Unknown Error";
    alert.text(alertText);
    alert.dialog({
        open: function( ) {
          showOverlay();
        },
        close: function( ) {
          hideOverlay();
        },
        buttons: [
            {
                text: "OK",
                click: function() {
                    $( this ).dialog( "close" );
                }
            }
        ]
    });
}

function ajaxErrorUnlessPageRefresh(xhr, type, errorThrown) {
    xhr.abort();
    if (isPageBeingRefreshed) {
        return;
    }
    showInfoAlert(errorThrown);
    infoPopup(xhr.responseText);
}

function infoPopup(info_html) {
    var popup = open("", "Info Popup", "width=800,height=400");
    popup.document.body.innerHTML = info_html.replace(/(?:\r\n|\r|\n)/g, '<br />');
}

function trim_data(data) {
    return $($.trim(data));
}

function Runner() {
    var _self = this;
    var testListUpdating = false;

    this.eventToGetUpdatedDataFromServer = function () {
        setInterval(function () {
            if (!testListUpdating) {
                getUpdatedDataFromServer();
            }
        }, STATUS.UPDATE_INTERVAL);
    };

    this.getBranch = function () {
        return $('li.active .branch').val();
    };

    this.showCurrentRspecResult = function (server_name) {
        $.ajax({
            url: 'servers/show_current_results',
            type: 'GET',
            data: {
                'server': server_name
            },
            success: function (data) {
                showPopup();
                $('.popup-window').html(data);
                eventsForRspecPopup();
            }
        });
    };

    this.eventToShowCurrentRspecResult = function (elem) {
        elem.on('click', function () {
            var server_name = $(this).attr('data-server');
            _self.showCurrentRspecResult(server_name);
        });
    };

    this.stopCurrent = function (server) {
        $.ajax({
            url: 'runner/stop_current',
            type: 'POST',
            async: false,
            data: {
                'server': server
            },
            success: function () {
                showInfoAlert('Current test was stopped successfully!');
            },
            error: function (xhr, type, errorThrown) {
                ajaxErrorUnlessPageRefresh(xhr, type, errorThrown);
            }
        });
    };

    this.stopAllBooked = function () {
        $.ajax({
            url: 'runner/stop_all_booked',
            type: 'POST',
            async: true,
            beforeSend: function () {
                showOverlay('Stopping tests on all booked servers');
            },
            complete: function () {
                hideOverlay();
            },
            success: function () {
                showInfoAlert('All test on all booked servers stop successfully!');
            },
            error: function (xhr, type, errorThrown) {
                ajaxErrorUnlessPageRefresh(xhr, type, errorThrown);
            }
        });
    };
    
    this.destroyAllUnbooked = function () {
        $.ajax({
            url: 'runner/destroy_all_unbooked_servers',
            type: 'POST',
            async: true,
            beforeSend: function () {
                showOverlay('Destroy all unbooked servers');
            },
            complete: function () {
                hideOverlay();
            },
            success: function () {
                showInfoAlert('All unbooked servers destroyed');
            },
            error: function (xhr, type, errorThrown) {
                ajaxErrorUnlessPageRefresh(xhr, type, errorThrown);
            }
        });
    };

    this.eventToStopTest = function (elem) {
        elem.on('click', function () {
            var result = confirm('Are you really want to stop this test?');
            if (result) {
                var server_name = $(this).attr('data-server');
                _self.stopCurrent(server_name);
                getUpdatedDataFromServer();
            }
        });
    };

    this.eventToStopAllBooked = function (elem) {
        elem.on('click', function () {
            var result = confirm('Are you really want to stop all test on booked servers?');
            if (result) {
                _self.stopAllBooked();
            }
        });
    };
    
    this.eventToDestroyAllUnBooked = function (elem) {
        elem.on('click', function () {
            var result = confirm('Are you really want to destroy all unbooked servers?');
            if (result) {
                _self.destroyAllUnbooked();
            }
        });
    };

    this.unbookAllServers = function() {
        $.ajax({
            url: 'queue/unbook_all_servers',
            context: this,
            async: false,
            type: 'POST',
            success: function () {
                getUpdatedDataFromServer();
            },
            error: function (xhr, type, errorThrown) {
                ajaxErrorUnlessPageRefresh(xhr, type, errorThrown);
            }
        });
    };

    this.eventToAddTestsFromSidebar = function(elem) {
        elem.on('click', function(){
            var tests = _self.getTestPathsFromSidebar();
            var branch = _self.getBranch();
            var location = $('#list-region').val();
            addTestsInQueue(tests, branch, location);
            getUpdatedDataFromServer();
        });
    };

    this.getTestPathsFromSidebar = function() {
        var tests = [];
        $('#sidebar').find('.file-name').each(function(){
                 tests.push($(this).attr('data-qtip'));
        });
        return tests;
    };

    this.eventToAddTestInQueue = function(elem) {
        elem.on('click', function(){
            addTestInQueue($(this).attr('full-path'), _self.getBranch(), $('li.active .region').val());
            getUpdatedDataFromServer();
            imitateHover($('.test-node :first'));
        });
    };

    this.addFolderInQueue = function(folder_elem) {
        var tests = [];
        folder_elem.find('.add-button-file').each(function(){
            tests.push($(this).attr('full-path'));
        });
        if (tests.length !== 0) {
            var branch = _self.getBranch();
            var location = $('li.active .region').val();
            addTestsInQueue(tests, branch, location);
        }

    };

    this.eventToAddFolderInQueue = function(folder_elem) {
        folder_elem.on('click', function(){
            _self.addFolderInQueue($(this).parent());
            getUpdatedDataFromServer();
        });
    };

    this.showServers = function () {
        $.ajax({
            url: 'runner/show_servers',
            context: this,
            async: false,
            type: 'GET',
            success: function (data) {
                var trimmed_data = trim_data(data);
                $("div#servers").html(trimmed_data);
                _self.eventToOpenServer(trimmed_data.find('.server-header'));
                _self.eventToOpenLogBySelector('.log-opener span');
                _self.eventToSlimScrollLog(trimmed_data.find('.log'));
                eventToBookServer(trimmed_data.find('.book-button'));
                eventToUnbookServer(trimmed_data.find('.unbook-button'), false);
                _self.eventToStopTest(trimmed_data.find('.glyphicon-stop'));
                initEventsForCreateDestroyButtons();
                _self.eventToGetUpdatedDataFromServer();
                _self.eventToShowCurrentRspecResult(trimmed_data.find('.ui-progress-bar'));
            },
            error: function (xhr, type, errorThrown) {
                ajaxErrorUnlessPageRefresh(xhr, type, errorThrown);
            }
        });
    };

    this.showTestsView = function () {
        var project = getCurrentProject();
        $.ajax({
            url: 'runner/show_tests',
            context: this,
            async: true,
            type: 'GET',
            success: function (data) {
                var trimmed_data = trim_data(data);
                var fileTab = $(".tests-block .tab-content")
                fileTab.html(trimmed_data);
                setEventToOpenFolder();
                _self.eventToAddFile();
                _self.selectProject(project);
                _self.eventToAddTestInQueue(trimmed_data.find('.add-button-file'));
                _self.eventToAddFolderInQueue(trimmed_data.find('.add-button-folder'));
                addFullPaths(fileTab)
            },
            error: function (xhr, type, errorThrown) {
                ajaxErrorUnlessPageRefresh(xhr, type, errorThrown);
            }
        });
    };

    this.eventForPullProjectsAndFillTests = function(elem) {
        elem.on('click', function() {
            _self.pullProjectsAndFillTests();
        });
    };

    this.pullProjectsAndFillTests = function() {
        showSectionOverlay();
        _self.fetchBranchesAndShowFiles();
    };

    this.fetchBranchesAndShowFiles = function() {
        $.ajax({
            url: 'runner/branches',
            context: this,
            async: true,
            type: 'GET',
            success: function (data) {
                _self.setGitReferences($('#docs-branches'), data.doc_branches, data.doc_tags);
                _self.setGitReferences($('#teamlab-branches'), data.tm_branches, data.tm_tags);
                _self.showTestsView();
                hideSectionOverlay();
            },
            error: function (xhr, type, errorThrown) {
                ajaxErrorUnlessPageRefresh(xhr, type, errorThrown);
            }
        });
    };

    this.pullProjectsAndGetAllView = function(){
        _self.pullProjectsAndFillTests();
    };

    this.setGitReferences = function(control, branches, tags) {
        clearElementInside(control);
        control.append($("<option disabled>Branches</option>"));
        for(var i = 0; i < branches.length; i++) {
            control.append($("<option>" + branches[i] + "</option>"));
        }
        control.append($("<option disabled>Tags</option>"));
        for(var i = 0; i < tags.length; i++) {
            control.append($("<option>" + tags[i] + "</option>"));
        }
    };

    this.saveTestList = function () {
        $.ajax({
            url: 'runner/save_list',
            context: this,
            type: 'POST',
            data: {
                'test_list': getTestList(),
                'branch': getCurrentBranch(),
                'project': getCurrentProject()
            },
            beforeSend: function () {
                showOverlay('Saving...');
            },
            complete: function () {
                hideOverlay();
            },
            success: function (data) {
                if (data === "") {
                    showInfoAlert('Sign up for saving!');
                    return;
                }
                var trimmed_data = trim_data(data);
                _self.appendListDropdownMenu(trimmed_data);
            },
            error: function (xhr, type, errorThrown) {
                ajaxErrorUnlessPageRefresh(xhr, type, errorThrown);
            }
        });
    };

    this.appendListDropdownMenu = function (list_menu) {
        var checkAlreadyExist = false;
        $('#test_list_menu').find('a').each(function () {
            if ($(this).text() == list_menu.find('a').first().text()) {
                checkAlreadyExist = true;
            }
        });
        if (checkAlreadyExist !== true) {
            $('#test_list_menu').prepend(list_menu);
            var menu_link = list_menu.children('a').first();
            $(menu_link).on('click', function () {
                _self.eventToLoadTestList($(this));
            });
            list_menu.find('i.delete-test-list').off('click');
            _self.setEventToDeleteTestList(list_menu);
        }

    };

    this.EventToDeleteTestList = function (list_menu) {
        $.ajax({
            url: list_menu.find('.delete-test-list').attr('delete-data'),
            context: this,
            async: false,
            type: 'DELETE',
            success: function () {
                list_menu.remove();
            },
            error: function (xhr, type, errorThrown) {
                ajaxErrorUnlessPageRefresh(xhr, type, errorThrown);
            }
        });
    };

    this.setEventToDeleteTestList = function (list_menu) {
        list_menu.find('i.delete-test-list').on('click', function () {
            _self.EventToDeleteTestList($(this).parent());
        });
    };

    this.changeBranch = function () {
        var project = getCurrentProject();
        $.ajax({
            url: 'runner/change_branch',
            context: this,
            async: true,
            type: 'GET',
            data: {
                'project': project,
                'branch': getCurrentBranch()
            },
            beforeSend: function () {
                showSectionOverlay();
            },
            success: function () {
                var startIcon = $(".active .start-icon");
                startIcon.parent().removeClass('with-start');
                _self.showTestsView();
                bootbox.alert({
                    message: "Branch or Tag was successful changed",
                    backdrop: true
                });
                hideSectionOverlay();
            },
            error: function (xhr, type, errorThrown) {
                ajaxErrorUnlessPageRefresh(xhr, type, errorThrown);
            }
        });
    };

    this.setEventChangeBranch = function () {
        $('li select.branch').change(function () {
            _self.changeBranch();
        });
    };

    this.eventToChangeLocationForTest = function(elem) {
        elem.change(function(){
            var test_id = elem.parent().parent().attr('data-id');
            var new_location = elem.val();
            _self.changeLocationForTest(test_id, new_location);
        });
    };

    this.changeLocationForTest = function(test_id, new_location) {
        $.ajax({
            url: 'queue/change_test_location',
            data: { test_id: test_id, new_location: new_location },
            context: this,
            type: 'POST',
            error: function (xhr, type, errorThrown) {
                ajaxErrorUnlessPageRefresh(xhr, type, errorThrown);
            }
        });
    };

    this.eventToLoadTestList = function (elem) {
        $("#list-name").text(elem.text());
        showSectionOverlay();
        $.ajax({
            url: 'runner/load_test_list',
            context: this,
            type: 'GET',
            async: true,
//            async: false,
//            beforeSend: (),
            beforeSend: function () {
                showOverlay('Loading...');
            },
            complete: function () {
                hideOverlay();
            },
            data: {
                'listName': elem.text()
            },
            success: function (data) {
                $("#sidebar-test-list").html(data.html);
                _self.selectProject(data.project);
                _self.selectBranch(data.branch);
                _self.changeBranch();
                setEventToOpenFile($('.file-folder'));
                setEventToDeleteFolderFromList();
                setEventToDeleteTestFromList();
                _self.checkAllAddedOnSidebar();
                addSortableToElem($('.stroke-list'));
                openSidebar();
                showStartPanel();
                unlockAllTab();
                unlockAllBranchSelect();
                lockInactiveTab();
                lockActiveBranchSelect();

            },
            error: function (xhr, type, errorThrown) {
                ajaxErrorUnlessPageRefresh(xhr, type, errorThrown);
            }
        });
    };

    this.selectBranch = function (branch) {
        $("li.active select.branch option").filter(function () {
            return $(this).html() == branch;
        }).prop('selected', true);
//        $("li.active select.branch :contains('" + branch + "')").prop('selected', true);      jg
    };

    this.selectProject = function (project) {
        var docsTab = $('div#docs');
        var tmTab = $('div#teamlab');
        var currentActive = $('.nav-tabs li.active');
        $('.nav.nav-tabs a').each(function () {
            if ((project == 'docs') && ($(this).attr('href') == '#docs')) {
                currentActive.removeClass('active');
                $(this).parent().addClass('active');
                docsTab.addClass('active');
                tmTab.removeClass('active');
            }
            if ((project == 'teamlab') && ($(this).attr('href') == '#teamlab')) {
                currentActive.removeClass('active');
                $(this).parent().addClass('active');
                tmTab.addClass('active');
                docsTab.removeClass('active');
            }
        });

    };

    this.checkAllAddedOnSidebar = function () {
        makeAllAddButtonsVisible();
        var added_files = _self.getListSidebarFiles();
        $(".tab-content .file-name").each(function () {
            var cur_file = $(this).parent().find('.add-button-file').attr('full-path');
            if (jQuery.inArray(cur_file, added_files) != -1) {
                $(this).find('i.add-file').css('display', 'none');
            }
        });
    };

    this.getListSidebarFiles = function () {
        var files = [];
        $("#sidebar .file-name").each(function () {
            files.push($(this).attr('data-qtip'));
        });
        return files;
    };

    this.eventToOpenServer = function(header) {
        header.on('click', function (e) {
            if (!$(e.target).is("label")) {
                return;
            }
            var server_content = $(this).next();
            server_content.slideToggle();
        });
        stopPropagation(header.find('div.button'));
    };

    this.addFileToSidebar = function (icon) {
        var file_name = icon.parent();
        var text = file_name.text();
        var path = file_name.parent().find('.add-button-file').attr('full-path');
        var file_name_elem = "<div class='file-name shower' data-qtip='" + path + "'><i class='glyphicon glyphicon-file'></i><div class='file-name-text'>" + text + "</div><i class='glyphicon glyphicon-remove'></i><span class='hidden-tool'>" + text + "</span></div>";
        var folder = $("<div class='file-folder'>" + file_name_elem + "</div>");
        $("#sidebar-test-list").append(folder);
        setEventToDeleteFolderFromList();
        icon.css('display', 'none');
        showStartPanel();
        openSidebar();
        lockInactiveTab();
        lockActiveBranchSelect();
    };

    this.eventToAddFile = function () {
        var icons = $('.tab-content i.add-file');
        offEventsOnElem(icons);
        icons.on('click', function () {
            _self.addFileToSidebar($(this));
        });
    };

    this.eventToOpenLogBySelector = function (opener_selector) {
        $(opener_selector).on('click', function () {
            var opener_index = $(opener_selector).index($(this));
            var server_name = $(this).parent().parent().parent().get(0).id;
            if (server_log_visible(server_name)) {
                empty_server_log(server_name);
            } else {
                fetch_server_log(server_name);
            }
            $('.log-window').eq(opener_index).slideToggle();
        });
    };

    this.eventToSlimScrollLog = function (log) {
        log.slimScroll({
            height:'80px'
        });
    };

    this.eventToSortTestQueue = function (){
        var removeIntent = false;
        $('#test-queue').sortable({
            over: function () {
                removeIntent = false;
            },
            out: function () {
                removeIntent = true;
            },
            start: function () {
                testListUpdating = true;
            },
            stop: function () {
                testListUpdating = false;
            },
            beforeStop: function (event, ui) {
                if(removeIntent === true){
                    ui.item.remove();
                    _self.deleteTestFromQueue(ui.item.attr('data-id'));
                }
            },
            update: function(event, ui) {
                if (removeIntent !== true) {
                    var first = ui.item.attr('data-id');
                    var second = ui.item.prev().attr('data-id');
                    var in_start = false;
                    if (second === undefined) {
                        in_start = true;
                    }
                    _self.swapTestsInQueue(first, second, in_start);
                }
            }
        });
    };

    this.deleteTestFromQueue = function(test_id) {
        $.ajax({
            url: 'queue/delete_test',
            data: { test_id: test_id },
            async: false,
            type: 'POST',
            success: function() {
                toggleClearTestButton();
                toggleShuffleTestButton();
            },
            error: function (xhr, type, errorThrown) {
                ajaxErrorUnlessPageRefresh(xhr, type, errorThrown);
            }
        });
    };

    this.swapTestsInQueue = function(test_id1, test_id2, in_start) {
        $.ajax({
            url: 'queue/swap_tests',
            data: { test_id1: test_id1, test_id2: test_id2, in_start: in_start },
            async: false,
            type: 'POST',
            error: function (xhr, type, errorThrown) {
                ajaxErrorUnlessPageRefresh(xhr, type, errorThrown);
            }
        });
    };

    this.clearTestQueue = function() {
        $.ajax({
            url: 'queue/clear_tests',
            async: false,
            type: 'POST',
            error: function (xhr, type, errorThrown) {
                ajaxErrorUnlessPageRefresh(xhr, type, errorThrown);
            }
        });
    };

    this.shuffleTestQueue = function() {
        $.ajax({
            url: 'queue/shuffle_tests',
            async: false,
            type: 'POST',
            error: function (xhr, type, errorThrown) {
                ajaxErrorUnlessPageRefresh(xhr, type, errorThrown);
            }
        });
    };

    this.eventToClearTestQueue = function(elem) {
        elem.on('click', function(){
            _self.clearTestQueue();
            getUpdatedDataFromServer();
        });
    };

    this.eventToShuffleTestQueue = function(elem) {
        elem.on('click', function(){
            _self.shuffleTestQueue();
            getUpdatedDataFromServer();
        });
    };

    this.eventToClearServerList = function(elem) {
        elem.on('click', function(){
            _self.unbookAllServers();
            getUpdatedDataFromServer();
        });
    };

    this.eventToRemoveDuplicatesFromQueue = function (elem) {
        elem.on('click', function () {
            _self.removeDuplicatesFromQueue();
            getUpdatedDataFromServer();
        });
    };

    this.removeDuplicatesFromQueue = function() {
        $.ajax({
            url: 'queue/remove_duplicates',
            async: false,
            type: 'POST',
            error: function (xhr, type, errorThrown) {
                ajaxErrorUnlessPageRefresh(xhr, type, errorThrown);
            }
        });
    };
}

var myRunner = new Runner();

var constants = {
    fixedBottom: 20
};

$(function () {
    setSideBarHeight(getSideBarHeight());
    closeSidebar();
    setToggleSidebarCoordinates(getNeededToggleCoordinates());

    $("#open-sidebar").on('click', function () {
        var sidebar = $("#sidebar");
        var visibility = sidebar.css("display");
        if (visibility == 'none') {
            openSidebar();
        }
        else {
            closeSidebar();
        }
    });

    $("#copyright").on('click', function () {
        changeBgZooey();
    });

    $("#cat").on('click', function () {
        changeBgCat();
    });

    $("#edit-list-name").on('click', function () {
        changeDivToInput();
        $(this).css('visibility', 'hidden');
        eventsEditInput();
    });

    $("#sidebar-test-list").slimScroll({
        height: '100%',
        width: '100%'
    });

    $(window).resize(function () {
        setSideBarHeight(getSideBarHeight());
    });

    $('#save-new').on('click', function () {
        if (verifyListName($("#list-name").text())) {
            if ($("#sidebar-test-list").children().size() === 0) {
                showInfoAlert('Nothing to save! Add tests from tests sections.');
            } else {
                myRunner.saveTestList();
            }
        }
    });

    $('#test_list_menu').find('a').on('click', function () {
        if ($(this).attr('href')) {
            myRunner.eventToLoadTestList($(this));
        }
        else {
            openSidebar();
            createNewList();
        }
    });

    eventToClosePopup();

    myRunner.setEventToDeleteTestList($('#test_list_menu').find('li'));

});

function openSidebar() {
    var sidebar = $("#sidebar");
    var ico = $("#open-ico");
    sidebar.css('display', 'block');
    ico.addClass('glyphicon-chevron-left');
    ico.removeClass('glyphicon-chevron-right');
    $("#main").css("margin-left", "230px");
    $("#popup").find(".wrap").css("margin-left", "230px");
    setToggleSidebarCoordinates(getNeededToggleCoordinates());
}

function closeSidebar() {
    var sidebar = $("#sidebar");
    var ico = $("#open-ico");
    sidebar.css('display', 'none');
    ico.addClass('glyphicon-chevron-right');
    ico.removeClass('glyphicon-chevron-left');
    $("#main").css("margin-left", "0");
    $("#popup").find(".wrap").css("margin-left", "0");
    setToggleSidebarCoordinates(getNeededToggleCoordinates());
}

function getSideBarHeight() {
    var topNavHeight = $("#topnavbar").height();
    var windowHeight = $(window).height();
    return windowHeight - topNavHeight - constants.fixedBottom;
}
function setSideBarHeight(height) {
    $("#sidebar").height(height);
}

function getNeededToggleCoordinates() {
    var coordinates = {
        left: 0,
        top: 0
    };
    var sidebarWidth = 0;
    if ($("#sidebar").css('display') != 'none') {
        sidebarWidth = $("#sidebar").outerWidth();
    }
    coordinates.left = sidebarWidth - 1;
    return coordinates;
}

function setToggleSidebarCoordinates(coordinates) {
    var elem = $("#open-sidebar");
    elem.css('left', coordinates.left);
}

function changeBgZooey() {
    var body = $('body');
    var bg = body.css('background-image');
    if (bg == 'none') {
        body.css("background-image", "url(/assets/zooey.jpg)");
    }
    else {
        body.css('background-image', 'none');
    }
}

function changeBgCat() {
    var body = $('body');
    var bg = body.css('background-image');
    if (bg == 'none') {
        body.css("background-image", "url(/assets/cat-box.jpg)");
    }
    else {
        body.css('background-image', 'none');
    }
}

function changeDivToInput() {
    var listNameDiv = $("#list-name");
    var textFromDiv = listNameDiv.text();
    listNameDiv.text('');
    var input = $('<input class="list-name">');
    input.val(textFromDiv);
    listNameDiv.append(input);
    input.focus();
    input.select();
}

function changeInputToDiv() {
    var textFromInput = $("input.list-name").val();
    if (verifyListName(textFromInput)) {
        var listNameDiv = $("#list-name");
        clearElementInside(listNameDiv);
        listNameDiv.text(textFromInput);
        $("#edit-list-name").css('visibility', 'visible');
    }
}

function eventsEditInput() {
    var input = $("input.list-name");
    input.blur(function () {
        changeInputToDiv();
    });

    input.keypress(function (e) {
        if (e.which == 13) {
            $(this).blur();
        }
    });
}

function verifyListName(listName) {
    if (listName.length > MAX_LENGTH || listName.length < MIN_LENGTH) {
        showInfoAlert('Name of list is too long or short!(more then ' + MAX_LENGTH + ' or less then ' + MIN_LENGTH + ' symbols)');
        return false;
    }
    var result = true;
    $('#test_list_menu').find('a').each(function () {
        if ($(this).text() == listName) {
            result = confirm('Current list name already exist. Test list will be overwrite!');
        }
    });
    return result;
}

function HtmlEncode(val) {
    return $("<div/>").text(val).html();
}

function HtmlDecode(val) {
    return $("<div/>").html(val).text();
}

function showStartPanel() {
    if (checkEmptyList() === false) {
        $('.start-panel').show();
    }
}

function lockInactiveTab() {
    if (checkEmptyList() === false) {
        var tab = $('.nav-tabs li:not(.active) a');
        tab.attr("data-toggle", "");
        tab.css('background-color', '#eee');
    }
}

function lockActiveBranchSelect() {
    if (checkEmptyList() === false) {
        $('.nav-tabs li.active select.branch').attr('disabled', 'disabled');
    }
}

function unlockActiveBranchSelect() {
    if (checkEmptyList() === true) {
        $('.nav-tabs li.active select.branch').removeAttr('disabled');
    }
}

function unlockAllTab() {
    var tab = $('.nav-tabs li a');
    tab.attr("data-toggle", "tab");
    tab.css('background-color', '');
}

function unlockAllBranchSelect() {
    $('.nav-tabs select.branch').removeAttr('disabled');
}

function unlockInactiveTab() {
    if (checkEmptyList() === true) {
        var tab = $('.nav-tabs li:not(.active) a');
        tab.attr("data-toggle", "tab");
        tab.css('background-color', '');
    }
}

function hideStartPanel() {
    if (checkEmptyList()) {
        $('.start-panel').hide();
    }
}

function checkEmptyList() {
    return $('#sidebar-test-list').children().size() === 0;
}

function addSortableToElem(elem) {
    elem.sortable({ });
}

function showOverlay(text) {
    if (typeof text === 'undefined'){
        $('.overlay').show();
        $('.overlay-window').hide();
    } else {
        $('.overlay .overlay-text').text(text);
        $('.overlay').show();
        $('.overlay-window').show();
    }
    return false;
}

function hideOverlay() {
    $('.overlay').fadeOut();
    return false;
}

function eventsForRspecPopup() {
    eventToOpenDescribe();
    evenToOpenFailDetails();
    setScrollOnMainDescribe();
    setFailedToFailedDescribes();
    eventToClosePopup();
}

function eventToOpenDescribe() {
    $('.describe-head').on('click', function () {
        var describeChild = $(this).next('.describe-child');
        var cur_display = describeChild.css('display');
        if (cur_display == 'none') {
            describeChild.slideDown();
        } else {
            describeChild.slideUp();
        }
    });
}

function evenToOpenFailDetails() {
    $('.example.failed .example-head').on('click', function () {
        var failDetails = $(this).next('.fail-details');
        var cur_display = failDetails.css('display');
        if (cur_display == 'none') {
            failDetails.slideDown();
        } else {
            failDetails.slideUp();
        }
    });
}

function showPopup() {
    $('.popup-overlay').fadeIn();
}

function closePopup() {
    $('.popup-overlay').fadeOut();
}

function eventToClosePopup() {
    $('.close-result.pointer').on('click', function () {
        closePopup();
    });
    $('div.popup-overlay').on('click', function () {
        closePopup();
    });
    stopPropagation($('.popup-window'));
}

function setScrollOnMainDescribe() {
    $('.main-describe').slimScroll({ width: 'auto', height: '100%', size: '3px'});
}

function setFailedToFailedDescribes() {
    $('.describe').each(function () {
        if ($(this).find('.failed').length !== 0) {
            $(this).addClass('failed');
        }
    });
}

function clearHistoryOnClient(client) {
    $.ajax({
        url: '/clients/clear_history',
        async: false,
        type: 'POST',
        data: {
            'client': client
        },
        beforeSend: function () {
            disableClearHistoryButton();
            showOverlay('Deleting...');
        },
        error: function (xhr, type, errorThrown) {
            ajaxErrorUnlessPageRefresh(xhr, type, errorThrown);
        },
        complete: function() {
            location.reload();
        }
    });
}

function disableClearHistoryButton() {
    $('#clear-history').prop('disabled', true);
}

function offEventsOnElem(elem) {
    elem.off();
}

function clearElementInside(elem) {
    elem.html('');
}

function stopPropagation(elem) {
    elem.click(function(e){ e.stopPropagation();});
}

function showSectionOverlay() {
    $(".block:last() .section-overlay").show();
}

function hideSectionOverlay() {
    $(".block:last() .section-overlay").hide();
}

function imitateHover(elem) {
    $(elem).mouseenter().mouseleave();
}
