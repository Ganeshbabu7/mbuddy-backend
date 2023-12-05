const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { tokenValidation, adminTokenValidation } = require("../auth/auth.js");

// Schema :
const { BuddysModel } = require("../schema/loginSchema.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Manage Profile Verification Router :
router.post("/", adminTokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, currentPage, pageSize } = req.body;
    let admin = await BuddysModel.findOne({ _id: id });
    if (admin) {
      if (action == "allBuddys") {
        const result = await BuddysModel.aggregate([
          {
            $match: {
              $or: [
                { $eq: { isVerified: "approved" } },
                { $eq: { isVerified: "blocked" } },
              ],
            },
          },
          {
            $skip: (currentPage - 1) * pageSize,
          },
          {
            $limit: pageSize,
          },
        ]);
        res.status(200).send({ message: "All Buddys", result });
      } else if (action == "verifiedBuddys") {
        const result = await BuddysModel.aggregate([
          {
            $match: {
              $eq: { isVerified: "approved" },
            },
          },
          {
            $skip: (currentPage - 1) * pageSize,
          },
          {
            $limit: pageSize,
          },
        ]);
        res.status(200).send({ message: "Only Verified Buddys", result });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "Admin Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;
