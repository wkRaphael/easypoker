import newAlert from './modules/alertModule.js';
import sendPOST from './modules/network.js';

const socket = io();

socket.on("connect", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
  });

document.addEventListener('DOMContentLoaded', function () {
    const createRoomButton = document.getElementById('CreateRoomButton');
    createRoomButton.addEventListener('click', function() {
        const roomName = document.getElementById('CreateRoomInput').value;
        if (roomName) {
            newAlert(`Room created with name '${roomName}'!`, '#00FF02', 3)
            sendPOST('/create-room', { roomID: roomName}, () => {});
        } else {
            newAlert(`No room name entered!`, '#FF8A00', 3)
        }
    });

    const removeRoomButton = document.getElementById('RemoveRoomButton');
    removeRoomButton.addEventListener('click', function() {
        const roomName = document.getElementById('RemoveRoomInput').value;
        if (roomName) {
            newAlert(`Room removed with name '${roomName}'!`, '#00FF02', 3)
            sendPOST('/remove-room', { roomID: roomName}, () => {});
        } else {
            newAlert(`No room name entered!`, '#FF8A00', 3)
        }
    });

    const addPlayerToRoomButton = document.getElementById('AddPlayerToRoomButton');
    addPlayerToRoomButton.addEventListener('click', function() {
        const roomName = document.getElementById('AddPlayerRoomInput').value;
        const player = document.getElementById('AddPlayerPlayerInput').value;
        if (roomName) {
            newAlert(`Player added to room with name '${player}'!`, '#00FF02', 3)
            sendPOST('/add-player-to-room', { roomID: roomName, player: player}, () => {});
        } else {
            newAlert(`Inputs invalid!`, '#FF8A00', 3)
        }
    });

    const getRoomsButton = document.getElementById('GetRoomsButton');
    getRoomsButton.addEventListener('click', function() {
        // Load available rooms
        /*
        Filter should be in JSON format. Options that aren't used should be null
        Filter options:
        Filter by isPublic
        Filter by max_players
        Filter by room_name
        Filter by room_type
        */
        socket.emit("get-rooms", ({ isPublic: null, maxPlayers: null, roomName: null, roomType: null }));
    });
});

function createRooms(data) {
    const textSize = '20px';
    const roomsContainer = document.getElementById("RoomsContainer");
    // Determine if rooms are already on screen
    if (document.querySelector(".RoomsWrapper")) {
        document.querySelector(".RoomsWrapper").remove();
    }
    let roomsWrapper = document.createElement('div');
    roomsWrapper.className = 'RoomsWrapper';
    // {"id":26,"room_name":"j1zz687c6e","room_type":1,"room_maxplayers":2,"room_players":{"playerArray":["BOB","JOE","TEST"]},"room_ispublic":0}
    for (let i = 0; i < data.length; i++) {
        let room = document.createElement('div');
        room.className = 'Room';
        room.id = `Room${i}`;

        let roomName = document.createElement('a');
        let roomNameWrapper = document.createElement('div');
        roomNameWrapper.className = 'RoomNameWrapper';
        roomName.href = `/play/${data[i].room_name}`;
        roomName.innerText = data[i].room_name;
        roomName.style.color = 'var(--color-3)';
        roomName.style.fontSize = textSize;
        roomNameWrapper.appendChild(roomName);
        room.appendChild(roomNameWrapper);

        let roomType = document.createElement('div');
        let roomTypeWrapper = document.createElement('div');
        roomTypeWrapper.className = 'RoomTypeWrapper';
        let getRoomType= (data) => {
            let type = data[i].room_type;
            switch(type) {
                case 0:
                    type = "Poker";
                    break;
                case 1:
                    type = "Coinflip";
                    break;
                default:
                    type = "Unknown";
            }
            return type;
        }
        roomType.innerText = getRoomType(data);
        roomType.style.fontSize = textSize;
        roomTypeWrapper.appendChild(roomType);
        room.appendChild(roomTypeWrapper);

        let roomMaxPlayers = document.createElement('div');
        let roomMaxPlayersWrapper = document.createElement('div');
        roomMaxPlayersWrapper.className = 'RoomMaxPlayersWrapper';
        roomMaxPlayers.innerText = data[i].room_maxplayers;
        roomMaxPlayers.style.fontSize = textSize;
        roomMaxPlayersWrapper.appendChild(roomMaxPlayers);
        room.appendChild(roomMaxPlayersWrapper);

        let roomPublicStatus = document.createElement('div');
        let roomPublicStatusWrapper = document.createElement('div');
        roomPublicStatusWrapper.className = 'RoomPublicStatusWrapper';
        roomPublicStatus.innerText = (data[i].room_ispublic == 1) ? "True" : "False";
        roomPublicStatus.style.fontSize = textSize;
        roomPublicStatusWrapper.appendChild(roomPublicStatus);
        room.appendChild(roomPublicStatusWrapper);

        roomsWrapper.appendChild(room);
    }
    roomsContainer.appendChild(roomsWrapper);
}

socket.emit("get-rooms", ({ isPublic: null, maxPlayers: null, roomName: null, roomType: null }));

socket.on("rooms", (data) => {
    createRooms(data);
})