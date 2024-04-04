const ws = io();

const card1Element = document.getElementById("card1");
const card2Element = document.getElementById("card2");

ws.onOpen = () => {
  console.log("WebSocket connected");
};

ws.on("getResult", (result) => {
  console.log(result);
});

ws.onclose = () => {
  console.log("WebSocket disconnected");
};

function setCardColor(element, cardValue) {
  if (cardValue.includes("♥") || cardValue.includes("♦")) {
    element.style.color = "red";
  } else {
    element.style.color = "black";
  }
}

function start() {
  ws.send("start", window.location.pathname.split("/").pop());
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
