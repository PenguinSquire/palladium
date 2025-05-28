const { AttachmentBuilder, SlashCommandBuilder } = require('discord.js');
const https = require('https');
const http = require('http');
const fs = require('fs');
const { log, backupEmbed, isTitle } = require("../../modules/modules.js")
const loadingEmoji = '<a:BlurpleLoading:1285784156579561483>'

const apiResponse = async (nugget, userChoices) => {
    const encodedLink = encodeURI(userChoices.link); // cobalt requires links to be sent as URI

    return await fetch('http://localhost:9000/', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            url: encodedLink,
            videoQuality: userChoices.quality.toString(),
            downloadMode: userChoices.audioOnly,
            filenameStyle: 'basic'
        })
    })
        .then(response => response.text())
        .then(response => JSON.parse(response))
        .catch(err => {
            log.error(nugget.randomInteger, `API error:`, err);
            return 'Error:', err;
        });
}

async function downloadVideo(nugget) {
    return new Promise((resolve, reject) => {
        const destination = nugget.fileLocation + 0 + nugget.fileType[0]
        const file = fs.createWriteStream(destination);

        const protocol = nugget.URL.startsWith('https') ? https : http;

        protocol.get(nugget.URL, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => {
                    log.info(nugget.randomInteger, 'Video downloaded successfully');
                    nugget.totalFiles++
                    resolve(); // resolve can be here because as soon as it starts closing files, it means its done with our one video file
                });
            });
        }).on('error', (err) => {
            fs.unlink(destination, () => {
                log.error(nugget.randomInteger, 'Error downloading file:', err);
            });
        });
    });
}

