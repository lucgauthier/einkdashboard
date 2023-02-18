const ical = require('node-ical');
const cache = require('memory-cache');
const config = require('../utils/config');
const datetime = require('../utils/datetime');
var logger = require('../utils/logger');

const apiCacheDurationMs = 1000 * 15;

async function getApiEvents() {
    const cacheKey = `events`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
        logger.info('Event API data retrieved from cache');
        return cachedData;
    }

    const events = await ical.async.fromURL(config.ICAL_URL);
    cache.put(cacheKey, events, apiCacheDurationMs);

    logger.info('Event API data retrieved from url');
    return events;
}

async function getEvents() {
    const apiEvents = await getApiEvents();
    const events = [];

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

