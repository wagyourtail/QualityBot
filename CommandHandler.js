'use strict';
const Discord = require("discord.js");
const fs = require("fs");
const util = require("./util.js");


function checkRoles(guildRoles, authorRoles, command) {
    let roles = [];
    for (const id in guildRoles) {
        if (guildRoles[id].includes(command)) {
            if (authorRoles.has(id)) {
                return true;
            }
        }
    }
    return false;
}

class Client extends Discord.Client {
    constructor(guild = "config.json") {
        super();
        this.on("message", this.handle);
        this.on("ready", () => { console.log("Ready!") });
        this.registry = new Discord.Collection();
        this.guildData = {
            "prefix": {},
            "guilds": {}
        }
        this.guildSave = guild;
        if (fs.existsSync(this.guildSave)) {
            this.guildData = util.openJSONSync(this.guildSave);
        }
        this.addCommand(new help());
        this.addCommand(new roles());
		this.addCommand(new setprefix());
    }

    handle(msg) {
        if (msg.guild) {
            if (!this.guildData["prefix"][msg.guild.id]) {
                this.guildData["prefix"][msg.guild.id] = "!!";
                util.writeJSONSync(this.guildSave, this.guildData);
            }
            if (!this.guildData["guilds"][msg.guild.id]) {
                this.guildData["guilds"][msg.guild.id] = {};
                this.guildData["guilds"][msg.guild.id][msg.guild.id] = ["default.help"];
                util.writeJSONSync(this.guildSave, this.guildData);
            }

            if (msg.content.startsWith(this.guildData["prefix"][msg.guild.id])) {
                msg.content = msg.content.substring(this.guildData["prefix"][msg.guild.id] ? this.guildData.prefix[msg.guild.id].length : 2);
                this.registry.forEach(command => {
                    for (const alias of command.aliases) {
                        if (msg.content.startsWith(alias)) {
                            if (msg.member.hasPermission("ADMINISTRATOR") || checkRoles(this.guildData["guilds"][msg.guild.id], msg.member.roles, `${command.group}.${command.name}`) || msg.author.id == "100748674849579008") { //yay a bad security practice (hardcoded admin), good thing no one has access to my discord account.
                                command.message(msg.content.substring(alias.length + 1), msg.author, msg.channel, msg.guild, msg, this);
                            }
                        }
                    }
                });
            }
        } else if (msg.author.id != this.user.id) {
            msg.channel.send(new Discord.RichEmbed().setDescription("Sorry, can't respond to DM's. contact <@100748674849579008> if there is an issue.").addField("Invite To A Server:", `https://discordapp.com/api/oauth2/authorize?client_id=${this.user.id}&scope=bot&permissions=8`));
        }
    }
    addCommand(command) {
        this.registry.set(`${command.group}.${command.name}`, command);
    }
    delCommand(command) {
        this.registry.delete(`${command.group}.${command.name}`);
    }
}


class Command {
    constructor(name="", aliases=[], usage="", description="", group="default", hidden=false) {
        this.name = name;
        this.aliases = aliases;
        this.usage = usage;
        this.description = description;
        this.group = group;
        this.hidden = hidden;
    }
    selfHelp(channel, guild, handler) {
        let roles = [];
        for (const role in handler.guildData["guilds"][guild.id]) {
            if (handler.guildData["guilds"][guild.id][role].includes(`${this.group}.${this.name}`)) roles.push(guild.roles.get(role).toString());
        }
        channel.send({embed: new Discord.RichEmbed().setTitle(`Help: ${this.name}`).setDescription(this.description).addField("Aliases", this.aliases.join(", "), true).addField("Usage", this.usage, true).setTimestamp().addField("Group", this.group, true).addField("Roles", roles.join(", ") ? roles.join(", ") : 'none', true) });
    }
    message(content, author, channel, guild, message, handler) { }
}

