const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { tokenValidation, adminTokenValidation } = require("../auth/auth.js");

// Schema :
const { budsModel } = require("../schema/budsSchema.js");
const { BuddysModel } = require("../schema/loginSchema.js");
const { communityModel } = require("../schema/communitySchema.js");
const { personalDetailsModel } = require("../schema/buddysSchema.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Dashboard Count Router :
router.post("/cardDetails", adminTokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      let buddys = await BuddysModel.countDocuments();
      let buds = await budsModel.countDocuments();
      let community = await communityModel.countDocuments();
      let verifiedProfile = await BuddysModel.countDocuments({
        isVerified: true,
      });
      let result = { buddys, buds, community, verifiedProfile };
      res.status(200).send({
        message: "Buddys Count Details",
        result,
      });
    } else res.status(200).send({ message: "Admin Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Gender Count Router :
router.post("/gender", adminTokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    let admin = await BuddysModel.findOne({ _id: id });
    if (admin) {
      let buddys = await BuddysModel.countDocuments();
      let maleCount = await personalDetailsModel.countDocuments({
        gender: "Male",
      });
      let femaleCount = await personalDetailsModel.countDocuments({
        gender: "Female",
      });
      let others = buddys - (femaleCount + maleCount);
      let result = { buddys, maleCount, femaleCount, others };
      res.status(200).send({
        message: "Buddys Gender Count Details",
        result,
      });
    } else res.status(400).send({ message: "Admin Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Count Function for Buddys, Buds and Community:
const getBuddyCounts = async (interval, model) => {
  let currentDate = new Date();
  let firstDayOfPeriod;

  if (interval === "daily") {
    let currentDate = new Date();
    let firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    let dateCounts = [];
    for (let date = new Date(firstDayOfMonth); date < currentDate; date.setDate(date.getDate() + 1)) {
      let nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      let buddysDailyCount = await model.countDocuments({
        createdAt: { $gte: date, $lt: nextDate },
      });

      dateCounts.push({ date: new Date(date), count: buddysDailyCount });
    }

    // Include the count for the current date separately
    let buddysDailyCountToday = await model.countDocuments({
      createdAt: {
        $gte: currentDate,
        $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });
    dateCounts.push({ date: currentDate, count: buddysDailyCountToday });

    return dateCounts;
  } else if (interval === "weekly") {
    firstDayOfPeriod = new Date(currentDate);
    firstDayOfPeriod.setDate(currentDate.getDate() - currentDate.getDay());
    firstDayOfPeriod.setHours(0, 0, 0, 0);
  } else if (interval === "monthly") {
    firstDayOfPeriod = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  } else {
    throw new Error("Invalid interval. Use 'daily', 'weekly', or 'monthly'.");
  }

  let endDate;
  if (interval === "daily") {
    endDate = new Date(firstDayOfPeriod.getTime() + 24 * 60 * 60 * 1000);
  } else if (interval === "weekly") {
    endDate = new Date(firstDayOfPeriod.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else if (interval === "monthly") {
    let nextMonth = firstDayOfPeriod.getMonth() + 1;
    let nextYear = firstDayOfPeriod.getFullYear();
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }
    endDate = new Date(nextYear, nextMonth, 1);
  }

  let buddysCount = await model.countDocuments({
    createdAt: { $gte: firstDayOfPeriod, $lt: endDate },
  });

  if (interval === "daily") {
    return [{ date: firstDayOfPeriod.toISOString(), count: buddysCount }];
  } else if (interval === "weekly") {
    let monthName = firstDayOfPeriod.toLocaleString("default", { month: "long" });
    let weekNumber = Math.ceil(firstDayOfPeriod.getDate() / 7);
    let year = firstDayOfPeriod.getFullYear();
    return [{ monthName, year , weekNumber, count: buddysCount }];
  } else if (interval === "monthly") {
    let monthName = firstDayOfPeriod.toLocaleString("default", { month: "long" });
    let year = firstDayOfPeriod.getFullYear();
    return [{ monthName, year, count: buddysCount }];
  }
};

// Buddys Count Router :
router.post("/newBuddys", adminTokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const action = req.body.action;

    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      const model = BuddysModel
      if (action == "daily") {
        let result = await getBuddyCounts("daily", model);
        res.status(200).send({ message: "Buddy Daily Count Details", result });
      } else if (action == "Weekly") {
        let result = await getBuddyCounts("weekly", model);
        res.status(200).send({ message: "Buddy Daily Count Details", result });
      } else if (action == "monthly") {
        let result = await getBuddyCounts("monthly", model);
        res.status(200).send({ message: "Buddy Daily Count Details", result });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "Admin Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Bus Count Router :
router.post("/newBuds", adminTokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const action = req.body.action;

    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      const model = budsModel
      if (action == "daily") {
        let result = await getBuddyCounts("daily", model);
        res.status(200).send({ message: "Buds Daily Count Details", result });
      } else if (action == "Weekly") {
        let result = await getBuddyCounts("weekly", model);
        res.status(200).send({ message: "Buds Daily Count Details", result });
      } else if (action == "monthly") {
        let result = await getBuddyCounts("monthly", model);
        res.status(200).send({ message: "Buds Daily Count Details", result });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "Admin Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Community Count Router :
router.post("/newCommunity", adminTokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const action = req.body.action;

    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      const model = communityModel
      if (action == "daily") {
        let result = await getBuddyCounts("daily", model);
        res.status(200).send({ message: "Buds Daily Count Details", result });
      } else if (action == "Weekly") {
        let result = await getBuddyCounts("weekly", model);
        res.status(200).send({ message: "Buds Daily Count Details", result });
      } else if (action == "monthly") {
        let result = await getBuddyCounts("monthly", model);
        res.status(200).send({ message: "Buds Daily Count Details", result });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "Admin Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Country Based Count Router :
router.post("/buddyCountCountry", adminTokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const action = req.body.action;

    let admin = await BuddysModel.findOne({ _id: id });
    if (admin) {
      if (action == "daily") {
        let buddys = await BuddysModel.countDocuments();
        // res.status(200).send({
        //   message: "Buddys Gender Count Details",
        //   result,
        // });
      } else if (action == "weekly") {
      } else if (action == "monthly") {
      } else res.status.send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "Admin Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;
