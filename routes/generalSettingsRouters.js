const express = require("express");
const router = express.Router();
const { mongoose } = require("mongoose");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { sendOtpToMobno } = require("../config/msg91Config.js");
const { generalSettingsModel } = require("../schema/settingsSchema.js");
const { generateOTP, hashOtp } = require("../services/loginFunctions.js");
const {
  hashCompare,
  hashPassword,
  tokenValidation,
} = require("../auth/auth.js");
const {
  otpModel,
  tokenModel,
  BuddysModel,
} = require("../schema/loginSchema.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// General Settings Router :
router.post("/generalSettings", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const action = req.body.action;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        let check = await generalSettingsModel.findOne({ userId: id });
        if (!check) {
          let result = new generalSettingsModel(req.body);
          await result.save();
          res.status(200).send({ message: "General Settings Created" });
        } else res.status(400).send({ message: "Use Action Update" });
      } else if (action == "read") {
        let result = await generalSettingsModel
          .findOne({ userId: id })
          .sort({ createdAt: -1 });
        res.status(200).send({ message: "General Settings", result });
      } else if (action == "update") {
        let result = await generalSettingsModel.findOneAndUpdate(
          { userId: id },
          { $set: req.body }
        );
        res.status(200).send({ message: "Saved Successfully" });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Manage Session Router :
router.post("/changePassword", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, oldPassword, newPassword } = req.body;

    let buddy = await BuddysModel.findOne({ _id: id }).sort({ createdAt: -1 });
    if (buddy) {
      if (action == "checkOldPassword") {
        if (await hashCompare(oldPassword, buddy.password)) {
          // let otpLength = 6;
          // let Otp = await generateOTP(otpLength);
          // let hash = await hashOtp(Otp);

          // if (buddy.countryCode && buddy.mobNo) {
          //   let otpSave;
          //   await sendOtpToMobno({
          //     otp: Otp,
          //     countryCode: buddy.countryCode,
          //     mobNo: buddy.mobNo,
          //   });
          //   otpSave = new otpModel({
          //     emailId: "",
          //     countryCode: buddy.countryCode,
          //     mobNo: buddy.mobNo,
          //     otp: hash,
          //   });
          // } else if (buddy.emailId) {
          //   await sendOtpToEmail({
          //     userName: buddy.fullName,
          //     userEmail: buddy.emailId,
          //     otp: Otp,
          //   });
          //   otpSave = new otpModel({
          //     emailId: buddy.emailId,
          //     countryCode: "",
          //     mobNo: "",
          //     otp: hash,
          //   });
          // }
          res.status(200).send({
            message: "Password Verified Successfully",
          });
        } else res.status(400).send({ message: "Incorrect old password" });
      } else if (action == "changePassword") {
        if (await hashCompare(oldPassword, buddy.password)) {
          await BuddysModel.findOneAndUpdate(
            { _id: id },
            { $set: { password: await hashPassword(newPassword) } }
          );
          res.status(200).send({ message: "Password Changed Successfully" });
        } else res.status(400).send({ message: "Incorrect old password" });
      }
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Manage Session Router :
router.post("/manageSession", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    let buddy = await BuddysModel.find({ _id: id });
    if (buddy) {
      let result = await tokenModel.find(
        { userId: id },
        {
          createdAt: 1,
          deviceName: 1,
          deviceType: 1,
          appVersion: 1,
          deviceVersion: 1,
        }
      );
      res.status(200).send({ message: "Manage Session Details", result });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
  }
});

// Delete My Profile :
router.post("/deleteMyProfile", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    let buddy = await BuddysModel.find({ _id: id });
    if (buddy) {
      res.status(200).send({ message: "Working in Progress" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
