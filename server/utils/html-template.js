const fsPromises = require("fs/promises");
const nodeHtmlToImage = require('node-html-to-image');
const bmp = require("../utils/bmp");
var logger = require('../utils/logger');

async function ToBmpFile(template, data, outputBmpImagePath) {
    const outputPngImagePath = outputBmpImagePath + '.png';

    await nodeHtmlToImage({
        output: outputPngImagePath,
        content: data,
        type: 'png',
        //quality: 100,
        html: template,
        puppeteerArgs: {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        }
    });

    await bmp.pngToBmpBottomUp(outputPngImagePath, outputBmpImagePath);
    await fsPromises.rm(outputPngImagePath);
    
    logger.info(`> ${outputBmpImagePath}`);
}

async function ToHtmlFile(compiledTemplate, templateData, outputPath) {
    const result = compiledTemplate(templateData);

    try {
        await fsPromises.writeFile(outputPath, result);
        logger.info(`> ${outputPath}`);
    }
    catch (err) {
        logger.error(err);
    }
}

module.exports = {
    ToBmpFile: ToBmpFile,
    ToHtmlFile: ToHtmlFile
}