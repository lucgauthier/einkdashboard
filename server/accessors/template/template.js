const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const font2base64 = require('node-font2base64');
const logger = require('../../utils/logger')

// Define template helper functions
handlebars.registerHelper('loud', function(str) {
    return str.toUpperCase()
});
handlebars.registerHelper('weekDayLong', function(weekDay) {
    const values = [
        'Lundi',
        'Mardi',
        'Mercredi',
        'Jeudi',
        'Vendredi',
        'Samedi',
        'Dimanche'
    ];
    return values[weekDay - 1];
});
handlebars.registerHelper('weekDayInitial', function(weekDay) {
    const values = [
        'L',
        'M',
        'M',
        'J',
        'V',
        'S',
        'D'
    ];
    return values[weekDay - 1];
});
handlebars.registerHelper('monthLong', function(month) {
    const values = [
        'janvier',
        'février',
        'mars',
        'avril',
        'mai',
        'juin',
        'juillet',
        'août',
        'septembre',
        'octobre',
        'novembre',
        'décembre'
    ];
    return values[month - 1];
});
handlebars.registerHelper('isFirst', function(day, options) {
    return day == 1 ? options.fn(this) : options.inverse(this);
});
handlebars.registerHelper('icon', function(icon) {
    const localPath = path.join(__dirname, `icons-${icon.set}`, `${icon.ref}.png`);
    if (fs.existsSync(localPath)) {
        const image = fs.readFileSync(localPath);
        const base64Image = new Buffer.from(image).toString('base64');
        return `data:image/png;base64,${base64Image}`
    }
    else {
        logger.warn("icon not found", icon.set, icon.ref)
        return 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
    }
    
});
handlebars.registerHelper('display_rain', function(rain) {
    if (rain) {
        return '' + Math.round(rain) + ' mm';
    }
    return null;
});
handlebars.registerHelper('display_snow', function(snow) {
    if (snow && snow >= 10) {
        return '' + Math.round(snow / 10) + ' cm';
    }
    else if (snow) {
        return '<1 cm';
    }
    return null;
});
handlebars.registerHelper('display_pop', function(pop) {
    if (pop && pop > 0) {
        return '' + Math.round(pop * 100) + '%';
    }
    return null;
});
handlebars.registerHelper('display_uvi', function(uvi) {
    if (uvi && uvi >= 1) {
        return '' + Math.round(uvi) + ' UV';
    }
    return null;
});
handlebars.registerHelper('fontface', function(name, file) {
    name = handlebars.escapeExpression(name);
    file = handlebars.escapeExpression(file);

    const localPath = path.join(__dirname, 'fonts', `${file}`);
    const data = font2base64.encodeToDataUrlSync(localPath);
    return new handlebars.SafeString(`@font-face { font-family: '${name}'; src: url(${data}) format('woff2'); }`);
});
handlebars.registerHelper('json', function(data) {
    return new handlebars.SafeString(JSON.stringify(data));
});

// Get handlebars template content
async function getTemplateContent() {
    const templatePath = path.join(__dirname, 'index.html');
    const templateContent = fs.readFileSync(templatePath);
    
    return templateContent.toString();
}

module.exports = {
    getTemplate: getTemplateContent,
    getCompiledTemplate: async function() {
        const templateContent = await getTemplateContent();
        return handlebars.compile(templateContent);
    }
};