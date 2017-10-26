test = function() {
    // Helpers
    var tests = 0;
    var failures = 0;
    function test(name, cond) { if(!cond) { fail(name) } tests++ }
    function fail(name) { console.log("FAIL: " + name); failures++; }
    // TESTS:
    // NO TESTS YET
    // Log results
    console.log(tests + " tests complete, " + failures + " failures");
};
