const serverUtils = require("./serverUtils");
const rooms = require("./rooms");

async function verifyIsOwnerOfRoom(req, res, next) {
    try{
        const token = req.cookies.access_token;
        const requestingUser = serverUtils.getUserFromToken(token);
        const roomName = req.body.roomID;
        if (await rooms.isPlayerOwnerOfRoom(requestingUser, roomName)) {
            return next();
        } else {
            return res.sendStatus("401");
        }
    } catch(err) {
        console.error(err);
    }
}

async function verifyJoinRoom(req, res, next) {
    try{
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
    } catch(err) {
        console.error(err);
    }
}

async function verifyIsLoggedIn(req, res, next) {
    try{
        const isLoggedIn = serverUtils.checkIsLoggedIn(req.cookies);
        if (isLoggedIn){
            return next()
        } else {
            return res.sendStatus(401);
        }
    } catch(err) {
        console.error(err);
    }
}

module.exports = {
    verifyJoinRoom,
    verifyIsOwnerOfRoom,
    verifyIsLoggedIn
}