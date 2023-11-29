// Use Mongoose :
const mongoose = require("mongoose");
const moment = require("moment-timezone");

// Buds Schema
const budSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    communityId: { type: Array },
    teamId: { type: Array },
    subTeamId: { type: Array },
    description: { type: String },
    link: { type: String },
    tagBuddys: { type: Array },
    tagBuddysDetails: { type: Array },
    mentionBuddys: { type: Array },
    mentionDetails: { type: Array },
    locationId: { type: String },
    pollsId: { type: String },
    imageId: { type: [{ type: String }] },
    videoId: { type: String },
    docId: { type: String },
    // docId: { type: [{ type: String }] },
    viewedBy: { type: Array },
    whoCanViewyourBud: { type: String },
    whoCanComment: { type: String },
    budOwner: { type: String },
    isVerified: { type: Boolean, default: false },
    isDelete: { type: Boolean, default: false },
    reBudStatus: { type: Boolean, default: false },
    reBudDetails: [
      {
        reBudUserId: { type: String },
        reBudUserName: { type: String },
        reBudFullName: { type: String },
        reBudUserProfilePic: { type: String },
        reBudTitle: { type: String },
        reBudisVerified: { type: String },
        reBudThoughts: { type: String },
      },
    ],
    buddyDetails: { type: Object, default: {} },
    buddyOwnerDetails: { type: Object, default: {} },
    location: { type: Object, default: {} },
    image: { type: Object, default: {} },
    video: { type: Object, default: {} },
    doc: { type: Object, default: {} },
    polls: { type: Object, default: {} },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    reBudCount: { type: Number, default: 0 },
    weatherLiked: { type: Boolean, default: false },
    currentUser: { type: Boolean, default: false },
    budType: { type: String },
    hideBy: { type: Array },
    savedBy: { type: Array },
    isSaved: { type: Boolean, default: false },
    isDelete: { type: Boolean, default: false },
    isComment: { type: Boolean, default: false },
    isArchive: { type: Boolean, default: false },
    isReported: { type: Boolean, default: false },
    budStatus: { type: String, default: "Active" },
    adminComment: { type: String, default: "None" },
    adminId: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Buds" }
);

const imageSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    imageType: { type: String },
    imageUrl: { type: String },
    tempImageUrl: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Images" }
);

const videoSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    videoUrl: { type: String },
    thumbnailUrl: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Videos" }
);

const audioSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    audioUrl: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Audios" }
);

const documentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    documentUrl: { type: String },
    documentName: { type: String },
    documentFormat: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Documents" }
);

const tagsSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    tagName: { type: String },
    trendingScore: { type: Number, default: 0 },
    updated: [{ type: Date }],
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Tags" }
);

const tagsResultSchema = new mongoose.Schema(
  {
    // budId : {type:String},
    tagName: { type: String },
    totalTrendingScore: { type: Number },
    trendingScoreInLast24Hours: { type: Number },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Trending Tags" }
);

const locationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    latitude: { type: String },
    longitude: { type: String },
    address: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "location" }
);

const pollSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    pollQuestion: { type: String },
    pollOptions: [
      {
        label: { type: String },
        average: { type: String, default: 0 },
      },
    ],
    pollDurationDate: { type: Date },
    pollDurationTime: { type: String },
    pollDuration: { type: String },
    remainingTime: { type: String, default: null },
    results: { type: [Object] },
    totalNoofResult: { type: Number, default: 0 },
    isAnswered: { type: String },
    createdAt: {
      type: String,
      default: moment().format("YYYY-MM-DD HH:mm:ss"),
    },
    updatedAt: {
      type: String,
      default: moment().format("YYYY-MM-DD HH:mm:ss"),
    },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Polls" }
);

const resultSchema = new mongoose.Schema(
  {
    pollId: { type: String, required: true },
    userId: { type: String },
    optionId: { type: String, required: true },
    totalNoofResult: { type: Number, default: 0 },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Results" }
);

const likeSchema = new mongoose.Schema(
  {
    budId: { type: String, required: true },
    likeCount: { type: Number, default: 0 },
    likedBy: [
      {
        userId: { type: String },
        weatherLiked: { type: Boolean, default: false },
        currentUser: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true },
  { versionKey: false },
  { collation: "Likes" }
);

const commentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    userDetails: { type: Object, default: {} },
    budId: { type: String, required: true },
    comment: { type: String, require: true },
    commentLikeCount: { type: Number, default: 0 },
    commentReplyCount: { type: Number, default: 0 },
    attachments: { type: String },
    duration: { type: String },
    weatherLiked: { type: Boolean, default: false },
    isDelete: { type: Boolean, default: false },
    isReported: { type: Boolean, default: false },
  },
  { timestamps: true },
  { versionKey: false },
  { collation: "Comments" }
);

const commentLikeSchema = new mongoose.Schema(
  {
    commentId: { type: String, required: true },
    likeCount: { type: Number, default: 0 },
    likedBy: [
      {
        userId: { type: String },
        weatherLiked: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true },
  { versionKey: false },
  { collation: "Comment Likes" }
);

const commentReplySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    userDetails: { type: Object, default: {} },
    commentId: { type: String, required: true },
    reply: { type: String, require: true },
    duration: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collation: "Comment Reply" }
);

const giftSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    budId: { type: String, required: true },
    appreciation: { type: String },
    currency: { type: String },
    giftAmount: { type: Number, require: true },
  },
  { timestamps: true },
  { versionKey: false },
  { collation: "Gifts" }
);

const saveBudsSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    budId: { type: String, required: true },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Saved Buds" }
);

const budsModel = mongoose.model("Buds", budSchema);
const tagsModel = mongoose.model("Tags", tagsSchema);
const pollModel = mongoose.model("Polls", pollSchema);
const likesModel = mongoose.model("Likes", likeSchema);
const giftsModel = mongoose.model("Gifts", giftSchema);
const imageModel = mongoose.model("Images", imageSchema);
const videoModel = mongoose.model("Videos", videoSchema);
const audioModel = mongoose.model("Audios", audioSchema);
const resultModel = mongoose.model("Results", resultSchema);
const commentsModel = mongoose.model("Comments", commentSchema);
const locationModel = mongoose.model("Location", locationSchema);
const documentModel = mongoose.model("Documents", documentSchema);
const saveBudsModel = mongoose.model("Saved Buds", saveBudsSchema);
const tagsResultModel = mongoose.model("Trending Tags", tagsResultSchema);
const commentLikeModel = mongoose.model("Comment Likes", commentLikeSchema);
const commentReplyModel = mongoose.model("Comment Reply", commentReplySchema);

module.exports = {
  budsModel,
  tagsModel,
  pollModel,
  likesModel,
  imageModel,
  audioModel,
  videoModel,
  giftsModel,
  resultModel,
  saveBudsModel,
  documentModel,
  commentsModel,
  locationModel,
  tagsResultModel,
  commentLikeModel,
  commentReplyModel,
};
