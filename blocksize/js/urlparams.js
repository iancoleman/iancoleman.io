// Library to convert url hash value into field values on the page.
// Usage: add attribute "x-url-param" to element and give it an id.

new (function() {

    // Single place to track values from url and in fields
    var values = {};
    var keys = [];
    var defaults = {};

    // Load page elements
    var pageElements = document.querySelectorAll("[x-url-param]");
    var elementById = {};

    // Track page element values
    for (var i=0; i<pageElements.length; i++) {
        var pageElement = pageElements[i];
        var id = pageElement.id;
        if (id) {
            var value = pageElement.value;
            if (typeof value === "string") {
                // Track this element
                keys.push(id);
                keys.sort();
                if (id in values) {
                    console.warn("Duplicate id for url-param element: " + id);
                }
                values[id] = value;
                defaults[id] = value;
                elementById[id] = pageElement;
                var onEvent = "input";
                var tagname = pageElement.tagName.toLowerCase();
                if (tagname == "select") {
                    onEvent = "change";
                }
                pageElement.addEventListener(onEvent, function() {
                    values[this.id] = this.value;
                    setHash();
                });
            }
        }
        else {
            console.warn("x-url-param without id for element with class '" + pageElement.className + "'");
        }
    }

    // Load url values
    var hashStr = window.location.hash.substring(1);
    var hashBits = hashStr.split("&");
    for (var i=0; i<hashBits.length; i++) {
        var keyValueStr = hashBits[i];
        var keyValue = keyValueStr.split("=");
        var id = decodeURIComponent(keyValue[0]);
        var value = decodeURIComponent(keyValue[1]);
        values[id] = value;
    }

    // Prepopulate elements with values
    for (var id in values) {
        var el = elementById[id];
        if (el) {
            var value = values[id];
            el.value = value;
        }
    }

    function setHash() {
        var hashBits = [];
        for (var k=0; k<keys.length; k++) {
            var key = keys[k];
            var value = values[key];
            var defaultValue = defaults[key];
            if (value != defaultValue) {
                var safeKey = encodeURIComponent(key);
                var safeValue = encodeURIComponent(value);
                var keyValueStr = safeKey + "=" + safeValue;
                hashBits.push(keyValueStr);
            }
        }
        var hash = hashBits.join("&");
        if (hash == "") {
            hash = "_";
        }
        window.location.hash = hash;
    }

    setHash();

})();
