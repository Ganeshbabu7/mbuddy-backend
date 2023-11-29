const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { tokenValidation, adminTokenValidation } = require("../auth/auth.js");

// Schema :
const { BuddysModel } = require("../schema/loginSchema.js");
const {
  reportBudsModel,
  reportChatsModel,
  reportEventsModel,
  reportBuddysModel,
  reportStoriesModel,
  reportCommentsModel,
  reportCommunitiesModel,
} = require("../schema/reportsSchema.js");

// Pipeline :
const {
  budsReportPipeline,
  chatsReportPipeline,
  eventsReportPipeline,
  buddysReportPipeline,
  storiesReportPipeline,
  commentsReportPipeline,
  communitiesReportPipeline,
} = require("./reportPipelines.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Manage Buddys Router :
router.post("/mangeReport", adminTokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, currentPage, pageSize } = req.body;
    let admin = await BuddysModel.findOne({ _id: id });
    if (admin) {
      if (action == "buddys") {
        const query = await buddysReportPipeline(currentPage, pageSize);
        const result = await reportBuddysModel.aggregate(query);
        res.status(400).send({ message: "Buddys Report Details", result });
      } else if (action == "buds") {
        const query = await budsReportPipeline(currentPage, pageSize);
        const result = await reportBudsModel.aggregate(query);
        res.status(400).send({ message: "Buds Report Details", result });
      } else if (action == "comments") {
        const query = await commentsReportPipeline(currentPage, pageSize);
        const result = await reportCommentsModel.aggregate(query);
        res.status(400).send({ message: "Comments Report Details", result });
      } else if (action == "stories") {
        const query = await storiesReportPipeline(currentPage, pageSize);
        const result = await reportStoriesModel.aggregate(query);
        res.status(400).send({ message: "Stories Report Details", result });
      } else if (action == "chats") {
        const query = await chatsReportPipeline(currentPage, pageSize);
        const result = await reportChatsModel.aggregate(query);
        res.status(400).send({ message: "Chats Report Details", result });
      } else if (action == "communities") {
        const query = await communitiesReportPipeline(currentPage, pageSize);
        const result = await reportCommunitiesModel.aggregate(query);
        res.status(400).send({ message: "Communities Report Details", result });
      } else if (action == "events") {
        const query = await eventsReportPipeline(currentPage, pageSize);
        const result = await reportEventsModel.aggregate(query);
        res.status(400).send({ message: "Events Report Details", result });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "Admin Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;
