const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    username: { type: String, required: true }, // Email as username
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { collection: "chats" }
);

module.exports = mongoose.model("Chat", chatSchema);
