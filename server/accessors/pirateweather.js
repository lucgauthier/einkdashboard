const axios = require('axios');
const cache = require('memory-cache');
const { addDays, dateEquals } = require('../utils/datetime');
const config = require('../utils/config');
var logger = require('../utils/logger');

const apiCacheDurationMs = config.WEATHER_CACHE_DURATION_MINUTES * 1000 * 60;
const amHour = config.WEATHER_AM_HOUR;
const pmHour = config.WEATHER_PM_HOUR;
const apiKey = config.PIRATEWEATHER_APIKEY;

async function getApiResult(date, coord) {
    const time = `${date.year}-${digitToPaddedString(date.month)}-${digitToPaddedString(date.day)}T06:30:00`;
    const url = `https://api.pirateweather.net/forecast/${apiKey}/${coord.lat},${coord.lon}?exclude=alerts&units=ca&time=${time}`;
    
    const cachedData = cache.get(url);
    if (cachedData) {
        logger.info('Weather API data retrieved from cache');
        return cachedData;
    }

    const response = await axios.get(url);

    if (response.status != 200) {
        logger.error('Weather API data could not be retrieved from pirateweather.net');
        throw Error('Weather API error');
    }
    
    logger.info('Weather API data retrieved from pirateweather.net');
    
    const data = response.data;
    cache.put(url, data, apiCacheDurationMs);

    return data;
}

function digitToPaddedString(num) {
    if (num > 9) return '' + num;
    return '0' + num;
}

function convertDailyWeather(daily) {
    return {
        min: Math.round(daily.temperatureLow),
        max: Math.round(daily.temperatureHigh),
        icon: { set: 2, ref: daily.icon },
        uvi: daily.uvIndex, // Max UV index for the day
        pop: daily.precipProbability, // Probability of Precipitation
        rain: daily.precipType == "rain" ? daily.precipAccumulation * 10 : null, // Rain precip. in mm
        snow: daily.precipType == "snow" ? daily.precipAccumulation * 10 : null, // Snow precip. in mm
    };
}

async function getWeather(date, coord) {
    const result = await getApiResult(date, coord);
    
    const weather = {
        today: {
            am: null,
            pm: null,
            icon: null,
            weather: null
        },
        days: []
    }

    weather.today.icon = { set: 2, ref: result.daily.icon };
    
    const amResult = result.hourly.data.find(hourly => {
        const hourDate = unixDateToDate(hourly.time);
        return dateEquals(date, hourDate) && hourDate.hours == amHour;
    });
    const pmResult = result.hourly.data.find(hourly => {
        const hourDate = unixDateToDate(hourly.time);
        return dateEquals(date, hourDate) && hourDate.hours == pmHour;
    });
    
    if (amResult) {
        weather.today.am = {
            temp: Math.round(amResult.temperature),
            icon: { set: 2, ref: amResult.icon },
            pop: amResult.precipProbability,
            rain: amResult.precipType == "rain" ? amResult.precipAccumulation * 10 : null, // mm
            snow: amResult.precipType == "snow" ? amResult.precipAccumulation * 10 : null, // mm
            hour: config.WEATHER_AM_HOUR
        }
    }

    if (pmResult) {
        weather.today.pm = {
            temp: Math.round(pmResult.temperature),
            icon: { set: 2, ref: pmResult.icon },
            pop: pmResult.precipProbability,
            rain: pmResult.precipType == "rain" ? pmResult.precipAccumulation * 10 : null, // mm 
            snow: pmResult.precipType == "snow" ? pmResult.precipAccumulation * 10 : null, // mm
            hour: config.WEATHER_PM_HOUR
        }
    }

    const tomorrow = addDays(date, 1);
    weather.hourly = result.hourly.data.filter(hourly => {
        const hourDate = unixDateToDate(hourly.time);
        return (dateEquals(date, hourDate) && hourDate.hours >= 7 && hourDate.hours <= 23)
            || (dateEquals(tomorrow, hourDate) && hourDate.hours == 0);
    }).map(hourly => {
        const hourDate = unixDateToDate(hourly.time);
        return {
            hour: hourDate.hours || 24, // change 0 to 24
            temp: Math.round(hourly.temperature),
            precip: hourly.precipAccumulation * 10 || 0,
            pop: pmResult.precipProbability
        };
    });

    const today = result.daily.data.find(daily => dateEquals(date, unixDateToDate(daily.time)));
    if (today) {
        weather.today.weather = convertDailyWeather(today);
    }

    const totalDays = 14;

    for (var i=0; i<totalDays; i++) {
        const daily = result.daily.data.find(daily => dateEquals(addDays(date, i), unixDateToDate(daily.time)));
        if (!daily) break;

        weather.days.push({
            date: unixDateToDate(daily.time),
            weather: convertDailyWeather(daily)
        });
    }
    
    return weather;
}

module.exports = getWeather;

function unixDateToDate(unixTimestamp) {  
    const jsDate = new Date(unixTimestamp * 1000);
    return { year: jsDate.getFullYear(), month: jsDate.getMonth() + 1, day: jsDate.getDate(), hours: jsDate.getHours() };
}
