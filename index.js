const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Chat = require("./model/Chat");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const users = {}; // To store connected users and their rooms

// MongoDB connection
const MONGO_URI = "mongodb+srv://pk15sk30:pM3fsNELLhONZJi2@cluster0.wmbk7.mongodb.net/?retryWrites=true&w=majority";
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Serve static files
app.use(express.static("public"));

// Serve the main HTML file
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// API to retrieve chat history for a specific room
app.get("/history/:room", async (req, res) => {
  try {
    const chats = await Chat.find({ room: req.params.room }).sort({ timestamp: 1 });
    res.json(chats);
  } catch (err) {
    console.error("Error retrieving chat history:", err);
    res.status(500).send("Error retrieving chat history");
  }
});

// Handle socket connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Handle "join" event
  socket.on("join", (data) => {
    const { username, targetUser } = data;

    if (!username || !targetUser) {
      console.error("Error: Username or target user missing");
      return;
    }

    // Generate a unique room name based on the two users
    const room = [username, targetUser].sort().join("_");

    // Save the room and username
    users[socket.id] = { username, room };
    socket.join(room);

    console.log(`${username} joined room: ${room}`);

    // Fetch chat history for the room and send it to the user
    Chat.find({ room })
      .sort({ timestamp: 1 })
      .then((chats) => {
        socket.emit("chat history", chats);
      })
      .catch((err) => {
        console.error("Error fetching chat history:", err);
      });
  });

  // Handle "chat message" event
  socket.on("chat message", async (data) => {
    const { username, message, targetUser } = data;

    if (!username || !message || !targetUser) {
      console.error("Error: Missing data in chat message");
      return;
    }

    // Generate the room name based on the two users
    const room = [username, targetUser].sort().join("_");

    try {
      // Save the message to the database
      const chatMessage = new Chat({
        username,
        message,
        room,
        timestamp: new Date(),
      });
      await chatMessage.save();

      // Broadcast the message to the room
      io.to(room).emit("chat message", { username, message });
    } catch (err) {
      console.error("Error saving message to DB:", err);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      console.log(`${user.username} disconnected from room: ${user.room}`);
      delete users[socket.id];
    }
  });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
