const fs = require('fs');
const path = require('path');

function getDashboardSettingsMap() {
    const dashboardsDir = path.resolve(__dirname, '../data/dashboards');
    const result = {};

    if (!fs.existsSync(dashboardsDir)) return result;

    const folders = fs.readdirSync(dashboardsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    folders.forEach(folder => {
        const settingsPath = path.join(dashboardsDir, folder, 'settings.json');
        if (fs.existsSync(settingsPath)) {
            try {
                const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                if (settings.token) {
                    result[settings.token] = folder;
                }
            } catch (e) {
                // ignore invalid JSON
            }
        }
    });

    return result;
}

module.exports.getDashboardSettingsMap = getDashboardSettingsMap;

function getDashboardKeyByToken(token) {
    const map = getDashboardSettingsMap();
    return map[token] || null;
}

module.exports.getDashboardKeyByToken = getDashboardKeyByToken;

function getDashboardSettings(key) {
    const dashboardsDir = path.resolve(__dirname, '../data/dashboards');
    const settingsPath = path.join(dashboardsDir, key, 'settings.json');
    if (!fs.existsSync(settingsPath)) return null;
    try {
        return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (e) {
        return null;
    }
}

module.exports.getDashboardSettings = getDashboardSettings;
