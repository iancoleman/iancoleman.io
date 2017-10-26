consts = {};

consts.secondsPerDay = 60*60*24;
consts.daysPerYear = 365;
consts.monthsPerYear = 12;

consts.secondsPerYear = consts.secondsPerDay * consts.daysPerYear;
consts.daysPerMonth = consts.daysPerYear / consts.monthsPerYear;
consts.secondsPerMonth = consts.secondsPerDay * consts.daysPerMonth;
