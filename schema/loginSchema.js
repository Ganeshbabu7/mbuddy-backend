// Use Mongoose :
const mongoose = require("mongoose");
const validator = require("validator");

// 1-Buddies Registration Schema :
const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    type: { type: String },
    email_mobNo: { type: String },
    emailId: { type: String },
    countryCode: { type: String },
    mobNo: { type: String },
    dob: { type: Date },
    password: { type: String },
    referralCode: { type: String },
    referredByCode: { type: String },
    isOtpVerified: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isVerifiedStatus: { type: String, default: "none" },
    useAgree: { type: Boolean, default: false },
    otp: { type: String },
    userName: { type: String },
    isBlocked: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    lastActive: { type: Date },
    buddyStatus: { type: String, default: "Active" },
    adminComment: { type: String, default: "None" },
    adminId: { type: String },
    role: { type: String },
    // buddyRole: { type: String, default: "buddy" },
  },
  { timestamps: true, versionKey: false, collection: "buddys" }
);

// 2-Buddies Login Schema :
const tokenSchema = new mongoose.Schema(
  {
    userId: { type: String, default: "" },
    browserName: { type: String, default: "" },
    browserVersion: { type: String, default: "" },
    deviceName: { type: String, default: "" },
    deviceType: { type: String, default: "" },
    deviceVersion: { type: String, default: "" },
    appVersion: { type: String, default: "" },
    emailId: { type: String },
    countryCode: { type: String },
    mobNo: { type: Number },
    token: { type: String },
    tokenStatus: { type: String, default: "Active" },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Token" }
);

// 3-OTP Verification Schema :
const otpVerificationSchema = new mongoose.Schema(
  {
    emailId: { type: String },
    countryCode: { type: String },
    mobNo: { type: String },
    otp: { type: String, required: true },
    otpStatus: { type: String, default: "Active" },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "otpVerification" }
);

// 4-Referral Code Schema :
const referralCodeSchema = new mongoose.Schema(
  {
    referredBy: { type: String },
    referredTo: { type: String },
    referralCode: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "referralCodeDeatils" }
);

const BuddysModel = mongoose.model("buddys", userSchema);
const tokenModel = mongoose.model("Token", tokenSchema);
const otpModel = mongoose.model("otpVerification", otpVerificationSchema);
const referralModel = mongoose.model("referralCodeDeatils", referralCodeSchema);

module.exports = {
  otpModel,
  tokenModel,
  BuddysModel,
  referralModel,
};
