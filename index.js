const path = require('node:path');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const url = require("url");
require("dotenv").config();

const mariadb = require('mariadb');
const pool = mariadb.createPool(
    {
        host: process.env.DB_HOST, 
        user: process.env.DB_USER, 
        password: process.env.DB_PASSWORD,
        database: "db_easy_poker",
        connectionLimit: 50
});

pool.getConnection((err, connection) => {
    if(connection){
        connection.release();
    }
});

const app = express();
const server = http.createServer(app);
app.set("view engine", "ejs");

app.use(express.json({ limit: "1kb" }));

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

createJWT = (username) => {
    const accessToken = jwt.sign(username, process.env.ACCESS_TOKEN_SECRET);
    return accessToken;
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

// Serve static files
app.use(express.static(path.join(__dirname, 'public')))

app.get("/", function (req, res) {
    const userId = generateUserId();
    res.render("root", { userId: userId });
});

// Handle Get Requests

app.get("/play", (req, res) => {
    const token = generateToken();
    const userId = generateUserId();
    res.render("play", { token: token, userId: userId });
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/sign-up", (req, res) => {
    res.render("sign-up");
});

// Handle Post Requests

loginUser = async (username, password) => {
    let userObject = {
        loginSuccess: false
    }
    try{
        // Make sure the user exists in the database first!
        if ((await pool.query('SELECT * FROM users WHERE username = ?', username)).length > 0){
            let hashedPassword = await pool.query('SELECT password_hash FROM users WHERE username = ?', username);
            let isPasswordCorrect = await bcrypt.compare(password, hashedPassword[0].password_hash);
            if (isPasswordCorrect){
                console.log(`Logging in ${username}...`);
                const accessToken = createJWT(username);
                userObject.loginSuccess = isPasswordCorrect;
                userObject.accessToken = accessToken;
            }
        }
    } catch (err) {
        console.error(err);
    }
    return userObject;
}

app.post("/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const conditionalArray = [typeof username == "string", typeof password == "string",
        password.length >= 12, password.length <= 40, username.length <= 20, /^[a-zA-Z0-9_]*$/.test(username)];
        if (!conditionalArray.includes(false)) {
            const userObject = await loginUser(username, password);
            let loginSuccess = userObject.loginSuccess;
            // Send back a proper response if an access token IS in the userObject
            if (loginSuccess){
                return res
                    .status(200)
                    .cookie("access_token", userObject.accessToken, {
                        path: "/",
                        httpOnly: true,
                        secure: true
                      })
                    .json({ loginSuccess: loginSuccess });
            }
            else{
                return res
                    .status(404)
                    .json({ loginSuccess: loginSuccess });
            }
        }
});

createNewUser = async (username, email, password) => {
    let wasAccountCreated = false;
    let newUserObject = {
        wasCreated: wasAccountCreated
    }
    try{
        // Only create a new user if the username isn't taken
        console.log(await pool.query('SELECT * FROM users WHERE username = ?', username))
        if ((await pool.query('SELECT * FROM users WHERE username = ?', username)).length == 0){
            console.log(`Creating new user with username: ${username}`);
            const saltRounds = 10;
            let hashedPassword = await bcrypt.hash(password, saltRounds);
            await pool.query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [ username, email, hashedPassword ]);
            const accessToken = createJWT({ user: username });
            newUserObject.wasCreated = true;
            newUserObject.accessToken = accessToken;
        }
        else{
            console.log("User already exists!");
        }
    } catch (err){
        console.error(err);
    }
    return newUserObject;
}

app.post("/sign-up", async (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const conditionalArray = [typeof username == "string", typeof password == "string",
        password.length >= 12, password.length <= 40, username.length <= 20, /^[a-zA-Z0-9_]*$/.test(username)];
        if (!conditionalArray.includes(false)) {
            let newUserObject = await createNewUser(username, email, password);
            let wasCreated = newUserObject.wasCreated;
            // Send back a proper response if an access token IS in the userObject
            if (wasCreated){
                return res
                    .status(200)
                    .cookie("access_token", newUserObject.accessToken, {
                        path: "/",
                        httpOnly: true,
                        secure: true
                      })
                    .json({ wasCreated: wasCreated });
            }
            else{
                return res
                    .status(404)
                    .json({ wasCreated: wasCreated });
            }
        }
});

// Logs a user out by removing their auth token
app.post("/logout", async (req, res) => {
    return res
            // 205 status tells the user agent to reset content from the calling document
            .status(205)
            // Set the requesters auth token stored in a cookie to an empty string
            .cookie("access_token", "")
            .send()
});

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
    console.log(`EasyPoker server listening on port ${port}!`);
});
