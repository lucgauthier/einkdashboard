const static = require('node-static');
const http = require('http');
const path = require('path');
var cron = require('node-cron');
var logger = require('./utils/logger');

const serverHttpPort = 8080;
const dashboardManager = require('./managers/dashboard');

// 1. Generate dashboard automatically: 21:45 to 7:45
//cron.schedule('0 0 21 * * *', async () => {
cron.schedule('0 45 0-7,21-23 * * *', async () => {
  logger.info('Job run started', new Date().toLocaleString());

  await dashboardManager.generatePage();
  await dashboardManager.generateImage();

  logger.info('Job run completed', new Date().toLocaleString());
}, {
  name: 'Daily dashboard generation',
  runOnInit: false, 
  timezone: 'America/Toronto'
});

// 2. Serve dashboard files
// live: /image.bmp is accessed by networked dashboard
// debug: /index.html can be accessed for debugging purpose
// debug: /generatePage to generate fresh /index.html
// debug: /generateImage to generate fresh /image.bmp
// debug: /generateAll to generate fresh page and image

const outputDirectory = path.resolve(__dirname, 'output');

const file = new(static.Server)(outputDirectory, { cache: 0 }); // 3600 = 1 hour

// cached image can be accessed to /image.png
// cached page can be accessed to /index.html
const server = http.createServer(async function (req, res) {
  // Make sure the dashboard is properly generated when /dashboard endpoint is called
  if (req.url == '/generatePage') {
    await dashboardManager.generatePage();
    req.url = '/';
  }

  if (req.url == '/generateImage') {
    await dashboardManager.generateImage();
    req.url = '/image.bmp';
  }

  if (req.url == '/generateAll') {
    await dashboardManager.generatePage();
    await dashboardManager.generateImage();
    req.url = '/';
  }

  if (req.url == '/device') {
    // return sleep time to next update
    //logger.info('Received from device', req.da);
    const seconds = dashboardManager.getSleepTime();
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
process.on('SIGINT', function() {
  logger.info('SIGINT received. Closing server.');
  server.close(() => {
    logger.info('Exiting process.');
    process.exit(0);
  });
});