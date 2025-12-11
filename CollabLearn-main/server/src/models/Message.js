const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  chatId: { type: String, required: true },
  senderId: { type: String, required: true },
  text: { type: String, required: true },
  time: { type: Date, required: true, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
