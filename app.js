'use strict';

const Discord = require("./CommandHandler.js");
const cred = Discord.util.openJSONSync("./client.json");
const Client = new Discord.Client();
Client.cred = cred;


require("./PluginLoader.js").run(Client);

Client.login(cred.token).catch(console.log);