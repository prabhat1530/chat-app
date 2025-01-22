const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Chat = require("./model/Chat"); // Import Chat model

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// MongoDB connection
const MONGO_URI = "mongodb+srv://pk15sk30:pM3fsNELLhONZJi2@cluster0.wmbk7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Serve static files
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Retrieve chat history
app.get("/history", async (req, res) => {
  try {
    const chats = await Chat.find().sort({ timestamp: 1 }); // Sort by oldest first
    res.json(chats);
  } catch (err) {
    res.status(500).send("Error retrieving chat history");
  }
});

// Handle socket connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Broadcast messages and save to DB
  socket.on("chat message", async (msg) => {
    const chatMessage = new Chat({ username: "Anonymous", message: msg });
    await chatMessage.save(); // Save message to DB
    io.emit("chat message", msg);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
