const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { tokenValidation, adminTokenValidation } = require("../auth/auth.js");

// Schema :
const { budsPipeline } = require("./pipelines.js");
const { budsModel } = require("../schema/budsSchema.js");
const { BuddysModel } = require("../schema/loginSchema.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Manage Buddys Router :
router.post("/manageBuds", adminTokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, currentPage, pageSize } = req.body;
    let admin = await BuddysModel.findOne({ _id: id });
    if (admin) {
      if (action == "totalBuds") {
        const pipeline = await budsPipeline(currentPage, pageSize);
        const query = [
          {
            $match: {},
          },
          ...pipeline,
        ];
        const result = await budsModel.aggregate(query);
        const resultLength = result.length;
        res.status(200).send({
          message: "Total Buds Details",
          resultLength,
          result,
        });
      } else if (action == "activeBuds") {
        const pipeline = await budsPipeline(currentPage, pageSize);
        const query = [
          {
            $match: { budStatus: "Active" },
          },
          ...pipeline,
        ];
        const result = await BuddysModel.aggregate(query);
        const resultLength = result.length;
        res
          .status(200)
          .send({ message: "Active Buds List", resultLength, result });
      } else if (action == "hiddenBuds") {
        const pipeline = await budsPipeline(currentPage, pageSize);
        const query = [
          {
            $match: { budStatus: "Hide" },
          },
          ...pipeline,
        ];
        const result = await BuddysModel.aggregate(query);
        const resultLength = result.length;
        res
          .status(200)
          .send({ message: "Hidden Buds List", resultLength, result });
      } else if (action == "suspendedBuds") {
        const pipeline = await budsPipeline(currentPage, pageSize);
        const query = [
          {
            $match: { budStatus: "Suspended" },
          },
          ...pipeline,
        ];
        const result = await BuddysModel.aggregate(query);
        const resultLength = result.length;
        res
          .status(200)
          .send({ message: "Suspended Buds List", resultLength, result });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "Admin Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Update budStatus Router :
router.post("/updateBudStatus", adminTokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { budId, budStatus, reason } = req.body;
    let admin = await BuddysModel.findOne({ _id: id });
    if (admin) {
      let result = await budsModel.findOneAndUpdate(
        { _id: budId },
        { $set: { budStatus: budStatus } }
      );
      res
        .status(200)
        .send({ message: "Bud Status Updated Successfully", result });
    } else res.status(400).send({ message: "Admin Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;
