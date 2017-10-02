/**
 * Created by lobashov-2 on 10.03.17.
 */

function getUpdatedDataFromServer() {
    $.ajax({
        url: 'runner/updated_data.json',
        type: 'GET',
        async: false,
        data: {
            'servers': getAllServers()
        },
        success: function (data) {
            setDataOnServersView(data.servers_data);
            clearServersQueue();
            clearTestsQueue();
            setDataOnQueuePanel(data.queue_data);
            toggleClearTestButton();
            toggleShuffleTestButton();
            toggleRemoveDuplicatesQueue();
            toggleUnbookAllServersButton();
            toggleStopAllBookedServers();
        },
        error: function (e) {
            console.log(e.message);
        }
    });
}

function getAllServers() {
    var servers = [];
    $('.server').each(function () {
        var server_name = $(this).attr('id');
        var is_log_displayed = server_log_visible(server_name);
        servers.push({name: server_name, with_log: is_log_displayed});
    });
    return JSON.stringify(servers);
}

function setDataOnServersView(data) {
    for (var i = 0; i < data.length; i++) {
        var selector = "div[id='" + data[i].name + "']";
        var server = $(selector);
        setStatusToServerView(server, data[i].status);
        setServerIp(server, data[i].server_ip);
        copyServerIpToClipboardEvent(data[i].name);
        disableSelectServerSize(data[i].name);
        setServerSize(data[i].name, data[i].size);
        if (data[i].status) {
            changeCreateOnDestroy(server.find('.glyphicon-off'));
            if('test' in data[i]) {
                showTestProgress(server.find('.ui-progress-bar'), data[i].test.progress, data[i].test.time, data[i].test.failed_count);
                setTestNameAndOptions(server.find('.ui-progress-bar .hidden-tool'), data[i].test);
                fill_server_log(data[i].name, data[i].log);
                server.find('.glyphicon-stop').show();
            } else {
                server.find('.ui-progress-bar').hide();
                server.find('.glyphicon-stop').hide();
            }
            if('booked' in data[i]) {
                showBookedClient(server.find('.user-icon'), data[i].booked.booked_client);
                if (data[i].booked.booked_by_client) {
                    showUnbookButton(server.find("div.button"));
                } else {
                    hideUnbookButton(server.find("div.button"));
                }
            } else {
                hideBookedClient(server.find('.user-icon'));
                showBookButton(server.find("div.button"));
            }
        } else {
            server.find('.ui-progress-bar').hide();
            server.find('.glyphicon-stop').hide();
            hideUnbookButton(server.find("div.button"));
            hideBookedClient(server.find('.user-icon'));
            changeDestroyOnCreate(server.find('.glyphicon-off'));
        }
        if (data[i]._status  == 'destroying') {
            server.find('.server-content').show();
            showServerSectionOverlay(data[i].name, 'Destroying...');
        } else if (data[i]._status  == 'creating') {
            server.find('.server-content').show();
            showServerSectionOverlay(data[i].name, 'Creating...');
        } else {
            hideServerSectionOverlay(data[i].name);
        }
    }
}

function setStatusToServerView(server, status) {
    if (status === true) {
        server.removeClass('off');
    }
    else {
        server.addClass('off');
    }
}

function setServerIp(server, ip) {
    server.find('.server-ip span').text(ip);
}

function changeCreateOnDestroy(button) {
    if (button.hasClass('create')) {
        button.removeClass('create');
        button.addClass('destroy');
        button.find('span').text('destroy');
    }
}

function showTestProgress(progress_elem, progress, time, failed_count) {
    var ui_progress = progress_elem.find('.ui-progress');
    ui_progress.css('width', progress + '%');
    ui_progress.removeClass('red-background');
    if (failed_count != 0) {
        ui_progress.addClass('red-background');
    }
    progress_elem.find('.value').text(progress + '% ' + time);
    progress_elem.show();
}

function setTestNameAndOptions(hidden_elem, test) {
    hidden_elem.find('.name').text(test.name);
    hidden_elem.find('.location').text(test.location);
    hidden_elem.find('.test-progress').text('progress ' + test.progress + '%');
    hidden_elem.find('.time').text(test.time);
    hidden_elem.find('.docs_branch').text('Docs Branch: ' + test.doc_branch);
    hidden_elem.find('.tm_branch').text('OnlyOffice Branch: ' + test.tm_branch);
    hidden_elem.find('.spec_language').text('Spec Language: ' + test.spec_language);
}

function showBookedClient(userIcon, userName) {
    userIcon.find('span').text(userName);
    userIcon.css('visibility', 'visible');
}

function showUnbookButton(button) {
    changeBookButtonOnUnbook(button);
    button.show();
    button.css('visibility', 'visible');
    eventToUnbookServer(button, false);
}

function hideUnbookButton(button) {
    button.hide();
}

function hideBookedClient(userIcon) {
    userIcon.find('span').text('');
    userIcon.css('visibility', 'hidden');
}

function showBookButton(button) {
    changeUnbookButtonOnBook(button);
    button.show();
    eventToBookServer(button);
}

function changeDestroyOnCreate(button) {
    if (button.hasClass('destroy')) {
        button.removeClass('destroy');
        button.addClass('create');
        button.find('span').text('create');
    }
}

function clearServersQueue() {
    clearElementInside($('#server-queue'));
}

function clearTestsQueue() {
    clearElementInside($('#test-queue'));
}

function copyServerIpToClipboardEvent(serverName) {
    var copyTextareaBtn = $("#" + serverName + ' .server-ip span');

    copyTextareaBtn.on('click', function () {
        selectObjectForCopy(copyTextareaBtn);
        document.execCommand('copy');
        copyTextareaBtn.fadeOut('normal', function() {
            copyTextareaBtn.delay(200).fadeIn();
        });
    });
}

function selectObjectForCopy(jqueryObject) {
    var range = document.createRange();
    range.selectNode(jqueryObject.get(0));
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
}
