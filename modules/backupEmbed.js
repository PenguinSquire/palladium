function backupEmbed(link) {
    let www = ''
    let fix = ''


    let url = new URL(link);
    let protocol = url.protocol
    let host = url.host
    let pathname = url.pathname;
    let search = url.search;
    //console.log(url)
    if ((/^www\./i.test(url.host))) {
        www = 'www.'
        host = host.slice(4, host.length)
    }
    if (host.includes("instagram")) {
        fix = 'dd'
        search = ''
    } else if (host.includes("tiktok")) {
        host = host.slice(2, host.length)
        fix = 'tfx'
        search = ''
    } else if (host.includes("twitter")) {
        fix = 'vx'
    } else if (host.includes("x.com")) {
        host = host.slice(1, host.length)
        fix = 'vxtwitter'
    }
    let newLink = protocol + '//' + www + fix + host + pathname + search
    return newLink
}
module.exports = { backupEmbed }