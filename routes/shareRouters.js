const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { budsModel } = require("../schema/budsSchema.js");
const { communityModel } = require("../schema/communitySchema.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Read Details without Token :
router.post("/", async (req, res) => {
  try {
    const { action, buddyId, budId, communityId, eventId } = req.body;
    if (action == "buddys") {
      res.status(200).send({ message: "Working In progress" });
    } else if (action == "buds") {
      let result = await budsModel.findOne({
        $and: [{ _id: budId }, { whoCanViewyourBud: "everyOne" }],
      });
      if (result) {
        res.status(200).send({ message: "Bud List", result });
      } else res.status(400).send({ message: "Bud can't see everybody," });
    } else if (action == "communities") {
      let result = await communityModel.findOne({ _id: communityId });
    } else if (action == "events") {
    } else res.status(400).send({ message: "Action Does Not Exists" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;
