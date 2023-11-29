const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { tokenValidation, adminTokenValidation } = require("../auth/auth.js");

// Schema :
const { BuddysModel } = require("../schema/loginSchema.js");
const { eventCategoryModel } = require("../schema/eventsSchema.js");
const { communityCategoryModel } = require("../schema/communitySchema.js");
const {
  eventCategoryPipeline,
  communityCategoryPipeline,
} = require("./pipelines.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Community Category Router :
router.post("/", adminTokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, currentPage, pageSize } = req.body;
    const admin = await BuddysModel.findOne({ _id: id });
    if (admin) {
      if (action == "community") {
        const query = await communityCategoryPipeline(currentPage, pageSize);
        const result = await communityCategoryModel.aggregate(query);
        res.status(200).send({ message: "Community Category Details", result });
      } else if (action == "event") {
        const query = await eventCategoryPipeline(currentPage, pageSize);
        const result = await eventCategoryModel.aggregate(query);
        res.status(200).send({ message: "Event Category Details", result });
      } else res.status(400).send({ message: "Action Does Not Exists" });
    } else res.status(400).send({ message: "Admin Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;
