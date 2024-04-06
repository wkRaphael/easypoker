const serverUtils = require("./serverUtils");
const rooms = require("./rooms");

async function verifyJoinRoom(req, res, next) {
    const token = req.cookies.access_token;
    const requestingUser = serverUtils.getUserFromToken(token);
    const roomName = req.params.roomID;
    if (requestingUser) {
        if (await rooms.isPlayerInRoom(requestingUser, roomName)) {
            return next();
        }
    }
    // Return 401 if user is not authenticated to requested room
    return res
        .status(401)
        .render("401");
}

module.exports = {
    verifyJoinRoom
}