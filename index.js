// noinspection JSValidateTypes
const path = require("node:path");
const bcrypt = require("bcrypt");
const express = require("express");
require("dotenv").config();
const poker = require("./modules/poker");
const database = require("./modules/database");
const expressCookieParser = require("cookie-parser");
const app = express();
const server = require("http").createServer(app);
const wss = require("socket.io")(server);
const rooms = require("./modules/rooms");
const serverUtils = require("./modules/serverUtils");
const expressMiddleware = require("./modules/expressMiddleware");
const {getUserFromToken, getAccessToken} = require("./modules/serverUtils");
const {response} = require("express");
// Named Constants
const accessTokenName = "access_token";

app.set("view engine", "ejs");

app.use(express.json({ limit: "1kb" }));
app.use(expressCookieParser());

app.use("/poker/:roomID", expressMiddleware.verifyJoinRoom);
app.use("/coinflip/:roomID", expressMiddleware.verifyJoinRoom);
app.use("/add-player-to-room", expressMiddleware.verifyIsOwnerOfRoom);

const port = 3000;
let shuffledCards = poker.shuffledDeck();

function menuBar(reqCookies, otherOptions) {
  const isLoggedIn = serverUtils.checkIsLoggedIn(reqCookies);
  const username = serverUtils.getUserFromToken(serverUtils.getAccessToken(reqCookies));
  let options = { username: username, isLoggedIn: isLoggedIn };
  if (typeof(otherOptions) == "object") {
    return {...options, ...otherOptions}
  }
  return options
}
// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Handle Get Requests
app.get("/", (req, res) => {

  res.render("root", menuBar(req.cookies));
});

