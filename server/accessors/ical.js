const ical = require('node-ical');
const cache = require('memory-cache');
const datetime = require('../utils/datetime');
var logger = require('../utils/logger');

const apiCacheDurationMs = 1000 * 15;

async function getApiEvents(icalUrl) {
    const cacheKey = `events-${icalUrl}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
        logger.info('Event API data retrieved from cache');
        return cachedData;
    }

    const events = await ical.async.fromURL(icalUrl);
    cache.put(cacheKey, events, apiCacheDurationMs);

    logger.info('Event API data retrieved from url');
    return events;
}

async function getEvents(icalUrl, dateFrom, dateTo) {
    const events = [];

    if (!icalUrl) {
        return events;
    }

    const apiEvents = await getApiEvents(icalUrl);

    for (let k in apiEvents) {
        if (apiEvents.hasOwnProperty(k)) {
            const ev = apiEvents[k];
            if (ev.type == 'VEVENT') {
                getEventOccurrences(ev, dateFrom, dateTo).forEach(occurrence => {
                    const event = {
                        date: datetime.jsDateToDate(occurrence.start),
                        title: occurrence.summary
                    };

                    if (occurrence.datetype === 'date-time') {
                        event.start = datetime.jsDateToDate(occurrence.start);
                        event.end = datetime.jsDateToDate(occurrence.end);
                    }

                    if (isWithinDateRange(event.date, dateFrom, dateTo)) {
                        events.push(event);
                    }
                });
            }
        }
    }

    return events;
}

function getEventOccurrences(event, dateFrom, dateTo) {
    if (!event.rrule || !dateFrom || !dateTo) {
        return [event];
    }

    const rangeStart = new Date(dateFrom.year, dateFrom.month - 1, dateFrom.day);
    const rangeEnd = new Date(dateTo.year, dateTo.month - 1, dateTo.day, 23, 59, 59, 999);
    const duration = event.end.getTime() - event.start.getTime();

    return event.rrule.between(rangeStart, rangeEnd, true)
        .filter(start => !isExcludedOccurrence(event, start))
        .map(start => getOccurrenceEvent(event, start, duration));
}

function isExcludedOccurrence(event, start) {
    const recurrenceKey = start.toISOString().slice(0, 10);
    return event.exdate && event.exdate[recurrenceKey] && !event.recurrences?.[recurrenceKey];
}

function getOccurrenceEvent(event, start, duration) {
    const recurrenceKey = start.toISOString().slice(0, 10);
    const override = event.recurrences?.[recurrenceKey];

    if (override) {
        return override;
    }

    return {
        ...event,
        start: start,
        end: new Date(start.getTime() + duration)
    };
}

function isWithinDateRange(date, dateFrom, dateTo) {
    if (dateFrom && compareDates(date, dateFrom) < 0) {
        return false;
    }

    if (dateTo && compareDates(date, dateTo) > 0) {
        return false;
    }

    return true;
}

function compareDates(a, b) {
    return (a.year - b.year) || (a.month - b.month) || (a.day - b.day);
}

module.exports = getEvents;

