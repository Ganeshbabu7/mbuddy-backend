// Use Mongoose :
const mongoose = require("mongoose");
const validator = require("validator");

// Buddys Profile Schemas :

const buddyProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    buds: { type: Array },
    followingBuddys: { type: Array },
    communities: { type: Array },
    followerBuddys: { type: Array },
    profileImageDetails: { type: Object, default: {} },
    personalDetails: { type: Object, default: {} },
    experienceDetails: { type: Object, default: {} },
    educationDetails: { type: Object, default: {} },
    achievementDetails: { type: Object, default: {} },
    skillsDetails: { type: Object, default: {} },
    intrestDetails: { type: Object, default: {} },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "buddyProfile" }
);

const profileImageSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    profilePic: { type: String },
    coverPic: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "profileImage" }
);

const personalDetailsSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    fullName: { type: String },
    title: { type: String },
    userName: { type: String },
    gender: { type: String },
    dob: { type: Date },
    email: { type: String },
    countryCode: { type: String },
    mobNo: { type: String },
    languages: { type: Array },
    district: { type: String },
    state: { type: String },
    country: { type: String },
    aboutMe: { type: String },
    referralCode: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "personalDetails" }
);

const educationDetailsSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    institutionName: { type: String, require: true },
    degree: { type: String },
    fieldOfStudy: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    educationLocation: { type: String },
    educationDescription: { type: String },
    reOrder: { type: Number },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "educationDetails" }
);

const experienceDetailsSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    companyName: { type: String, require: true },
    position: { type: String },
    jobRole: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    experience: { type: String },
    jobLocation: { type: String },
    jobType: { type: String },
    jobDescription: { type: String },
    reOrder: { type: Number },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "experienceDetails" }
);

const achievementDetailsSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    title: { type: String, require: true },
    issuedBy: { type: String },
    issuedOn: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    associatedWith: { type: String },
    achievementDescription: { type: String },
    reOrder: { type: Number },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "achievementDetails" }
);

const skillsDetailsSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    skills: [{ skillName: { type: String } }],
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Skills Details" }
);

const intrestDetailsSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    intrestes: [{ intrestName: { type: String } }],
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Intrest Details" }
);

const buddyFollowerDetailsSchema = new mongoose.Schema(
  {
    userId: { type: String },
    followId: { type: String },
    type: { type: String, default: "Following" },
    status: { type: String, default: "Request Send" },
    isFollow: { type: Boolean, default: false },
    isRequested: { type: Boolean, default: false },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "buddyFollowerDetails" }
);

const profileImageModel = mongoose.model("profileImage", profileImageSchema);
const buddyProfileModel = mongoose.model("buddyProfile", buddyProfileSchema);
const skillsDetailsModel = mongoose.model(
  "Skills Details",
  skillsDetailsSchema
);
const intrestDetailsModel = mongoose.model(
  "Intrest Details",
  intrestDetailsSchema
);
const personalDetailsModel = mongoose.model(
  "personalDetails",
  personalDetailsSchema
);
const educationDetailsModel = mongoose.model(
  "educationDetails",
  educationDetailsSchema
);
const experienceDetailsModel = mongoose.model(
  "experienceDetails",
  experienceDetailsSchema
);
const achievementDetailsModel = mongoose.model(
  "achievementDetails",
  achievementDetailsSchema
);
const buddyFollowerDetailsModel = mongoose.model(
  "buddyFollowerDetails",
  buddyFollowerDetailsSchema
);

module.exports = {
  profileImageModel,
  buddyProfileModel,
  skillsDetailsModel,
  intrestDetailsModel,
  personalDetailsModel,
  educationDetailsModel,
  experienceDetailsModel,
  achievementDetailsModel,
  buddyFollowerDetailsModel,
};
