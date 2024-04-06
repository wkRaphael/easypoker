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
});