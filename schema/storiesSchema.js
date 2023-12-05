// Use Mongoose :
const mongoose = require("mongoose");

// Stories Schemas :
const storySchema = new mongoose.Schema(
  {
    text: { type: String },
    textBgColour: { type: String },
    textFontStyle: { type: String },
    image: { type: Object, default: {} },
    video: { type: Object, default: {} },
    userId: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isViewed: { type: Boolean, default: false },
    buddyDetails: { type: Object, default: {} },
    imageId: { type: [{ type: String }] },
    videoId: { type: [{ type: String }] },
    noOfView: { type: Number, default: 0 },
    viewedBy: [
      {
        userId: { type: String },
        time: { type: String },
      },
    ],
    storyType: { type: String },
    whoCanSeeYourStories: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Stories" }
);

const storyModel = mongoose.model("Stories", storySchema);

module.exports = { storyModel };
