const express = require("express");
const router = express.Router();
const { mongoose } = require("mongoose");
const { tokenValidation } = require("../auth/auth.js");
const { dbUrl } = require("../config/mongoDbConfig.js");

// Schema :
const { BuddysModel } = require("../schema/loginSchema.js");
const { eventCategoryModel } = require("../schema/eventsSchema.js");
const { communityCategoryModel } = require("../schema/communitySchema.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Category Function :
const categoryFunction = async (req, res, model, name) => {
  try {
    const id = req.userId;
    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      const result = await model.find({ status: "Active" });
      res.status(200).send({ message: `${name} Category List`, result });
    } else res.status(400).send({ message: "User Does Not Exists" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
};

// Community Category List :
router.post("/list", tokenValidation, async (req, res) => {
  const { action } = req.body;
  if (action == "communityCategory") {
    await categoryFunction(req, res, communityCategoryModel, "Community");
  } else if (action == "eventsCategory") {
    await categoryFunction(req, res, eventCategoryModel, "Event");
  } else res.status(400).send({ message: "Action Does Not Exists" });
});

module.exports = router;
