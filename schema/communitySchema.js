// // Use Mongoose :
const mongoose = require("mongoose");
const validator = require("validator");
const moment = require("moment-timezone");

// Community Schema :
const communitySchema = new mongoose.Schema(
  {
    userId: { type: String, require: true },
    communityName: { type: String },
    countryCode: { type: String },
    mobNo: { type: String },
    designation: { type: String },
    selectCategory: { type: String },
    selectSubCategory: { type: String },
    expectedMemberCount: { type: String },
    aboutCommunity: { type: String },
    admins: { type: Array },
    buddysList: { type: Array },
    blockedBuddysList: [
      {
        userId: { type: String },
        createdAt: {
          type: String,
          default: moment().format("YYYY-MM-DD HH:mm:ss"),
        },
      },
    ],
    profilePic: { type: String },
    coverPic: { type: String },
    status: { type: String, default: "Request Sent" }, //Request Sent, Approved, Rejected
    communityGuidelines: {
      privacy: { type: String }, //pubslic, private
      joinFee: { type: String },
      verification: { type: String },
    },
    adminComment: { type: String, default: "None" },
    adminId: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Communities" }
);

const buddyJoinedSchema = new mongoose.Schema(
  {
    userId: { type: String, require: true },
    details: [
      {
        communityId: { type: String },
        teamDetails: [
          {
            teamId: { type: String },
            subTeamId: { type: Array },
          },
        ],
      },
    ],
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Joined Communities" }
);

const boardSchema = new mongoose.Schema(
  {
    type: { type: String },
    communityId: { type: String },
    teamId: { type: String },
    subTeamId: { type: String },
    budId: { type: String },
    boardedBy: { type: String },
    boardedOn: { type: Date },
    buddyDetails: { type: Object, default: {} },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Board Buds" }
);

const communityQuestionSchema = new mongoose.Schema(
  {
    userId: { type: String, require: true },
    question: { type: String },
    communityId: { type: String },
    communityName: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Community Questions" }
);

// ______________________________________________________________________________

// Counter Schema
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 555 },
});

const communityIdSchema = new mongoose.Schema(
  {
    userId: { type: String, require: true },
    communityId: { type: String },
    communityName: { type: String },
    memberId: { type: String },
    memberName: { type: String },
    positionName: { type: String },
    location: { type: String },
    userProfilePic: { type: String },
    communityProfilePic: { type: String },
    qrCode: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Comunity IdCards" }
);

const lastMemberIdSchema = new mongoose.Schema({
  communityId: { type: String, required: true },
  lastMemberId: { type: Number, default: 554 }, // Start from 555 - 1
});

communityIdSchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next();
  }

  let counter;
  try {
    counter = await Counter.findByIdAndUpdate(
      "community_member_counter",
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
  } catch (error) {
    return next(error);
  }

  const memberId = counter.seq.toString().padStart(4, "0");
  this.memberId = memberId;

  try {
    let lastAssigned = await LastMemberId.findOne({
      communityId: this.communityId,
    });
    if (!lastAssigned) {
      lastAssigned = new LastMemberId({ communityId: this.communityId });
    }

    const newLastMemberId = lastAssigned.lastMemberId + 1;
    this.memberId = newLastMemberId.toString().padStart(4, "0");
    lastAssigned.lastMemberId = newLastMemberId;

    this._lastAssigned = lastAssigned; // Store the updated lastAssigned document
  } catch (error) {
    return next(error);
  }

  next();
});

// Outside the middleware, handle saving the document
communityIdSchema.post("save", async function () {
  if (this._lastAssigned) {
    await this._lastAssigned.save();
  }
});

// ____________________________________________________________________________________

