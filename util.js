const fs = require('fs');
if (!fs.existsSync('./configs')) fs.mkdirSync('./configs');

/**
 * Opens a json file and returns the data
 * @param {string} JSONFile The file to retrive data from
 * @returns {Promise<Object>}
 */
function openJSON(JSONFile) {
    return new Promise((resolve, reject) => {
        fs.readFile(JSONFile, 'utf8', (err, data) => {
            if (err) return reject(err);
            try {
                return resolve(JSON.parse(data));
            } catch (e) {
                return reject(e);
            }
        });
    });
}

/**
 * Writes a json object to a file
 * @param {string} JSONFile The file to write to
 * @param {Object} JSONObject The object to write to file
 * @returns {Promise<string>}
 */
function writeJSON(JSONFile, JSONObject) {
    return new Promise((resolve, reject) => {
        fs.writeFile(JSONFile, JSON.stringify(JSONObject, null, '\t'), 'utf8', (err) => {
            if (err) return reject(err);
            return resolve('File saved');
        });
    });
}

/**
 * Opens a json file and returns the data
 * @param {string} JSONFile The file to retrive data from
 * @returns {Object}
 */
function openJSONSync(JSONFile) {
    return JSON.parse(fs.readFileSync(JSONFile));
}

/**
 * Writes a json object to a file
 * @param {string} JSONFile The file to write to
 * @param {Object} JSONObject The object to write to file
 */
function writeJSONSync(JSONFile, JSONObject) {
    fs.writeFileSync(JSONFile, JSON.stringify(JSONObject, null, '\t'));
}

/**
 * converts H:M:S to milliseconds
 * @param {string} time A time string in hours:minutes:seconds format
 * @returns {number}
 */
function timeToMs(time) {
    var final = 0;
    var hms = time.split(':');
    for (var i = 0; i < hms.length; i++) {
        var newfinal = final + (parseInt(hms[i]) * Math.pow(60, hms.length - (i + 1)));
        final = newfinal;
    }
    var ms = final * 1000;
    return ms;
}





function msToTime(duration) {
    var milliseconds = parseInt((duration % 1000) / 100)
        , seconds = parseInt((duration / 1000) % 60)
        , minutes = parseInt((duration / (1000 * 60)) % 60)
        , hours = parseInt((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}


/**
 * Checks if a GuildMember has a certain Role
 * @param {external:GuildMember} member The GuildMember to check for a role.
 * @param {external:Role} role The Role to look for.
 * @returns {boolean}
 */
function hasRole(member, role) {
    if (role.id === role.guild.id) return true;
    return member.roles.has(role.id);
}

exports.hasRole = hasRole;
exports.timeToMs = timeToMs;
exports.msToTime = msToTime;
exports.writeJSON = writeJSON;
exports.openJSON = openJSON;
exports.writeJSONSync = writeJSONSync;
exports.openJSONSync = openJSONSync;
