function backupEmbed(link) {
    let www = ''
    let fix = ''


    let url = new URL(link);
    let protocol = url.protocol
    let host = url.host
    let pathname = url.pathname;
    let search = url.search;
    //console.log(url)
    if (host.includes("instagram")) {
        host = host.replace("instagram", "ddinstagram")
        search = ''
    } else if (host.includes("tiktok")) {
        host = host.replace("tiktok", "tfxktok")
        search = ''
    } else if (host.includes("twitter")) {
        host = host.replace("twitter", "vxtwitter")
    } else if (host.includes("x.com")) {
        host = host.replace("x.com", "vxtwitter")
    }
    let newLink = protocol + '//' + host + pathname + search
    return newLink
}
module.exports = { backupEmbed }