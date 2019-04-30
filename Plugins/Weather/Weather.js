const Discord = require("../../CommandHandler.js");
const weather = require('weather-js');

class weatherCl extends Discord.Command {
	constructor() {
        super("weather", ["weather"], "weather <location>", "weather query", "Weather");
    }
	message(content, author, channel, guild, message, handler) {
		weather.find({search: content, degreeType: 'C'}, (err,res) => {
			if (res[0]) {
				channel.send(new Discord.RichEmbed().setTitle(res[0].location.name).setDescription(`${res[0].location.lat}°${parseFloat(res[0].location.lat) > 0 ? "N" : "S"}, ${Math.abs(parseFloat(res[0].location.long))}°${parseFloat(res[0].location.lat) > 0 ? "W" : "E"}`).addField("Temperature",`${Math.round(parseFloat(res[0].current.temperature)*1.8+32)}°F (${res[0].current.temperature}°C)\nFeels Like: ${parseFloat(res[0].current.feelslike)*1.8+32}°F (${res[0].current.feelslike}°C)\nHumidity:${res[0].current.humidity}%`, true).addField("Wind",res[0].current.winddisplay,true).setThumbnail(res[0].current.imageUrl))
			}
		});
	}
}

module.exports.load = function (client) {
	client.addCommand(new weatherCl());
}