const ws = new WebSocket(
  `ws://${window.location.host}?token=${token}&userId=${userId}`
);

const card1Element = document.getElementById("card1");
const card2Element = document.getElementById("card2");

ws.onopen = () => {
  console.log("WebSocket connected");
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  card1Element.textContent = data.card1;
  card2Element.textContent = data.card2;

  setCardColor(card1Element, data.card1);
  setCardColor(card2Element, data.card2);
};

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
  console.log("Called!");
}

function check() {
  console.log("Checked!");
}

function fold() {
  card1Element.style.color = "#cccccc";
  card2Element.style.color = "#cccccc";
  console.log("Folded!");
}

function raise() {
  console.log("Raise!");
}
