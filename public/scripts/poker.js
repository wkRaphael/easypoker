const ws = io();

const card1Element = document.getElementById("card1");
const card2Element = document.getElementById("card2");

ws.onOpen = () => {
  console.log("WebSocket connected");
};
ws.on("updateHand", (cards) => {
  const data = JSON.parse(cards);
  card1Element.textContent = data.card1;
  card2Element.textContent = data.card2;

  setCardColor(card1Element, data.card1);
  setCardColor(card2Element, data.card2);
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

function shuffle() {
  ws.send("shuffle");
}

function call() {
  ws.send("call");
}

function check() {
  ws.send("check");
}
function joinGame() {
  ws.send("joinGame");
}

function fold() {
  card1Element.style.color = "#cccccc";
  card2Element.style.color = "#cccccc";
  ws.send("fold");
}

function raise() {
  ws.send("raise", "test");
}

function clickListener(selector, functionCalled) {
  document.querySelector(selector).addEventListener("click", functionCalled);
}
document.addEventListener("DOMContentLoaded", function () {
  clickListener("#call", call);
  clickListener("#check", check);
  clickListener("#fold", fold);
  clickListener("#raise", raise);
  clickListener("#shuffle", shuffle);
});
