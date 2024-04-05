// noinspection JSValidateTypes

const path = require("node:path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
require("dotenv").config();
const poker = require("./modules/poker");
const cookieParser = require("./modules/cookieParser");
const database = require("./modules/database");
const expressCookieParser = require("cookie-parser");
const app = express();
const server = require("http").createServer(app);
const wss = require("socket.io")(server);
// Named Constants
const accessTokenName = "access_token";

app.set("view engine", "ejs");

app.use(express.json({ limit: "1kb" }));
app.use(expressCookieParser());

function createJWT(data) {
  return jwt.sign(data, process.env.ACCESS_TOKEN_SECRET);
}

// Returns JWT data AND verifies that the token was created by the server
function getJWTData(JWT) {
  let data;
  try {
    data = jwt.verify(JWT, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    data = null;
  }
  return data;
}
function isString(possibleString) {
  return typeof possibleString == "string";
}
function getAccessToken(cookies) {
  let accessToken;
  try {
    if (typeof cookies == "string") {
      accessToken = cookieParser.parseStringCookiesKey(cookies, accessTokenName);
    } else {
      accessToken = cookieParser.parseJSONCookiesKey(cookies, accessTokenName);
    }
  } catch (err) {
    console.error("Incorrect type passed to getAccessToken!");
  }
  return accessToken;
}

function getUserFromToken(token) {
  let username = null;
  const data = getJWTData(token);
  if (data) {
    try {
      username = data.username;
    } catch (err) {
      // Do nothing
    }
  }
  return username;
}

function checkIsLoggedIn(cookies) {
  let isLoggedIn = false;
  let JSONCookies = expressCookieParser.JSONCookies(cookies);
  let token = cookieParser.parseJSONCookiesKey(JSONCookies, accessTokenName);
  if (token) {
    if (getJWTData(token)) isLoggedIn = true;
  }
  return isLoggedIn;
}

const port = 3000;
let shuffledCards = poker.shuffledDeck();

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Handle Get Requests
app.get("/", function (req, res) {
  const isLoggedIn = checkIsLoggedIn(req.cookies);
  const username = getUserFromToken(getAccessToken(req.cookies));
  res.render("root", { username: username, isLoggedIn: isLoggedIn });
});

app.get("/play/:roomID", (req, res) => {
  console.log(`RoomID: ${req.params["roomID"]}`);
  const isLoggedIn = checkIsLoggedIn(req.cookies);
  res.render("play", { isLoggedIn: isLoggedIn });
});

app.get("/play", (req, res) => {
  if (!checkIsLoggedIn(req.cookies)) {
    return res.redirect("/login");
  }
  let randomString = (Math.random() + 1).toString(36).substring(2);
  res.redirect(`/play/${randomString}`);
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/coinflip/:roomID", (req, res) => {
  console.log(`RoomID: ${req.params["roomID"]}`);
  const isLoggedIn = checkIsLoggedIn(req.cookies);
  res.render("coinflip", { isLoggedIn: isLoggedIn });
});

app.get("/coinflip", (req, res) => {
  if (!checkIsLoggedIn(req.cookies)) {
    return res.redirect("/coinflip");
  }
  let randomString = (Math.random() + 1).toString(36).substring(2);
  res.redirect(`/coinflip/${randomString}`);
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/sign-up", (req, res) => {
  res.render("sign-up");
});

//This needs to stay the last get request
app.get("*", function (req, res) {
  res.status(404).render("404");
});

// Handle Post Requests
loginUser = async (username, password) => {
  // Get DB connection
  const conn = await database.fetchConn();
  let userObject = {
    loginSuccess: false,
  };
  try {
    // Make sure the user exists in the database first!
    if ((await conn.query("SELECT * FROM users WHERE username = ?", username)).length > 0) {
      let hashedPassword = await conn.query("SELECT password_hash FROM users WHERE username = ?", username);
      let isPasswordCorrect = await bcrypt.compare(password, hashedPassword[0]["password_hash"]);
      if (isPasswordCorrect) {
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
};

app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const conditionalArray = [typeof username == "string", typeof password == "string", password.length >= 12, password.length <= 40, username.length <= 20, /^[a-zA-Z0-9_]*$/.test(username)];
  if (!conditionalArray.includes(false)) {
    const userObject = await loginUser(username, password);
    let loginSuccess = userObject.loginSuccess;
    // Send back a proper response if an access token IS in the userObject
    if (loginSuccess) {
      return res
        .status(200)
        .cookie(accessTokenName, userObject.accessToken, {
          path: "/",
          httpOnly: true,
          secure: true,
        })
        .json({ loginSuccess: loginSuccess });
    } else {
      return res.status(404).json({ loginSuccess: loginSuccess });
    }
  }
});

createNewUser = async (username, email, password) => {
  // Get DB connection
  const conn = await database.fetchConn();
  let wasAccountCreated = false;
  let newUserObject = {
    wasCreated: wasAccountCreated,
  };
  try {
    if ((await conn.query("SELECT * FROM users WHERE username = ?", username)).length === 0) {
      console.log(`Creating new user with username: ${username}`);
      const saltRounds = 10;
      let hashedPassword = await bcrypt.hash(password, saltRounds);
      await conn.query("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)", [username, email, hashedPassword]);
      const accessToken = createJWT({ username: username });
      newUserObject.wasCreated = true;
      newUserObject.accessToken = accessToken;
    } else {
      newUserObject.error = "Username already taken!";
      console.log("Account Creation Cancelled: User already exists");
    }
  } catch (err) {
    console.error(err);
  }
  return newUserObject;
};

app.post("/sign-up", async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const conditionalArray = [typeof username == "string", typeof password == "string", password.length >= 12, password.length <= 40, username.length <= 20, /^[a-zA-Z0-9_]*$/.test(username)];
  if (!conditionalArray.includes(false)) {
    let newUserObject = await createNewUser(username, email, password);
    let resObject = {
      wasCreated: newUserObject.wasCreated,
      error: newUserObject.error,
    };
    let wasCreated = newUserObject.wasCreated;
    // Send back a proper response if an access token IS in the userObject
    if (wasCreated) {
      return res
        .status(200)
        .cookie(accessTokenName, newUserObject.accessToken, {
          path: "/",
          httpOnly: true,
          secure: true,
        })
        .json(resObject);
    } else {
      return res.status(404).json(resObject);
    }
  }
});

// Logs a user out by removing their auth token
app.post("/logout", async (req, res) => {
  res.clearCookie(accessTokenName);
  return res.sendStatus(200);
});

const connectedClients = new Map();

wss.use((socket, next) => {
  const JWTData = getJWTData(getAccessToken(socket.handshake.headers.cookie));
  if (!JWTData) {
    next(new Error("Token was null"));
  } else {
    socket.username = JWTData.username;
    next();
  }
});

wss.on("connection", (ws) => {
  const userId = ws.username;

  connectedClients.set(ws, userId);
  console.log(`WebSocket connected - User ID: ${userId}`);

  ws.emit("updateHand", JSON.stringify({ card1: shuffledCards[0], card2: shuffledCards[1] }));

  ws.on("message", (event, arg1) => {
    if (event === "shuffle") {
      shuffledCards = poker.shuffledDeck();
      ws.emit("updateHand", JSON.stringify({ card1: shuffledCards[0], card2: shuffledCards[1] }));
    }
    if (event === "joinGame" && arg1 && isString(arg1) && /^[a-zA-Z0-9]+$/.test(arg1)) {
      // TODO: make a proper way to create and check if rooms exist
      ws.join(arg1);
    }
    if (event === "start") {
      wss.to(arg1).emit("getResult", "Hello World!");
    }
    console.log(`Message: ${event} User ID: ${connectedClients.get(ws)}`);
  });

  ws.on("close", () => {
    console.log(`WebSocket disconnected - User ID: ${connectedClients.get(ws)}`);
    connectedClients.delete(ws);
  });
});

server.listen(port, function () {
  console.log(`EasyPoker server listening on port http://127.0.0.1:${port}!`);
});