async function downloadImages(pickerObject, nugget) {
    return new Promise((resolve, reject) => {
        for (i in pickerObject) {
            const imageURL = pickerObject[i].url
            //console.log(imageURL)
            nugget.fileType[i] = imageURL.match(/\.([^.]*?)(?=\?|#|$)/)[0]; //gets the filetype

            const destination = nugget.fileLocation + i + nugget.fileType[i]
            const file = fs.createWriteStream(destination);

            const protocol = imageURL.startsWith('https') ? https : http;
            protocol.get(imageURL, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(() => {
                        //console.log(`${i} image downloaded`)
                    });
                });
            }).on('error', (err) => {
                fs.unlink(destination, () => {
                    log.error(nugget.randomInteger, 'Error downloading file:', err);
                });
            });
        }
        //console.log(vars.fileType)
        nugget.totalFiles = pickerObject.length
        log.info(nugget.randomInteger, `${nugget.totalFiles} Images downloaded successfully`);
        setTimeout(() => { // gives extra time before resolving
            resolve(); // resolve has to get extra time for images because there's more than one im pretty sure
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
        .setName('dev-download')
        .setDescription('embeds video/images from a link')
        .addStringOption(option =>
            option.setName('link')
                .setDescription('The video or image link to embed')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('audio-only')
                .setDescription('If you only want the video\'s audio'))
        .addBooleanOption(option =>
            option.setName('spoiler')
                .setDescription('If you want to spoiler the video/images'))
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
        await interaction.deferReply({ ephemeral: false }); //defer gives you more than 3 seconds to return the response

        const randInt = Math.floor(Math.random() * 100000000)
        let nugget = { //no particular reason i named the variable nugget
            randomInteger: randInt, //randInt is my stupid way of getting the interaction ID
            failure: true,
            URL: '',
            fileName: '',
            spoilerText: '',
            fileLocation: `tempFiles/${randInt}_temp`,
            fileType: Array('.mp4'),
            totalFiles: 0,
            reply: 'i dont know what went wrong'

        };

        //parse all the user choices
        let userChoices = {
            link: interaction.options.getString('link'),
            audioOnly: 'auto', // default to audio + visual
            quality: '720' // default to 720p
        }

        if (interaction.options.getBoolean('audio-only')) {
            userChoices.audioOnly = 'audio' // only download audio
            nugget.fileType[0] = ".mp3"
        }
        if (interaction.options.getBoolean('spoiler')) {
            nugget.fileLocation = `tempFiles/SPOILER_${randInt}_temp`
            nugget.spoilerText = '||'
        }

        userChoices.quality = interaction.options.getString('quality') ?? '720';

        try {
            if (!isValidUrl(userChoices.link))
                return interaction.editReply(`\"\`\`${nugget.spoilerText}${userChoices.link}${nugget.spoilerText}\`\`\" is not a valid link`);

            log.link(nugget.randomInteger, userChoices.link)

            const textResponse = async () => {
                for (var i = 1; i <= 3; i++) { //try 3 times to download if cobalt returns the "try again" error code
                    let stringResponse = await apiResponse(nugget, userChoices)
                    if (stringResponse instanceof Error) { // if response is an error
                        log.info(nugget.randomInteger, `${stringResponse.name}: ${stringResponse.message}`)
                        if (stringResponse.message == "fetch failed") {
                            return "Cobalt API appears to be down right now"
                        } else {
                            return `There was an unknown error with the API \n-# ${stringResponse.name}: ${stringResponse.message}`
                        }
                    } else {
                        log.info(nugget.randomInteger, `Before: ${nugget.randomInteger} - ${userChoices.link}`)
                        userChoices.link = backupEmbed(userChoices.link)
                        log.info(nugget.randomInteger, `After:  ${nugget.randomInteger} - ${userChoices.link}`)
                        //nugget.APIstatus = stringResponse['status'];
                        console.log(nugget.randomInteger, stringResponse)
                        if (stringResponse['status'] == 'tunnel' || stringResponse['status'] == "redirect") { //all the non-fail API responses

                            try {
                                nugget.URL = stringResponse['url']
                                // extract the name and type if filename is there
                                let fileName = stringResponse['filename']
                                const typeMatch = fileName.substring(fileName.lastIndexOf('.'));; // extract any file type that exists
                                nugget.fileType[0] = typeMatch ? typeMatch : nugget.fileType[0]; // set the file type is one is found
                                
                                if (isTitle(fileName)) { // only run this is the file name is useful for the user
                                    fileName = typeMatch[0] ? fileName.replace(typeMatch[0], '') : fileName; // set the file name minus the type
                                    const dataMatch = fileName.match(/^(.*)\(/); // extract any extra data that exists
                                    nugget.fileName = dataMatch ? dataMatch[1].trimEnd() : fileName; // remove the extra data from the end from Cobalt
                                    console.log(nugget.fileName.match(/^(.*)\(/));
                                }

                                await interaction.editReply(`${loadingEmoji} downloading video \n-# [here is the download link](<${nugget.URL}>)`);
                                await downloadVideo(nugget)
                                nugget.failure = false
                                return 'Success!'
                            } catch (videoError) {
                                console.error(`${nugget.randomInteger} Video Error:`, videoError)
                                return `video download failed: ${videoError}`
                            }
                        }
                        else if (stringResponse['status'] == 'picker') { // picker means API returned more than one thing

                            try {
                                await downloadImages(stringResponse['picker'], nugget)
                                nugget.failure = false
                                return ("picker? i hardly know her")
                            } catch (imageError) {
                                log.error(nugget.randomInteger, `Image Download`, imageError)
                                return `image download failed: ${imageError}`
                            }

                        } else if (stringResponse['status'] == 'error') { // error
                            console.log(stringResponse['error'])
                            if (stringResponse['error'].code == 'error.api.fetch.short_link') {
                                return `Try a non-shortened link maybe?`
                            } else if (stringResponse['error'].code == 'error.api.youtube.login') {
                                return `error.api.youtube.login (???)`
                            }

                            else {
                                return `Cobalt returned an error I havent caught yet: \n\`${stringResponse['error'].code}\``
                            }

                        } else { // all the Cobalt API error catching
                            log.info(nugget.randomInteger, `got to the API else statement; i = ${i}`)
                            log.warn(nugget.randomInteger, `Cobalt API Returned ${stringResponse['status']}: ${stringResponse['text']}`)
                            if (stringResponse['text'].includes("i couldn't process your request"))
                                return `Cobalt couldn't handle your request. Are you sure it's a valid link?`;
                            else if (stringResponse['text'].includes("cobalt is at capacity"))
                                return `Cobalt API is at capacity right now. Try again in a few seconds!`
                            else if (stringResponse['text'].includes("i couldn't connect to the service api"))
                                return `Couldn't connect to the service API. Check <https://status.cobalt.tools/> and try again`
                            //the two sections where you probably just need to retry
                            else if (stringResponse['text'].includes("something went wrong when i tried getting info about your link")) {
                                if (i == 3)
                                    return `Tried ${i} times. Cobalt didn't like your link`
                                continue
                            }
                            else
                                return `Cobalt API returned ${stringResponse['status']}: \n-# ${stringResponse['text']}`
                        }
                    }
                }
                return "my \`for\` loop broke somehow :(((" //im desperately hoping that this never executes but i dont have an easy way to test the "try again" part

            };
            nugget.reply = await textResponse()
            if (nugget.URL != '')
                await interaction.editReply(`${loadingEmoji} uploading ${nugget.spoilerText}[video](<${userChoices.link}>)${nugget.spoilerText}`);

            let fileAttachments = [];
            let tempArray = [];
            let h = 0; // h is how many messages need to be sent
            let j = 0; // j is the number of files per message
            for (let i = 0; i < nugget.totalFiles; i++) {
                tempArray[j] = new AttachmentBuilder(nugget.fileLocation + i + nugget.fileType[i]);
                if (j == 9) {
                    fileAttachments[h] = tempArray
                    tempArray = []
                    j = -1
                    h++
                }
                j++
            }
            fileAttachments[h] = tempArray // get all the remaining elements for the final message


            if (!nugget.failure) {
                let message = `upload ${nugget.spoilerText}complete${nugget.spoilerText}`
                if (nugget.fileName != '') {
                    message = `${nugget.spoilerText}${nugget.fileName}${nugget.spoilerText}`
                }
                await interaction.editReply({ content: message, files: fileAttachments[0] }); //embeds the newly downloaded video; i dont know what happens if its too large
                if (h > 0) { // sends more messages if its more than 10 files
                    if (j == 0)
                        h--
                    for (let i = 1; i <= h; i++)
                        await interaction.followUp({ files: fileAttachments[i] });
                }

                log.info(nugget.randomInteger, `${nugget.totalFiles} files removed`);

            } else //something failed; print error message
                await interaction.editReply({ content: `${nugget.reply} \n${nugget.spoilerText}${userChoices.link}${nugget.spoilerText}` });

        } catch (error) { //try catch around the entire bot lets goooo
            if (error.name == 'AbortError') {
                log.error(nugget.randomInteger, `timeout`, error)
                await interaction.editReply(`upload timed out :( \n${nugget.spoilerText}[here is the link](${userChoices.link})${nugget.spoilerText}`);
            } else {
                log.error(nugget.randomInteger, `catchall:`, error)
                await interaction.editReply(`bot broke for some reason :( \n${nugget.spoilerText}${userChoices.link}${nugget.spoilerText} \n-# ${error}`);
            }
        } finally {
            for (let i = 0; i < nugget.totalFiles; i++) { // deletes temp files
                fs.unlink(nugget.fileLocation + i + nugget.fileType[i], function (err) {
                    if (err && err.code == 'ENOENT') // file doens't exist
                        log.info(nugget.randomInteger, `File doesn't exist, won't remove it.`);
                    else if (err) // other errors, e.g. maybe we don't have enough permission
                        log.error(nugget.randomInteger, `Error occurred while trying to remove file at ` + nugget.fileLocation + i + nugget.fileType[i], err);
                });
            }
        }
    },
};