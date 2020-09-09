(function() {

    const maxU32 = Math.pow(2,32);

    let base = 6;
    let repeats = 62;
    let samples = 1000;

    let bitsPerSample = repeats * Math.log2(base);
    let bitsFloor = Math.floor(bitsPerSample);
    let bitsCeil = Math.ceil(bitsPerSample);

    let alignment = "lsb";

    let chart = null;

    // virtual dom

    let DOM = {};

    DOM.setup = document.querySelectorAll(".setup")[0];
    DOM.setup.baseHelper = DOM.setup.querySelectorAll(".base-helper")[0];
    DOM.setup.base = DOM.setup.querySelectorAll(".base")[0];
    DOM.setup.repeats = DOM.setup.querySelectorAll(".repeats")[0];
    DOM.setup.samples = DOM.setup.querySelectorAll(".samples")[0];
    DOM.setup.rng = DOM.setup.querySelectorAll(".rng")[0];
    DOM.setup.alignment = DOM.setup.querySelectorAll(".alignment")[0];

    DOM.theory = document.querySelectorAll(".theory")[0];
    DOM.theory.repeats = DOM.theory.querySelectorAll(".repeats");
    DOM.theory.base = DOM.theory.querySelectorAll(".base");
    DOM.theory.entropyBits = DOM.theory.querySelectorAll(".entropy-bits")[0];
    DOM.theory.entropyBitsFloor = DOM.theory.querySelectorAll(".entropy-bits-floor");
    DOM.theory.entropyBitsFloorPct = DOM.theory.querySelectorAll(".entropy-bits-floor-pct")[0];
    DOM.theory.unevenEntropy = DOM.theory.querySelectorAll(".uneven-entropy")[0];
    DOM.theory.entropyBitsCeil = DOM.theory.querySelectorAll(".entropy-bits-ceil");
    DOM.theory.entropyBitsCeilPct = DOM.theory.querySelectorAll(".entropy-bits-ceil-pct");
    DOM.theory.largestSampleSummary = DOM.theory.querySelectorAll(".largest-sample-summary")[0];
    DOM.theory.largestSampleBinary = DOM.theory.querySelectorAll(".largest-sample-binary")[0];
    DOM.theory.largestSampleRepeater = DOM.theory.querySelectorAll(".largest-sample-repeater")[0];
    DOM.theory.largestPossibleFloor = DOM.theory.querySelectorAll(".largest-possible-floor")[0];

    DOM.expData = document.querySelectorAll(".experiment-data")[0];
    DOM.expData.samples = DOM.expData.querySelectorAll(".samples")[0];
    DOM.expData.samplesBase10 = DOM.expData.querySelectorAll(".samples-base10")[0];
    DOM.expData.samplesBase2 = DOM.expData.querySelectorAll(".samples-base2")[0];

    DOM.expResults = document.querySelectorAll(".experiment-results")[0];
    DOM.expResults.floor = DOM.expResults.querySelectorAll(".samples-floor")[0];
    DOM.expResults.floor.count = DOM.expResults.floor.querySelectorAll(".count")[0];
    DOM.expResults.floor.bits = DOM.expResults.floor.querySelectorAll(".bits")[0];
    DOM.expResults.floor.pct = DOM.expResults.floor.querySelectorAll(".pct")[0];
    DOM.expResults.ceil = DOM.expResults.querySelectorAll(".samples-ceil")[0];
    DOM.expResults.ceil.count = DOM.expResults.ceil.querySelectorAll(".count")[0];
    DOM.expResults.ceil.bits = DOM.expResults.ceil.querySelectorAll(".bits")[0];
    DOM.expResults.ceil.pct = DOM.expResults.ceil.querySelectorAll(".pct")[0];
    DOM.expResults.table = DOM.expResults.querySelectorAll("tbody")[0];

    // event handlers

    DOM.setup.baseHelper.addEventListener("change", baseHelperChanged);
    DOM.setup.base.addEventListener("input", parseUserValues);
    DOM.setup.repeats.addEventListener("input", parseUserValues);
    DOM.setup.samples.addEventListener("input", parseUserValues);
    DOM.setup.rng.addEventListener("change", parseUserValues);
    DOM.setup.alignment.addEventListener("change", parseUserValues);

    DOM.expData.samples.addEventListener("scroll", syncScroll);
    DOM.expData.samplesBase10.addEventListener("scroll", syncScroll);
    DOM.expData.samplesBase2.addEventListener("scroll", syncScroll);

    // helper functions

    // array of random floats between 0 and 1
    function getRandomArray(len) {
        let a = [];
        let isCrypto = DOM.setup.rng.value == "crypto";
        if (isCrypto) {
            let n = new Uint32Array(len);
            window.crypto.getRandomValues(n);
            for (let i=0; i<n.length; i++) {
                a.push(n[i] / maxU32);
            }
        }
        else {
            for (let i=0; i<len; i++) {
                a.push(Math.random());
            }
        }
        return a;
    }

    // string number 'len' digits long of specified base
    function getRandomNumber(len, base) {
        let floats = getRandomArray(len);
        let ints = floats.map(function(v) { return Math.floor(v*base % base) });
        let intStr = ints.map(function(v) { return v.toString(base) }).join("");
        return intStr;
    }

    // joins all strings in strArr with line numbers preceding.
    function withLineNumbers(strArr) {
        let s = "";
        let pad = Math.ceil(Math.log10(strArr.length + 1));
        for (let i=0; i<strArr.length; i++) {
            let lineNum = (i+1).toString();
            let prefix = lineNum.padStart(pad, ' ') + ": ";
            let val = adjustForBitAlignment(strArr[i]);
            s += prefix + val + "\n";
        }
        return s;
    }

    function adjustForBitAlignment(binaryString) {
        let adjustedBinStr = binaryString;
        if (alignment == "lsb" && binaryString.length == bitsFloor) {
            adjustedBinStr = " " + adjustedBinStr;
        }
        return adjustedBinStr;
    }

    function baseHelperChanged() {
        let newBase = DOM.setup.baseHelper.value;
        if (newBase == "custom") {
            DOM.setup.base.classList.remove("hidden");
        }
        else {
            DOM.setup.base.classList.add("hidden");
            DOM.setup.base.value = newBase;
            parseUserValues();
        }
    }

    function parseUserValues() {
        base = parseInt(DOM.setup.base.value);
        repeats = parseInt(DOM.setup.repeats.value);
        samples = parseInt(DOM.setup.samples.value);
        alignment = DOM.setup.alignment.value;

        bitsPerSample = repeats * Math.log2(base);
        bitsFloor = Math.floor(bitsPerSample);
        bitsCeil = Math.ceil(bitsPerSample);

        if (bitsFloor == bitsCeil) {
            alignment = "NA";
        }

        updateTheory();
        doExperiment();
    }

    function updateTheory() {

        let biggest = (base-1).toString(base);
        let largestSample = new BigNumber("".padStart(repeats, biggest), base);
        let largestSampleBinary = largestSample.toString(2).substring(0, 9);
        let totalSamples = largestSample.plus(1);
        let maxBinaryBitsFloor = new BigNumber("".padStart(bitsFloor, "1"), 2);
        let diff = largestSample.minus(maxBinaryBitsFloor);
        let portion = diff.div(totalSamples);
        let ceilPctStr = (portion * 100).toFixed(3);
        let floorPctStr = ((1 - portion) * 100).toFixed(3);
        let sampleSummaryLen = Math.min(3, repeats);
        let sampleSummaryText = "".padStart(sampleSummaryLen, biggest);
        let largestFloorLen = Math.min(3, bitsFloor);
        let largestFloorText = "".padStart(largestFloorLen, "1");

        DOM.theory.repeats.forEach(function(e) { e.textContent = repeats; });
        DOM.theory.base.forEach(function(e) { e.textContent = base; });
        DOM.theory.entropyBits.textContent = bitsPerSample.toFixed(5);
        DOM.theory.entropyBitsFloor.forEach(function(e) { e.textContent = bitsFloor; });
        DOM.theory.entropyBitsFloorPct.textContent = floorPctStr;
        DOM.theory.entropyBitsCeil.forEach(function(e) { e.textContent = bitsCeil; });
        DOM.theory.entropyBitsCeilPct.forEach(function(e) { e.textContent = ceilPctStr; });
        DOM.theory.largestSampleSummary.textContent = sampleSummaryText;
        DOM.theory.largestSampleBinary.textContent = largestSampleBinary;
        DOM.theory.largestSampleRepeater.textContent = biggest;
        DOM.theory.largestPossibleFloor.textContent = largestFloorText;

        if (alignment == "NA") {
            DOM.theory.unevenEntropy.classList.add("hidden");
        }
        else {
            DOM.theory.unevenEntropy.classList.remove("hidden");
        }
    }

    function doExperiment() {

        // generate experimental data

        if (alignment == "NA") {
            DOM.expResults.floor.classList.add("hidden");
        }
        else {
            DOM.expResults.floor.classList.remove("hidden");
        }

        let baseNsamples = [];
        let base10samples = [];
        let base2samples = [];

        for (let i=0; i<samples; i++) {
            // generate samples
            let intStr = getRandomNumber(repeats, base);
            baseNsamples.push(intStr);
            // convert to decimal and binary
            let n = new BigNumber(intStr, base);
            base10samples.push(n.toString(10));
            base2samples.push(n.toString(2).padStart(bitsFloor, '0'));
        }

        // display experimental data

        DOM.expData.samples.value = withLineNumbers(baseNsamples);
        DOM.expData.samplesBase10.value = withLineNumbers(base10samples);
        DOM.expData.samplesBase2.value = withLineNumbers(base2samples);

        // calculate experimental results

        // onesAtBitPos[i] is the number of 1s in bit position i
        // summed for all samples.
        let onesAtBitPos = [];
        // samplesAtBitPos[i] is the number of samples that have
        // a value (ie 0 or 1) at bit position i.
        let samplesAtBitPos = [];
        for (let i=0; i<bitsCeil; i++) {
            onesAtBitPos.push(0);
            samplesAtBitPos.push(0);
        }

        // accumulate the results for each sample
        let ceilSampleCount = 0;
        for (let i=0; i<base2samples.length; i++) {
            let sample = base2samples[i];
            // record if this is a long or a short sample
            if (sample.length == bitsCeil) {
                ceilSampleCount += 1;
            }
            // adjust for bit alignment
            let adjustedSample = adjustForBitAlignment(base2samples[i]);
            for (let j=0; j<adjustedSample.length; j++) {
                // record if this has bit i as a 0 or a 1
                if (adjustedSample[j] == "1") {
                    onesAtBitPos[j] += 1;
                }
                if (adjustedSample[j] != " ") {
                    samplesAtBitPos[j] += 1;
                }
            }
        }

        // calculate stats

        let floorSampleCount = samples - ceilSampleCount;
        let floorSamplePct = (floorSampleCount / samples * 100).toFixed(3);
        let ceilSamplePct = (ceilSampleCount / samples * 100).toFixed(3);

        // display stats

        DOM.expResults.floor.count.textContent = floorSampleCount;
        DOM.expResults.floor.bits.textContent = bitsFloor;
        DOM.expResults.floor.pct.textContent = floorSamplePct;
        DOM.expResults.ceil.count.textContent = ceilSampleCount;
        DOM.expResults.ceil.bits.textContent = bitsCeil;
        DOM.expResults.ceil.pct.textContent = ceilSamplePct;

        // display table for bit frequency

        let portionOfZerosAtBitPos = []; // proportion of bits that are 1

        DOM.expResults.table.innerHTML = "";
        for (let i=0; i<onesAtBitPos.length; i++) {
            // row
            let row = document.createElement("tr");
            DOM.expResults.table.appendChild(row);
            // bit#
            let bitNel = document.createElement("td");
            bitNel.textContent = i+1;
            row.appendChild(bitNel);
            // 0s
            let thisBitSamples = samplesAtBitPos[i];
            let zeros = thisBitSamples - onesAtBitPos[i];
            let zerosEl = document.createElement("td");
            zerosEl.textContent = zeros;
            row.appendChild(zerosEl);
            // 1s
            let ones = onesAtBitPos[i];
            let onesEl = document.createElement("td");
            onesEl.textContent = ones;
            row.appendChild(onesEl);
            // %0s
            let zerosPortion = zeros / thisBitSamples;
            let zerosPct = (zerosPortion * 100).toFixed(3);
            portionOfZerosAtBitPos.push(zerosPortion)
            let zerosPctEl = document.createElement("td");
            zerosPctEl.textContent = zerosPct;
            row.appendChild(zerosPctEl);
        }

        // display chart

        if (chart != null) {
            chart.destroy();
        }
        let params = {
            //title: "Portion of ones",
            type: "bar",
            data: {
                labels: "".padStart(onesAtBitPos.length-1, " ").split(" "),
                datasets: [{
                    backgroundColor: "#3354b5",
                    borderColor: "#3354b5",
                    data: portionOfZerosAtBitPos.map(function(v) { return v * 100;}),
                }],
            },
            options: {
                legend: {
                    display: false,
                },
                title: {
                    display: true,
                    text: "Portion of 0s at each bit position",
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            min: 0,
                            max: 100,
                        },
                    }],
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            let i = tooltipItem.index + 1;
                            let t = tooltipItem.yLabel;
                            return "bit #" + i + ": " + t.toFixed(1) + "%";
                        },
                    },
                },
            },
        };
        let ctx = document.getElementById("frequencies").getContext("2d");
        chart = new Chart(ctx, params);

    }

    let isScrolling = false;
    let scrollDebounce = null;
    function syncScroll(e) {
        isScrolling = true;
        if (scrollDebounce != null) {
            clearTimeout(scrollDebounce);
        }
        scrollDebounce = setTimeout(function() {
            isScolling = false;
            updateScroll(e);
        }, 100);
    }

    function updateScroll(e) {
        let pos = e.target.scrollTop;
        DOM.expData.samples.scrollTo(0, pos);
        DOM.expData.samplesBase10.scrollTo(0, pos);
        DOM.expData.samplesBase2.scrollTo(0, pos);
    }

    parseUserValues();

})();
