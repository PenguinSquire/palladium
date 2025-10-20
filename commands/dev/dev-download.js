const { AttachmentBuilder, SlashCommandBuilder } = require('discord.js');
const https = require('https');
const http = require('http');
const fs = require('fs');
const { log, backupEmbed, isTitle } = require("../../modules/modules.js");
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

async function download(wholeObject, nugget) {
    console.log(wholeObject)
    let pickerObject = wholeObject['picker']

    // list of promises we gotta wait for
    const downloadPromises = [];

    let i = 0;
    for (i = 0; i < pickerObject.length; i++) {
        const imageURL = pickerObject[i].url

        //gets the filename(if its there)
        const fileName = pickerObject[i].filename
        // extract any file type that exists
        const typeMatch = fileName?.substring(fileName.lastIndexOf('.')); // ? passes undefined instead of erroring out
        if (typeMatch) {
            nugget.fileType[i] = typeMatch // set the file type if one is found
        } else {
            // try to look for one in the url??
            nugget.fileType[i] = imageURL.match(/\.([^.]*?)(?=\?|#|$)/)?.[0] ?? nugget.fileType[i]; // if no extension found, default to ".mp4"
        }
        // push the promise returned by gimmeGhoul
        downloadPromises.push(gimmeGhoul(nugget, imageURL, i));
    }
    // if optional audio exists and they want it
    if (nugget.optionalAudio && typeof wholeObject["audio"] != "undefined") {
        nugget.fileType[i] = ".mp3"
        // push the promise returned by gimmeGhoul
        downloadPromises.push(gimmeGhoul(nugget, wholeObject["audio"], i));
    }

    // wait for every download to finish
    await Promise.all(downloadPromises);

    log.info(nugget.randomInteger, `${nugget.totalFiles} Files downloaded successfully`);
}


function gimmeGhoul(nugget, imageURL, i = 0) {
    return new Promise((resolve, reject) => {
        const destination = nugget.fileLocation + i + nugget.fileType[i]
        const file = fs.createWriteStream(destination);
        const protocol = imageURL.startsWith('https') ? https : http;

        const timeout = setTimeout(() => {
            file.destroy();
            try { fs.unlinkSync(destination); } catch { }
            reject(new Error(`Download timed out after 30 seconds`));
        }, 30000);

        protocol.get(imageURL, (response) => {
            response.pipe(file);

            file.on('finish', () => {
                file.close(() => {
                    clearTimeout(timeout);
                    try {
                        const fileStats = fs.statSync(destination);
                        const fileSize = fileStats.size;
                        console.info(`File: ${destination} created with size: ${fileSize}`);
                        if (fileSize == 0) {
                            fs.unlinkSync(destination); // clean up
                            return reject(new Error(`returned 0 byte file`));
                        }
                        nugget.totalFiles++
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                });
            });
        }).on('error', (err) => {
            clearTimeout(timeout);
            fs.unlink(destination, () => {
                log.error(nugget.randomInteger, 'Error downloading files:', err);
                reject(err);
            });
        });
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
        .setDescription('embeds media from a link')
        .addStringOption(option =>
            option.setName('link')
                .setDescription('The media link to embed')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('audio-only')
                .setDescription('If you only want the media\'s audio'))
        .addBooleanOption(option =>
            option.setName('spoiler')
                .setDescription('If you want to spoiler the media'))
        .addBooleanOption(option =>
            option.setName('extra-audio')
                .setDescription('If you want to attach any additional audio from multi-media posts (enabled by default)'))
        .addStringOption(option =>
            option.setName('quality')
                .setDescription('If the media needs a lower quality to be uploaded')
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
            optionalAudio: true,
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

        nugget.optionalAudio = interaction.options.getBoolean('extra-audio') ?? true;
        userChoices.quality = interaction.options.getString('quality') ?? '720';

        try {
            if (!isValidUrl(userChoices.link))
                return interaction.editReply(`\"\`\`${nugget.spoilerText}${userChoices.link}${nugget.spoilerText}\`\`\" is not a valid link`);

            log.link(nugget.randomInteger, userChoices.link)

            const textResponse = async () => {
                //funny section
                if (nugget.randomInteger % 1000 == 2) {
                    userChoices.link = "I'm not giving you that";
                    log.egg(nugget.randomInteger, `not doing that`)
                    return "Hi! It's me, The Computer"
                }
                if (nugget.randomInteger % 1000 == 46) {
                    userChoices.link = "https://www.tumblr.com/palladium-archive/795441871259336704"
                    log.egg(nugget.randomInteger, `annoying dog`)
                }

                let stringResponse = await apiResponse(nugget, userChoices)
                if (stringResponse instanceof Error) { // if response is an error
                    log.info(nugget.randomInteger, `${stringResponse.name}: ${stringResponse.message}`)
                    if (stringResponse.message == "fetch failed") {
                        return "Cobalt API appears to be down right now"
                    } else {
                        return `There was an unknown error with the API \n-# ${stringResponse.name}: ${stringResponse.message}`
                    }
                } else {
                    userChoices.link = backupEmbed(userChoices.link)
                    //console.log(nugget.randomInteger, stringResponse)

                    if (stringResponse['status'] == 'error') { // error
                        log.api(nugget.randomInteger, stringResponse['error'].code)

                        let message = `Cobalt returned an error I havent caught yet: \n\`${stringResponse['error'].code}\``

                        if (stringResponse['error'].code == 'error.api.fetch.short_link') {
                            message = `Try a non-shortened link maybe?`
                        } else if (stringResponse['error'].code == 'error.api.youtube.login') {
                            message = `Youtube thinks I am a bot\n Try again in a few hours maybe(?)`
                        } else if (stringResponse['error'].code == 'error.api.content.post.age') {
                            message = `The media is age restricted and cannot be accessed`
                        } else if (stringResponse['error'].code == 'error.api.link.invalid') {
                            message = `This link is not currently supported`
                        } else if (stringResponse['error'].code == 'error.api.content.video.unavailable') {
                            message = `The media was unavialable\n-# usually, this means it is member-exclusive`
                        } else if (stringResponse['error'].code == 'error.api.fetch.empty') {
                            message = `Cobalt returned an empty file\n-# This usually means the platform thinks I'm a bot`
                        }
                        return message

                    } else {
                        await interaction.editReply(`${loadingEmoji} downloading media..`);
                        //all the non-fail API responses
                        console.log(stringResponse)
                        try {
                            if (stringResponse['status'] == 'tunnel' || stringResponse['status'] == "redirect") {
                                // extract the name of the file
                                const fileName = stringResponse['filename'];
                                const title = fileName.substring(0, fileName.lastIndexOf('.'));
                                if (isTitle(title)) { // only run this is the file name is useful for the user
                                    const dataMatch = title.match(/^(.*)\(/); // extract any extra data that exists
                                    nugget.fileName = dataMatch ? dataMatch[1].trimEnd() : title; // remove the extra data at the end from Cobalt
                                    console.log(nugget.fileName);
                                }

                                // encase it in a picker object to work alongside "picker" objects
                                stringResponse = { picker: [stringResponse] };
                            }

                            await download(stringResponse, nugget)
                            nugget.failure = false
                            return 'Success!'
                        } catch (mediaError) {
                            log.error(nugget.randomInteger, `Media Error`, mediaError)
                            return `media download failed: ${mediaError.message}`
                        }
                    }
                    // catchall???
                    return `Cobalt API returned ${stringResponse['status']}: \n-# ${stringResponse['text']}`
                }
            };
            nugget.reply = await textResponse()
            await interaction.editReply(`${loadingEmoji} uploading ${nugget.spoilerText}[media](<${userChoices.link}>)${nugget.spoilerText}`);

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