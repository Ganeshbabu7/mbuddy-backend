const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { tokenValidation } = require("../auth/auth.js");
const { BuddysModel } = require("../schema/loginSchema.js");
const { buddyPromisesFunction } = require("../services/buddyFunctions.js");
const { discoverSuggestion } = require("../services/discoverFunctions.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Discover Router :
router.post("/", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      const result = {
        buddys: await discoverSuggestion.buddySuggestion(id),
        community: await discoverSuggestion.communitySuggestion(id),
        event: await discoverSuggestion.eventSuggestion(id),
      };
      res.status(200).send({ message: "Discover List", result });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Buddy Suggestion Category Wise :
router.post("/buddySuggestionCategory", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      const result = {};
      res.status(200).send({ message: "Buddy Suggestion List", result });
    } else res.status(400).send({ message: "User Does Not Exists" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Verified Buddys :
router.post("/verifiedBuddys", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const buddy = await BuddysModel.find({ _id: id });
    if (buddy) {
      const buddys = await BuddysModel.find({
        _id: { $ne: id },
        isVerified: true,
      });
      const result = await buddyPromisesFunction(req,buddys);
      res.status(200).send({ message: "Verified Buddy Details", result });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;
