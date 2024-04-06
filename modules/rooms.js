const database = require("./database");

// Room Functions
async function getRooms() {
    const conn = await database.fetchConn();
    return await conn.query("SELECT * FROM rooms");
}

async function getPlayersInRoom(roomName) {
    let result = null;
    const conn = await database.fetchConn();

    const roomExists = (await conn.query("SELECT id FROM rooms WHERE room_name = ?", roomName)).length > 0;
    
    if (roomExists) {
        let playerJSON = await conn.query("SELECT room_players FROM rooms WHERE room_name = ?", roomName);
        result = playerJSON[0].room_players.playerArray;
    }
    return result;
}

async function removePlayerFromRoom(player, roomName) {
    let result = null;
    const conn = await database.fetchConn();

    let playerJSON = await conn.query("SELECT room_players FROM rooms WHERE room_name = ?", roomName);
    const roomExists =  ((playerJSON).length > 0);
    const playerExists =  ((await conn.query("SELECT user_id FROM users WHERE username = ?", player)).length > 0);

    let playerArray = playerJSON[0].room_players.playerArray;

    if (roomExists && playerExists && playerArray.includes(player)) {
        let playerIndex = playerArray.indexOf(player);
        playerArray.splice(playerIndex, 1);
        result = await conn.query("UPDATE rooms SET room_players = ? WHERE room_name = ?", [JSON.stringify({ playerArray: playerArray }), roomName]);
    }
    return result;
}

async function addPlayerToRoom(player, roomName) {
    let result = null;
    const conn = await database.fetchConn();

    let playerJSON = await conn.query("SELECT room_players FROM rooms WHERE room_name = ?", roomName);
    const roomExists =  ((playerJSON).length > 0);
    const playerExists =  ((await conn.query("SELECT user_id FROM users WHERE username = ?", player)).length > 0);

    let playerArray = playerJSON[0].room_players.playerArray;

    if (roomExists && playerExists && !(playerArray.includes(player))){
        if (playerArray == null) {
            playerArray = [];
            playerArray.push(player);
            result = await conn.query("UPDATE rooms SET room_players = ? WHERE room_name = ?", [JSON.stringify({ playerArray: playerArray }), roomName]);
        } else {
            playerArray.push(player);
            result = await conn.query("UPDATE rooms SET room_players = ? WHERE room_name = ?", [JSON.stringify({ playerArray: playerArray }), roomName]);
        }
    }
    return result;
}

async function removeRoom(roomName) {
    let result = null;
    console.log(`Removing room with name '${roomName}'`);
    const conn = await database.fetchConn();
    if ((await conn.query("SELECT user_id FROM rooms WHERE room_name = ?", roomName)).length > 0) {
        result = await conn.query("DELETE FROM rooms WHERE room_name = ?", roomName);
    }
    return result;
}

async function createRoom(roomName, type, isPublic, maxPlayers) {
    let result = null;
    console.log(`Creating new room with name '${roomName}', type '${type}', public status '${isPublic}', and max players of '${maxPlayers}'`);
    const conn = await database.fetchConn();
    if ((await conn.query("SELECT id FROM rooms WHERE room_name = ?", roomName)).length == 0) {
        result = await conn.query("INSERT INTO rooms (room_name, room_type, room_ispublic, room_maxplayers) VALUES (?, ?, ?, ?)", [roomName, type, isPublic, maxPlayers]);
    }
    return result;
}

module.exports = {
    createRoom,
    removeRoom,
    getRooms,
    addPlayerToRoom,
    removePlayerFromRoom,
    getPlayersInRoom
}