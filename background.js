// Chrome automatically creates a background.html page for this to execute.
// This can access the inspected page via executeScript
//
// Can use:
// chrome.tabs.*
// chrome.extension.*


chrome.extension.onConnect.addListener(function (port) {

    var _loadedTabId;

    var extensionListener = function (message, sender, sendResponse) {

        function getStorage(tabId, type) {
            chrome.tabs.executeScript(tabId, {code: 'lzLocalStorageGetLocalStorage.getStorage("' + type + '");'})
        }

        //port.postMessage('test');
        if (message.action) {
            var tabId = message.tabId || sender.tab.id;
            if (message.action == 'load' || (message.action == 'changeStorage' && !_loadedTabId)) {
                chrome.tabs.executeScript(tabId, {code: 'window.lzLocalStorageGetLocalStorage'}, function (res) {
                    if (!res || !res[0]) {
                        chrome.tabs.executeScript(tabId, {file: 'getstorage.js'}, function () {
                            _loadedTabId = tabId;
                            getStorage(tabId, message.storageType);
                        });
                    } else {
                        getStorage(tabId, message.storageType);
                    }
                });
            } else if (message.action == 'changeStorage'  && _loadedTabId) {
                getStorage(tabId, message.storageType);
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
    });



});

