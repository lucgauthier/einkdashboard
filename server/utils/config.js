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
    WEATHER_CACHE_DURATION_MINUTES: process.env.WEATHER_CACHE_DURATION_MINUTES || 120,
    PORT: process.env.PORT || 8080,
};