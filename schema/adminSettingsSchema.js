const mongoose = require("mongoose");

const siteSettingsSchema = new mongoose.Schema(
  {
    userId: { type: String },
    siteTitle: { type: String },
    siteName: { type: String },
    siteEmail: { type: String },
    siteKeywords: { type: String },
    siteDescription: { type: String },
    siteLogo: { type: String },
    siteFavIcon: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Site Settings" }
);

const apiKeySettingsSchema = new mongoose.Schema(
  {
    userId: { type: String },
    googleAPI: { type: String },
    giphyAPI: { type: String },
    googleAnalyticsCode: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "API Key Settings" }
);

const coinRewardSettingsSchema = new mongoose.Schema(
  {
    userId: { type: String },
    pro: { type: String },
    free: { type: String },
    likes: { type: String },
    reBuds: { type: String },
    newBuds: { type: String },
    comments: { type: String },
    usdPoints: { type: String },
    minimumWithdraw: { type: String },
    maximumWithdraw: { type: String },
    withDrawlsPerWeek: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Coin Rewards Settings" }
);

const emailSettingsSchema = new mongoose.Schema(
  {
    userId: { type: String },
    smtpHost: { type: String },
    smtpPort: { type: String },
    smtpUserName: { type: String },
    smtpPassword: { type: String },
    smtpEncryption: { type: String },
    smtpServerType: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Email Settings" }
);

const smsSettingsSchema = new mongoose.Schema(
  {
    userId: { type: String },
    defaultSmsProvider: { type: String },
    fireBaseUsername: { type: String },
    fireBasePassword: { type: String },
    fireBaseAuthKey: { type: String },
    msg91UserName: { type: String },
    msg91Password: { type: String },
    msg91AuthKey: { type: String },
    mobNumber: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Sms Settings" }
);

const notificationSettingsSchema = new mongoose.Schema(
  {
    userId: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Notification Settings" }
);

const siteSettingsModel = mongoose.model("Site Settings", siteSettingsSchema);
const smsSettingsModel = mongoose.model("Sms Settings", smsSettingsSchema);
const apiKeySettingsModel = mongoose.model(
  "API Key Settings",
  apiKeySettingsSchema
);
const coinRewardSettingsModel = mongoose.model(
  "Coin And Rewards Settings",
  coinRewardSettingsSchema
);
const emailSettingsModel = mongoose.model(
  "Email Settings",
  emailSettingsSchema
);
const notificationSettingsModel = mongoose.model(
  "Notification Settings",
  notificationSettingsSchema
);

module.exports = {
  smsSettingsModel,
  siteSettingsModel,
  emailSettingsModel,
  apiKeySettingsModel,
  coinRewardSettingsModel,
  notificationSettingsModel,
};
