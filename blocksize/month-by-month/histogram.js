var loadBtn = document.getElementById("loadBtn");
var size = document.getElementById("size");
var loading = document.getElementById("loading");
var loaded = document.getElementById("loaded");
var chart = document.getElementById("chart");
var monthSelector = document.getElementById("month");

var blocks = [];
var monthlyHistograms = [];
var firstMonth = 0;

function init() {
    // Events
    loadBtn.addEventListener("click", loadData);
    // Chart defaults
    Chart.defaults.global.animation.duration = 0;
    // Show file size
    showSize();
}

function loadData() {
    // Show loading
    load.classList.add("hidden");
    loading.classList.remove("hidden");
    // Load the data
    Papa.parse("../data/blocks.csv", {
        download: true,
        complete: function(result) {
            if (result.errors.length > 0) {
                // TODO report error
                return;
            }
            // Parse csv data into array of block objects
            var rows = result.data;
            var columnNames = rows[0];
            for (var i=1; i<rows.length; i++) {
                var cells = rows[i];
                if (cells.length != 4) {
                    continue;
                }
                var block = {};
                for (var j=0; j<columnNames.length; j++) {
                    var key = columnNames[j];
                    var value = parseFloat(cells[j]);
                    if (key == "time") {
                        value = new Date(value * 1000);
                    }
                    block[key] = value;
                }
                blocks.push(block);
            }
            // Parse blocks into monthly bins
            var min = -100;
            var max = 1200;
            var step = 100;
            firstMonth = monthForDate(blocks[0].time);
            var thisMonthSizes = [];
            for (var i=0; i<blocks.length; i++) {
                var block = blocks[i];
                var thisMonth = monthForDate(block.time);
                var monthIndex = thisMonth - firstMonth;
                if (monthIndex > monthlyHistograms.length) {
                    // Create histogram
                    var bins = toBinData(thisMonthSizes, min, max, step);
                    var chartData = binsToChart(bins, monthIndex);
                    monthlyHistograms.push(chartData);
                    // reset monthly sizes
                    thisMonthSizes = [];
                }
                thisMonthSizes.push(block.size / 1000);
            }
            // Chart first month
            showMonth(0);
            // Set slider
            monthSelector.setAttribute("min", 0);
            monthSelector.setAttribute("max", monthlyHistograms.length-1);
            monthSelector.addEventListener("input", function() {
                var monthIndex = parseFloat(monthSelector.value);
                showMonth(monthIndex);
            });
            // Show chart
            loading.classList.add("hidden");
            loaded.classList.remove("hidden");
            monthSelector.focus();
        }
    });
}

function showSize() {
    var request = new XMLHttpRequest();
    request.open("HEAD", "../data/blocks.csv", true);
    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            if (request.status == 200) {
                var sizeBytes = request.getResponseHeader("Content-Length");
                var sizeMb = (sizeBytes / 1024 / 1024).toFixed(1);
                size.textContent = sizeMb + " MB";
            }
        }
    }
    request.send(null);
}

function showMonth(monthIndex) {
    var histogram = monthlyHistograms[monthIndex];
    // Clear old graph
    chart.innerHTML = "";
    var canvas = document.createElement("canvas");
    chart.appendChild(canvas);
    new Chart(canvas, {
        type: 'bar',
        data: histogram.normalized,
        options: {
            title: {
                display: true,
                text: histogram.title,
            },
            scales: {
                yAxes: [{
                    ticks: {
                        min: 0,
                        max: 100,
                    },
                }],
            },
        }
    });
}

function toBinData(a, min, max, step) {
    var range = max - min;
    var bins = [];
    var labels = [];
    // Generate bins
    for (var i=min; i<=max; i+=step) {
        var label = i + " - " + (i+step);
        labels.push(label);
        bins.push(0);
    }
    labels[0] = "< " + (min+step);
    labels[labels.length-1] = max + "+";
    // Populate bins
    for (var i=0; i<a.length; i++) {
        // Validate value
        var p = a[i];
        if (p > max) {
            p = max;
        }
        if (p < min) {
            p = min;
        }
        // Put in bin
        var binIndex = Math.floor(((p - min) / range) * (bins.length-1));
        bins[binIndex] += 1;
    }
    return {
        bins: bins,
        labels: labels,
    };
}

function binsToChart(binData, monthIndex) {
    var bins = binData.bins;
    var labels = binData.labels;
    // Calculate title - month
    var year = Math.floor(firstMonth / 12);
    var monthStr = dateStr(new Date(year, monthIndex + 1));
    // Calculate title - blocks
    var totalBlocks = 0;
    for (var i=0; i<bins.length; i++) {
        totalBlocks += bins[i];
    }
    // Normalize data
    var normBins = [];
    for (var i=0; i<bins.length; i++) {
        normBins.push(Math.round(bins[i] / totalBlocks * 1000)/10);
    }
    // Set global chart parameters
    var barColor = "#777";
    // Return chartable format
    var response = {
        title: "Block Size (KB) - " + monthStr + " - " + totalBlocks + " blocks",
        raw: {
            labels: labels,
            datasets: [{
                label: "% of blocks",
                data: bins,
                borderColor: barColor,
                pointBorderColor: barColor,
                pointBackgroundColor: barColor,
                backgroundColor: barColor,
            }],
        },
        normalized: {
            labels: labels,
            datasets: [{
                label: "% of blocks",
                data: normBins,
                borderColor: barColor,
                pointBorderColor: barColor,
                pointBackgroundColor: barColor,
                backgroundColor: barColor,
            }],
        },
    };
    return response;
}

function monthForDate(d) {
    return (d.getUTCFullYear()) * 12 + d.getUTCMonth();
}

function dateStr(d) {
    return d.toISOString().substring(0, 7);
}

function test() {
    // Helpers
    var tests = 0;
    var failures = 0;
    function test(name, cond) { if(!cond) { fail(name) } tests++ }
    function fail(name) { console.log("FAIL: " + name); failures++; }
    // TESTS:
    // monthForDate
    test(
        "monthForDate value",
        monthForDate(new Date(2000,1)) == 24000
    )
    test(
        "monthForDate diff",
        monthForDate(new Date(2000,2)) - monthForDate(new Date(2000,1)) == 1
    )
    // dateStr
    test(
        "dateStr UTC",
        dateStr(new Date("2000-01-01 00:00:00.000+0000")) == "2000-01"
    )
    test(
        "dateStr not UTC",
        dateStr(new Date("2000-01-01 00:00:00.000+1000")) == "1999-12"
    )
    // toBinData
    test(
        "toBinData",
        (function() {
            var d = toBinData([1,1,1], 0, 2, 1);
            var pass = true;
            pass = pass && d.bins[0] == 0;
            pass = pass && d.bins[1] == 3;
            pass = pass && d.bins[2] == 0;
            pass = pass && d.labels[0] == "< 1";
            pass = pass && d.labels[1] == "1 - 2";
            pass = pass && d.labels[2] == "2+";
            return pass;
        })()
    )
    // Log results
    console.log(tests + " tests complete, " + failures + " failures");
}

init();
