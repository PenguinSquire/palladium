<!-- COMMENTS FOR MEEEEEE

end lines with two spaces: '  ' to go to the next line
non-breaking space for indentation: ' '
-->


# Palladium  
A discord bot that natively embeds images and videos in discord from a variety of sources by utilizing the [Cobalt API](https://github.com/imputnet/cobalt/tree/main)

      initially a re-implementation of the [Cobalt Downloader](https://discord.com/application-directory/1093352359989612627)  discord bot (unaffiliated with Cobalt API)  
  
## Setup
- you need to create `config.json` file containing the following code:  
```
{
	"token": "[INSERT TOKEN HERE]",
	"clientId": "[INSERT YOUR CLIENT ID]",
	"guildId": "[INSERT GUILD SERVER ID]",
	"myUserID": "[INSERT USER ID]"
}
```

- `process.env` also needs to be created with the following code:  
```
discordToken = [INSERT TOKEN HERE]
```

  
- a folder `tempFiles` may also need to be created just in the main Palladium folder  
- once you start running commands, `logs.txt` should auto-create and auto-populate  
  
I am not sure how to properly re-initialize the `node_modules` server  

## Startup

run `node index` to start the bot  
  
`node dev-deploy.js` to update the guild commands.  
      This will deploy commands in the `guild` and `dev` folders  
`node global-deploy.js` to update the global commands.  
      This will deploy commands in the `global` and `universal` folders  
  
`node deleteAll.js` to delete all commands  
