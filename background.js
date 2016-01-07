// Chrome automatically creates a background.html page for this to execute.
// This can access the inspected page via executeScript
//
// Can use:
// chrome.tabs.*
// chrome.extension.*


chrome.extension.onConnect.addListener(function (port) {

    var extensionListener = function (message, sender, sendResponse) {

        var _loadedTabId;

        function getStorage(tabId, type) {
            chrome.tabs.executeScript(tabId, {code: 'lzLocalStorageGetLocalStorage.getStorage("' + type + '");'})
        }

        //port.postMessage('test');
        if (message.action) {
            if (message.action == 'load' || (message.action == 'changeStorage' && !_loadedTabId)) {
                chrome.tabs.executeScript(message.tabId, {code: 'window.lzLocalStorageGetLocalStorage'}, function (res) {
                    console.log('res: ' + res[0]);
                    if (!res[0]) {
                        chrome.tabs.executeScript(message.tabId, {file: 'getstorage.js'}, function () {
                            _loadedTabId = message.tabId;
                            getStorage(message.tabId, message.storageType);
                        });
                    } else {
                        getStorage(message.tabId, message.storageType);
                    }
                });
            } else if (message.action == 'changeStorage'  && _loadedTabId) {
                getStorage(message.tabId, message.storageType);
            } else if (message.action == 'storage') {
                port.postMessage(message);
            }
        }
    };

    // Listens to messages sent from the panel
    chrome.extension.onMessage.addListener(extensionListener);

    port.onDisconnect.addListener(function(port) {
        chrome.extension.onMessage.removeListener(extensionListener);
        if (_loadedTabId) {
            chrome.tabs.executeScript(_loadedTabId, {code: 'lzLocalStorageGetLocalStorage.stopStorage();'});
        }
        console.log('Disconnected');
    });



});

