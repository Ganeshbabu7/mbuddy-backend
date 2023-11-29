const mongoose = require("mongoose");
const moment = require("moment-timezone");

// General Settings Schema :
const generalSettingsSchema = new mongoose.Schema(
  {
    userId: { type: String, require: true },
    appLanguage: { type: String, default: "English" },
    contactSync: { type: Boolean, default: false },
    idDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false, collection: "generalSettings" }
);

// Privacy Settings Schema :
const privacySettingsSchema = new mongoose.Schema(
  {
    userId: { type: String, require: true },
    accountPrivacy: { type: Boolean, default: false },
    whoCanViewyourBud: { type: String, default: "everyOne" },
    whoCanComment: { type: String, default: "everyOne" },
    whoCanTagYou: { type: String, default: "everyOne" },
    whoCanMentionYou: { type: String, default: "everyOne" },
    whoCanSeeStories: { type: String, default: "everyOne" },
  },
  { timestamps: true, versionKey: false, collection: "privacySettings" }
);

const blockCommentersSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId },
    blockedUserId: { type: Array },
  },
  { timestamps: true, versionKey: false, collection: "blockComments" }
);

const hideStoriesSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId },
    hideUserId: { type: Array },
  },
  { timestamps: true, versionKey: false, collection: "hideStories" }
);

const shareStoriesSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId },
    shareUserId: { type: Array },
  },
  { timestamps: true, versionKey: false, collection: "shareStories" }
);

const muteStoriesSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId },
    muteUserId: { type: Array },
  },
  { timestamps: true, versionKey: false, collection: "muteStories" }
);

const blockedAccountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId },
    blockedUserDetails: [
      {
        blockedUserId: { type: String },
        createdAt: {
          type: String,
          default: moment().format("YYYY-MM-DD HH:mm:ss"),
        },
      },
    ],
  },
  { timestamps: true, versionKey: false, collection: "blockedAccount" }
);

const hideStoriesModel = mongoose.model("hideStories", hideStoriesSchema);
const muteStoriesModel = mongoose.model("muteStories", muteStoriesSchema);
const shareStoriesModel = mongoose.model("shareStories", shareStoriesSchema);
const blockedAccountModel = mongoose.model(
  "blockedAccount",
  blockedAccountSchema
);
const blockCommentersModel = mongoose.model(
  "blockComments",
  blockCommentersSchema
);
const generalSettingsModel = mongoose.model(
  "generalSettings",
  generalSettingsSchema
);
const privacySettingsModel = mongoose.model(
  "privacySettings",
  privacySettingsSchema
);

module.exports = {
  hideStoriesModel,
  muteStoriesModel,
  shareStoriesModel,
  blockedAccountModel,
  blockCommentersModel,
  generalSettingsModel,
  privacySettingsModel,
};
