const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { tokenValidation, adminTokenValidation } = require("../auth/auth.js");

// Schema :
const { BuddysModel } = require("../schema/loginSchema.js");
const { buddysPipeline } = require("./pipelines.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Manage Buddys Router :
router.post("/manageBuddys", adminTokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, currentPage, pageSize } = req.body;
    let admin = await BuddysModel.findOne({ _id: id });
    console.log("admin: ", admin.role);
    if (admin) {
      if (action == "totalBuddys") {
        const pipeline = await buddysPipeline(currentPage, pageSize);
        const query = [
          {
            $match: {},
          },
          ...pipeline,
        ];
        const totalBuddysCount = await BuddysModel.countDocuments();
        const result = await BuddysModel.aggregate(query);
        const resultLength = result.length;
        res.status(200).send({
          message: "Total Buddys Details",
          totalBuddysCount,
          resultLength,
          result,
        });
      } else if (action == "activeBuddys") {
        const currentDate = new Date();
        let oneMonthAgo = new Date(currentDate);
        oneMonthAgo.setMonth(currentDate.getMonth() - 1);

        const pipeline = await buddysPipeline(currentPage, pageSize);
        const query = [
          {
            $match: {
              buddyStatus: "Active",
              lastActive: { $gte: oneMonthAgo },
            },
          },
          ...pipeline,
        ];
        const totalBuddysCount = await BuddysModel.countDocuments({
          lastActive: { $gt: oneMonthAgo },
        });
        const result = await BuddysModel.aggregate(query);
        const resultLength = result.length;
        res.status(200).send({
          message: "Active Buddys Details",
          totalBuddysCount,
          resultLength,
          result,
        });
      } else if (action == "totalBuddysPosts") {
        const pipeline = await buddysPipeline(currentPage, pageSize);
        pipeline.push({
          $match: {
            budsCount: { $lte: 0 },
          },
        });
        const result = await BuddysModel.aggregate(pipeline);
        const resultLength = result.length;
        res
          .status(200)
          .send({ message: "Buds Posted Buddy List", resultLength, result });
      } else if (action == "blockedBuddys") {
        const pipeline = await buddysPipeline(currentPage, pageSize);
        const query = [
          {
            $match: {
              // isBlocked: true,
              buddyStatus: "Suspended",
            },
          },
          ...pipeline,
        ];
        const totalBuddysCount = await BuddysModel.countDocuments({
          buddyStatus: "Suspended",
        });
        const result = await BuddysModel.aggregate(query);
        const resultLength = result.length;
        res.status(200).send({
          message: "Blocked Buddy List",
          totalBuddysCount,
          resultLength,
          result,
        });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "Admin Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// buddyStatus Update Router :
router.post("/buddyStatus", adminTokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { buddyId, status, reason } = req.body;
    const admin = await BuddysModel.findOne({ _id: id });
    if (admin) {
      const buddy = await BuddysModel.findOne({ _id: id });
      if (buddy) {
        const result = await BuddysModel.findOneAndUpdate(
          { _id: buddyId },
          { $set: { buddyStatus: status, adminId: id, adminComment: reason } }
        );
        res
          .status(200)
          .send({ message: "Status Updated Successfully", result });
      } else res.status(400).send({ message: "Buddy Does Not Exists" });
    } else res.status(400).send({ message: "Admin Does Not Exists" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;
