const path = require('path');

const envFilePath = path.join(__dirname, '..', '.ENV');

// load the .ENV file when NODE_ENV is not production
// PROD env must supply environment variables
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({
        debug: true,
        path: envFilePath
    });
}

module.exports = {
    OPENWEATHER_APIKEY: process.env.OPENWEATHER_APIKEY,
    PIRATEWEATHER_APIKEY: process.env.PIRATEWEATHER_APIKEY,
    WEATHER_BYPASS_TODAY_CHECK: process.env.WEATHER_BYPASS_TODAY_CHECK == 'true',
    WEATHER_AM_HOUR: process.env.WEATHER_AM_HOUR || 8,
    WEATHER_PM_HOUR: process.env.WEATHER_PM_HOUR || 14,
    WEATHER_CACHE_DURATION_MINUTES: process.env.WEATHER_CACHE_DURATION_MINUTES || 120,
    LAT: process.env.LAT || 46.85,
    LON: process.env.LON || -71.38,
    TODAY_QUOTE: process.env.TODAY_QUOTE || 'Ici',
    ICAL_URL: process.env.ICAL_URL || null
};