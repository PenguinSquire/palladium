const { AttachmentBuilder, SlashCommandBuilder } = require('discord.js');
const https = require('https');
const fs = require('fs');
const modules = require("../../modules/modules.js")

async function downloadVideo(url, vars) {
    return new Promise((resolve, reject) => {
        const destination = vars.fileLocation + 0 + vars.fileType
        const file = fs.createWriteStream(destination);

        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => {
                    modules.log.info(vars.randomInteger, 'Video downloaded successfully');
                    vars.totalFiles++
                    resolve(); // resolve can be here because as soon as it starts closing files, it means its done with our one video file
                });
            });
        }).on('error', (err) => {
            fs.unlink(destination, () => {
                modules.log.error(vars.randomInteger, 'Error downloading file:', err);
            });
        });
    });
}

async function downloadImages(pickerObject, vars) {
    return new Promise((resolve, reject) => {
        for (i in pickerObject) {
            const imageURL = pickerObject[i].url
            vars.fileType = '.' + imageURL.split(/[#?]/)[0].split('.').pop().trim();

            const destination = vars.fileLocation + i + vars.fileType
            const file = fs.createWriteStream(destination);

            https.get(imageURL, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(() => {
                        //console.log(`${i} image downloaded`)
                    });
                });
            }).on('error', (err) => {
                fs.unlink(destination, () => {
                    modules.log.error(vars.randomInteger, 'Error downloading file:', err);
                });
            });
        }
        vars.totalFiles = pickerObject.length
        modules.log.info(vars.randomInteger, `${vars.totalFiles} Images downloaded successfully`);
        setTimeout(() => { // gives extra time before resolving
            resolve(); // resolve has to get extra time for images because there's more than one im p sure
        }, 2000);
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

        const randInt = Math.floor(Math.random() * 100000000); //randInt is my stupid way of getting the interaction ID

        let nugget = { //no particular reason i named the variable nugget
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

        const audioOnly = interaction.options.getBoolean('audio-only') ?? false; // ?? means default
        const quality = interaction.options.getString('quality') ?? '720';

        try {
            if (audioOnly)
                nugget.fileType = ".mp3"
            if (!isValidUrl(link))
                return interaction.editReply(`\"${link}\" is not a valid link`);

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
                    modules.log.error(nugget.randomInteger, `API error:`, err);
                    return 'Error:', err;
                });
            const textResponse = async () => {

                for (var i = 1; i <= 3; i++) { //try 3 times to download if cobalt returns the "try again" error code
                    const response = await apiResponse
                    const stringResponse = JSON.parse(await response)
                    //console.log(`string response: ${stringResponse}`)
                    nugget.APIstatus = stringResponse['status'];
                    //console.log("status: " + status)


                    if (nugget.APIstatus == 'success' || nugget.APIstatus == 'stream' || nugget.APIstatus == "redirect") { //all the non-fail API responses
                        //console.log("url: " + stringResponse['url'])
                        try {
                            await downloadVideo(stringResponse['url'], nugget)
                            nugget.failure = false
                            return 'Success!'
                        } catch (videoError) {
                            console.error(`${nugget.randomInteger} Video Error:`, videoError)
                            return `video download failed: ${videoError}`
                        }
                    }
                    else if (nugget.APIstatus == 'picker') { // picker means API returned more than one thing

                        //console.log("pickerType: " + stringResponse['pickerType'])
                        //console.log("picker: " + stringResponse['picker'])
                        try {
                            await downloadImages(stringResponse['picker'], nugget)
                            nugget.failure = false
                            return ("picker? i hardly know her")
                        } catch (imageError) {
                            modules.log.error(nugget.randomInteger, `Image Download`, imageError)
                            return `image download failed: ${imageError}`
                        }

                    } else { // all the Cobalt API error catching
                        modules.log.warn(nugget.randomInteger, `Cobalt API Returned ${stringResponse['status']}: ${stringResponse['text']}`)
                        if (stringResponse['text'].includes("i couldn't process your request"))
                            return `Cobalt couldn't handle your request. Are you sure it's a valid link?`;
                        else if (stringResponse['text'].includes("cobalt is at capacity"))
                            return `Cobalt API is at capacity right now. Try again in a few seconds!`
                        //the two sections where you probably just need to retry
                        else if (stringResponse['text'].includes("something went wrong when i" && i !== 3))
                            continue
                        else if (stringResponse['text'].includes("something went wrong when i" && i == 3))
                            return `Tried ${i} times. Cobalt didn't like your link`
                        else
                            return `Cobalt API returned ${stringResponse['status']}: \n-# ${stringResponse['text']}`
                    }
                }
                //im desperately hoping that this never executes but i dont have an easy way to test the "try again" part
                return "my \`for\` loop broke somehow :((("

            };
            nugget.reply = await textResponse()
            //console.log("reply: " + nugget.reply)
            let fileAttachments = [];
            let tempArray = [];
            let h = 0; // h is how many messages need to be sent
            let j = 0; // j is the number of files per message
            for (let i = 0; i < nugget.totalFiles; i++) {
                tempArray[j] = new AttachmentBuilder(nugget.fileLocation + i + nugget.fileType);
                //console.log(nugget.fileLocation + i + nugget.fileType)
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
            fileAttachments[h] = tempArray // get all the remaining elements for the final message
            //console.log(`${nugget.randomInteger} tempArray: ${tempArray}`)
            //console.log(`${nugget.randomInteger} fileAttachments ${h}: ${fileAttachments[h]}`)
            //const file = new AttachmentBuilder(nugget.fileLocation + i + nugget.fileType);
            if (!nugget.failure) {
                await interaction.editReply({ files: fileAttachments[0] }); //embeds the newly downloaded video; i dont know what happens if its too large

                if (h > 0) // sends more messages if its more than 10 files
                    for (let i = 1; i <= h; i++) {
                        //console.log(`do we get here (${i})`)
                        //await interaction.followUp("test");
                        await interaction.followUp({ files: fileAttachments[i] });
                    }

                for (let i = 0; i < nugget.totalFiles; i++) { // deletes temp files
                    fs.unlink(nugget.fileLocation + i + nugget.fileType, function (err) {
                        if (err && err.code == 'ENOENT') {
                            // file doens't exist
                            modules.log.info(nugget.randomInteger, `File doesn't exist, won't remove it.`);
                        } else if (err) {
                            // other errors, e.g. maybe we don't have enough permission
                            modules.log.error(nugget.randomInteger, `Error occurred while trying to remove file at ` + nugget.fileLocation + i + nugget.fileType, err);
                        }
                    });
                }
                modules.log.info(nugget.randomInteger, `${nugget.totalFiles} files removed`);
            } else //something failed; print error message
                await interaction.editReply({ content: nugget.reply });

        } catch (error) { //try catch around the entire bot lets goooo
            modules.log.error(nugget.randomInteger, `catchall:`, error)
            await interaction.editReply(`bot broke for some reason :( \n-# ${error}`);
        }
    },
};