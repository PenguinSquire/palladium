const { AttachmentBuilder, SlashCommandBuilder } = require('discord.js');
const http = require('https'); // or 'https' for https:// URLs
const fs = require('fs');

let failure
let fileLocation = "tempFiles/temp.mp4"
const thomasGif = 'https://cdn.discordapp.com/attachments/869737680727056437/1261720531477069834/gifmov.gif?ex=66c6be10&is=66c56c90&hm=e33a783d2e60a3a78234d0978817bb1b2e65d2f477f16785ddbf3725f1be18f6&'

function downloadVideo(url) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(fileLocation);
        const request = http.get(url, function (response) {
            response.pipe(file);

            // after download completed close filestream
            file.on("finish", () => {
                file.close();
                console.log("Download Completed");
            });
        });
        setTimeout(() => {
            resolve();
        }, 5000);
    });
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (err) {
        return false;
    }
}

module.exports = {
    dm_permission: true,
    data: new SlashCommandBuilder()
        .setName('download')
        .setDescription('embeds images from links')

        .addStringOption(option =>
            option.setName('link')
                .setDescription('The video link to embed')
                .setRequired(true))

        .addBooleanOption(option =>
            option.setName('audio-only')
                .setDescription('If you only want audio')
                .setRequired(false))

        .addStringOption(option =>
            option.setName('quality')

                .setDescription('If media needs a lower quality to be uploaded')
                .addChoices(
                    { name: '144p', value: '144' },
                    { name: '240p', value: '240' },
                    { name: '360p', value: '360' },
                    { name: '480p', value: '480' },
                    { name: '720p', value: '720' },
                    { name: '1080p', value: '1080' },
                    { name: '2160p', value: '2160' },
                    { name: 'max', value: 'max' },
                )),
    
    //bot response start
    async execute(interaction) {
        //defer gives you more than 3 seconds to return the response
        await interaction.deferReply({ ephemeral: false });

        //parse all the user choices
        const link = interaction.options.getString('link');
        const encodedLink = encodeURI(link); // cobalt requires links to be sent as URI

        const audioOnly = interaction.options.getBoolean('audio-only') ?? false;
        const quality = interaction.options.getString('quality') ?? '720';

        //default values in case nothing changes them
        let reply = 'i dont know what went wrong';
        failure = true;
        
        if (audioOnly)
            fileLocation = "tempFiles/temp.mp3"
        if (isValidUrl(link)) {

            const apiResponse = fetch('https://api.cobalt.tools/api/json', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: encodedLink,
                    vQuality: quality.toString(),
                    isAudioOnly: audioOnly
                })
            })
                .then((fetchResponse) => {
                    return fetchResponse.text()
                })
                .catch(err => {
                    console.error('Error:', err);
                    return 'Error:', err;
                });
            const textResponse = async () => {
                //try 3 times to download if cobalt returns the "try again" error code
                for (var i = 1; i <= 3; i++) {
                    try {
                        const stringResponse = JSON.parse(await apiResponse)
                        console.log("status: " + stringResponse["status"])
                        console.log("url: " + stringResponse['url'])
                        //all the non-fail API responses
                        if (stringResponse["status"] == 'success' || stringResponse['status'] == 'stream' || stringResponse['status'] == "redirect") {
                            await downloadVideo(stringResponse['url'])
                            failure = false
                            return 'Success!'
                        } else { // all the Cobalt API error catching
                            console.warn(`Cobalt API Returned ${stringResponse['status']}: ${stringResponse['text']}`)
                            if (stringResponse['text'].includes("i couldn't process your request"))
                                return `Cobalt couldn't handle your request. Are you sure it's a valid link?`;
                            //the two sections where you probably just need to retry
                            else if (stringResponse['text'].includes("something went wrong when i" && i !== 3))
                                continue
                            else if (stringResponse['text'].includes("something went wrong when i" && i == 3))
                                return `Tried ${i} times. Cobalt didn't like your link`
                            else
                                return `Cobalt API returned ${stringResponse['status']}: ${stringResponse['text']}`
                        }
                    }
                    catch (error) { //try catch around the entire bot lets goooo
                        console.log(error)
                        return "i dont know what you just did but it broke my bot please dont do it again"
                    }
                }
                //im desperately hoping that this never works but i dont have a reliable way to test the "try again" part
                return "my \`for\` loop broke somehow :((("

            };
            reply = await textResponse()
            //console.log("reply: " + reply)
            const file = new AttachmentBuilder(fileLocation);
            if (!failure) {
                //embeds the newly downloaded video; i dont know what happens if its too large
                await interaction.editReply({ files: [file] });
                
                //deletes temp file
                fs.unlink(fileLocation, function (err) {
                    if (err && err.code == 'ENOENT') {
                        // file doens't exist
                        console.info("File doesn't exist, won't remove it.");
                    } else if (err) {
                        // other errors, e.g. maybe we don't have enough permission
                        console.error("Error occurred while trying to remove file");
                    } else {
                        console.info(`removed`);
                    }
                });
            } else { //something failed; print error message
                await interaction.editReply({ content: reply });
            }
        } else // skip everything if it isnt even a link
            await interaction.editReply(`\"${link}\" is not a valid link`);
    },
};