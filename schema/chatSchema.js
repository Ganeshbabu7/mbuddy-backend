const mongoose = require("mongoose");

const createMessageSchema = new mongoose.Schema(
  {
    users: { type: Array },
    messageType: { type: String, default: "oneToOne" },
    groupName: { type: String },
    groupTitle: { type: String },
    groupProfilePic: { type: String },
    adminsList: { type: Array },
    communityId: { type: String, default: "" },
    teamId: { type: String, default: "" },
    subTeamId: { type: String, default: "" },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Message Id" }
);

const messageSchema = new mongoose.Schema(
  {
    chatId: { type: String },
    message: {
      senderId: { type: String },
      type: { type: String },
      text: { type: String },
      image: { type: Array },
      video: { type: Array },
      audio: { type: Array },
      contact: { type: Array },
      location: {
        lat: { type: String },
        long: { type: String },
        address: {
          name: { type: String },
          location: { type: String },
        },
      },
      document: { type: Array },
      pendingStatus: { type: Boolean, default: false },
      deliveredStatus: { type: Boolean, default: false },
      readStatus: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Messages" }
);

const messageModel = mongoose.model("Messages", messageSchema);
const createMessageModel = mongoose.model("Message Id", createMessageSchema);

module.exports = {
  messageModel,
  createMessageModel,
};

// const MessageSchema = mongoose.Schema({
//     message: {
//         text: { type: String, required: true },
//     },
//     users: Array,
//     sender: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );
