const { AttachmentBuilder, SlashCommandBuilder } = require('discord.js');
const http = require('https'); // or 'https' for https:// URLs
const fs = require('fs');
const thomasGif = 'https://cdn.discordapp.com/attachments/869737680727056437/1261720531477069834/gifmov.gif?ex=66c6be10&is=66c56c90&hm=e33a783d2e60a3a78234d0978817bb1b2e65d2f477f16785ddbf3725f1be18f6&'

function downloadVideo(url, vars) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(vars.fileLocation + 0 + vars.fileType);
        vars.totalFiles++
        const request = http.get(url, function (response) {
            response.pipe(file);

            // after download completed close filestream
            file.on("finish", () => {
                file.close();
            });
        });
        console.log(`${vars.randomInteger} - ${vars.totalFiles} Video Download Completed`);
        setTimeout(() => {
            resolve();
        }, 5000);
    });
}
function downloadImages(pickerObject, vars) {
    return new Promise((resolve, reject) => {
        for (i in pickerObject) {
            const imageURL = pickerObject[i].url
            vars.fileType = '.' + imageURL.split(/[#?]/)[0].split('.').pop().trim();
            const file = fs.createWriteStream(vars.fileLocation + i + vars.fileType);
            const request = http.get(imageURL, function (response) {
                response.pipe(file);

                // after download completed close filestream
                file.on("finish", () => {
                    file.close();
                });
            });

            vars.totalFiles = parseInt(i) + 1
            //console.log((`${i} / ${vars.totalFiles} - ${pickerObject[i].url}`))
        }
        console.log(`${vars.randomInteger} - ${vars.totalFiles} Image Downloads Completed`);
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
    data: new SlashCommandBuilder()
        .setName('download')
        .setDescription('embeds video/images from a link')

        .addStringOption(option =>
            option.setName('link')
                .setDescription('The video or image link to embed')
                .setRequired(true))

        .addBooleanOption(option =>
            option.setName('audio-only')
                .setDescription('If you only want the video\'s audio')
                .setRequired(false))

        .addStringOption(option =>
            option.setName('quality')

                .setDescription('If video media needs a lower quality to be uploaded')
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

        const randInt = Math.floor(Math.random() * 100000000);
        let nugget = {
            randomInteger: randInt,
            failure: true,
            APIstatus: '',
            fileLocation: `tempFiles/${randInt}_temp`,
            fileType: '.mp4',
            totalFiles: 0,
            reply: 'i dont know what went wrong'
        };

        //parse all the user choices
        const link = interaction.options.getString('link');
        const encodedLink = encodeURI(link); // cobalt requires links to be sent as URI

        const audioOnly = interaction.options.getBoolean('audio-only') ?? false;
        const quality = interaction.options.getString('quality') ?? '720';

        //default values in case nothing changes them
        try {
            if (audioOnly)
                nugget.fileType = ".mp3"
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
                        console.error(`${nugget.randomInteger} Error:`, err);
                        return 'Error:', err;
                    });
                const textResponse = async () => {
                    //try 3 times to download if cobalt returns the "try again" error code
                    for (var i = 1; i <= 3; i++) {
                        const response = await apiResponse
                        const stringResponse = JSON.parse(await response)
                        const textResponse = await (response)
                        //console.log(`text response: ${textResponse}`)
                        //console.log(`string response: ${stringResponse}`)
                        nugget.APIstatus = stringResponse['status'];
                        //console.log("status: " + status)
                        //all the non-fail API responses
                        if (nugget.APIstatus == 'success' || nugget.APIstatus == 'stream' || nugget.APIstatus == "redirect") {
                            //console.log("url: " + stringResponse['url'])
                            try {
                                await downloadVideo(stringResponse['url'], nugget)
                                nugget.failure = false
                                return 'Success!'
                            } catch (videoError) {
                                console.error(`${nugget.randomInteger} Video Error:`, videoError)
                                return `video download failed: ${videoError}`
                            }
                        } else if (nugget.APIstatus == 'picker') {
                            //console.log("pickerType: " + stringResponse['pickerType'])
                            //console.log("picker: " + stringResponse['picker'])
                            try {
                                await downloadImages(stringResponse['picker'], nugget)
                                nugget.failure = false
                                return ("picker? i hardly know her")
                            } catch (imageError) {
                                console.error(`${nugget.randomInteger} Image Error:`, imageError)
                                return `image download failed: ${imageError}`
                            }

                        } else { // all the Cobalt API error catching
                            console.warn(`${nugget.randomInteger} Cobalt API Returned ${stringResponse['status']}: ${stringResponse['text']}`)
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
                    //im desperately hoping that this never works but i dont have a reliable way to test the "try again" part
                    return "my \`for\` loop broke somehow :((("

                };
                nugget.reply = await textResponse()
                //console.log("reply: " + nugget.reply)
                let fileAttachments = [];
                let tempArray = [];
                let h = 0;
                let j = 0;
                for (let i = 0; i < nugget.totalFiles; i++) {
                    tempArray[j] = new AttachmentBuilder(nugget.fileLocation + i + nugget.fileType);
                    console.log(nugget.fileLocation + i + nugget.fileType)
                    if (j == 9) {
                        //console.log(`${nugget.randomInteger} ${i}/${nugget.totalFiles}`)
                        fileAttachments[h] = tempArray
                        //console.log(`${nugget.randomInteger} fileAttachments ${h}: ${fileAttachments[h]}`)
                        tempArray = []
                        j = -1
                        h++
                    }
                    j++
                }
                fileAttachments[h] = tempArray
                //console.log(`${nugget.randomInteger} tempArray: ${tempArray}`)
                //console.log(`${nugget.randomInteger} fileAttachments ${h}: ${fileAttachments[h]}`)
                //const file = new AttachmentBuilder(nugget.fileLocation + i + nugget.fileType);
                if (!nugget.failure) {
                    //embeds the newly downloaded video; i dont know what happens if its too large
                    await interaction.editReply({ files: fileAttachments[0] });
                    if (h > 0)
                        for (let i = 1; i <= h; i++) {
                            //console.log(`do we get here (${i})`)
                            //await interaction.followUp("test");
                            await interaction.followUp({ files: fileAttachments[i] });
                        }


                    //deletes temp files
                        //testing if all the videos download correctly
                    /* for (let i = 0; i < nugget.totalFiles; i++) {
                        fs.unlink(nugget.fileLocation + i + nugget.fileType, function (err) {
                            if (err && err.code == 'ENOENT') {
                                // file doens't exist
                                console.info(`${nugget.randomInteger} File doesn't exist, won't remove it.`);
                            } else if (err) {
                                // other errors, e.g. maybe we don't have enough permission
                                console.error(`${nugget.randomInteger} Error occurred while trying to remove file at ` + nugget.fileLocation + i + nugget.fileType);
                            }
                        });
                    }
                    console.info(`${nugget.randomInteger} - ${nugget.totalFiles} files removed`); */
                } else { //something failed; print error message
                    await interaction.editReply({ content: nugget.reply });
                }
            } else // skip everything if it isnt even a link
                await interaction.editReply(`\"${link}\" is not a valid link`);

        } catch (error) { //try catch around the entire bot lets goooo
            console.error(`${nugget.randomInteger} catchall:`, error)
            await interaction.editReply(`bot broke for some reason :( \n-# ${error}`);
        }
    },
};