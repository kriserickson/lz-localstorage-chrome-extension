/**
 * Convert a json string into
 * @param jsonStr
 * @returns {string|XML}
 */
function syntaxHighlightJson(jsonStr) {
    try {
        var jsonObj = JSON.parse(jsonStr);
        var json = JSON.stringify(jsonObj, null, 4);
    } catch (e) {
        // If the json parsing fails...
        json = jsonStr;
    }
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

function humanFileSize(size) {
    if (size > 0) {
        var i = Math.floor(Math.log(size) / Math.log(1024));
        return ( size / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['Bytes', 'kB', 'MB', 'GB', 'TB'][i];
    } else {
        return '0 Bytes';
    }
}

/**
 * On - Do event delegation for dynamic elements.
 * @param elSelector
 * @param eventName
 * @param selector
 * @param fn
 */
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



(function createChannel() {
    //Create a port with background page for continous message communication
    var port = chrome.extension.connect({
        name: "Sample Communication" //Given a Name
    });

    // Listen to messages from the background page
    port.onMessage.addListener(function (message) {

        if (message.action == 'storage') {
            var html = '';
            var uncompressedSize = 0;
            var compressedSize = 0;

            for (var key in message.data) {
                if (message.data.hasOwnProperty(key)) {
                    var value = message.data[key];
                    var compressed = false;
                    if (value.charCodeAt(0) > 255) {
                        value = LZString.decompressFromUTF16(message.data[key]);
                        compressed = true;
                    }

                    compressedSize += message.data[key].length;
                    uncompressedSize += value.length;
                    html += '<tr>' +
                                '<td class="key-column">' + key + '</td>' +
                                '<td class="value-column' + (compressed ? ' compressed' : '') + '" data-key="' + key + '">' +
                                    value +
                                '</td>' +
                                '<td class="corner"></td>' +
                            '</tr>';
                }
            }

            document.querySelector('#tableBody').innerHTML = html;
            document.querySelector('#sizeInfo').style.display = 'inline-block';
            document.querySelector('#compressedSize').innerText = humanFileSize(compressedSize * 2);    // Times 2 since we are using UFT-16 to store in localStorage
            document.querySelector('#uncompressedSize').innerText = humanFileSize(uncompressedSize * 2);
        }

    });


}());



on('#tableBody', 'click', 'tr', function(event) {
    var nodeList = document.querySelectorAll('tr.selected');
    for (var i = 0; i < nodeList.length; i++) {
        nodeList[i].classList.remove('selected');
    }
    var node = event.target;
    while (node.nodeName != 'TR' && node.parentNode) {
        node = node.parentNode;
    }
    node.classList.add('selected');
});

on('#tableBody', 'dblclick', 'tr', function(event) {

    var node = event.target.classList.contains('value-column') ? event.target : event.target.querySelector('.value-column');
    var jsonStr = node.innerText.trim();
    var keyValue = node.attributes['data-key'].value;
    document.querySelector('#modalKeyValue').innerText = 'Value for "' + keyValue + '"';
    // If it looks like JSON, then...
    if (jsonStr[0] == '{' || jsonStr[0] == '[') {
        document.querySelector('#jsonDetails').innerHTML = syntaxHighlightJson(jsonStr);
    }

    var style = document.querySelector('.modalDialog').style;
    style.opacity = 1;
    style.pointerEvents =  'auto';
});

document.getElementById('storageType').addEventListener('change', function(event) {
    chrome.extension.sendMessage({action: "load", tabId: chrome.devtools.inspectedWindow.tabId, storageType: event.target.value});
});

document.querySelector('#close').addEventListener('click', function() {
    var style = document.querySelector('.modalDialog').style;
    style.opacity = 0;
    style.pointerEvents =  'none';
});

chrome.extension.sendMessage({action: "load", tabId: chrome.devtools.inspectedWindow.tabId, storageType: 'local'});

