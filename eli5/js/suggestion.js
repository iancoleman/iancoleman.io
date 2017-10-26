// DOM elements and events for showing a highlighted word and detail about that
// word.

Suggestion = function(detailedWord) {

    var DICT_URL_ROOT = "http://dictionary.reference.com/browse/";
    var THES_URL_ROOT = "http://www.thesaurus.com/browse/";

    function showDetail() {
        $(".suggestions").css("display", "none");
        detail.css("display", "block");
    }

    function hideDetail() {
        detail.css("display", "none");
    }

    function wordRankEl(word, rank) {
        var el = $("<span>");
        // show rank
        var rankEl = $("<div class='rank'>");
        rankEl.text(rank);
        el.append(rankEl);
        if (rank == Thesaurus.NO_RANK) {
            rankEl.attr("title", "Not in top ten thousand words");
            rankEl.text("10K+");
        }
        // show word
        var wordEl = $("<span>");
        wordEl.text(word);
        el.append(wordEl);
        return el;
    }

    this.el = $("<span class='complex-word'>");

    // element to display the word
    this.el.text(detailedWord.word);

    // element to show detail on hover
    var detail = $("<div class='suggestions'>");
    $("body").append(detail);

    // show the word in the detail
    var title = $("<h3>");
    var titleTextEl = wordRankEl(detailedWord.word, detailedWord.rank);
    title.append(titleTextEl);
    detail.append(title);

    // add synonyms to the detail
    var synonymsEl = $("<div class='synonyms'>");
    detail.append(synonymsEl);

    // show synonyms
    if (detailedWord.synonyms.length > 0) {
        for (var i=0; i<detailedWord.synonyms.length; i++) {
            var synonym = detailedWord.synonyms[i];
            var detailedSynonym = Thesaurus.lookup(synonym);
            var rank = detailedSynonym.rank;
            var synonymEl = $("<div class='synonym'>");
            var synonymTextEl = wordRankEl(synonym, rank);
            synonymEl.append(synonymTextEl);
            synonymsEl.append(synonymEl);
        }
    }
    else {
        synonymsEl.text("No close matches");
    }

    // add external links to detail
    var external = $("<div class='external'>");
    detail.append(external);
    // thesaurus link
    var thes = $("<a target='_blank'>");
    thes.text("More synonyms");
    var thesUrl = THES_URL_ROOT + detailedWord.wordLower;
    thes.attr("href", thesUrl);
    thes.attr("href", thesUrl);
    external.append(thes);
    // dictionary link
    var dict = $("<a target='_blank'>");
    dict.text("Definition");
    var dictUrl = DICT_URL_ROOT + detailedWord.wordLower;
    dict.attr("href", dictUrl);
    external.append(dict);

    this.el.on("mouseover", showDetail);

}
