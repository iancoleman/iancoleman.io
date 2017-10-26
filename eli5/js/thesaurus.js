Thesaurus = new (function() {

    var self = this;

    var cache = {};

    this.NO_RANK = 10001;

    this.lookup = function(word) {
        var detail = {};
        var wordLower = word.toLowerCase();
        if (wordLower in cache) {
            detail = cache[wordLower];
        }
        else {
            detail = {
                rank: self.NO_RANK,
                synonyms: [],
            };
        }
        detail.word = word;
        detail.wordLower = wordLower;
        return detail;
    }

    function init() {
        loadWords();
    }

    function loadWords() {
        $.ajax({
            url: "thesaurus.json",
            success: loadSuccess,
            error: loadError,
        });
    }

    function loadSuccess(data) {
        cache = data;
        loadContractions();
    }

    function loadError(e) {
        // TODO improve this
        $("#simple-text").text("Error loading simple words list");
    }

    function loadContractions() {
        $.ajax({
            url: "contractions.txt",
            success: addContractions,
            // ignore error
        });
    }

    function addContractions(data) {
        var lines = data.split("\n");
        for (var i=0; i<lines.length; i++) {
            var contraction = lines[i];
            cache[contraction] = {
                rank: -1,
            }
        }
    }

    init();

})();
