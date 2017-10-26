(function() {

    var DOM = getEls();

    // default calculation and string comes from input
    for (var selector in DOM) {
        (function(s) {
            if ("input" in DOM[s] && DOM[s].input.length > 0) {
                DOM[s].calculation = function() {
                    return parseFloatNoNan(DOM[s].input.val());
                }
            }
            DOM[s].string = function() {
                return DOM[s].calculation();
            }
        })(selector);
    }

    DOM["groupsize-average"].calculation = function() {
        var min = parseFloatNoNan(DOM["groupsize-minimum"].input.val());
        var max = parseFloatNoNan(DOM["groupsize-maximum"].input.val());
        return Math.ceil((min+max)/2);
    }

    DOM["networksize"].calculation = function() {
        var networksize = parseFloatNoNan(DOM["networksize"].input.val());
        return networksize * 1000;
    }

    DOM["groupcount"].calculation = function() {
        var networksize = DOM["networksize"].calculation();
        var groupsizeAvg = DOM["groupsize-average"].calculation();
        return Math.ceil(networksize/groupsizeAvg);
    }

    DOM["quorumsize-average"].calculation = function() {
        var groupsizeAvg = DOM["groupsize-average"].calculation();
        var quorumratio = DOM["quorumratio"].calculation();
        return Math.floor(groupsizeAvg * quorumratio) + 1;
    }

    DOM["quorumsize-minimum"].calculation = function() {
        var groupsizeMin = DOM["groupsize-minimum"].calculation();
        var quorumratio = DOM["quorumratio"].calculation();
        return Math.floor(groupsizeMin * quorumratio) + 1;
    }

    DOM["joinchance-worstcase"].calculation = function() {
        var groupcount = DOM["groupcount"].calculation();
        var quorumsizeMin = DOM["quorumsize-minimum"].calculation();
        return Math.pow(1/groupcount, quorumsizeMin);
    }

    DOM["events-worstcase"].calculation = function() {
        var groupcount = DOM["groupcount"].calculation();
        var quorumsizeMin = DOM["quorumsize-minimum"].calculation();
        return Math.pow(groupcount, quorumsizeMin);
    }

    DOM["millennia-worstcase"].calculation = function() {
        var eventsWorstcase = DOM["events-worstcase"].calculation();
        var attackrate = DOM["attackrate"].calculation();
        var totalAttacks = attackrate * (60 * 60 * 24 * 365 * 1000);
        return eventsWorstcase / totalAttacks;
    }

    DOM["joinchance-average"].calculation = function() {
        var groupcount = DOM["groupcount"].calculation();
        var quorumsizeAvg = DOM["quorumsize-average"].calculation();
        return Math.pow(1/groupcount, quorumsizeAvg);
    }

    DOM["events-average"].calculation = function() {
        var groupcount = DOM["groupcount"].calculation();
        var quorumsizeAvg = DOM["quorumsize-average"].calculation();
        return Math.pow(groupcount, quorumsizeAvg);
    }

    DOM["millennia-average"].calculation = function() {
        var eventsAvg = DOM["events-average"].calculation();
        var attackrate = DOM["attackrate"].calculation();
        var totalAttacks = attackrate * 60 * 60 * 24 * 365 * 1000;
        return eventsAvg / totalAttacks;
    }

    DOM["total-chance-of-control"].calculation = function() {
        return parseFloatNoNan(DOM["total-chance-of-control"].input.val()) / 100;
    }

    DOM["total-chance-of-control"].string = function() {
        return DOM["total-chance-of-control"].input.val();
    }

    DOM["vault-chance-of-control"].calculation = function() {
        var totalChanceOfControl = DOM["total-chance-of-control"].calculation();
        var quorumsizeAdjusted = DOM["quorumsize-adjusted"].calculation();
        var exponent = Math.log(totalChanceOfControl) / quorumsizeAdjusted;
        return Math.pow(Math.E, exponent);
    }

    DOM["vault-chance-of-control"].string = function() {
        // number of decimals depends on number of decimals in total-chance-of-control
        var precision = 3;
        var totalStr = DOM["total-chance-of-control"].string();
        var totalBits = totalStr.split(".");
        if (totalBits.length > 1) {
            precision = totalBits[1].length + 3;
        }
        var percent = DOM["vault-chance-of-control"].calculation() * 100;
        return percent.toFixed(precision);
    }

    DOM["quorumsize-adjusted"].calculation = function() {
        var quorumsizeAvg = DOM["quorumsize-average"].calculation();
        return quorumsizeAvg - 1;
    }

    DOM["vault-joins-to-control"].calculation = function() {
        var vaultChanceOfControl = DOM["vault-chance-of-control"].calculation();
        var groupcount = DOM["groupcount"].calculation();
        var joins = Math.log(1 - vaultChanceOfControl) / Math.log(1 - 1 / groupcount);
        return Math.ceil(joins);
    }

    DOM["total-nonconsecutive-joins-to-control"].calculation = function() {
        var vaultJoinsToControl = DOM["vault-joins-to-control"].calculation();
        var quorumsizeAdjusted = DOM["quorumsize-adjusted"].calculation();
        return Math.ceil(vaultJoinsToControl * quorumsizeAdjusted);
    }

    DOM["total-nonconsecutive-time-to-control"].calculation = function() {
        var totalNonconsecutiveJoinsToControl = DOM["total-nonconsecutive-joins-to-control"].calculation();
        var attackrate = DOM["attackrate"].calculation();
        var totalAttacks = attackrate * 60 * 60 * 24;
        return totalNonconsecutiveJoinsToControl / totalAttacks;
    }

    DOM["total-nonconsecutive-time-to-control"].string = function() {
        return DOM["total-nonconsecutive-time-to-control"].calculation().toFixed(3);
    }

    DOM["interrupt-relocate-rate"].calculation = function() {
        var networksize = DOM["networksize"].calculation();
        var relocateDays = DOM["interrupt-relocate-days"].calculation();
        return Math.ceil(networksize / relocateDays);
    }

    DOM["interrupts-per-day"].calculation = function() {
        var joinRate = DOM["interrupt-join-rate"].calculation();
        var leaveRate = DOM["interrupt-leave-rate"].calculation();
        var relocateRate = DOM["interrupt-relocate-rate"].calculation();
        return joinRate + leaveRate + relocateRate;
    }

    DOM["seconds-per-interrupt"].calculation = function() {
        var interruptsPerDay = DOM["interrupts-per-day"].calculation();
        return (60 * 60 * 24) / interruptsPerDay;
    }

    DOM["seconds-per-interrupt"].string = function() {
        return DOM["seconds-per-interrupt"].calculation().toFixed(1);
    }

    DOM["interruption-count-during-attack"].calculation = function() {
        var totalNonconsecutiveJoinsToControl = DOM["total-nonconsecutive-time-to-control"].calculation();
        var secondsPerInterrupt = DOM["seconds-per-interrupt"].calculation();
        return totalNonconsecutiveJoinsToControl * (60 * 60 * 24) / secondsPerInterrupt;
    }

    DOM["interruption-count-during-attack"].string = function() {
        return DOM["interruption-count-during-attack"].calculation().toFixed(2);
    }

    DOM["chance-of-attack-interruption"].calculation = function() {
        var groupcount = DOM["groupcount"].calculation();
        var interruptionCountDuringAttack = DOM["interruption-count-during-attack"].calculation();
        return 1-Math.pow((1-1/groupcount), interruptionCountDuringAttack);
    }

    DOM["chance-of-attack-interruption"].string = function() {
        var chance = DOM["chance-of-attack-interruption"].calculation() * 100;
        var chanceStr = chance.toFixed(3);
        if (chance > 99.999) {
            chanceStr = "greater than 99.999"
        }
        return chanceStr;
    }

    for (var selector in DOM) {
        (function(s) {
            if (!("calculation" in DOM[s])) {
                console.log("No calculation for selector: " + s);
            }
        })(selector);
    }

    function parseFloatNoNan(s) {
        // TODO
        return parseFloat(s);
    }

    function recalculate() {
        // update display with newly input values
        for (var selector in DOM) {
            var value = DOM[selector].string();
            DOM[selector].spans.text(value);
        }
    }

    function getEls() {
        var DOM = {};
        // get all elements with data-calculate property
        var els = $("[data-calculate]");
        for (var i=0; i<els.length; i++) {
            var el = $(els[i]);
            // group elements by their property value
            var selector = el.attr("data-calculate");
            if (!(selector in DOM)) {
                DOM[selector] = {
                    input: $("input[data-calculate='" + selector + "']"),
                    spans: $("span[data-calculate='" + selector + "']"),
                }
            }
            // set events
            if (el.is("input")) {
                el.on("input", recalculate);
            }
        }
        return DOM;
    }

    recalculate();

})();
