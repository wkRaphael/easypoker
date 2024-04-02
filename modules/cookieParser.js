// Returns the value of a key
function parseCookieKey(cookie, key) {
    let value;
    // Remove whitespace
    cookie = cookie.replace(' ', '');
    // Split at ;
    cookie = cookie.split(';');
    // Split each keyPair
    cookie.forEach((keyPair) => {
        let keyArray = keyPair.split('=')
        if (keyArray[0] == key){
            value = keyArray[1];
        }
    })
    return value;
}

// Returns all values with keys in JSON
function parseCookie(cookie) {
    let cookieJSON = {};
    // Remove whitespace
    cookie = cookie.replace(' ', '');
    // Split at ;
    cookie = cookie.split(';');
    // Split each keyPair
    cookie.forEach((keyPair) => {
        let keyArray = keyPair.split('=')
        cookieJSON[keyArray[0]] = keyArray[1];
    })
    return cookieJSON;
}

module.exports = {
    parseCookieKey,
    parseCookie
}