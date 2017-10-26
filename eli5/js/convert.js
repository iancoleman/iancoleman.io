(function() {

    var DOM = {};
    DOM.complex = $("#complex-text");
    DOM.simple = $("#simple-text");
    DOM.vocabularyLimit = $("#vocabulary-limit");

    var rewordEventTimeout = null;
    var convertDelayMilliseconds = 100;

    function init() {
        setEvents();
        DOM.complex.focus();
    }

    function setEvents() {
        DOM.complex.on("input", complexWordsChanged);
        DOM.vocabularyLimit.on("change", complexWordsChanged);
    }

    function complexWordsChanged() {
        if (rewordEventTimeout != null) {
            clearTimeout(rewordEventTimeout);
        }
        rewordEventTimeout = setTimeout(convertWords, convertDelayMilliseconds);
    }

    function convertWords() {
        // Parse complex words entered by user
        var complexStr = DOM.complex.val();
        var complexWords = getPotentiallyComplexWords(complexStr);
        // Get the degree of simplicity required
        var vocabularyLimit = parseInt(DOM.vocabularyLimit.val());
        // Find complex words
        var wordsAboveThreshold = {};
        for (var i=0; i<complexWords.length; i++) {
            // Find words that are above the threshold of simplicity
            var complexWord = complexWords[i];
            var complexWordLower = complexWord.toLowerCase();
            var detailedWord = Thesaurus.lookup(complexWord);
            var complexity = detailedWord.rank;
            if (complexity > vocabularyLimit) {
                wordsAboveThreshold[complexWord] = detailedWord;
            }
        }
        // Clear the existing words
        DOM.simple.empty();
        // Show the options for simplification
        var textEl = $("<span>");
        textEl.text(complexStr);
        DOM.simple.append(textEl);
        for (var complexWord in wordsAboveThreshold) {
            // Replace all instances with simplified options
            var children = DOM.simple.children();
            for (var i=0; i<children.length; i++) {
                var child = $(children[i]);
                var text = child.text();
                var splitter = new RegExp("\\b" + complexWord + "\\b");
                var bits = text.split(splitter);
                if (bits.length == 1) {
                    continue
                }
                for (var j=bits.length-1; j>=0; j--) {
                    var newEl = $("<span>");
                    newEl.text(bits[j]);
                    child.after(newEl);
                    if (j != 0) {
                        var detailedWord = wordsAboveThreshold[complexWord];
                        var suggestion = new Suggestion(detailedWord);
                        child.after(suggestion.el);
                    }
                }
                child.remove();
            }
        }
    }

    function getPotentiallyComplexWords(complexStr) {
        var bits = complexStr.split(/\s/g);
        var words = [];
        for (var i=0; i<bits.length; i++) {
            var bit = bits[i];
            bit = bit.replace(/^[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]+/,"");
            bit = bit.replace(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]+$/,"");
            if (bit.length > 0) {
                words.push(bit);
            }
        }
        return words;
    }

    init();

})();
