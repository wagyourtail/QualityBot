const Discord = require("../../CommandHandler.js");
const fs = require('fs');

let ids = {};

class setCategory extends Discord.Command {
    constructor() {
        super("setcategory", ["setcategory"], "setcategory <text channel group>", "set group for looking fp channels", "Looking For Players");
    }
    message(content, author, channel, guild, message, handler) {
        console.log('debug1');
        let id = content.match(/[^\d]*(\d+).*/);
		if (id && id[1] && guild.channels.get(id[1]).type == 'category') {
				ids[guild.id] = id[1];
				Discord.util.writeJSONSync("Plugins/LookingFP/LookingFP.json", ids);
		} else {
			channel.send('no Channel Category provided? please provide a Category already.');
		}
    }
}

class setGame extends Discord.Command {
    constructor() {
        super("setgame", ["setgame"], "setgame <game name>", "set game name for looking for players channel", "Looking For Players");
    }
    message(content, author, channel, guild, message, handler) {
		try {
			if (ids[guild.id] && message.member.voiceChannel.parent.id == ids[guild.id]) {
				message.member.voiceChannel.setName(content);
			}
		} catch(e) {
			console.log(e);
		}
    }
}


 


module.exports.load = function (client) {
	client.addCommand(new setCategory());
	client.addCommand(new setGame());
	
	if (fs.existsSync("Plugins/LookingFP/LookingFP.json")) {
        ids = Discord.util.openJSONSync("Plugins/LookingFP/LookingFP.json");
    } else {
        Discord.util.writeJSONSync("Plugins/LookingFP/LookingFP.json", ids);
    }
	
	client.on('voiceStateUpdate', (oldMember, newMember) => {
		if (ids[newMember.guild.id]) {
			try {
				if (newMember.voiceChannel.parent.id == ids[newMember.guild.id]) {
					if (newMember.voiceChannel.members.size == 1 && (!oldMember.voiceChannel || oldMember.voiceChannel.id != newMember.voiceChannel.id)) {
						if (newMember.presence.game) newMember.voiceChannel.setName(newMember.presence.game.name);
						newMember.guild.createChannel("Looking For Players", "voice").then((channel) => {
							channel.setParent(ids[newMember.guild.id]);
						});
					}
				} 
			} catch(e) {
			}
			try {
				if (oldMember.voiceChannel.parent.id == ids[oldMember.guild.id]) {
					if (!oldMember.voiceChannel.members.size && oldMember.guild.channels.get(ids[oldMember.guild.id]).children.size > 2) {
						oldMember.voiceChannel.delete("empty looking for players.");
					}
				}
			} catch(e){ 
			}
		}			
	});
}