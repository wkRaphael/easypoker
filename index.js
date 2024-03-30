const path = require('node:path'); 
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const url = require("url");

const app = express();
const server = http.createServer(app);
app.set("view engine", "ejs");

const connectedClients = new Map();

function generateToken() {
  // Example: Generate a random token
  const token = Math.random().toString(36).substring(7);
  return token;
}

function generateUserId() {
  // Example: Generate a random user ID
  const userId = Math.random().toString(36).substring(7);
  return userId;
}

function verifyToken(token) {
  // Example: Check if the token is valid
  const validTokens = ["token1", "token2", "token3"];
  return true;
}

const wss = new WebSocket.Server({ server });

const port = 3000;

const numbers = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];
const suites = ["♣", "♠️", "♦", "♥️"];
const cards = [];

for (const suite of suites) {
  for (const number of numbers) {
    cards.push(`${number}${suite}`);
  }
}

function shuffleArray(array) {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}

let shuffledCards = shuffleArray(cards);

app.get("/", function (req, res) {
  const userId = generateUserId();
  res.render("root", { userId: userId });
});

app.get("/play", function (req, res) {
  const token = generateToken();
  const userId = generateUserId();
  res.render("play", { token: token, userId: userId });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')))

wss.on("connection", (ws, req) => {
  const parsedUrl = url.parse(req.url, true);
  const token = parsedUrl.query.token;
  const userId = parsedUrl.query.userId;

  // Verify the token
  const isValidToken = verifyToken(token);
  if (!isValidToken) {
    ws.close(4001, "Invalid token");
    return;
  }

  connectedClients.set(ws, userId);

  console.log(`WebSocket connected - User ID: ${userId}`);

  ws.send(JSON.stringify({ card1: shuffledCards[0], card2: shuffledCards[1] }));

  ws.on("message", (message) => {
    if (message.toString() === "shuffle") {
      shuffledCards = shuffleArray(cards);
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({ card1: shuffledCards[0], card2: shuffledCards[1] })
          );
        }
      });
    }
    console.log(`Message: ${message} User ID: ${connectedClients.get(ws)}`);
  });

  ws.on("close", () => {
    console.log(
      `WebSocket disconnected - User ID: ${connectedClients.get(ws)}`
    );
    connectedClients.delete(ws);
  });
});

server.listen(port, function () {
  console.log(`Poker listening on port ${port}!`);
});
