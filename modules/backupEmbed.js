function backupEmbed(link) {
    let newLink = link
    const splitLink = link.split("://www.")
    if (link.includes("instagram")) {
        newLink = `${splitLink[0]}://www.dd${splitLink[1]}`
    }
    console.log
    return newLink
}
module.exports = { backupEmbed }