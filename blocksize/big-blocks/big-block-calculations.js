var DOM = {};

var BYTES_PER_TX = 300;
var BLOCKS_PER_DAY = 24 * 6;

function init() {
    DOM.blocksize = document.querySelectorAll(".blocksize")[0];
    DOM.globalPopulation = document.querySelectorAll(".global-population")[0];
    DOM.transactable = document.querySelectorAll(".transactable")[0];
    DOM.useBitcoin = document.querySelectorAll(".use-bitcoin")[0];
    DOM.txPerDay = document.querySelectorAll(".tx-per-day")[0];
    DOM.details = document.querySelectorAll(".details")[0];
    DOM.calc = {};
    DOM.calc.globalPopulation = document.querySelectorAll(".calc-global-population");
    DOM.calc.transactable = document.querySelectorAll(".calc-transactable");
    DOM.calc.useBitcoin = document.querySelectorAll(".calc-use-bitcoin");
    DOM.calc.txPerDay = document.querySelectorAll(".calc-tx-per-day");

    DOM.globalPopulation.addEventListener("input", update);
    DOM.transactable.addEventListener("input", update);
    DOM.useBitcoin.addEventListener("input", update);
    DOM.txPerDay.addEventListener("input", update);
}

function update() {
    var params = {
        globalPopulation: parseFloat(DOM.globalPopulation.value),
        transactable: parseFloat(DOM.transactable.value),
        useBitcoin: parseFloat(DOM.useBitcoin.value),
        txPerDay: parseFloat(DOM.txPerDay.value),
    }
    var totalTxPerDay = params.globalPopulation * 1e9 * params.transactable / 100 * params.useBitcoin / 100 * params.txPerDay;
    var bytesPerDay = BYTES_PER_TX * totalTxPerDay;
    var bytesPerBlock = bytesPerDay / BLOCKS_PER_DAY;
    var megabytesPerBlock = Math.round(bytesPerBlock / 1024 / 1024);
    DOM.blocksize.textContent = megabytesPerBlock.toLocaleString();
    DOM.details.href = "/blocksize/#block-size=" + megabytesPerBlock;
    for (var key in DOM.calc) {
        var els = DOM.calc[key];
        var value = params[key];
        for (var i=0; i<els.length; i++) {
            var el = els[i];
            el.textContent = value;
        }
    }
}

init();
update();
