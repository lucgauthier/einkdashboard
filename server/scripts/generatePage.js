const dashboard = require('../managers/dashboard')

try {
    dashboard.generatePage("default");
} catch (error) {
    console.error("Error generating page:", error);
}