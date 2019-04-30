const Discord = require("../../CommandHandler.js");
const aki = require('aki-api');

let ids = {};

let waitForReact = (channel,author,msg) => {
	return new Promise((res)=>{
			const filter = (r,u) => u.id == author.id;
			const sel = {"✔":0,"✖":1,"ℹ":2,"🇵":3,"🇳":4}

			msg.awaitReactions(filter, {max:1}).then(collected => {
				Array.from(collected.values())[0].remove(author.id);
				if (Object.keys(sel).includes(collected.keyArray()[0])) {
					res(sel[collected.keyArray()[0]]);
				}
				else {
					waitForReact(gd,channel,author).then(res);
				}
			})
	})
}


class akinator extends Discord.Command {
	constructor() {
        super("akinator", ["akinator","aki"], "akinator", "start a game of akinator", "Akinator");
    }
    message(content, author, channel, guild, message, handler) {
		let a = async () => {
			const gd = await aki.start('en2')
			let ni = {'nextStep':0,'progress':'0'};
			let msg = await channel.send(new Discord.RichEmbed().setTitle("Akinator").setDescription(`Question #${ni.nextStep+1}`).addField(gd.question,`Progress: ${parseInt(ni.progress)}%`).addField("Options","✔:Yes	✖:No	ℹ:Don't Know	🇵:Probably	🇳:Probably Not", true))
			msg.react("✔").then(()=>{msg.react("✖").then(()=>{msg.react("ℹ").then(()=>{msg.react("🇵").then(()=>{msg.react("🇳")})})})});
				do {
					ni = await aki.step('en2',gd.session,gd.signature, await waitForReact(channel,author,msg), ni.nextStep)
					msg.edit(new Discord.RichEmbed().setTitle("Akinator").setDescription(`Question #${ni.nextStep+1}`).addField(ni.nextQuestion,`Progress: ${parseInt(ni.progress)}%`).addField("Options","✔:Yes	✖:No	ℹ:Don't Know	🇵:Probably	🇳:Probably Not", true))
				} while (parseFloat(ni.progress) < 85);
				const win = await aki.win('en2',gd.session,gd.signature,ni.nextStep)
				msg.edit(new Discord.RichEmbed().setTitle("Akinator").setDescription("").addField(`${win.answers[0].name}`,`${win.answers[0].description}`,true).addField(`Questions: ${ni.nextStep+1}`,`certainty: ${parseInt(parseFloat(win.answers[0].proba)*100)}%`).setImage(win.answers[0].absolute_picture_path))
				msg.clearReactions();
		}
		a();
	}
}

module.exports.load = function (client) {
	client.addCommand(new akinator());
}