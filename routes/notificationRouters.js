const express = require("express");
const router = express.Router();
const { mongoose } = require("mongoose");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { tokenValidation } = require("../auth/auth.js");
const { BuddysModel } = require("../schema/loginSchema.js");
const {
  notificationModel,
  pushTokenModel,
  communityNotificationModel,
} = require("../schema/notificationSchema.js");
const {
  ntfReadFunction,
  ntfCountFunction,
} = require("../services/notificationFunctions.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Push NTF Token :
router.post("/ntfToken", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { deviceType, pushToken } = req.body;
    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      const pushTokenCheck = await pushTokenModel.findOne({ userId: id });
      if (pushTokenCheck) {
        const result = new pushTokenModel({
          userId: id,
          deviceType: deviceType,
          pushToken: pushToken,
        });
        res
          .status(201)
          .send({ message: "Push NTF Token Created Successfully", result });
      } else {
        const result = await pushTokenModel.updateOne(
          { userId: id },
          { $set: req.body },
          { new: true }
        );
        res
          .status(200)
          .send({ message: "Push NTF Token Updated Successfully", result });
      }
    } else res.status(400).send({ message: "User Does Not Exists" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Notification List :
router.post("/list", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, skip } = req.body;
    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "communityNtf") {
        await ntfReadFunction(res, id, communityNotificationModel, skip);
      } else if (action == "ntf") {
        await ntfReadFunction(res, id, notificationModel, skip);
      } else res.status(400).send({ message: "Action Does Not Exists" });
    } else res.status(400).send({ message: "User Does Not Exists" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Notification Count :
router.post("/ntfCount", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action } = req.body;
    if (action == "communityNtfCount") {
      await ntfCountFunction(res, id, communityNotificationModel);
    } else if (action == "ntfCount") {
      await ntfCountFunction(res, id, notificationModel);
    } else res.status(400).send({ message: "Action Does Not Exists" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Update Read By List :
router.post("/addReadBy", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { notificationId, action } = req.body;
    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      let result;
      if (action == "ntf") {
        result = await notificationModel.findOneAndUpdate(
          { _id: notificationId },
          { $addToSet: { readBy: id } }
        );
      } else if (action == "communityNtf") {
        result = await communityNotificationModel.findOneAndUpdate(
          { _id: notificationId },
          { $addToSet: { readBy: id } }
        );
      }
      res
        .status(200)
        .send({ message: "Notification Read Successfully", result });
    } else res.status(400).send({ message: "User Does Not Exists" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;