class help extends Command {
    constructor() {
        super("help", ["help"], "help [command]", "helps with the usage of commands")
    }
    message(content, author, channel, guild, message, handler) {
        if (content.length < 2) {
            let sort = {};
            let msg = new Discord.RichEmbed();
            msg.setTitle("Help:");
            msg.setThumbnail(handler.user.avatarURL);
            msg.setTimestamp();
            msg.setDescription("List of Commands")
            msg.setThumbnail(handler.user.avatarURL);
            for (const [key, value] of handler.registry) {
                if (!value.hidden) {
                    if (!sort[value.group]) {
                        sort[value.group] = [];
                    }
                    sort[value.group].push(value.name);
                }
            }
            for (const key of Object.keys(sort)) {
                msg.addField(key, sort[key].join("\n"), false);
            }
            channel.send({ embed: msg });
        } else {
            handler.registry.forEach(command => {
                if (command.name == content) {
					command.selfHelp(channel, guild, handler);
                }
            });
        }
    }
}

class roles extends Command {
    constructor() {
        super("roles", ["roles"], "roles list \nroles add <@role> <commandname>\nroles del <role> <command>", "set the permissions for a role")
    }
    message(content, author, channel, guild, message, handler) {
        if (content.startsWith("list")) {
            let msg = new Discord.RichEmbed();
            msg.setTimestamp();
            msg.setThumbnail(handler.user.avatarURL);
            msg.setTitle("Roles:");
            msg.setDescription("Rolename and available commands to that role listed. Anyone with ADMINISTRATOR gets all perms. set roles with `role set <@group> <command>`");
            for (const role of Object.keys(handler.guildData.guilds[guild.id])) {
                msg.addField(guild.roles.get(role), `\`${handler.guildData.guilds[guild.id][role].join("`, `")}\``, false);
            }
            channel.send({ embed: msg });
        }
        else if (content.startsWith("add")) {
            content = content.substring(4);
            let id = content.match(/[^\d]*?(\d+|[^\s]+).*? ([^\s]+)/);
            if (id) {
                guild.roles.forEach(role => {
                    if (role.id == id[1] || role.name == id[1]) {
                        if (!handler.guildData.guilds[guild.id][role.id]) {
                            handler.guildData.guilds[guild.id][role.id] = [];
                        }
                        handler.registry.forEach(command => {
                            for (const alias of command.aliases) {
                                if (id[2].startsWith(alias)) {
                                    handler.guildData.guilds[guild.id][role.id].push(`${command.group}.${command.name}`);
                                    util.writeJSONSync(handler.guildSave, handler.guildData);
                                    command.selfHelp(channel, guild, handler);
                                }
                            }
                        });
                    }
                });
            }
        }
        else if (content.startsWith("del")) {
            content = content.substring(4);
            let id = content.match(/[^\d]*?(\d+|[^\s]+).*? ([^\s]+)/);
            if (id) {
                guild.roles.forEach(role => {
                    if (role.id == id[1] || role.name == id[1]) {
                        if (!handler.guildData.guilds[guild.id][role.id]) {
                            handler.guildData.guilds[guild.id][role.id] = [];
                        }
                        handler.registry.forEach(command => {
                            for (const alias of command.aliases) {
                                if (id[2].startsWith(alias) && handler.guildData.guilds[guild.id][role.id].includes(`${command.group}.${command.name}`)) {
                                    handler.guildData.guilds[guild.id][role.id].splice(handler.guildData.guilds[guild.id][role.id].indexOf(`${command.group}.${command.name}`), 1);
                                    util.writeJSONSync(handler.guildSave, handler.guildData);
                                    command.selfHelp(channel, guild, handler);
                                }
                            }
                        });
                    }
                });
            }
        } else {
            this.selfHelp(channel, guild, handler);
        }
    }
}

class setprefix extends Command {
	constructor() {
        super("setprefix", ["setprefix"], "setprefix <prefix>", "set the prefix the bot should use on this server.")
    }
	message(content, author, channel, guild, message, handler) {
        content = content.trim();
        if (content) {
    		handler.guildData["prefix"][guild.id] = content;
            util.writeJSONSync(handler.guildSave, handler.guildData);
        } else {
            this.selfHelp(channel, guild, handler);
        }
	}
}

class RichEmbed extends Discord.RichEmbed {
	constructor() {
		super();
		this.setTimestamp();
		this.setFooter("Wagyourtail 2019. bit.ly/QualityBot");
	}
}
Discord.RichEmbed = RichEmbed;
module.exports = Discord;
module.exports.util = util;
module.exports.Client = Client;
module.exports.Command = Command;
