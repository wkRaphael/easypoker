const path = require('node:path');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const url = require("url");
require("dotenv").config();
const poker = require("./modules/poker");
const mariadb = require('mariadb');
const cookieParser = require('./modules/cookieParser');
const expressCookieParser = require('cookie-parser');

// Named Constants
const accessTokenName = 'access_token';

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
app.use(expressCookieParser());

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

createJWT = (data) => {
    const accessToken = jwt.sign(data, process.env.ACCESS_TOKEN_SECRET);
    return accessToken;
}

// Returns JWT data AND verifies that the token was created by the server
getJWTData = (JWT) => {
    let data;
    try {
        data = jwt.verify(JWT, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        data = null;
    }
    return data;
}

getAccessToken = (cookies) => {
    let accessToken;
    try {
        if (typeof cookies == "string"){
            accessToken = cookieParser.parseStringCookiesKey(cookies, accessTokenName);
        } else {
            accessToken = cookieParser.parseJSONCookiesKey(cookies, accessTokenName);
        }
    } catch (err) {
        console.error("Incorrect type passed to getAccessToken!")
    }
    return accessToken;
}

getUserFromToken = (token) => {
    let username = null;
    const data = getJWTData(token);
    if(data){
        try {
            username = data.username;
        } catch (err) {
            // Do nothing
        }
    }
    return username;
}

checkIsLoggedIn = (cookies) => {
    let isLoggedIn = false;
    let JSONCookies = expressCookieParser.JSONCookies(cookies);
    let token = cookieParser.parseJSONCookiesKey(JSONCookies, accessTokenName);
    if(token) {
        if (getJWTData(token))
        isLoggedIn = true;
    } 
    return isLoggedIn;
}

const wss = new WebSocket.Server({ server });

const port = 3000;

let shuffledCards = poker.shuffledDeck();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')))

// Handle Get Requests

app.get("/", function (req, res) {
    const isLoggedIn = checkIsLoggedIn(req.cookies);
    const username = getUserFromToken(getAccessToken(req.cookies));
    res.render("root", { username: username, isLoggedIn: isLoggedIn });
});

app.get("/play", (req, res) => {
    const token = generateToken();
    const userId = generateUserId();
    const isLoggedIn = checkIsLoggedIn(req.cookies);
    res.render("play", { token: token, userId: userId, isLoggedIn: isLoggedIn });
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
                const accessToken = createJWT({ username: username });
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
                    .cookie(accessTokenName, userObject.accessToken, {
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
        if ((await pool.query('SELECT * FROM users WHERE username = ?', username)).length == 0){
            console.log(`Creating new user with username: ${username}`);
            const saltRounds = 10;
            let hashedPassword = await bcrypt.hash(password, saltRounds);
            await pool.query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [ username, email, hashedPassword ]);
            const accessToken = createJWT({ username: username });
            newUserObject.wasCreated = true;
            newUserObject.accessToken = accessToken;
        }
        else{
            newUserObject.error = "Username already taken!";
            console.log("Account Creation Cancelled: User already exists");
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
            let resObject = {
                wasCreated: newUserObject.wasCreated,
                error: newUserObject.error
            }
            let wasCreated = newUserObject.wasCreated;
            // Send back a proper response if an access token IS in the userObject
            if (wasCreated){
                return res
                    .status(200)
                    .cookie(accessTokenName, newUserObject.accessToken, {
                        path: "/",
                        httpOnly: true,
                        secure: true
                      })
                    .json(resObject);
            }
            else{
                return res
                    .status(404)
                    .json(resObject);
            }
        }
});

// Logs a user out by removing their auth token
app.post("/logout", async (req, res) => {
    res.clearCookie(accessTokenName);
    return res
            .sendStatus(200)
});

//This needs to stay the last page
app.get('*', function(req, res){
    res.status(404).render("404");
});

wss.on("connection", (ws, req) => {
    // const parsedUrl = url.parse(req.url, true);
    // Get the clients cookies with 'req.headers.cookie'
    const JWTData = getJWTData(getAccessToken(req.headers.cookie));

    // Verify the token
    if (JWTData == null) {
        ws.close(4001, "Invalid token");
        return;
    }
    
    let userId;
    try {
        userId = JWTData.username;
    } catch (err) {
        userId = null;
    }

    connectedClients.set(ws, userId);

    console.log(`WebSocket connected - User ID: ${userId}`);
    ws.send(JSON.stringify({ card1: shuffledCards[0], card2: shuffledCards[1] }));

     ws.on("message", (message) => {
        if (message.toString() === "shuffle") {
            shuffledCards = poker.shuffledDeck()
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
