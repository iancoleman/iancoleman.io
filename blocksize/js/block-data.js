(function() {

    var data = [];

    var DOM = {};
    DOM.loadButton = $(".load button");
    DOM.size = $(".load .size");
    DOM.load = $(".load");
    DOM.loading = $(".loading");
    DOM.charts = $(".charts");
    DOM.start = $(".start");
    DOM.end = $(".end");
    DOM.blocks = $(".stats .blocks");
    DOM.sizekb = $(".stats .sizekb");
    DOM.sizetxs = $(".stats .sizetxs");
    DOM.timing = $(".stats .timing");
    DOM.timeseries = $(".stats .timeseries");
    DOM.largeCharts = $(".large-charts");
    DOM.logarithmic = $(".logarithmic");
    DOM.sizeChart = $(".chart .size");
    DOM.txlengthChart = $(".chart .txlength");
    DOM.timingChart = $(".chart .timing");
    DOM.timeseriesChart = $(".chart .timeseries");

    function init() {
        showDataSize();
        setEvents();
        setChartOptions();
    }

    function setEvents() {
        DOM.loadButton.on("click", loadData);
        DOM.largeCharts.on("change", setLargeCharts);
        DOM.logarithmic.on("change", render);
    }

    function setChartOptions() {
        Chart.defaults.global.animation.duration = 0;
    }

    function showDataSize() {
        var request = new XMLHttpRequest();
        request.open("HEAD", "data/blocks.csv", true);
        request.onreadystatechange = function() {
            if (request.readyState == 4) {
                if (request.status == 200) {
                    var sizeBytes = request.getResponseHeader("Content-Length");
                    var sizeMb = (sizeBytes / 1024 / 1024).toFixed(1);
                    DOM.size.text(sizeMb + " MB");
                }
            }
        }
        request.send(null);
    }

    function loadData() {

        // Hide load button
        DOM.load.addClass("hidden");
        // Show loading
        DOM.loading.removeClass("hidden");
        // Load the data
        Papa.parse("data/blocks.csv", {
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
                        block[key] = value;
                    }
                    data.push(block);
                }
                // Hide loading
                DOM.loading.addClass("hidden");
                // Show charts
                DOM.charts.removeClass("hidden");
                // Set min and max dates
                var minDateStr = dateStr(data[0].time);
                var maxDateStr = dateStr(data[data.length-1].time);
                DOM.start.attr("min", minDateStr);
                DOM.start.attr("max", maxDateStr);
                if (DOM.start.val() == "") {
                    DOM.start.val(minDateStr);
                    DOM.start.trigger("input");
                }
                DOM.start.on("input", render);
                DOM.end.attr("min", minDateStr);
                DOM.end.attr("max", maxDateStr);
                if (DOM.end.val() == "") {
                    DOM.end.val(maxDateStr);
                    DOM.end.trigger("input");
                }
                DOM.end.on("input", render);
                render();
            },
        })
    }

    function render() {
        // Size chart values
        sizeLabels = [];
        sizeValues = [];
        minSize = 0; // KB
        sizeStep = 100;
        maxSize = 1024; // KB
        for (var kb=minSize; kb<=maxSize; kb+=sizeStep) {
            sizeLabels.push(kb.toFixed(0) + "-" + (kb+sizeStep).toFixed(0) + " KB");
            sizeValues.push(0);
        }
        sizeLabels[sizeLabels.length-1] = (maxSize) + " KB+";
        // Txlength chart values
        txlengthLabels = [];
        txlengthValues = [];
        minTxlength = 0; // KB
        var maxTxlength = 3000;
        txlengthStep = Math.ceil(maxTxlength / 10);
        for (var txs=0; txs<=maxTxlength; txs+=txlengthStep) {
            txlengthLabels.push(txs.toFixed(0) + "-" + (txs+txlengthStep).toFixed(0) + " txs");
            txlengthValues.push(0);
        }
        txlengthLabels[txlengthLabels.length-1] = (maxTxlength) + " txs+";
        // Timing chart values
        timingLabels = [];
        timingValues = [];
        timingStep = 100;
        var minTiming = -100; // Block times are not always sequential
        var maxTiming = 20*60;
        for (var tm=minTiming; tm<=maxTiming; tm+=timingStep) {
            timingLabels.push(tm.toFixed(0) + "-" + (tm+timingStep).toFixed(0) + "s");
            timingValues.push(0);
        }
        timingLabels[0] = "< 0s";
        timingLabels[timingLabels.length-1] = (maxTiming) + "s+";
        //  Timeseries values
        var tsLabels = [];
        var tsMedianSize = [];
        var tsMeanSize = [];
        var tsMaxSize = [];
        var tsMeanTime = [];
        var thisMonthSizes = [];
        var thisMonthTimes = [];
        // Stats
        var totalBlocks = 0;
        var cumSizekb = 0;
        var cumSizetxs = 0;
        var cumTiming = 0;
        // Parse the data
        var start = new Date(DOM.start.val() + "T00:00:00+0000").getTime() / 1000;
        var end = new Date(DOM.end.val() + "T00:00:00+0000").getTime() / 1000;
        var firstDate = new Date(data[0].time * 1000);
        var firstMonth = monthForDate(firstDate);
        for (var i=0; i<data.length; i++) {
            var block = data[i];
            // Timeseries data
            var blockDate = new Date(block.time * 1000);
            var thisMonth = monthForDate(blockDate);
            var monthIndex = thisMonth - firstMonth;
            if (monthIndex > tsMedianSize.length || i == data.length-1) {
                // Month has ended, put past month into time series
                thisMonthSizes.sort(function(a,b) { return a-b });
                var medianSize = decimalPlaces(median(thisMonthSizes), 1);
                tsMedianSize.push({ x: monthIndex, y: medianSize });
                var meanSize = decimalPlaces(mean(thisMonthSizes), 1);
                tsMeanSize.push({ x: monthIndex, y: meanSize });
                var maxSize = decimalPlaces(thisMonthSizes[thisMonthSizes.length - 1], 1);
                tsMaxSize.push({ x: monthIndex, y: maxSize });
                var meanTime = decimalPlaces(mean(thisMonthTimes), 1);
                tsMeanTime.push({ x: monthIndex, y: meanTime });
                tsLabels.push(dateStr(prevBlock.time).substring(0,7));
                // Reset monthly stats
                thisMonthSizes = [];
                thisMonthTimes = [];
            }
            // accumulate data for this month
            thisMonthSizes.push(parseFloat(block.size) / 1024);
            if (i > 0) {
                var prevBlock = data[i-1];
                var time = block.time - prevBlock.time;
                thisMonthTimes.push(time);
            }
            // Ignore data outside the time range for histograms
            if (block.time < start || block.time > end) {
                continue;
            }
            // Total Blocks stat
            totalBlocks += 1;
            // Size
            var sizekb = block.size / 1024;
            var sizeBucket = Math.floor(sizekb / sizeStep);
            sizeValues[sizeBucket] += 1;
            cumSizekb += sizekb;
            // Txlength
            var txlength = block.txlength;
            if (txlength > maxTxlength) {
                txlength = maxTxlength;
            }
            var txlengthBucket = Math.floor(txlength / txlengthStep);
            txlengthValues[txlengthBucket] += 1;
            cumSizetxs += txlength;
            // Timing
            if (i > 0) {
                var prevBlock = data[i-1];
                var timing = block.time - prevBlock.time;
                if (timing > maxTiming) {
                    timing = maxTiming;
                }
                if (timing < minTiming) {
                    timing = minTiming;
                }
                var timingBucket = Math.floor((timing - minTiming) / timingStep);
                timingValues[timingBucket] += 1;
                cumTiming += timing;
            }
        }
        // Work out the scale type
        var scaleType = "linear";
        if (DOM.logarithmic.prop("checked")) {
            scaleType = "logarithmic";
        }
        // Set global chart parameters
        var barColor = "#777";
        // Chart the size
        DOM.sizeChart.empty();
        var sizeCanvas = document.createElement("canvas");
        DOM.sizeChart.append(sizeCanvas);
        new Chart(sizeCanvas, {
            type: 'bar',
            data: {
                labels: sizeLabels,
                datasets: [{
                    label: 'Blocks of this size',
                    data: sizeValues,
                    borderColor: barColor,
                    pointBorderColor: barColor,
                    pointBackgroundColor: barColor,
                    backgroundColor: barColor,
                }],
            },
            options: {
                title: {
                    display: true,
                    text: "Block Size",
                },
                scales: {
                    yAxes: [{
                        type: scaleType,
                    }]
                }
            }
        });
        // Chart the txlength
        DOM.txlengthChart.empty();
        var txlengthCanvas = document.createElement("canvas");
        DOM.txlengthChart.append(txlengthCanvas);
        new Chart(txlengthCanvas, {
            type: 'bar',
            data: {
                labels: txlengthLabels,
                datasets: [{
                    label: 'Blocks with this many txs',
                    data: txlengthValues,
                    borderColor: barColor,
                    pointBorderColor: barColor,
                    pointBackgroundColor: barColor,
                    backgroundColor: barColor,
                }],
            },
            options: {
                title: {
                    display: true,
                    text: "Txs Per Block",
                },
                scales: {
                    yAxes: [{
                        type: scaleType,
                    }]
                }
            }
        });
        // Chart the timing
        DOM.timingChart.empty();
        var timingCanvas = document.createElement("canvas");
        DOM.timingChart.append(timingCanvas);
        var size = new Chart(timingCanvas, {
            type: 'bar',
            data: {
                labels: timingLabels,
                datasets: [{
                    label: 'Blocks this far apart',
                    data: timingValues,
                    borderColor: barColor,
                    pointBorderColor: barColor,
                    pointBackgroundColor: barColor,
                    backgroundColor: barColor,
                }],
            },
            options: {
                title: {
                    display: true,
                    text: "Time Between Blocks",
                },
                scales: {
                    yAxes: [{
                        type: scaleType,
                    }]
                }
            }
        });
        // Chart the time series
        DOM.timeseriesChart.empty();
        var timeseriesCanvas = document.createElement("canvas");
        DOM.timeseriesChart.append(timeseriesCanvas);
        var maxSizeColor = "#D62728";
        var meanSizeColor = "#FF7F0E";
        var medianSizeColor = "#2CA02C";
        var meanTimeColor = "#1F77B4";
        var size = new Chart(timeseriesCanvas, {
            type: 'line',
            data: {
                labels: tsLabels,
                datasets: [
                    {
                        label: 'Max Size',
                        data: tsMaxSize,
                        fill: false,
                        borderColor: maxSizeColor,
                        pointBorderColor: maxSizeColor,
                        pointBackgroundColor: maxSizeColor,
                        backgroundColor: maxSizeColor,
                        pointRadius: 1,
                    },
                    {
                        label: 'Avg Size',
                        data: tsMeanSize,
                        fill: false,
                        borderColor: meanSizeColor,
                        pointBorderColor: meanSizeColor,
                        pointBackgroundColor: meanSizeColor,
                        backgroundColor: meanSizeColor,
                        pointRadius: 1,
                    },
                    {
                        label: 'Median Size',
                        data: tsMedianSize,
                        fill: false,
                        borderColor: medianSizeColor,
                        pointBorderColor: medianSizeColor,
                        pointBackgroundColor: medianSizeColor,
                        backgroundColor: medianSizeColor,
                        pointRadius: 1,
                    },
                    {
                        label: 'Avg Time',
                        data: tsMeanTime,
                        fill: false,
                        borderColor: meanTimeColor,
                        pointBorderColor: meanTimeColor,
                        pointBackgroundColor: meanTimeColor,
                        backgroundColor: meanTimeColor,
                        pointRadius: 1,
                    },
                ],
            },
            options: {
                title: {
                    display: true,
                    text: "Block History",
                },
                scales: {
                    yAxes: [{
                        type: scaleType,
                    }]
                }
            }
        });
        // Stats
        var avgSizekb = (cumSizekb / totalBlocks).toFixed(0);
        var avgSizetxs = (cumSizetxs / totalBlocks).toFixed(0);
        var avgTiming = (cumTiming / (totalBlocks - 1)).toFixed(0);
        DOM.blocks.text(totalBlocks);
        DOM.sizekb.text(avgSizekb);
        DOM.sizetxs.text(avgSizetxs);
        DOM.timing.text(avgTiming);
    }

    function setLargeCharts() {
        var charts = [
            DOM.sizeChart,
            DOM.txlengthChart,
            DOM.timingChart,
            DOM.timeseriesChart,
        ]
        for (var i=0; i<charts.length; i++) {
            var chart = charts[i];
            if (DOM.largeCharts.prop("checked")) {
                chart.addClass("large-chart");
                chart.removeClass("col-md-6");
            }
            else {
                chart.removeClass("large-chart");
                chart.addClass("col-md-6");
            }
        }
    }

    function dateStr(unixTime) {
        var d = new Date(unixTime * 1000);
        return d.toISOString().substring(0, 10);
    }

    function monthForDate(d) {
        return d.getUTCFullYear() * 12 + d.getUTCMonth();
    }

    function mean(a) {
        var total = 0;
        if (a.length == 0) {
            return 0;
        }
        for (var i=0; i<a.length; i++) {
            total += a[i];
        }
        return total / a.length;
    }

    function median(a) {
        if (a.length < 1) {
            return 0;
        }
        if (a.length % 2 == 0) {
            var lo = a[a.length / 2 - 1];
            var hi = a[a.length / 2];
            return (lo + hi) / 2;
        }
        else {
            return a[Math.floor(a.length / 2)]
        }
    }

    function decimalPlaces(val, places) {
        var multiplier = Math.pow(10, places);
        var intVal = Math.round(val * multiplier);
        var floatVal = intVal / multiplier;
        return floatVal;
    }

    init();

})();
