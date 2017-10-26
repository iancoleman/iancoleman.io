labor = new (function() {

    var self = this;

    var DOM = {};
    DOM.laborHours = $(".labor .hours");
    DOM.laborPrice = $(".labor .price");
    DOM.laborCost = $(".labor .total");

    function calculate() {

        self.cost = 0;

        var laborPrice = parseFloat(DOM.laborPrice.val());
        var laborHours = parseFloat(DOM.laborHours.val());
        self.cost = laborPrice * laborHours;
        network.totalCosts += self.cost;

    }

    function render() {
        DOM.laborCost.text(self.cost.toLocaleString());
    }

    network.addCalculatedListener(function() {
        calculate();
        render();
    });

    var onInputEls = [
        DOM.laborHours,
        DOM.laborPrice,
    ];
    for (var i=0; i<onInputEls.length; i++) {
        onInputEls[i].on("input", network.recalc);
    }

})();
