const express = require("express");
const PORT = 3000;
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  getCurrentUser,
  userJoin,
  getRoomUsers,
  userLeave,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = "Chukwuebuka's bot";

// WebSocket.OPEN()

// Run when a client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    console.log(user);
    socket.join(user.room);

    console.log("New WS Connection......"); // anytime there is a connection between the frontend and backend, there is a connection
    socket.emit("message", formatMessage(botName, "Welcome to ChatCord!")); // sends a message to the client i.e(Only to the current user)

    // console.log(WebSocket)
    // broadcast to other users except the user who sends the message
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

      // send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room),
      })
  });

  // check when a user disconnect and informs everybody was
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );
    };

    io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room),
      })
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    console.log(msg);

    const user = getCurrentUser(socket.id);

    // lets re-emit back to the client
    console.log(user);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });
});
// to set a static folder to be recognized by express
app.use(express.static(path.join(path.join(__dirname, "public"))));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
