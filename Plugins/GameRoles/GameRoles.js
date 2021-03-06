const Discord = require("../../CommandHandler.js");
const fs = require('fs');

let roles = {}

class addgame extends Discord.Command {
    constructor() {
        super("addgame", ["addgame"], "addgame <@role> <emoji>", "adds game to list of roles to hand people for games.", "GameRoles", false);
    }
    message(content, author, channel, guild, message, handler) {
        if (!roles[guild.id]) {
            roles[guild.id] = {roles:{}, message:null};
        }
        let matches = content.match(/[^\d]*(\d+)[^\d]+?:[^\s]+:[^\d]*(\d+)/);
        if (matches && matches[1]) {
            roles[guild.id].roles[matches[2]] = matches[1];
        }
        Discord.util.writeJSONSync("Plugins/GameRoles/GameRoles.json", roles);
    }
}

class delgame extends Discord.Command {
    constructor() {
        super("delgame", ["delgame"], "delgame <emoji>", "removes game to list of roles to hand people for games.", "GameRoles", false);
    }
    message(content, author, channel, guild, message, handler) {
        if (!roles[guild.id]) {
            roles[guild.id] = {roles:{}, message:null};
        }
        let matches = content.match(/[^\d]*(\d+)/);
        if (matches && matches[1] && roles[matches[1]]) {
            delete roles[matches[1]];
            Discord.util.writeJSONSync("Plugins/GameRoles/GameRoles.json", roles);
        }
    }
}

class gamerolelist extends Discord.Command {
    constructor() {
        super ("gamerolelist", ["gamerolelist","grl"], "gamerolelist [optional message id]", "post message for people to react to to get roles", "GameRoles", false);
    }
    addReactions(message, guild) {
        Object.keys(roles[guild.id].roles).forEach(reaction => {
            message.react(reaction);
        });
        message.reactions.forEach(reaction => {
            if (!Object.keys(roles[guild.id].roles).includes(reaction._emoji.id)) {
                reaction.fetchUsers().then(users => {
                    users.forEach(user => {
                        reaction.remove(user);
                    });
                });
            }
        });
        roles[guild.id].message = {channel:message.channel.id, id:message.id};
        Discord.util.writeJSONSync("Plugins/GameRoles/GameRoles.json", roles);
    }
    message(content, author, channel, guild, message, handler) {
        if (!roles[guild.id]) {
            roles[guild.id] = {roles:{}, message:null};
        }
        let matches = content.match(/[^\d]*(\d+)/);
        if (matches && matches[1]) {
            channel.fetchMessage(matches[1]).then(message => {
                this.addReactions(message, guild);
            });
        } else {
            channel.fetchMessages({limit:2}).then(messages => {
                this.addReactions(messages.last(), guild);
            });
        }

        message.delete();
    }
}

module.exports.load = function (client) {
    if (fs.existsSync("Plugins/GameRoles/GameRoles.json")) {
        roles = Discord.util.openJSONSync("Plugins/GameRoles/GameRoles.json");
    } else {
        Discord.util.writeJSONSync("Plugins/GameRoles/GameRoles.json", roles);
    }

    client.on('raw', event => {
        if (event.t == "MESSAGE_REACTION_ADD" && roles[event.d.guild_id] && roles[event.d.guild_id].message && roles[event.d.guild_id].message.id == event.d.message_id && roles[event.d.guild_id].roles[event.d.emoji.id] && event.d.user_id != client.user.id) {
                client.guilds.get(event.d.guild_id).members.get(event.d.user_id).addRole(roles[event.d.guild_id].roles[event.d.emoji.id]).catch(console.log);
        } else if (event.t == "MESSAGE_REACTION_REMOVE" && roles[event.d.guild_id] && roles[event.d.guild_id].message && roles[event.d.guild_id].message.id == event.d.message_id && roles[event.d.guild_id].roles[event.d.emoji.id] && event.d.user_id != client.user.id) {
                client.guilds.get(event.d.guild_id).members.get(event.d.user_id).removeRole(roles[event.d.guild_id].roles[event.d.emoji.id]).catch(console.log);
        }
    });

    client.addCommand(new addgame());
    client.addCommand(new gamerolelist());
}