app.get("/profile/:username", async (req, res) => {
  const username = serverUtils.getUserFromToken(serverUtils.getAccessToken(req.cookies));
  const profileOf = req.params['username'];
  console.log(`Serving profile page for username '${profileOf}'`);
  if (await serverUtils.checkIfUserExists(profileOf)){
    res.render("profile", menuBar(req.cookies, {profileOf: profileOf}))
  } else {
    console.log(`User '${username}' does not exist!`)
    res
      .status(404)
      .render("404", menuBar(req.cookies));
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/play/:roomID", expressMiddleware.verifyJoinRoom, (req, res) => {
  console.log(`RoomID: ${req.params.roomID}`);
  const isLoggedIn = serverUtils.checkIsLoggedIn(req.cookies);
  res.render("coinflip", { isLoggedIn: isLoggedIn });
});

app.get("/play", (req, res) => {
  res.render("play", menuBar(req.cookies));
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/sign-up", (req, res) => {
  res.render("sign-up");
});

//This needs to stay the last get request
app.get("*", function (req, res) {
  res
    .status(404)
    .render("404", menuBar(req.cookies));
});

// Handle Post Requests
app.post("/add-player-to-room", expressMiddleware.verifyIsOwnerOfRoom, async (req, res) => {
  const roomName = req.body.roomID;
  const player = req.body.player;
  const conditionalArray = [typeof roomName == "string", typeof player == "string", player.length <= 30, roomName.length >= 6, roomName.length <= 25, /^[a-zA-Z0-9_]*$/.test(roomName), /^[a-zA-Z0-9_]*$/.test(player)];
  if (!conditionalArray.includes(false)){
    const result = await rooms.addPlayerToRoom(player, roomName);
    if (result) {
      return res.sendStatus(200);
    }
    return res.sendStatus(400);
  } else {
    return res.sendStatus(400);
  }
})


// UPDATE BEFORE PUT INTO PRODUCTION - Users should not be able to remove most rooms!
app.post("/remove-room", expressMiddleware.verifyIsOwnerOfRoom, async (req, res) => {
  const roomName = req.body.roomID;
  console.log(`attempting to remove room with name ${roomName}`)
  const conditionalArray = [typeof roomName == "string", roomName.length >= 6, roomName.length <= 25, /^[a-zA-Z0-9_]*$/.test(roomName)];
  if (!conditionalArray.includes(false)){
    const result = await rooms.removeRoom(roomName);
    if (result) {
      return res.sendStatus(200);
    }
    return res.sendStatus(400);
  } else {
    return res.sendStatus(400);
  }
})

app.post("/create-room", expressMiddleware.verifyIsLoggedIn, async (req, res) => {
  const roomName = req.body.roomID;
  console.log(`RoomName is = ${roomName}`)
  const conditionalArray = [typeof roomName == "string", roomName.length >= 6, roomName.length <= 25, /^[a-zA-Z0-9_]*$/.test(roomName)];
  if (!conditionalArray.includes(false)){
    const requestingUser = serverUtils.getUserFromToken(serverUtils.getAccessToken(req.cookies));
    const roomType = 1;
    const isPublic = true;
    const maxPlayers = 8;
    console.log(`Received post from ${requestingUser}, to create a room with name ${roomName}, type ${roomType}, public status of ${isPublic}, and max players of ${maxPlayers} `);
    await rooms.createRoom(roomName, roomType, isPublic, maxPlayers);
    await rooms.addPlayerToRoom(requestingUser, roomName);
  } else {
    return res.sendStatus("400")
  }
});

async function loginUser (username, password) {
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
        const accessToken = serverUtils.createJWT({ username: username });
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

async function createNewUser(username, email, password) {
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
      const accessToken = serverUtils.createJWT({ username: username });
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
}

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
  const JWTData = serverUtils.getJWTData(serverUtils.getAccessToken(socket.handshake.headers.cookie));
  if (!JWTData) {
    next(new Error("Token was null"));
  } else {
    socket.userId = JWTData.username;
    next();
  }
});
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
wss.on("connection", async (socket) => {
  const userId = socket.userId;
const roomID = socket.handshake.query.roomID;
  connectedClients.set(socket, userId);
  if (roomID !== undefined) {
    let room = await rooms.getRoomsWithFilters({roomName: roomID})
    if (room.length > 0) {
      socket.join(roomID)
      wss.to(roomID).emit("update-players", room[0]["room_players"])
    }
  }
  socket.on("start", async () => {
    if (roomID !== undefined) {
      let room = await rooms.getRoomsWithFilters({roomName: roomID})
      if (room.length > 0) {
        socket.join(roomID)
        wss.to(roomID).emit("get-result", room[0]["room_players"].playerArray[getRandomInt(room[0]["room_players"].playerArray.length)])
      }
    }
  })
  if (socket.handshake.query.roomID !== undefined && await rooms.isPlayerInRoom(userId, socket.handshake.query.roomID)) {
    socket.join(socket.handshake.query.roomID)
  }
  socket.emit("updateHand", JSON.stringify({card1: shuffledCards[0], card2: shuffledCards[1]}));
  socket.on("message", (event, arg1) => {
    if (event === "shuffle") {
      shuffledCards = poker.shuffledDeck();
      socket.emit("updateHand", JSON.stringify({card1: shuffledCards[0], card2: shuffledCards[1]}));
    }
    if (event === "joinGame" && arg1 && serverUtils.isString(arg1) && /^[a-zA-Z0-9]+$/.test(arg1)) {
      // TODO: make a proper way to create and check if rooms exist
      socket.join(arg1);
    }
    console.log(`Message: ${event} User ID: ${connectedClients.get(socket)}`);
  });

  /*
  Filter should be in JSON format. Options that aren't used should be null
  Filter options:
  Filter by isPublic
  Filter by max_players
  Filter by room_name
  Filter by room_type
  */
  socket.on("get-players", (event) => {
    console.log("event");
  })
  socket.on("get-rooms", async (filters) => {
    console.log(`Websocket with id ${socket.id} is requesting rooms!`)
    socket.emit("rooms", await rooms.getRoomsWithFilters(filters));
  });

  socket.on("close", () => {
    console.log(`WebSocket disconnected - User ID: ${connectedClients.get(socket)}`);
    connectedClients.delete(socket);
  });
});

server.listen(port, function () {
  console.log(`EasyPoker server listening on port http://localhost:${port}!`);
});
