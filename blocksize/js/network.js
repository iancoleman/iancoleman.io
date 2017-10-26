// Access to the network parameters as entered by the user.
network = new (function() {

    var self = this;

    var DOM = {};
    DOM.size = $(".parameters input.block-size");
    DOM.blocks = $(".parameters input.blocks");
    DOM.time = $(".parameters input.time");
    DOM.peers = $(".parameters input.peers");
    DOM.nodes = $(".parameters .nodes");
    DOM.blockGrammar = $(".parameters .block-grammar");
    DOM.finalTotal = $(".costs .final .total");
    DOM.hop1Nodes = $(".parameters .hop-1-nodes");
    DOM.hop2Nodes = $(".parameters .hop-2-nodes");
    DOM.hopNNodes = $(".parameters .hop-n-nodes");
    DOM.static = {};
    DOM.static.hops = $(".hops");
    DOM.static.size = $(".results span.block-size");
    DOM.static.blocks = $(".results span.blocks");
    DOM.static.time = $(".results span.time");
    DOM.static.peers = $("span.peers");
    DOM.static.minTxSize = $("span.min-tx-size");

    DOM.bandwidthCostPercent = $(".costs .bandwidth .percent .value");
    DOM.bandwidthCostBar = $(".costs .bandwidth .bar");
    DOM.processingCostPercent = $(".costs .processing .percent .value");
    DOM.processingCostBar = $(".costs .processing .bar");
    DOM.laborCostPercent = $(".costs .labor .percent .value");
    DOM.laborCostBar = $(".costs .labor .bar");
    DOM.diskCostPercent = $(".costs .disk .percent .value");
    DOM.diskCostBar = $(".costs .disk .bar");

    function calculate() {

        self.megabytesPerBlock = parseFloat(DOM.size.val());

        self.bytesPerBlock = self.megabytesPerBlock * 1024 * 1024;

        self.blocksPerSecondNumerator = parseFloat(DOM.blocks.val());

        self.blocksPerSecondDenominator = parseFloat(DOM.time.val());

        self.connectedPeers = parseFloat(DOM.peers.val());

        self.totalNetworkNodes = parseFloat(DOM.nodes.val());

        self.numberOfHops = numberOfHops(self.totalNetworkNodes, self.connectedPeers);

        self.maxNodesForHops = Math.pow(self.connectedPeers, self.numberOfHops);

        self.megabitsPerBlock = self.bytesPerBlock * 8 / 1000 / 1000;

        self.blocksPerSecond = self.blocksPerSecondNumerator / self.blocksPerSecondDenominator;

        self.secondsPerBlock = 1 / self.blocksPerSecond;

        self.downloadPeers = 1;

        self.megabitsPerSecondDown = self.megabitsPerBlock * self.blocksPerSecond * self.downloadPeers * self.numberOfHops;

        // Upload must happen to all peers that are not downloaded from.
        self.uploadPeers = self.connectedPeers - self.downloadPeers;

        self.megabitsPerSecondUp = self.megabitsPerBlock * self.blocksPerSecond * self.uploadPeers * self.numberOfHops;

        self.megabitsPerSecondMax = Math.max(self.megabitsPerSecondUp, self.megabitsPerSecondDown);

        self.blocksPerMonth = consts.secondsPerMonth * self.blocksPerSecond;

        self.megabytesPerMonth = self.blocksPerMonth * self.megabytesPerBlock * self.connectedPeers;

        self.gigabytesPerMonth = self.megabytesPerMonth / 1024;

        self.blocksPerYear = consts.secondsPerYear * self.blocksPerSecond;

        self.megabytesPerYear = self.blocksPerYear * self.megabytesPerBlock;

        self.gigabytesPerYear = self.megabytesPerYear / 1024;

        // Must use min tx size to model worst case scenario.
        // The smaller the tx size the more txs per block and the higher the
        // required transaction processing rate.
        // Note this does not account for variation such as the mega transaction.
        // See https://rusty.ozlabs.org/?p=522
        // For the source of this block size, see
        // https://insight.bitpay.com/tx/70108ec3d588a48c825565f0ecf3f553952c7764dca7a9e8dac21d6df56948b1
        self.minTxSize = 226; // bytes

        self.bytesPerBlock = self.megabytesPerBlock * 1024 * 1024;

        self.txsPerBlock = self.bytesPerBlock / self.minTxSize;

        self.txsPerSecond = self.txsPerBlock * self.blocksPerSecond * self.numberOfHops;

        self.totalCosts = 0;

    }

    ////
    // Rendering
    ////

    function render() {
        if (self.blocksPerSecondNumerator == 1) {
            DOM.blockGrammar.text("block");
        }
        else {
            DOM.blockGrammar.text("blocks");
        }
        DOM.static.hops.text(self.numberOfHops.toLocaleString());
        DOM.hop1Nodes.text(self.connectedPeers.toLocaleString());
        DOM.hop2Nodes.text((Math.pow(self.connectedPeers, 2)).toLocaleString());
        DOM.hopNNodes.text(self.maxNodesForHops.toLocaleString());
        DOM.static.size.text(self.megabytesPerBlock);
        DOM.static.blocks.text(self.blocksPerSecondNumerator);
        DOM.static.time.text(self.blocksPerSecondDenominator);
        DOM.static.peers.text(self.connectedPeers);
        DOM.static.minTxSize.text(self.minTxSize);
        DOM.finalTotal.text(self.totalCosts.toLocaleString());

        // Show proportionality bars on viability costs
        var largestCost = Math.max(bandwidth.cost, processing.cost, disk.cost, labor.cost);
        var bandwidthBarSize = Math.round(bandwidth.cost / largestCost * 100) + "%";
        var bandwidthPercent = Math.round(bandwidth.cost / self.totalCosts * 100) + "%";
        DOM.bandwidthCostPercent.text(bandwidthPercent);
        DOM.bandwidthCostBar.css("width", bandwidthBarSize);
        var processingBarSize = Math.round(processing.cost / largestCost * 100) + "%";
        var processingPercent = Math.round(processing.cost / self.totalCosts * 100) + "%";
        DOM.processingCostPercent.text(processingPercent);
        DOM.processingCostBar.css("width", processingBarSize);
        var diskBarSize = Math.round(disk.cost / largestCost * 100) + "%";
        var diskPercent = Math.round(disk.cost / self.totalCosts * 100) + "%";
        DOM.diskCostPercent.text(diskPercent);
        DOM.diskCostBar.css("width", diskBarSize);
        var laborBarSize = Math.round(labor.cost / largestCost * 100) + "%";
        var laborPercent = Math.round(labor.cost / self.totalCosts * 100) + "%";
        DOM.laborCostPercent.text(laborPercent);
        DOM.laborCostBar.css("width", laborBarSize);
    }

    ////
    // Event hanlers
    ////

    var calculatedHandlers = [];

    self.addCalculatedListener = function(fn) {
        calculatedHandlers.push(fn);
    }

    self.recalc = function() {
        calculate();
        for (var i=0; i<calculatedHandlers.length; i++) {
            calculatedHandlers[i]();
        }
        render();
    }

    function numberOfHops(totalNodes, connectionsPerNode) {
        // Assuming that there are no cycles (not a good assumption).
        // Need to account for network topology.
        // The current algorithm used here is too optimistic.
        // Most likely there would be more hops than this to fully propagate.
        // eg for 8 peers per node
        // 1 hop  = 8 nodes have block data
        // 2 hops = 8*8 = 64 nodes have block data
        // 3 hops = 8*8*8 = 512
        // h hops = 8^h
        var h = Math.log(totalNodes) / Math.log(connectionsPerNode);
        return Math.ceil(h);
    }

    // Recalculate when changes are made to elements
    var onInputEls = [
        DOM.size,
        DOM.blocks,
        DOM.time,
        DOM.peers,
        DOM.nodes,
    ];
    for (var i=0; i<onInputEls.length; i++) {
        onInputEls[i].on("input", self.recalc);
    }

})();
