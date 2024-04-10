const ws = io({
  query: {
    roomID: window.location.pathname.split("/").pop()
  }
});

const players = document.getElementById("players");
const coinflipResult = document.getElementById("cf-result");

ws.on("connection", () => {
  console.log("WebSocket disconnected");
})

ws.on("update-players", (data) => {
  document.querySelectorAll('.playerElement').forEach(e => e.remove());
  data.playerArray.forEach(player => {
    let playerElement = document.createElement("div")
    playerElement.className = "playerElement"
    playerElement.innerText = player
    players.appendChild(playerElement);
  })
})
ws.on("get-result", (result) => {
  coinflipResult.innerText = result;
});

ws.onclose = () => {
  console.log("WebSocket disconnected");
};

function start() {
  ws.emit("start", window.location.pathname.split("/").pop());
}
//FIXME: find a better way to do these both
function joinGame() {
  ws.send("joinGame", window.location.pathname.split("/").pop());
}

function fold() {
  card1Element.style.color = "#cccccc";
  card2Element.style.color = "#cccccc";
  ws.send("fold");
}

function raise() {
  ws.send("raise");
}
function clickListener(selector, functionCalled) {
  document.querySelector(selector).addEventListener("click", functionCalled);
}
document.addEventListener("DOMContentLoaded", function () {
  clickListener("#join-game", joinGame);
  clickListener("#start", start);
});
