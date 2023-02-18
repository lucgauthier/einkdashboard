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
    PIRATEWEATHER_APIKEY: process.env.PIRATEWEATHER_APIKEY,
    WEATHER_AM_HOUR: parseInt(process.env.WEATHER_AM_HOUR || 8),
    WEATHER_PM_HOUR: parseInt(process.env.WEATHER_PM_HOUR || 14),
    WEATHER_CACHE_DURATION_MINUTES: process.env.WEATHER_CACHE_DURATION_MINUTES || 120,
    LAT: process.env.LAT || 46.85,
    LON: process.env.LON || -71.38,
    ICAL_URL: process.env.ICAL_URL || null,
    PORT: process.env.PORT || 8080,
};