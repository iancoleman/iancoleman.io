(function() {

// Elements

let DOM = {};
DOM.root = document.querySelectorAll(".secure-network-size")[0];
DOM.lifetimeVaultCost = DOM.root.querySelectorAll(".lifetime-vault-cost")[0];
DOM.vaultsPerSection = DOM.root.querySelectorAll(".vaults-per-section")[0];
DOM.quorum = DOM.root.querySelectorAll(".quorum")[0];
DOM.totalSafecoins = DOM.root.querySelectorAll(".total-safecoins")[0];
DOM.chart = document.querySelectorAll("#size-chart")[0];

// Constants

let consts = {};
consts.minNetSize = 1000;
consts.maxNetSize = 3000000;

// Events
DOM.lifetimeVaultCost.addEventListener("input", updateChart);
DOM.vaultsPerSection.addEventListener("input", updateChart);
DOM.quorum.addEventListener("input", updateChart);
DOM.totalSafecoins.addEventListener("input", updateChart);

// Calculations

function updateChart() {
    DOM.chart.innerHTML = "";
    let chart = document.createElement("canvas");
    chart.height = 300;
    chart.width = 400;
    DOM.chart.appendChild(chart);
    // calculate data points for chart
    let lifetimeVaultCost = DOM.lifetimeVaultCost.value;
    let vaultsPerSection = DOM.vaultsPerSection.value;
    let quorum = DOM.quorum.value;
    let totalSafecoins = DOM.totalSafecoins.value;
    let sizeStep = consts.minNetSize;
    let labels = [];
    let values = [];
    for (let networkSize=consts.minNetSize; networkSize<=consts.maxNetSize; networkSize=networkSize+sizeStep) {
        let safecoinPrice = (networkSize * networkSize * quorum * lifetimeVaultCost) / (totalSafecoins * vaultsPerSection);
        labels.push(networkSize);
        values.push(Math.round(safecoinPrice*100)/100);
    }
    // show chart
    let ctx = chart.getContext('2d');
    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Maximum Price",
                data: values,
                pointRadius: 0,
            }],
        },
        options: {
            legend: {
                display: false,
            },
            tooltips: {
                displayColors: false,
                callbacks: {
                    title: function(tooltipItems, data) {
                        let ns = tidyNum(tooltipItems[0].xLabel);
                        return "Network size: " + ns + " vaults";
                    },
                    label: function(tooltipItems, data) {
                        return "Maximum price: $" + tooltipItems.yLabel;
                    },
                }
            },
            animation: {duration: 0},
            hover: {animationDuration: 0},
            responsiveAnimationDuration: 0,
        },
    });
}

updateChart();

})();
