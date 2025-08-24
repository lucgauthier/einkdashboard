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

async function getEvents(icalUrl) {
    const events = [];

    if (!icalUrl) {
        return events;
    }

    const apiEvents = await getApiEvents(icalUrl);

    for (let k in apiEvents) {
        if (apiEvents.hasOwnProperty(k)) {
            const ev = apiEvents[k];
            if (ev.type == 'VEVENT') {
                events.push({
                    date: datetime.jsDateToDate(ev.start),
                    title: ev.summary
                });
            }
        }
    }

    return events;
}

module.exports = getEvents;

