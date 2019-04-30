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
                            if (msg.member.hasPermission("ADMINISTRATOR") || checkRoles(this.guildData["guilds"][msg.guild.id], msg.member.roles, `${command.group}.${command.name}`) || msg.author.id == "100748674849579008") {
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
					let roles = [];
					for (const role in handler.guildData["guilds"][guild.id]) {
					if (handler.guildData["guilds"][guild.id][role].includes(`${command.group}.${command.name}`)) roles.push(guild.roles.get(role).toString());
					}
					console.log(roles.join(", ") ? roles.join(", ") : 'none');
                    channel.send({ embed: new Discord.RichEmbed().setTitle(`Help: ${command.name}`).setDescription(command.description).addField("Aliases", command.aliases.join(", "), true).addField("Usage", command.usage, true).setTimestamp().addField("Group", command.group, true).addField("Roles", roles.join(", ") ? roles.join(", ") : 'none', true) });
                }
            });
        }
    }
}

class roles extends Command {
    constructor() {
        super("roles", ["roles"], "roles list \nroles set <role> <command>\nroles del <role><command>", "set the permissions for a role")
    }
    message(content, author, channel, guild, message, handler) {
        if (content.startsWith("list")) {
            let msg = new Discord.RichEmbed();
            msg.setTimestamp();
            msg.setThumbnail(handler.user.avatarURL);
            msg.setTitle("Roles:");
            msg.setDescription("Rolename and available commands to that role listed. Anyone with ADMINISTRATOR gets all perms. set roles with `role set <group by name or number> <group>.<command>`");
            for (const role of Object.keys(handler.guildData.guilds[guild.id])) {
                msg.addField(guild.roles.get(role).name, `\`${handler.guildData.guilds[guild.id][role].join("`, `")}\``, false);
            }
            channel.send({ embed: msg });
        }
        else if (content.startsWith("set")) {
            content = content.substring(4);
            let id = content.match(/[^\d]*(\d+).*? (.+\..+)/);
            guild.roles.forEach(role => {
                if (id[1] ? role.id == id[1] : role.name.toLowerCase() == id[3].trim().toLowerCase()) {
                    if (!handler.guildData.guilds[guild.id][role.id]) {
                        handler.guildData.guilds[guild.id][role.id] = [];
                    }
                    if (handler.registry.has(id[2] ? id[2] : id[4])) {
                        if (!handler.guildData.guilds[guild.id][role.id].includes(id[2] ? id[2] : id[4])) {
                            handler.guildData.guilds[guild.id][role.id].push(id[2] ? id[2] : id[4]);
                            util.writeJSONSync(handler.guildSave, handler.guildData);
                        }
                    }
                }
            });
        }
        else if (content.startsWith("del")) {
            content = content.substring(4);
            let id = content.match(/[^\d]*(\d+).* (.+\..+)|(.+) (.+\..+)/);
            guild.roles.forEach(role => {
                if (id[1] ? role.id == id[1] : role.name.toLowerCase() == id[3].trim().toLowerCase()) {
                    if (!handler.guildData.guilds[guild.id][role.id]) {
                        handler.guildData.guilds[guild.id][role.id] = [];
                    }
                    console.log(handler.registry.has(id[2]) || handler.registry.has(id[4]));
                    if (handler.registry.has(id[2] ? id[2] : id[4])) {
                        if (handler.guildData.guilds[guild.id][role.id].includes(id[2] ? id[2] : id[4])) {
                            handler.guildData.guilds[guild.id][role.id].splice(handler.guildData.guilds[guild.id][role.id].indexOf(id[2] ? id[2] : id[4]), 1);
                            util.writeJSONSync(handler.guildSave, handler.guildData);
                        }
                    }
                }
            });

        }
    }
}

class setprefix extends Command {
	constructor() {
        super("setprefix", ["setprefix"], "setprefix <prefix>", "set the prefix the bot should use on this server.")
    }
	message(content, author, channel, guild, message, handler) {
		handler.guildData["prefix"][guild.id] = content;
        util.writeJSONSync(handler.guildSave, handler.guildData);
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