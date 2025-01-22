const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { collection: "chats" } // Collection name
);

module.exports = mongoose.model("Chat", chatSchema);
