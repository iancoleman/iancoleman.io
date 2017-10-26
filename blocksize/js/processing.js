processing = new (function() {

    var self = this;

    var DOM = {};
    DOM.processing = $(".results .processing");
    DOM.processingRate = $(".processing .rate");
    DOM.processingPrice = $(".processing .price");
    DOM.processingErrorMsg = $(".costs .processing .error");
    DOM.processingCost = $(".processing .total");

    function calculate() {

        this.cost = 0;

        self.processingRate = parseFloat(DOM.processingRate.val());
        var processingPrice = parseFloat(DOM.processingPrice.val());
        var processingRatio = network.txsPerSecond / self.processingRate;
        var yearsPerLife = 5;
        self.cost = processingPrice * processingRatio / yearsPerLife;
        network.totalCosts += self.cost;

    }

    function render() {

        if (self.processingRate < network.txsPerSecond) {
            DOM.processingRate.addClass("impossible");
            DOM.processingErrorMsg.removeClass("hidden");
        }
        else {
            DOM.processingRate.removeClass("impossible");
            DOM.processingErrorMsg.addClass("hidden");
        }
        DOM.processing.text(network.txsPerSecond.toLocaleString());
        DOM.processingCost.text(self.cost.toLocaleString());

    }

    network.addCalculatedListener(function() {
        calculate();
        render();
    });

    var onInputEls = [
        DOM.processingPrice,
        DOM.processingRate,
    ];
    for (var i=0; i<onInputEls.length; i++) {
        onInputEls[i].on("input", network.recalc);
    }

})();
