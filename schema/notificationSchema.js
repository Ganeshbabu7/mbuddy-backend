const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String },
    budId: { type: String },
    commentId: { type: String },
    replyId: { type: String },
    reBudId: { type: String },
    notificationType: { type: String },
    title: { type: String, default: "MYBUDDY" },
    body: { type: String },
    readBy: { type: Array },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "notifications" }
);

const communityNotificationSchema = new mongoose.Schema(
  {
    userId: { type: String },
    budId: { type: String },
    commentId: { type: String },
    reBudId: { type: String },
    notificationType: { type: String },
    title: { type: String, default: "MYBUDDY" },
    body: { type: String },
    readBy: { type: Array },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "community notifications" }
);

const pushTokenSchema = new mongoose.Schema(
  {
    userId: { type: String },
    deviceType: { type: String },
    pushToken: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "push ntf tokens" }
);

const pushTokenModel = mongoose.model("push ntf tokens", pushTokenSchema);
const notificationModel = mongoose.model("notifications", notificationSchema);
const communityNotificationModel = mongoose.model(
  "community notifications",
  communityNotificationSchema
);

module.exports = {
  pushTokenModel,
  notificationModel,
  communityNotificationModel,
};
