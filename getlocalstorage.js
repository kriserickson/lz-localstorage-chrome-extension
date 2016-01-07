(function() {

    console.log('Getting local storage keys');

    function sendObjectToDevTools(message) {
        // The callback here can be used to execute something on receipt
        chrome.extension.sendMessage(message, function (message) {
        });
    }

    var localStorageInfo = {};
    for(var i in localStorage)
    {
        if (localStorage.hasOwnProperty(i)) {
            localStorageInfo[i] = localStorage[i];
        }
    }

    sendObjectToDevTools({action: "localStorage", data: localStorageInfo});
})();