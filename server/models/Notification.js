const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: ["message", "group_invite", "friend_request", "mention"],
      required: true,
    },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    message: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    text: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
