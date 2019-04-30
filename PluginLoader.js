const fs = require("fs");

module.exports.run = function (client) {
    if (!fs.existsSync("./Plugins")) {
        fs.mkdirSync("./Plugins");
    }
    let folders = fs.readdirSync("./Plugins");
    for (const plugin of folders) {
        require(`./Plugins/${plugin}/${plugin}.js`).load(client);
    }
}