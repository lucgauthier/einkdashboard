const axios = require('axios');
const cache = require('memory-cache');
const { addDays, dateEquals } = require('../utils/datetime');
const config = require('../utils/config');
var logger = require('../utils/logger');

const apiCacheDurationMs = config.WEATHER_CACHE_DURATION_MINUTES * 1000 * 60;
const amHour = config.WEATHER_AM_HOUR;
const pmHour = config.WEATHER_PM_HOUR;
const bypassTodayCheck = config.WEATHER_BYPASS_TODAY_CHECK; // false in PROD
const apiKey = config.OPENWEATHER_APIKEY;

async function getApiResult(coord) {
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${coord.lat}&lon=${coord.lon}&exclude=minutely,alerts&units=metric&appid=${apiKey}`;

    const cachedData = cache.get(url);
    if (cachedData) {
        logger.info('Weather API data retrieved from cache');
        return cachedData;
    }

    const response = await axios.get(url);

    if (response.status != 200) {
        logger.error('Weather API data could not be retrieved from openweathermap.org');
        throw Error('Weather API error');
    }
    
    logger.info('Weather API data retrieved from openweathermap.org');
    
    const data = response.data;
    cache.put(url, data, apiCacheDurationMs);

    return data;
}

function convertDailyWeather(daily) {
    return {
        min: Math.round(daily.temp.min),
        max: Math.round(daily.temp.max),
        icon: { set: 1, ref: daily.weather[0].icon },
        uvi: daily.uvi, // Max UV index for the day
        pop: daily.pop, // Probability of Precipitation
        rain: daily.rain || null, // Rain precip. in mm
        snow: daily.snow || null, // Snow precip. in mm
    };
}

async function getWeather(date, coord) {
    const result = await getApiResult(coord);
    
    const weather = {
        today: {
            am: null,
            pm: null,
            icon: null,
            weather: null
        },
        days: []
    }

    // we have today's icon if the result is for the appropriate date
    if (dateEquals(date, unixDateToDate(result.current.dt)) || bypassTodayCheck) {
        weather.today.icon = { set: 1, ref: result.current.weather.icon };
    }
    
    const amResult = result.hourly.find(hourly => {
        const hourDate = unixDateToDate(hourly.dt);
        return dateEquals(date, hourDate) && hourDate.hours == amHour;
    });
    const pmResult = result.hourly.find(hourly => {
        const hourDate = unixDateToDate(hourly.dt);
        return dateEquals(date, hourDate) && hourDate.hours == pmHour;
    });

    if (amResult) {
        weather.today.am = {
            temp: Math.round(amResult.temp),
            icon: { set: 1, ref: amResult.weather[0].icon },
            pop: amResult.pop,
            rain: amResult.rain,
            snow: amResult.snow
        }
    }

    if (pmResult) {
        weather.today.pm = {
            temp: Math.round(pmResult.temp),
            icon: { set: 1, ref: pmResult.weather[0].icon }
        }
    }

    const today = result.daily.find(daily => dateEquals(date, unixDateToDate(daily.dt)));
    if (today) {
        weather.today.weather = convertDailyWeather(today);
    }

    const totalDays = 14;

    for (var i=0; i<totalDays; i++) {
        const daily = result.daily.find(daily => dateEquals(addDays(date, i), unixDateToDate(daily.dt)));
        if (!daily) break;

        weather.days.push({
            date: unixDateToDate(daily.dt),
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

/*
// Code to download icons from openweathermap.org
const iconNames = [
    '01',
    '02',
    '03',
    '04',
    '09',
    '10',
    '11',
    '13',
    '50'
];
const variations = [
    'https://openweathermap.org/img/wn/$d.png',
    'https://openweathermap.org/img/wn/$d@4x.png',
    'https://openweathermap.org/img/wn/$n.png',
    'https://openweathermap.org/img/wn/$n@4x.png'
];
iconNames.forEach(iconName => {
    variations.forEach(variation => {
        const url = variation.replace('$', iconName);
        const filename = url.split('/').pop();
        const localPath = path.join(__dirname, '..', 'template', 'icons', filename);

        if (!fs.existsSync(localPath)) {
            request.get(url).pipe(fs.createWriteStream(localPath));
        }
    });
});
*/