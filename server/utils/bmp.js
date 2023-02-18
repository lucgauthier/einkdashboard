var fs = require("fs");
var path = require("path");
const jimp = require('jimp');
const bmp = require("../utils/bmp-js-master");
var logger = require('../utils/logger');

function convertToBottomUp(sourceImagePath, destinationImagePath) {
    sourceImagePath = sourceImagePath ? path.resolve(__dirname, '..', sourceImagePath) : null;
    destinationImagePath = destinationImagePath ? path.resolve(__dirname, '..', destinationImagePath) : sourceImagePath;

    var bmpBuffer = fs.readFileSync(sourceImagePath);
    var bmpData = bmp.decode(bmpBuffer);
    var encoded = bmp.encode(bmpData);

    fs.writeFileSync(destinationImagePath, encoded.data);
}

async function pngToBmpBottomUp(sourceImagePath, destinationImagePath) {
    sourceImagePath = sourceImagePath ? path.resolve(__dirname, '..', sourceImagePath) : null;
    destinationImagePath = destinationImagePath ? path.resolve(__dirname, '..', destinationImagePath) : sourceImagePath;

    jimp.read(sourceImagePath, async function (err, image) {
        if (err) {
            logger.error(err);
        } else {
            await image
                .color([{ apply: 'greyscale', params: []}])
                .flip(false, true)
                .writeAsync(destinationImagePath);

            try {
                convertToBottomUp(destinationImagePath, destinationImagePath);
            }
            catch (err) {
                logger.error(err);
            }
        }
    });
}

module.exports = {
    convertToBottomUp: convertToBottomUp,
    pngToBmpBottomUp: pngToBmpBottomUp
};