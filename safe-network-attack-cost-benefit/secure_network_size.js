(function() {

// Elements

let DOM = {};
DOM.root = document.querySelectorAll(".secure-network-size")[0];
DOM.safecoinPrice = DOM.root.querySelectorAll(".safecoin-price")[0];
DOM.lifetimeVaultCost = DOM.root.querySelectorAll(".lifetime-vault-cost")[0];
DOM.vaultsPerSection = DOM.root.querySelectorAll(".vaults-per-section")[0];
DOM.quorum = DOM.root.querySelectorAll(".quorum")[0];
DOM.totalSafecoins = DOM.root.querySelectorAll(".total-safecoins")[0];
DOM.networkSize = DOM.root.querySelectorAll(".network-size")[0];
DOM.sections = DOM.root.querySelectorAll(".sections")[0];
DOM.safecoinsPerSection = DOM.root.querySelectorAll(".safecoins-per-section")[0];
DOM.dollarsPerSection = DOM.root.querySelectorAll(".dollars-per-section")[0];
DOM.attackingVaults = DOM.root.querySelectorAll(".attacking-vaults")[0];
DOM.attackingCost = DOM.root.querySelectorAll(".attacking-cost")[0];
DOM.chart = DOM.root.querySelectorAll("#benefit-chart")[0];

// Events
DOM.safecoinPrice.addEventListener("input", updateNetworkSize);
DOM.lifetimeVaultCost.addEventListener("input", updateNetworkSize);
DOM.vaultsPerSection.addEventListener("input", updateNetworkSize);
DOM.quorum.addEventListener("input", updateNetworkSize);
DOM.totalSafecoins.addEventListener("input", updateNetworkSize);

// Calculations
function updateNetworkSize() {
    // get user values
    let safecoinPrice = DOM.safecoinPrice.value;
    let lifetimeVaultCost = DOM.lifetimeVaultCost.value;
    let vaultsPerSection = DOM.vaultsPerSection.value;
    let quorum = DOM.quorum.value;
    let totalSafecoins = DOM.totalSafecoins.value;
    // calculate other values
    let networkSize = Math.pow(((totalSafecoins * vaultsPerSection * safecoinPrice) / (quorum * lifetimeVaultCost)), 0.5);
    let sections = networkSize / vaultsPerSection;
    let safecoinsPerSection = totalSafecoins / sections;
    let dollarsPerSection = safecoinsPerSection * safecoinPrice;
    let attackingVaults = networkSize * quorum;
    let attackingCost = attackingVaults * lifetimeVaultCost;
    // display results
    let networkSizeStr = Math.ceil(networkSize).toLocaleString();
    DOM.networkSize.textContent = networkSizeStr;
    let sectionsStr = Math.ceil(sections).toLocaleString();
    DOM.sections.textContent = sectionsStr;
    let safecoinsPerSectionStr = Math.round(safecoinsPerSection).toLocaleString();
    DOM.safecoinsPerSection.textContent = safecoinsPerSectionStr;
    let dollarsPerSectionStr = (Math.round(dollarsPerSection*100)/100).toLocaleString();
    DOM.dollarsPerSection.textContent = dollarsPerSectionStr;
    let attackingVaultsStr = Math.ceil(attackingVaults).toLocaleString();
    DOM.attackingVaults.textContent = attackingVaultsStr;
    let attackingCostStr = (Math.round(attackingCost*100)/100).toLocaleString();
    DOM.attackingCost.textContent = attackingCostStr;
    // clear existing chart
    DOM.chart.innerHTML = "";
    let chart = document.createElement("canvas");
    chart.height = 300;
    chart.width = 400;
    DOM.chart.appendChild(chart);
    // create new chart
    let digits = Math.ceil(Math.log10(networkSize+1));
    let step = Math.pow(10, digits-2);
    let multiplier = Math.pow(10, digits-1);
    let midpoint = Math.round(networkSize / multiplier) * multiplier
    let xmin = midpoint - step * 10;
    let xmax = midpoint + step * 10;
    let labels = [];
    let costs = [];
    let benefits = [];
    // calculate cost benefits for each network size
    for (let x=xmin; x<xmax; x=x+step) {
        // calculate cost
        let xattackingVaults = x * quorum;
        let cost = xattackingVaults * lifetimeVaultCost;
        // calculate benefit
        let xsections = x / vaultsPerSection;
        let xsafecoinsPerSection = totalSafecoins / xsections;
        let benefit = xsafecoinsPerSection * safecoinPrice;
        labels.push(x);
        costs.push(cost);
        benefits.push(benefit);
    }
    // show chart
    let ctx = chart.getContext('2d');
    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Cost",
                data: costs,
                borderColor: "#00FF00",
            },
            {
                label: "Benefit",
                data: benefits,
                borderColor: "#FF0000",
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
                        let text = "";
                        for (let i=0; i<data.datasets.length; i++) {
                            let label = data.datasets[i].label;
                            let y = data.datasets[i].data[tooltipItems.index];
                            let valueStr = Math.round(y).toLocaleString();
                            text = text + label + ": $" + valueStr + "\n";
                        }
                        return text.trim();
                    },
                }
            },
            animation: {duration: 0},
            hover: {animationDuration: 0},
            responsiveAnimationDuration: 0,
        },
    });
}

updateNetworkSize();

})();
