bandwidth = new (function() {

    var self = this;

    var DOM = {};
    DOM.bandwidthDown = $(".results .bandwidth .down");
    DOM.bandwidthUp = $(".results .bandwidth .up");
    DOM.dataCap = $(".results .data-cap");
    DOM.bandwidthCostRow = $(".costs .bandwidth");
    DOM.bandwidthErrorMsg = $(".costs .bandwidth .error");
    DOM.bandwidthType = $(".costs .bandwidth .type");
    DOM.unlimited = $(".costs .unlimited");
    DOM.unlimitedSpeed = $(".costs .unlimited .speed");
    DOM.unlimitedPrice = $(".costs .unlimited .price");
    DOM.unlimitedTime = $(".costs .unlimited .time");
    DOM.unlimitedSpeed = $(".costs .unlimited .speed");
    DOM.capped = $(".costs .capped");
    DOM.cappedSize = $(".costs .capped .size");
    DOM.cappedTime = $(".costs .capped .time");
    DOM.cappedPrice = $(".costs .capped .price");
    DOM.cappedSpeed = $(".costs .capped .speed");
    DOM.bandwidthCost = $(".costs .bandwidth .total");
    DOM.ibdSize = $(".initial-block-download .size");
    DOM.ibdTime = $(".initial-block-download .time");
    DOM.ibdDate = $(".initial-block-download .date");
    DOM.overlapRate = $(".costs .overlap-rate");
    DOM.overlapTime = $(".costs .overlap-time");
    DOM.hopTime = $(".costs .hop-time");
    DOM.propagateTime = $(".costs .propagate-time");

    function calculate() {

        self.cost = 0;

        self.bandwidthType = DOM.bandwidthType.val();
        self.availableSpeed = 0;
        if (self.bandwidthType == "unlimited") {
            self.availableSpeed = parseFloat(DOM.unlimitedSpeed.val());
            // calculate annual cost
            var consumptionRatio = network.megabitsPerSecondMax / self.availableSpeed;
            var unitPrice = parseFloat(DOM.unlimitedPrice.val());
            var secondsPerUnit = parseFloat(DOM.unlimitedTime.val());
            var unitsEachYear = consts.secondsPerYear / secondsPerUnit;
            self.cost = unitsEachYear * unitPrice * consumptionRatio;
        }
        else if (self.bandwidthType == "capped") {
            self.availableSpeed = parseFloat(DOM.cappedSpeed.val());
            // validate numbers
            var availableSize = parseFloat(DOM.cappedSize.val());
            var secondsPerUnit = parseFloat(DOM.cappedTime.val());
            var unitsEachDay = consts.secondsPerDay / secondsPerUnit;
            var availableEachDay = unitsEachDay * availableSize;
            self.availableEachMonth = availableEachDay * consts.daysPerMonth;
            // calculate annual cost
            var consumptionRatio = network.gigabytesPerMonth / self.availableEachMonth;
            var unitsEachYear = consts.secondsPerYear / secondsPerUnit;
            var unitPrice = parseFloat(DOM.cappedPrice.val());
            self.cost = unitsEachYear * unitPrice * consumptionRatio;
        }
        network.totalCosts += self.cost;

        // Calculate overlap rate (rate blocks might overlap each other).
        // Depends which hop the block is received.
        // The later the hop, the longer the wait.
        // The longer the wait, the bigger the chance of overlapping block.
        // Work out the chance of a block arriving for each hop.
        // Then get the average overlap rate across all hops,
        // weighted by the number of nodes in each hop.
        var cumRate = 0;
        var cumWeight = 0;
        var nodesInPastHops = 0;
        self.secondsToGetBlock = network.megabitsPerBlock / self.availableSpeed;
        for (var h=1; h<=network.numberOfHops; h++) {
            var secondsBeforeBlock = h * self.secondsToGetBlock;
            var newBlockChance = chanceOfNewBlock(secondsBeforeBlock, network.secondsPerBlock);
            var nodesLteThisHopLevel = Math.min(Math.pow(network.connectedPeers, h), network.totalNetworkNodes);
            var nodesInThisHop = nodesLteThisHopLevel - nodesInPastHops;
            var partOfHopChance = nodesInThisHop / network.totalNetworkNodes;
            var weightedChance = newBlockChance * partOfHopChance;
            cumRate += weightedChance;
            cumWeight += partOfHopChance;
            nodesInPastHops += nodesInThisHop;
        }
        var overlapRate = cumRate / cumWeight;
        self.blocksBetweenOverlap = 1 / overlapRate;
        var secondsBetweenOverlaps = self.blocksBetweenOverlap * network.secondsPerBlock;
        self.daysBetweenOverlaps = secondsBetweenOverlaps / consts.secondsPerDay;
        self.propagationTime = self.secondsToGetBlock * network.numberOfHops;

        // Initial block download - assumes all blocks full since start
        var now = new Date().getTime();
        var startOfBlockchain = new Date("2009-01-09 00:00:00").getTime();
        var timeSinceStart = (now - startOfBlockchain) / 1000;
        var blocksSinceStart = timeSinceStart / 600; // 600s per block
        var existingSize = 1 * blocksSinceStart; // 1 MB
        var futureTime = new Date(DOM.ibdDate.val()).getTime();
        var timeToFuture = (futureTime - now) / 1000
        var blocksInFuture = timeToFuture / 600;
        if (blocksInFuture < 0) {
            blocksInFuture = 0;
        }
        var futureSize = network.megabytesPerBlock * blocksInFuture;
        self.ibdSize = Math.round((existingSize + futureSize) / 1024); // in GB
        var ibdSizeMegabits = self.ibdSize * 1024 * 8;
        self.ibdTime = Math.round(ibdSizeMegabits / self.availableSpeed / 3600); // in hours

    }

    function render() {

        DOM.unlimited.addClass("hidden");
        DOM.capped.addClass("hidden");
        if (self.bandwidthType == "unlimited") {
            // show unlimited options
            DOM.unlimited.removeClass("hidden");
            // if impossible, show error
            if (self.availableSpeed < network.megabitsPerSecondMax) {
                DOM.unlimitedSpeed.addClass("impossible");
                DOM.bandwidthErrorMsg.removeClass("hidden");
            }
            else {
                DOM.unlimitedSpeed.removeClass("impossible");
                DOM.bandwidthErrorMsg.addClass("hidden");
            }
        }
        else if (self.bandwidthType == "capped") {
            // show capped options
            DOM.capped.removeClass("hidden");
            // if impossible, show error
            var impossibleSize = self.availableEachMonth < network.gigabytesPerMonth;
            var impossibleSpeed = self.availableSpeed < network.megabitsPerSecondMax;
            if (impossibleSize || impossibleSpeed) {
                DOM.bandwidthErrorMsg.removeClass("hidden");
            }
            else {
                DOM.bandwidthErrorMsg.addClass("hidden");
            }
            if (impossibleSize) {
                DOM.cappedSize.addClass("impossible");
            }
            else {
                DOM.cappedSize.removeClass("impossible");
            }
            if (impossibleSpeed) {
                DOM.cappedSpeed.addClass("impossible");
            }
            else {
                DOM.cappedSpeed.removeClass("impossible");
            }
        }

        DOM.bandwidthDown.text(network.megabitsPerSecondDown.toLocaleString());
        DOM.bandwidthUp.text(network.megabitsPerSecondUp.toLocaleString());
        DOM.dataCap.text(network.gigabytesPerMonth.toLocaleString());

        DOM.overlapRate.text(Math.round(self.blocksBetweenOverlap));
        DOM.overlapTime.text(self.daysBetweenOverlaps.toLocaleString());

        DOM.hopTime.text(self.secondsToGetBlock.toLocaleString());
        DOM.propagateTime.text(self.propagationTime.toLocaleString());

        DOM.bandwidthCost.text(self.cost.toLocaleString());

        DOM.ibdSize.text(self.ibdSize.toLocaleString());
        DOM.ibdTime.text(self.ibdTime.toLocaleString());

    }

    network.addCalculatedListener(function() {
        calculate();
        render();
    });

    function chanceOfNewBlock(timeSinceLastBlock, avgBlockTime) {
        // See
        // https://en.bitcoin.it/wiki/Confirmation#Confirmation_Times
        // http://bitcoin.stackexchange.com/a/43592
        return 1 - Math.exp(-1*(timeSinceLastBlock / avgBlockTime));
    }

    onInputEls = [
        DOM.unlimitedPrice,
        DOM.unlimitedTime,
        DOM.unlimitedSpeed,
        DOM.cappedSize,
        DOM.cappedTime,
        DOM.cappedPrice,
        DOM.cappedSpeed,
        DOM.ibdDate,
    ];
    var onChangeEls = [
        DOM.bandwidthType,
        DOM.cappedTime,
        DOM.unlimitedTime,
    ];
    for (var i=0; i<onInputEls.length; i++) {
        onInputEls[i].on("input", network.recalc);
    }
    for (var i=0; i<onChangeEls.length; i++) {
        onChangeEls[i].on("change", network.recalc);
    }

})();
