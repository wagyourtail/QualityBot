const Discord = require("../../CommandHandler.js");
const fs = require('fs');

let filters = {}

class filter extends Discord.Command {
	constructor() {
		super("filter", ["filter","chatfilter"], "filter list [channel]\nfilter add </regex/|attatchments> \nfilter remove <id|attachments>", "filter channel messages deleting those that match. example `filter add /https?\:/`", "ChatFilter");
	}
	message(content, author, channel, guild, message, handler) {
		content = content.match(/\s*(add)\s+\/(.+)\/|\s*(add)\s+(attachments)|\s*(list)|\s*(remove)\s+(\d+)|\s*(remove)\s+(attachments)/i)
		if (content) {
			content = content.filter((el) => {return el != null;})
			switch(content[1]) {
				case "add":
					if (!filters[channel.id]) {
						filters[channel.id] = {}
						filters[channel.id].regex = []
						filters[channel.id].attachments = false
					}
					if (content[2] == "attachments") {
						filters[channel.id].attachments = true
						channel.send(new Discord.RichEmbed().setTitle(channel.name).setDescription("Now Blocking Attatchments. \nDo `filter remove attachments` to allow attachments."))
					} else {
						filters[channel.id].regex.push(content[2]);
						channel.send(new Discord.RichEmbed().setTitle(channel.name).setDescription(`Now Blocking /${content[2]}/i`))
					}
					Discord.util.writeJSONSync("Plugins/ChatFilter/ChatFilter.json",filters)
					break;
				case "list":
					if (filters[channel.id]) {
						let c = ""
						for (let i = 0; i < filters[channel.id].regex.length; i++) {
							c=c+`\n**${i+1}.** /${filters[channel.id].regex[i]}/i`
						}
						channel.send(new Discord.RichEmbed().setTitle(channel.name).setDescription(c).addField("Block Attatchments:", filters[channel.id].attachments))
					} else {
						filters[channel.id] = {}
						filters[channel.id].regex = []
						filters[channel.id].attachments = false
						channel.send(new Discord.RichEmbed().setTitle(channel.name).setDescription("no filters defined for this channel."))
						let c = ""
						for (let i = 0; i < filters[channel.id].regex.length; i++) {
							c=c+`\n**${i+1}.** /${filters[channel.id].regex[i]}/i`
						}
						channel.send(new Discord.RichEmbed().setTitle(channel.name).setDescription(c).addField("Block Attatchments:", filters[channel.id].attachments))
					}
					break;
				case "remove":
					if (filters[channel.id]) {
						if (content[2] == "attachments") {
							filters[channel.id].attachments = false
						} else {
							filters[channel.id].regex.splice(parseInt(content[2])-1,1)
						}
						Discord.util.writeJSONSync("Plugins/ChatFilter/ChatFilter.json",filters)
						let c = ""
						for (let i = 0; i < filters[channel.id].regex.length; i++) {
							c=c+`\n**${i+1}.** /${filters[channel.id].regex[i]}/i`
						}
						channel.send(new Discord.RichEmbed().setTitle(channel.name).setDescription(c).addField("Block Attatchments:", filters[channel.id].attachments))
					} else {
						filters[channel.id] = {}
						filters[channel.id].regex = []
						filters[channel.id].attachments = false
					}
					break;
				default:
					channel.send("invalid filter subcommand.")
					break;
			}
		}
	}
}



module.exports.load = function (client) {
	client.addCommand(new filter());
	
	
	if (fs.existsSync("Plugins/ChatFilter/ChatFilter.json")) {
        filters = Discord.util.openJSONSync("Plugins/ChatFilter/ChatFilter.json");
    } else {
        Discord.util.writeJSONSync("Plugins/ChatFilter/ChatFilter.json", filters);
    }
	
	
	client.on("message", (msg) => {
		if (filters[msg.channel.id]) {
			if (filters[msg.channel.id].regex.length != 0 && msg.content.match(new RegExp(filters[msg.channel.id].regex.join("|"),"i"))) {
				msg.delete()
			}
			
			if (filters[msg.channel.id].attachments && msg.attachments.size != 0) {
				msg.delete()
			}
		}
	})
	client.on("messageUpdate", (old, msg) => {
		if (filters[msg.channel.id]) {
			if (filters[msg.channel.id].regex.length != 0 && msg.content.match(new RegExp(filters[msg.channel.id].regex.join("|"),"i"))) {
				msg.delete()
			}
			
			if (filters[msg.channel.id].attachments && msg.attachments.size != 0) {
				msg.delete()
			}
		}
	})
}