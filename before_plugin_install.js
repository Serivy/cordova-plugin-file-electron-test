const fs = require('fs');
const path = require('path');

module.exports = async function(context) {
    if (context.opts.cordova.platforms.indexOf('electron') >= 0 && context.opts.cordova.plugins.indexOf('cordova-plugin-file') >= 0) { 
        const electronPackage = path.resolve("./platforms/electron/www/package.json");
        const electronFolder = path.dirname(electronPackage);
        try {
            fs.statSync(electronFolder);
        } catch (e) {
            fs.mkdirSync(electronFolder, {recursive: true });
        }

        try {
            let stat = fs.statSync(electronPackage);

        } catch (e) {
            fs.writeFileSync(electronPackage, "{}");
        }
    }
}