const Discord = require("../../CommandHandler.js");
const fs = require('fs');

let ids = {};

class setRole extends Discord.Command {
    constructor() {
        super("streamrole", ["streamrole"], "streamrole <@role>", "set role for streaming role", "Twitch Streaming");
    }
    message(content, author, channel, guild, message, handler) {
        console.log('debug1');
        let id = content.match(/[^\d]*(\d+).*/);
		if (id && id[1]) {
				ids[guild.id] = id[1];
				Discord.util.writeJSONSync("Plugins/TwitchPL/TwitchPL.json", ids);
				//channel.send(`ok. set guild stream role to ${id[1]}`);
		} else {
			channel.send('no role provided? please provide a role already.');
		}
    }
}


class listRoles extends Discord.Command {
    constructor() {
        super("listroles", ["listroles"], "listroles", "list all server roles by id", "Twitch Streaming");
    }
    message(content, author, channel, guild, message, handler) {
        guild.roles.forEach(role => {
			channel.send(`${role.name}: ${role.id}`);
		});
    }
}



module.exports.load = function (client) {
    client.addCommand(new setRole());
	client.addCommand(new listRoles());
    if (fs.existsSync("Plugins/TwitchPL/TwitchPL.json")) {
        ids = Discord.util.openJSONSync("Plugins/TwitchPL/TwitchPL.json");
    } else {
        Discord.util.writeJSONSync("Plugins/TwitchPL/TwitchPL.json", ids);
    }
    
    
    client.on('presenceUpdate', (oldMember, newMember) => {
        if (ids[newMember.guild.id]) {
            if (newMember.presence.game && newMember.presence.game.streaming) {
                newMember.addRole(ids[newMember.guild.id]);
            } else {
                newMember.removeRole(ids[newMember.guild.id]);
            }
        }
    })
    //client.players = new Discord.Collection();
    //client.addCommand(new play());
}