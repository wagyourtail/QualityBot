const Discord = require("../../CommandHandler.js");
const fs = require('fs');

let members = {}
let current = {}

class dfwm extends Discord.Command {
    constructor() {
        super("df", ["df"], "df", "toggles df status.", "default", true);
    }
    message(content, author, channel, guild, message, handler) {
        if (!members[guild.id]) {
            members[guild.id] = []
        }
        if (members[guild.id].includes(author.id)) {
            const index = members[guild.id].indexOf(author.id);
            if (index !== -1) members[guild.id].splice(index, 1);
        } else {
            members[guild.id].push(author.id);
            if (message.member.voiceChannel) {
                current[author.id] = message.member.voiceChannel.id;
            }
        }
        channel.send(new Discord.RichEmbed().setTitle(members[guild.id].includes(author.id)).setThumbnail("https://i.imgur.com/oxsoRC8.png"))
        Discord.util.writeJSONSync("Plugins/DFWM/DFWM.json", members)
    }
}
module.exports.load = function (client) {
    client.addCommand(new dfwm());
    
    if (fs.existsSync("Plugins/DFWM/DFWM.json")) {
        members = Discord.util.openJSONSync("Plugins/DFWM/DFWM.json");
    } else {
        Discord.util.writeJSONSync("Plugins/DFWM/DFWM.json", members);
    }
    
    client.on('voiceStateUpdate', (oldMember, newMember) => {
        if (!members[oldMember.guild.id]) {
            members[oldMember.guild.id] = []
        }
        
        if (members[oldMember.guild.id].includes(oldMember.id)) {
            if ((!current[oldMember.id] || !oldMember.voiceChannel) && newMember.voiceChannel) {
                current[oldMember.id] = newMember.voiceChannel.id
            }
            if (newMember.voiceChannel && current[oldMember.id] != newMember.voiceChannel.id) {
                newMember.setVoiceChannel(current[oldMember.id]);
            }
            if (newMember.serverMute) newMember.setMute(false, 'Protected User');
            if (newMember.serverDeaf) newMember.setDeaf(false, 'Protected User');
        }
    })
}