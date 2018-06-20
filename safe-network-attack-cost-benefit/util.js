function tidyNum(n) {
    if (n < 1000) {
        return n;
    }
    if (n < 1000000) {
        return n / 1000 + "K";
    }
    if (n < 1000000000) {
        return Math.round(n / 1000) / 1000 + "M";
    }
    return n;
}
