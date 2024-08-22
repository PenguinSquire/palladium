const { AttachmentBuilder, SlashCommandBuilder } = require('discord.js');
const http = require('https'); // or 'https' for https:// URLs
const fs = require('fs');
//const path = require('node:path');
//const loc = path.join(__dirname, 'commands');

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
    //category: loc.substring(loc.lastIndexOf('\\') + 1, loc.length).toString(),
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

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });

        const link = interaction.options.getString('link');
        const encodedLink = encodeURI(link); // cobalt requires links to be sent as URI

        const audioOnly = interaction.options.getBoolean('audio-only') ?? false;
        const quality = interaction.options.getString('quality') ?? '720';

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
                    vQuality: quality,
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
                try {
                    const stringResponse = JSON.parse(await apiResponse)
                    console.log("different status? " + stringResponse["text"])
                    console.log("status: " + stringResponse["status"])
                    console.log("url: " + stringResponse['url'])
                    if (stringResponse["status"] == 'success' || stringResponse['status'] == 'stream' || apiResponse['status'] == "redirect") {
                        if (stringResponse['status'] == "redirect" || stringResponse['status'] == "ok") {
                            failure = false
                            return 'redirect: ', stringResponse['url'];
                        } else {
                            await downloadVideo(stringResponse['url'])
                            failure = false
                            return 'Success!'

                        }
                    } else {
                        console.warn(`Cobalt API Returned ${stringResponse['status']}: ${stringResponse['text']}`)
                        if (stringResponse['text'].includes("i couldn't process your request"))
                            return `Cobalt couldn't handle your request. Are you sure it's a valid link?`;
                        else
                            return `Cobalt API Returned ${stringResponse['status']}: ${stringResponse['text']}`
                    }
                }
                catch (error) {
                    console.log(error)
                    return "i dont know what you just did but it broke my bot please dont do it again"
                }

            };
            reply = await textResponse()
            //console.log("reply: " + reply)
            const file = new AttachmentBuilder(fileLocation);
            if (!failure) {
                await interaction.editReply({ content: reply, files: [file] });

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
            } else {
                await interaction.editReply({ content: reply });
            }
        } else
            await interaction.editReply(`\"${link}\" is not a valid link`);


        //setTimeout(async () => {
        //    await interaction.editReply(thomasGif);
        //}, 3000);
        //await interaction.followUp({ content: 'the actual video', ephemeral: false });
    },
};