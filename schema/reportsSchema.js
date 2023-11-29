// Use Mongoose :
const mongoose = require("mongoose");

// Buddys Report Schema :
const reportBuddysSchema = new mongoose.Schema(
  {
    otherUserId: { type: String, require: true },
    reportedBy: [
      {
        userId: { type: String },
        reportDescription: { type: String },
      },
    ],
    adminDetails: {
      userId: { type: String },
      comment: { type: String },
    },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Buddys Reports" }
);

// Buds Report Schema :
const reportBudsSchema = new mongoose.Schema(
  {
    budId: { type: String, required: true },
    reportedBy: [
      {
        userId: { type: String },
        reportDescription: { type: String },
      },
    ],
    noOfReports: { type: Number },
    adminDetails: {
      userId: { type: String },
      comment: { type: String },
    },
  },
  { timestamps: true },
  { versionKey: false },
  { collation: "Buds Reports" }
);

// Comments Report Schema :
const commentReportSchema = new mongoose.Schema(
  {
    budId: { type: String, required: true },
    commentId: { type: String, required: true },
    reportedBy: [
      {
        userId: { type: String },
        reportDescription: { type: String },
      },
    ],
    noOfReports: { type: Number },
    adminDetails: {
      userId: { type: String },
      comment: { type: String },
    },
  },
  { timestamps: true },
  { versionKey: false },
  { collation: "Comments Reports" }
);

// Stories Report Schema :
const reportStoriesSchema = new mongoose.Schema(
  {
    storyId: { type: String, require: true },
    reportedBy: [
      {
        userId: { type: String },
        reportDescription: { type: String },
      },
    ],
    adminDetails: {
      userId: { type: String },
      comment: { type: String },
    },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Stories Reports" }
);

// Chat Report Schema :
const reportChatsSchema = new mongoose.Schema(
  {
    chatId: { type: String, require: true },
    reportedBy: [
      {
        userId: { type: String },
        reportDescription: { type: String },
      },
    ],
    adminDetails: {
      userId: { type: String },
      comment: { type: String },
    },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Chats Reports" }
);

// Community, Teams & SubTeams Report Schema :
const reportCommunitiesSchema = new mongoose.Schema(
  {
    communityId: { type: String, require: true },
    teamId: { type: String },
    subTeamId: { type: String },
    reportType: { type: String },
    reportedBy: [
      {
        userId: { type: String },
        reportDescription: { type: String },
      },
    ],
    adminDetails: {
      userId: { type: String },
      comment: { type: String },
    },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Community Reports" }
);

// Events Report Schema :
const reportEventsSchema = new mongoose.Schema(
  {
    eventId: { type: String, require: true },
    reportedBy: [
      {
        userId: { type: String },
        reportDescription: { type: String },
      },
    ],
    adminDetails: {
      userId: { type: String },
      comment: { type: String },
    },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Events Reports" }
);

const reportChatsModel = mongoose.model("Chats Reports", reportChatsSchema);
const reportEventsModel = mongoose.model("Events Reports", reportEventsSchema);
const reportBuddysModel = mongoose.model("Buddys Reports", reportBuddysSchema);
const reportBudsModel = mongoose.model("Buds Report Details", reportBudsSchema);
const reportCommentsModel = mongoose.model(
  "Comments Reports",
  commentReportSchema
);
const reportStoriesModel = mongoose.model(
  "Stories Reports",
  reportStoriesSchema
);
const reportCommunitiesModel = mongoose.model(
  "Communities Reports",
  reportCommunitiesSchema
);

module.exports = {
  reportBudsModel,
  reportChatsModel,
  reportEventsModel,
  reportBuddysModel,
  reportStoriesModel,
  reportCommentsModel,
  reportCommunitiesModel,
};
