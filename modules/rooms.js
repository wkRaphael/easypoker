const database = require("./database");

// Room Functions
async function getRooms() {
    try{
        const conn = await database.fetchConn();
        return await conn.query("SELECT * FROM rooms");
    } catch(err) {
        console.error(err);
    }
}

/*
Filter should be in JSON format. Options that aren't used should be null
Filter options:
Filter by isPublic
Filter by max_players
Filter by room_name
Filter by room_type
*/
async function getRoomsWithFilters(filters) {
    let result = null;
    try{
        const filterIsPublic = (filters.isPublic);
        const filterMaxPlayers = (filters.maxPlayers);
        const filterRoomName = (filters.roomName);
        const filterRoomType = (filters.roomType);
        
        const conn = await database.fetchConn();
        console.log(`Filters filterIsPublic = ${filterIsPublic}, filterMaxPlayers = ${filterMaxPlayers}, filterRoomName = ${filterRoomName}, filterRoomType = ${filterRoomType}`);
        result = await conn.query("SELECT * FROM rooms WHERE (room_ispublic = ? OR ? IS NULL) AND (room_maxplayers = ? OR ? IS NULL) AND (room_name = ? OR ? IS NULL) AND (room_type = ? OR ? IS NULL) ORDER BY room_type DESC",
         [filterIsPublic, filterIsPublic, filterMaxPlayers, filterMaxPlayers, filterRoomName, filterRoomName, filterRoomType, filterRoomType]);
    } catch(err) {
        console.error(err);
    }
    return result;
}

async function isPlayerOwnerOfRoom(player, roomName) {
    let result = false;
    try{
        const players = await getPlayersInRoom(roomName);
        if (players) {
            if (players[0] === player) {
                result = true;
            }
        }
    } catch(err) {
        console.error(err)
    }
    return result;
}

async function isPlayerInRoom(player, roomName) {
    let result = false;
    try{
        const players = await getPlayersInRoom(roomName);
        if (players) {
            if (players.includes(player)) {
                result = true;
            }
        }
    } catch(err) {
        console.error(err);
    }
    return result;

}

async function getPlayersInRoom(roomName) {
    let result = null;
    try{
        const conn = await database.fetchConn();

        const roomExists = (await conn.query("SELECT id FROM rooms WHERE room_name = ?", roomName)).length > 0;
        
        if (roomExists) {
            let playerJSON = await conn.query("SELECT room_players FROM rooms WHERE room_name = ?", roomName);
            result = playerJSON[0]["room_players"].playerArray;
        }
    } catch(err) {
        console.error(err);
    }
    return result;

}

async function removePlayerFromRoom(player, roomName) {
    let result = null;
    try{
        const conn = await database.fetchConn();

        let playerJSON = await conn.query("SELECT room_players FROM rooms WHERE room_name = ?", roomName);
        const roomExists =  ((playerJSON).length > 0);
        const playerExists =  ((await conn.query("SELECT user_id FROM users WHERE username = ?", player)).length > 0);

        let playerArray = playerJSON[0]["room_players"].playerArray;

        if (roomExists && playerExists && playerArray.includes(player)) {
            let playerIndex = playerArray.indexOf(player);
            playerArray.splice(playerIndex, 1);
            result = await conn.query("UPDATE rooms SET room_players = ? WHERE room_name = ?", [JSON.stringify({ playerArray: playerArray }), roomName]);
        }
    } catch(err) {
        console.error(err);
    }
    return result;

}

async function addPlayerToRoom(player, roomName) {
    let result = null;
    try{
        const conn = await database.fetchConn();

        let roomData = await conn.query("SELECT * FROM rooms WHERE room_name = ?", roomName);
        const roomExists =  ((roomData).length > 0);
        const playerExists =  ((await conn.query("SELECT user_id FROM users WHERE username = ?", player)).length > 0);
        if (!roomExists) return "room does not exist";
        if (!playerExists) return "player does not exist";

        let playerArray;
        if(roomData[0]["room_players"]) {
            playerArray = roomData[0]["room_players"].playerArray;
            if (playerArray.includes(player)) {
                return "player already in room";
            }
            if (playerArray.length + 1 > roomData[0]["room_maxplayers"]) return "max player already in room";
            playerArray.push(player);
            roomName = 0;
            result = await conn.query("UPDATE rooms SET room_players = ? WHERE room_name = ?", [JSON.stringify({ playerArray: playerArray }), roomName]);
        } else {
            playerArray = [];
            playerArray.push(player);
            result = await conn.query("UPDATE rooms SET room_players = ? WHERE room_name = ?", [JSON.stringify({ playerArray: playerArray }), roomName]);
        }
    } catch(err) {
        console.error(err);
    }
    return result;

}

async function removeRoom(roomName) {
    let result = null;
    try{
        console.log(`Removing room with name '${roomName}'`);
        const conn = await database.fetchConn();
        if ((await conn.query("SELECT id FROM rooms WHERE room_name = ?", roomName)).length > 0) {
            result = await conn.query("DELETE FROM rooms WHERE room_name = ?", roomName);
        }
    } catch(err) {
        console.error(err);
    }
    return result;

}

async function createRoom(roomName, type, isPublic, maxPlayers) {
    let result = null;
    try{
        console.log(`Creating new room with name '${roomName}', type '${type}', public status '${isPublic}', and max players of '${maxPlayers}'`);
        const conn = await database.fetchConn();
        if ((await conn.query("SELECT id FROM rooms WHERE room_name = ?", roomName)).length === 0) {
            result = await conn.query("INSERT INTO rooms (room_name, room_type, room_ispublic, room_maxplayers) VALUES (?, ?, ?, ?)", [roomName, type, isPublic, maxPlayers]);
        }
    } catch(err) {
        console.error(err);
    }
    return result;
}

module.exports = {
    createRoom,
    removeRoom,
    getRooms,
    getRoomsWithFilters,
    addPlayerToRoom,
    removePlayerFromRoom,
    getPlayersInRoom,
    isPlayerInRoom,
    isPlayerOwnerOfRoom
}