const joinCommunityRequestSchema = new mongoose.Schema(
  {
    communityId: { type: String },
    teamId: { type: String },
    subTeamId: { type: String },
    buddysList: {
      userId: { type: String },
      userStatus: { type: String, default: "Request Sent" },
    },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Community Request" }
);

// Community Category Schema :
const communityCategorySchema = new mongoose.Schema(
  {
    label: { type: String },
    value: { type: String },
    image: { type: String },
    status: { type: String },
    subCategory: [
      {
        label: { type: String },
        value: { type: String },
        image: { type: String },
        status: { type: String },
      },
    ],
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "CommunityCategory" }
);

// Team Schema :
const teamSchema = new mongoose.Schema(
  {
    userId: { type: String, require: true },
    communityId: { type: String },
    communityName: { type: String },
    teamName: { type: String },
    teamKeyword: { type: String },
    teamVisibility: { type: String },
    joinPrivacy: { type: String },
    joiningFee: { type: String },
    teamDescription: { type: String },
    whoCanViewTeam: { type: String },
    admins: { type: Array },
    buddysList: { type: Array },
    teamPic: { type: String },
    shortCode: { type: String },
    blockedBuddysList: [
      {
        userId: { type: String },
        createdAt: {
          type: String,
          default: moment().format("YYYY-MM-DD HH:mm:ss"),
        },
      },
    ],
    // createdBy : {type:String},
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Teams" }
);

const joinTeamRequestSchema = new mongoose.Schema(
  {
    communityId: { type: String },
    teamId: { type: String },
    buddysList: {
      userId: { type: String },
      userStatus: { type: String, default: "Request Sent" },
    },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Team Request" }
);

// Sub Team Schema :
const subTeamSchema = new mongoose.Schema(
  {
    userId: { type: String, require: true },
    communityId: { type: String },
    teamId: { type: String },
    teamName: { type: String },
    subTeamName: { type: String },
    teamKeyword: { type: String },
    teamVisibility: { type: String },
    joinPrivacy: { type: String },
    teamDescription: { type: String },
    whoCanViewTeam: { type: String },
    admins: { type: Array },
    buddysList: { type: Array },
    teamPic: { type: String },
    shortCode: { type: String },
    blockedBuddysList: [
      {
        userId: { type: String },
        createdAt: {
          type: String,
          default: moment().format("YYYY-MM-DD HH:mm:ss"),
        },
      },
    ],
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "SubTeams" }
);

const joinSubTeamRequestSchema = new mongoose.Schema(
  {
    communityId: { type: String },
    teamId: { type: String },
    subTeamId: { type: String },
    buddysList: {
      userId: { type: String },
      userStatus: { type: String, default: "Team Request Sent" },
    },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Sub-Team Request" }
);

const teamsModel = mongoose.model("Teams", teamSchema);
const Counter = mongoose.model("Counter", counterSchema);
const boardModel = mongoose.model("Board Buds", boardSchema);
const subTeamsModel = mongoose.model("SubTeams", subTeamSchema);
const communityModel = mongoose.model("Communities", communitySchema);
const LastMemberId = mongoose.model("LastMemberId", lastMemberIdSchema);
const communityIDModel = mongoose.model("CommunityIDModel", communityIdSchema);
const communityCategoryModel = mongoose.model(
  "CommunityCategory",
  communityCategorySchema
);
const buddyJoinedModel = mongoose.model(
  "Joined Communities",
  buddyJoinedSchema
);
const joinTeamRequestModel = mongoose.model(
  "Team Request",
  joinTeamRequestSchema
);
const joinRequestModel = mongoose.model(
  "Community Request",
  joinCommunityRequestSchema
);
const joinSubTeamRequestModel = mongoose.model(
  "Sub-Team Request",
  joinSubTeamRequestSchema
);
const communityQuestionModel = mongoose.model(
  "Community Questions",
  communityQuestionSchema
);

module.exports = {
  Counter,
  teamsModel,
  boardModel,
  LastMemberId,
  subTeamsModel,
  communityModel,
  communityIDModel,
  buddyJoinedModel,
  joinRequestModel,
  joinTeamRequestModel,
  communityQuestionModel,
  communityCategoryModel,
  joinSubTeamRequestModel,
};
