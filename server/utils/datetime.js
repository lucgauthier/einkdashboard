const moment = require('moment');

function addDays(date, days) {
    const jsDate = new Date(date.year, date.month - 1, date.day);
    jsDate.setDate(jsDate.getDate() + days);
    return { year: jsDate.getFullYear(), month: jsDate.getMonth() + 1, day: jsDate.getDate() };
}

function getWeekDay(date) {
    const jsDate = new Date(date.year, date.month - 1, date.day);
    const weekday = jsDate.getDay();
    return (weekday == 0) ? 7 : weekday;
}

function dateEquals(a, b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
}

function jsDateToDate(jsDate) {
    return { year: jsDate.getFullYear(), month: jsDate.getMonth() + 1, day: jsDate.getDate(), hours: jsDate.getHours() };
}

function getSecondsToMidnight() {
    const now = moment();
    const midnight = moment().add(1, 'days').hours(0).minutes(0).seconds(0);

    const duration = moment.duration(midnight.diff(now));

    return Math.round(duration.asSeconds());
}

function getSecondsToNextTime(hours, minutes, seconds) {
    const oneDayAsSeconds = 60 * 60 * 24;

    const now = moment();
    const timeTomorrow = moment().add(1, 'days').hours(hours).minutes(minutes).seconds(seconds);

    const duration = moment.duration(timeTomorrow.diff(now));
    const durationAsSeconds = duration.asSeconds();

    // if next time is today, return today, not tomorrow
    return Math.round(durationAsSeconds % oneDayAsSeconds);
}

module.exports = {
    addDays: addDays,
    getWeekDay: getWeekDay,
    dateEquals: dateEquals,
    jsDateToDate: jsDateToDate,
    getSecondsToMidnight: getSecondsToMidnight,
    getSecondsToNextTime: getSecondsToNextTime
}