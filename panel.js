bglog('background log');

(function createChannel() {
    //Create a port with background page for continous message communication
    var port = chrome.extension.connect({
        name: "Sample Communication" //Given a Name
    });

    // Listen to messages from the background page
    port.onMessage.addListener(function (message) {
        bglog('Got message...');

        if (message.action == 'localStorage') {
            var html = '';

            for (var key in message.data) {
                if (message.data.hasOwnProperty(key)) {
                    var value = message.data[key].charCodeAt(0) > 255 ? LZString.decompressFromUTF16(message.data[key]) : message.data[key];

                    html += '<tr>' +
                                '<td class="key-column">' + key + '</td>' +
                                '<td class="value-column">' +
                                    value +
                                '</td>' +
                                '<td class="corner"></td>' +
                            '</tr>';
                }
            }

            document.querySelector('#tableBody').innerHTML = html;
        }

    });


}());

function syntaxHighlightJson(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function on(elSelector, eventName, selector, fn) {
    var element = document.querySelector(elSelector);

    element.addEventListener(eventName, function(event) {
        var possibleTargets = element.querySelectorAll(selector);
        var target = event.target;

        for (var i = 0, l = possibleTargets.length; i < l; i++) {
            var el = target;
            var p = possibleTargets[i];

            while(el && el !== element) {
                if (el === p) {
                    return fn.call(p, event);
                }

                el = el.parentNode;
            }
        }
    });
}


function bglog(obj) {
    if(chrome && chrome.runtime) {
        chrome.runtime.sendMessage({action: "bglog", obj: obj});
    }
}

document.getElementById('reload').addEventListener('click', function() {
    chrome.extension.sendMessage({action: "reload", tabId: chrome.devtools.inspectedWindow.tabId});
}, false);

on('#tableBody', 'click', 'tr', function(event) {
    var nodeList = document.querySelectorAll('tr.selected');
    for (var i = 0; i < nodeList.length; i++) {
        nodeList[i].classList.remove('selected');
    }
    event.target.classList.add('selected');
});

on('#tableBody', 'dblclick', 'tr', function(event) {
    bglog('dblclick, event.target: ' + event.target);

    var node = event.target.classList.contains('value-column') ? event.target : event.target.querySelector('.value-column');
    var jsonStr = node.innerText;
    bglog('json: ' + jsonStr);
    var json = JSON.parse(jsonStr);
    document.querySelector('#jsonDetails').innerHTML = syntaxHighlightJson(JSON.stringify(json, null, 4));

    var style = document.querySelector('.modalDialog').style;
    style.opacity = 1;
    style.pointerEvents =  'auto';
});

document.querySelector('#close').addEventListener('click', function() {
    var style = document.querySelector('.modalDialog').style;
    style.opacity = 0;
    style.pointerEvents =  'none';
});

bglog('background log complete');

chrome.extension.sendMessage({action: "reload", tabId: chrome.devtools.inspectedWindow.tabId});