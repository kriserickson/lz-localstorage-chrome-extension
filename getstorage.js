if (!window.lzLocalStorageGetLocalStorage) {

    (function () {

        function stringHash(str) {
            var hash = 5381;
            var length = str.length;

            while (length) {
                hash = (hash * 33) ^ str.charCodeAt(length);
                length -= 1;
            }

            /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
             * integers. Since we want the results to be always positive, convert the
             * signed int to an unsigned by doing an unsigned bitshift. */
            return hash >>> 0;
        }


        function LZStorageGetLocalStorage() {

            var _hashResult = '';
            var _timeout = 0;
            var _type;
            var self = this;

            function sendObjectToDevTools(message) {
                // The callback here can be used to execute something on receipt
                chrome.extension.sendMessage(message, function (message) {
                });
            }

            function checkStorage() {
                var storageEngine = _type == 'session' ? window.sessionStorage : window.localStorage;
                var hash = '';
                for (var i in storageEngine) {
                    if (storageEngine.hasOwnProperty(i)) {
                        hash += stringHash(storageEngine[i]).toString();
                    }
                }
                var hashResult = stringHash(hash);
                if (_hashResult != hashResult) {
                    self.getStorage();
                }
                _timeout = setTimeout(checkStorage, 5000);
            }

            this.getStorage = function (type) {
                if (_timeout) {
                    clearTimeout(_timeout);
                    _timeout = 0;

                }
                if (type) {
                    _type = type;
                }
                var storageEngine = _type == 'session' ? window.sessionStorage : window.localStorage;
                var storageInfo = {};
                var hash = '';
                for (var i in storageEngine) {
                    if (storageEngine.hasOwnProperty(i)) {
                        storageInfo[i] = storageEngine[i];
                        hash += stringHash(storageInfo[i]).toString();
                    }
                }
                _hashResult = stringHash(hash);
                sendObjectToDevTools({action: 'storage', data: storageInfo, engine: _type});
                _timeout = setTimeout(checkStorage, 5000);
            };

            this.stopStorage = function () {
                if (_timeout) {
                    clearTimeout(_timeout);
                    _timeout = 0;
                }
            };

        }

        window.lzLocalStorageGetLocalStorage = new LZStorageGetLocalStorage();


    })();
}