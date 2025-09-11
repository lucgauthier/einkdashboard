var cron = require('node-cron');

const {
    config,
    datetime,
    htmlTemplate,
    logger,
} = require('../utils');

const { 
    calendarAccessor, 
    icalAccessor,
    pirateweatherAccessor,
    templateAccessor,
    settingsAccessor
} = require('../accessors');


const generateImage = async function(key) {
    const settings = settingsAccessor.getDashboardSettings(key);
    if (!settings) {
        console.warn(`Dashboard settings for key "${key}" not valid. Skipping image generation.`);
        return;
    }

    const templateData = await getTemplateData(calendarAccessor, pirateweatherAccessor, icalAccessor, settings);
    const html = await templateAccessor.getTemplate();
    const outputBmpImagePath = `./data/dashboards/${key}/output/image.bmp`;
    await htmlTemplate.ToBmpFile(html, templateData, outputBmpImagePath);
};

const generatePage = async function(key) {
    const settings = settingsAccessor.getDashboardSettings(key);
    if (!settings) {
        console.warn(`Dashboard settings for key "${key}" not valid. Skipping image generation.`);
        return;
    }
    
    const outputHtmlPath = `./data/dashboards/${key}/output/index.html`;
    const templateData = await getTemplateData(calendarAccessor, pirateweatherAccessor, icalAccessor, settings);
    const compiledTemplate = await templateAccessor.getCompiledTemplate(templateData);
    await htmlTemplate.ToHtmlFile(compiledTemplate, templateData, outputHtmlPath);
};


// Available methods
module.exports = {
    // called at server startup
    scheduleGeneration: async function() {
        const dashboards = settingsAccessor.getDashboardSettingsMap();
        Object.entries(dashboards).forEach(settings => {
            const key = settings[1];
            logger.info(`${key}: Scheduling dashboard generation`);
            
            const dashboardSettings = settingsAccessor.getDashboardSettings(key);
            if (!dashboardSettings) {
                console.warn(`Dashboard settings for key "${key}" not valid. Skipping.`);
                return;
            }
            const cronTime = dashboardSettings.cronTime || '0 45 0-7,21-23 * * *'; // Default: 21:45 to 7:45
            const timezone = dashboardSettings.timezone || 'America/Toronto'; // Default timezone

            cron.schedule(cronTime, async () => {
                logger.info('Job run started ' + new Date().toLocaleString());

                await generatePage(key);
                await generateImage(key);

                logger.info('Job run completed ' + new Date().toLocaleString());
            }, {
                name: 'Daily dashboard generation for ' + key,
                runOnInit: true, 
                timezone: timezone
            });
        });
    },

    // called by scheduler
    generateImage: generateImage,

    // useful for troubleshooting
    generatePage: generatePage,

    getSleepTime: function(key) {
        const settings = settingsAccessor.getDashboardSettings(key);
        if (!settings) {
            console.warn(`Dashboard settings for key "${key}" not valid. Skipping image generation.`);
            return;
        }
        
        return datetime.getSecondsToNextTime(settings.eink_sleep_until, 0, 0); // 7:00
    }
};

async function getTemplateData(calendarAccessor, weatherAccessor, icalAccessor, settings) {
    // Dashboard parameters
    const dashboardDate = getDashboardDate(settings.nextday_cutoff || 8);
    const dashboardCoord = { lat: settings.lat, lon: settings.lon };

    // Fetch data
    const weather = await weatherAccessor(dashboardDate, dashboardCoord, settings.weather_am, settings.weather_pm);
    const calendar = calendarAccessor(dashboardDate);
    const events = await icalAccessor(settings.ical_url);

    // Transform to final template data
    const data = calendar;

    data.todayQuote = config.TODAY_QUOTE;

    data.today.am = weather.today.am;
    data.today.pm = weather.today.pm;
    data.today.icon = weather.today.icon;
    data.today.weather = weather.today.weather;
    data.hourly = weather.hourly;

    data.weeks.forEach(week => {
        week.forEach(day => {
            const w = weather.days.find(weather => datetime.dateEquals(weather.date, day.date));
            day.weather = w ? w.weather : null;
            day.events = events.filter(e => datetime.dateEquals(e.date, day.date));
        });
    });

    return data;
}

// After 8 AM, return tomorrow. Otherwise, return today.
function getDashboardDate(nextday_cutoff) {
    const date = datetime.jsDateToDate(new Date());
    return date.hours < nextday_cutoff + 1 ? date : datetime.addDays(date, 1);
}
