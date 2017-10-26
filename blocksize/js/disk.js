disk = new (function() {

    var self = this;

    var DOM = {};
    DOM.suppliedDiskCapacity = $(".results .disk-consumption");
    DOM.diskSize = $(".costs .disk .size");
    DOM.diskPrice = $(".costs .disk .price");
    DOM.diskCost = $(".costs .disk .total");

    function calculate() {
        var diskPrice = parseFloat(DOM.diskPrice.val());
        var diskSize = parseFloat(DOM.diskSize.val()) * 1024;
        var diskRatio = network.gigabytesPerYear / diskSize;
        self.cost = diskPrice * diskRatio;
        network.totalCosts += self.cost;

    }

    function render() {

        DOM.suppliedDiskCapacity.text(network.gigabytesPerYear.toLocaleString());
        DOM.diskCost.text(self.cost.toLocaleString());

    }

    network.addCalculatedListener(function() {
        calculate();
        render();
    });

    var onInputEls = [
        DOM.diskSize,
        DOM.diskPrice,
    ];
    for (var i=0; i<onInputEls.length; i++) {
        onInputEls[i].on("input", network.recalc);
    }

})();
