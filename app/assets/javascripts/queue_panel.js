/**
 * Created by lobashov-2 on 10.03.17.
 */

function setDataOnQueuePanel(queue_data) {
    showBookedServers(queue_data.servers);
    setBookedServersCount(queue_data.servers.length);
    showTestsFromQueue(queue_data.tests);
    showTestsInQueueCount(queue_data.tests.length);
}
function showBookedServers(servers) {
    var sortedServers = servers.sort();
    for(var i = 0; i < sortedServers.length; i++) {
        appendServerOnQueue(sortedServers[i]);
    }
}
function appendServerOnQueue(server) {
    var button = $('<div class="unbook-button" data-server="'+ server + '">unbook</div>');
    var node = $('<div class="server-node"><i class="glyphicon glyphicon-hdd"></i></div>');
    var label = $('<label>').text(server);
    label.attr('title', server);
    node.append(label);
    node.append(button);
    eventToUnbookServer(button, true);
    $('#server-queue').append(node);
}
function setBookedServersCount(serversCount) {
    $('#booked-servers-title').text('Servers (' + serversCount + ')');
}
function showTestsFromQueue(tests) {
    for(var i = 0; i < tests.length; i++) {
        appendTestsOnQueue(tests[i]);
    }
}
function appendTestsOnQueue(test) {
    if (typeof regionSelector === 'undefined') {
        this.generateRegionSelect();
    }
    var props = $('<div class="props"></div>');
    props.append($('<label>').text(test.tm_branch).attr('title', 'OnlyOffice branch:' + test.tm_branch));
    props.append($('<label>').text(test.doc_branch).attr('title', 'Docs branch:' + test.doc_branch));
    props.append($('<label>').text(test.location).attr('title', 'Region: ' + test.location));
    var name = $('<div class="name"><i class="glyphicon glyphicon-leaf"></i>' + test.test_name + '</div>');
    var testNode = $('<div class="test-node" data-id="' + test.id + '" data-path="' + test.test_path + '" title="' + test.test_path + '"></div>');
    testNode.append(name);
    testNode.append(props);
    $('#test-queue').append(testNode);
}
function showTestsInQueueCount(testsCount) {
    $('#test-queue-title').text('Tests (' + testsCount + ')');
}

function checkQueueEmpty() {
    var empty = true;
    if($('.test-node :visible').size() !== 0) {
        empty = false;
    }
    return empty;
}

function toggleClearTestButton() {
    if (checkQueueEmpty()) {
        $('#clear-tests').hide();
    } else {
        $('#clear-tests').show();
    }
}

function toggleShuffleTestButton() {
    if (checkQueueEmpty()) {
        $('#shuffle-tests').hide();
    } else {
        $('#shuffle-tests').show();
    }
}

function toggleRemoveDuplicatesQueue() {
    if (checkQueueEmpty()) {
        $('#remove-duplicates-tests').hide();
    } else {
        $('#remove-duplicates-tests').show();
    }
}