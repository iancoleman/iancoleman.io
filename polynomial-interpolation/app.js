let points = [];
let randPoints = [];
let mousePoint = [];
let chart = document.getElementById("chart");
let kplusplus = document.querySelectorAll(".kplusplus");
let ctx = chart.getContext("2d");
let margin = 10; // do not put random points within margin/2 px of the edge
let coeffs = [];
let liveUpdate = true;

function toggleLiveUpdate(e) {
    liveUpdate = !liveUpdate;
    if (liveUpdate) {
        chartMove(e);
    }
}

function genPoints() {
    points = [];
    randPoints = [];
    // points is a list of [x,y] coordinates
    let w = chart.width;
    let h = chart.height;
    let k = parseInt(document.getElementById("k").value);
    kplusplus.forEach((e) => { e.textContent = k+1; });
    for (let i=0; i<k; i++) {
        randPoints.push([
            Math.round(Math.random() * (w-margin) + margin/2),
            Math.round(Math.random() * (h-margin) + margin/2),
        ]);
    }
    if (mousePoint.length == 0) {
        mousePoint = [Math.round(w/2), Math.round(h/2)];
    }
    points = randPoints.concat([mousePoint]);
    points.sort(function(a, b) {
        return a[0] - b[0];
    });
    coeffs = interpolate();
    drawChart();
}

function evalPoly(x, coeffs) {
    let y = 0;
    for (let i=0; i<coeffs.length; i++) {
        y = y + coeffs[i] * Math.pow(x, i);
    }
    // canvas 0 0 is top left, but curve 0 0 is bottom left, so negate y
    return y;
}

function chartMove(e) {
    if (!liveUpdate) {
        return;
    }
    let x = e.offsetX;
    let y = chart.width - e.offsetY;
    mousePoint = [x, y];
    points = randPoints.concat([mousePoint]);
    points.sort(function(a, b) {
        return a[0] - b[0];
    });
    coeffs = interpolate();
    drawChart();
}

function clearCanvas() {
    ctx.clearRect(0, 0, chart.width, chart.height);
}

function interpolate() {
    // from blsttc poly compute_interpolation
    if (points.length == 0) {
        return [];
    }
    let poly = [points[0][1]]
    let minusS0 = -points[0][0];
    let base = [minusS0, 1];
    for (let i=1; i<points.length; i++) {
        let p = points[i];
        let x = p[0];
        let y = p[1];
        let diff = y;
        let polyX = evalPoly(x, poly);
        diff = diff - polyX;
        let base_val = evalPoly(x, base);
        diff = diff / base_val;
        base = poly_mul_val(base, diff);
        poly = poly_add_poly(poly, base);
        let minusX = -x;
        base = poly_mul_poly(base, [minusX, 1]);
    }
    return poly;
}

function poly_add_poly(a, b) {
    while (b.length > a.length) {
        a.push(0);
    }
    for (let i=0; i<b.length; i++) {
        a[i] = a[i] + b[i];
    }
    return a;
}

function poly_mul_val(a, b) {
    let poly = [];
    for (let i=0; i<a.length; i++) {
        poly.push(a[i] * b);
    }
    return poly;
}

function poly_mul_poly(a, b) {
    if (b == []) {
        return [];
    }
    let ncoeffs = a.length + b.length - 1;
    let poly = [];
    for (let i=0; i<ncoeffs; i++) {
        poly.push(0);
    }
    let tmp = 0;
    for (let i=0; i<a.length; i++) {
        let ca = a[i];
        for (let j=0; j<b.length; j++) {
            let cb = b[j];
            tmp = ca;
            tmp = tmp * cb;
            poly[i + j] = poly[i + j] + tmp;
        }
    }
    return poly;
}

function tidyFloatStr(f, precision) {
    let s = f.toFixed(0);
    if (parseFloat(s) != 0) {
        return s;
    }
    s = f.toFixed(precision);
    return s;
}

function drawChart() {
    clearCanvas();
    // draw points
    for (let i=0; i<points.length; i++) {
        ctx.beginPath();
        let x = points[i][0];
        let y = points[i][1];
        ctx.arc(x, chart.height-y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    }
    // draw curve
    ctx.beginPath();
    let x = 0;
    let y = evalPoly(x, coeffs);
    ctx.moveTo(x, y);
    for (let x=0; x<500; x++) {
        y = evalPoly(x, coeffs);
        ctx.lineTo(x, chart.height-y);
    }
    ctx.stroke();
    // update polynomial text
    let poly = document.getElementById("poly");
    poly.innerHTML = "";
    let polyHtml = "";
    for (let i=0; i<coeffs.length; i++) {
        let cStr = coeffs[i].toString();
        polyHtml += cStr + "x<sup>" + i + "</sup>"
        if (i != coeffs.length - 1) {
            polyHtml += " + ";
        }
    }
    poly.innerHTML = polyHtml;
    // update points text
    pointsEl = document.getElementById("points");
    pointsEl.innerHTML = "";
    let pointsHtml = "";
    for (let i=0; i<points.length; i++) {
        let x = points[i][0];
        let y = points[i][1];
        pointsHtml += "<div>(" + x + "," + y + ")";
        if (x == mousePoint[0] && y == mousePoint[1]) {
            pointsHtml += " cursor";
        }
        pointsHtml += "</div>";
    }
    pointsEl.innerHTML = pointsHtml;
    // update point value
    updatey();
}

function updatey() {
    let xVal = parseFloat(document.getElementById("x").value);
    let yVal = evalPoly(xVal, coeffs);
    document.getElementById("y").textContent = yVal;
}

document.getElementById("k").addEventListener("change", genPoints);
document.getElementById("generate").addEventListener("click", genPoints);
document.getElementById("chart").addEventListener("mousemove", chartMove);
document.getElementById("chart").addEventListener("click", toggleLiveUpdate);
document.getElementById("x").addEventListener("input", updatey);

genPoints();
