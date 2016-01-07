// Chrome automatically creates a background.html page for this to execute.
// This can access the inspected page via executeScript
//
// Can use:
// chrome.tabs.*
// chrome.extension.*


chrome.extension.onConnect.addListener(function (port) {

    var extensionListener = function (message, sender, sendResponse) {

        //port.postMessage('test');
        if (message.action) {

            if (message.action == 'reload') {
                chrome.tabs.executeScript(message.tabId, {file: 'getlocalstorage.js'});
            } else if (message.action == 'localStorage') {
                port.postMessage(message);
            }
        }
    };

    // Listens to messages sent from the panel
    chrome.extension.onMessage.addListener(extensionListener);

    port.onDisconnect.addListener(function(port) {
        chrome.extension.onMessage.removeListener(extensionListener);
        _port = undefined;
    });



});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    switch(message.action) {
        case "bglog":
            console.log(message.obj);
            break;
    }
    return true;
});
