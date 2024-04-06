import newAlert from './modules/alertModule.js';
import sendPOST from './modules/network.js';

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
});