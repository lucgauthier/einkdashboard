const {
    config,
    datetime,
    htmlTemplate,
} = require('../utils');

const { 
    calendarAccessor, 
    icalAccessor,
    pirateweatherAccessor,
    templateAccessor,
} = require('../accessors');

// Available methods
module.exports = {
    // called by scheduler
    generateImage: async function() {
        const outputBmpImagePath = './output/image.bmp';
        const templateData = await getTemplateData(calendarAccessor, pirateweatherAccessor, icalAccessor);
        const html = await templateAccessor.getTemplate();

        await htmlTemplate.ToBmpFile(html, templateData, outputBmpImagePath);
    },

    // useful for troubleshooting
    generatePage: async function() {
        const outputHtmlPath = './output/index.html';
        const templateData = await getTemplateData(calendarAccessor, pirateweatherAccessor, icalAccessor);
        const compiledTemplate = await templateAccessor.getCompiledTemplate(templateData);

        await htmlTemplate.ToHtmlFile(compiledTemplate, templateData, outputHtmlPath);
    },

    getSleepTime: function() {
        return datetime.getSecondsToNextTime(7, 0, 0); // 7:00
    }
};

async function getTemplateData(calendarAccessor, weatherAccessor, icalAccessor) {
    // Dashboard parameters
    const dashboardDate = getDashboardDate();
    const dashboardCoord = { lat: 46.85, lon: -71.38 };

    // Fetch data
    const weather = await weatherAccessor(dashboardDate, dashboardCoord);
    const calendar = calendarAccessor(dashboardDate);
    const events = await icalAccessor();

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
function getDashboardDate() {
    const date = datetime.jsDateToDate(new Date());
    return date.hours < 9 ? date : datetime.addDays(date, 1);
    //return date;
}
