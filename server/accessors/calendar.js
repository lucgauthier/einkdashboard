const { addDays, getWeekDay } = require('../utils/datetime');

function getCalendar(date) {

    const weekDay = getWeekDay(date);

    const totalDays = 14;
    const pastDays = weekDay - 1;
    const futureDays = totalDays - weekDay;

    const days = [];

    // past
    for (var i=pastDays; i>0; i--) {
        days.push({ past: true, today: false, future: false, date: addDays(date, -1 * i) });
    }

    // present
    days.push({ past: false, today: true, future: false, date: date });

    // future
    for (var i=1; i<=futureDays; i++) {
        days.push({ past: false, today: false, future: true, date: addDays(date, i) });
    }

    // split days in weeks
    const weeks = [];
    for (var i=0; i<totalDays / 7; i++) {
        weeks.push(days.slice(7*i, 7*(i+1)));
    }

    const calendar = {
        today: {
            date: date,
            weekDay: getWeekDay(date)
        },
        weekDays: [
            { weekDay: 1, weekend: false },
            { weekDay: 2, weekend: false },
            { weekDay: 3, weekend: false },
            { weekDay: 4, weekend: false },
            { weekDay: 5, weekend: false },
            { weekDay: 6, weekend: true },
            { weekDay: 7, weekend: true }
        ],
        weeks: weeks
    };

    return calendar;
}

module.exports = getCalendar;