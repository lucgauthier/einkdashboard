const static = require('node-static');
const http = require('http');
const path = require('path');
var logger = require('./utils/logger');
var config = require('./utils/config');

const { 
    settingsAccessor
} = require('./accessors');

const dashboardManager = require('./managers/dashboard');
const serverHttpPort = config.PORT;

// 1. Generate dashboard automatically: 21:45 to 7:45
dashboardManager.scheduleGeneration();

// 2. Serve dashboard files
// live: /image.bmp is accessed by networked dashboard
// debug: /index.html can be accessed for debugging purpose
// debug: /generatePage to generate fresh /index.html
// debug: /generateImage to generate fresh /image.bmp
// debug: /generateAll to generate fresh page and image

// cached image can be accessed to /image.png
// cached page can be accessed to /index.html

const tokenKeys = settingsAccessor.getDashboardSettingsMap();
const defaultToken = "default";
const hasDefaultToken = !!tokenKeys[defaultToken];

const server = http.createServer(async function (req, res) {
  // grab token from querystring
  let token = req.url.split('?')[1]?.split('=')[1] || null;
  if (!token) {
    if (hasDefaultToken) {
      token = defaultToken;
    }
    else {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Token is required in query string');
      return;
    }
  }
  
  if (!tokenKeys[token]) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Token is not valid');
    return;
  }

  const key = tokenKeys[token];

  const outputDirectory = path.resolve(__dirname, 'data', 'dashboards', key, 'output');
  const file = new(static.Server)(outputDirectory, { cache: 0 }); // 3600 = 1 hour

  // Make sure the dashboard is properly generated when /dashboard endpoint is called
  if (req.url.startsWith('/generatePage')) {
    await dashboardManager.generatePage(key);
    req.url = '/';
  }

  if (req.url.startsWith('/generateImage')) {
    await dashboardManager.generateImage(key);

    // Somehow the file is not fully written at this point, 
    // so manually wait a little to be safe
    await delay(2000); 

    req.url = '/image.bmp';
  }

  if (req.url.startsWith('/generateAll')) {
    await dashboardManager.generatePage(key);
    await dashboardManager.generateImage(key);
    req.url = '/';
  }

  if (req.url.startsWith('/device')) {
    // return sleep time to next update
    //logger.info('Received from device', req.da);
    const seconds = dashboardManager.getSleepTime(key);
    logger.info('<--- %s %d', req.url, seconds);
    res.end('' + seconds);
  }
  else {
    logger.info('<--- %s', req.url);
    file.serve(req, res);
  }
}).listen(serverHttpPort);

logger.info('Serving output files at http://localhost:%d', serverHttpPort);

process.on('SIGTERM', function() {  
  logger.info('SIGTERM received. Closing server.');
  server.closeAllConnections();
  logger.info('Exiting process.');
  process.exit(1);
});
var sigintAlreadyReceived = false;
process.on('SIGINT', function() {
  if (sigintAlreadyReceived) {
    logger.info('SIGINT received twice. Exiting process now.');
    process.exit(1);
  }
  sigintAlreadyReceived = true;
  logger.info('SIGINT received. Closing server gracefully.');
  server.close(() => {
    logger.info('Exiting process.');
    process.exit(0);
  });
});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}