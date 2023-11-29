const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { tokenValidation, adminTokenValidation } = require("../auth/auth.js");

// Schema :
const { BuddysModel } = require("../schema/loginSchema.js");
const { siteSettingsModel } = require("../schema/adminSettingsSchema.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Site Settings Router:
router.post("/siteSettings", adminTokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    req.body.userId = id;
    const { action, companyDetailId } = req.body;
    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        const result = new siteSettingsModel(req.body);
        res
          .status(201)
          .send({ message: "Company Details Created Successfully", result });
      } else if (action == "update") {
        const result = await siteSettingsModel.findOneAndUpdate(
          { _id: companyDetailId },
          { $set: req.body }
        );
        res
          .status(200)
          .send({ message: "Company Details Updated Successfully", result });
      } else if (action == "delete") {
        const result = await siteSettingsModel.findOneAndDelete({
          _id: companyDetailId,
        });
        res
          .status(200)
          .send({ message: "Company Details Deleted Successfully", result });
      } else res.status(400).send({ message: "Actions Does Not Exists" });
    } else res.status(400).send({ message: "User Does Not Exists" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Site Setting Details Router:
router.post("/readCompanyDetails", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { companyDetailId } = req.body;
    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      const result = await siteSettingsModel.findOne({ _id: id });
      res.status(200).send({ message: "Company Details", result });
    } else res.status(400).send({ message: "User Does Not Exists" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;
