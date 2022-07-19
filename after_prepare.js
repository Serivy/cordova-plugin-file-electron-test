const fs = require('fs');
const path = require('path');

module.exports = async function(context) {
    if (context.opts.cordova.platforms.indexOf('electron') >= 0) { 
        const electronConfig = path.resolve("./platforms/electron/www/cdv-electron-settings.json");
        const data = JSON.parse(fs.readFileSync(electronConfig));
        const needsUpdating = data.browserWindow.width != 1200;
        if (needsUpdating) {
            console.log("Updating config");
            data.browserWindow.width = 1200;
            data.browserWindow.height = 800;
            fs.writeFileSync(electronConfig, JSON.stringify(data, null, 2))
        }
    }
}