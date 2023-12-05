const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { tokenValidation } = require("../auth/auth.js");
const { BuddysModel } = require("../schema/loginSchema.js");
const {
  searchFunction,
  buddysSearchFunction,
  buddyListFunction,
} = require("../services/searchFunctions.js");
const {
  communityModel,
  teamsModel,
  subTeamsModel,
} = require("../schema/communitySchema.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Search Buddys :
router.post("/search", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { search, searchType, skip } = req.body;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (searchType === "buddy") {
        const result = await searchFunction.searchBuddys(search, id, skip);
        const resultLength = result.length;
        res
          .status(200)
          .send({ message: "Buddy Search List", resultLength, result });
      } else if (searchType === "buds") {
        const result = await searchFunction.budsSearch(search);
        const resultLength = result.length;
        res
          .status(200)
          .send({ message: "Buds Search List", resultLength, result });
      } else if (searchType === "trends") {
        const result = await searchFunction.tagSearch(search);
        const resultLength = result.length;
        res.status(200).send({
          message: "Trends Search List",
          resultLength,
          result,
        });
      } else if (searchType === "community") {
        const result = await searchFunction.communitySearch(search, id);
        res.status(200).send({ message: "Community Search List", result });
      } else if (searchType === "events") {
        const result = await searchFunction.eventSearch(search);
        res.status(200).send({ message: "Events Search List", result });
      } else res.status(400).send({ message: "Search type not available" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Community Search :
router.post("/communitySearch", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { search, searchType } = req.body;
    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (searchType == "myCommunity") {
        const result = await searchFunction.myCommunitySearch(
          search,
          id,
          searchType
        );
        res.status(200).send({ message: "My Community Search List", result });
      } else if (searchType == "joinedCommunity") {
        const result = await searchFunction.myCommunitySearch(
          search,
          id,
          searchType
        );
        res
          .status(200)
          .send({ message: "Joined Community Search List", result });
      } else res.status(400).send({ message: "Search Type Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Verified Buddys List Search :
router.post("/buddySearch", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { search, searchType, communityId, teamId, subTeamId } = req.body;
    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (searchType == "verifiedBuddys") {
        const result = await buddysSearchFunction.verifiedBuddysSearch(
          req,
          res,
          search
        );
        res
          .status(200)
          .send({ message: "Verified Buddys Search List", result });
      } else if (searchType == "communityBuddys") {
        const result = await buddysSearchFunction.communityBuddysSearch(
          req,
          res,
          communityModel,
          communityId,
          search
        );
        const resultLength = result.length;
        res.status(200).send({
          message: "Joined Community Search List",
          resultLength,
          result,
        });
      } else if (searchType == "teamBuddys") {
        const result = await buddysSearchFunction.communityBuddysSearch(
          req,
          res,
          teamsModel,
          teamId,
          search
        );
        const resultLength = result.length;
        res.status(200).send({
          message: "Joined Community Search List",
          resultLength,
          result,
        });
      } else if (searchType == "subTeamBuddys") {
        const result = await buddysSearchFunction.communityBuddysSearch(
          req,
          res,
          subTeamsModel,
          teamId,
          search
        );
        const resultLength = result.length;
        res.status(200).send({
          message: "Joined Community Search List",
          resultLength,
          result,
        });
      } else res.status(400).send({ message: "Search Type Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Teams Search :
router.post("/teamSearch", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { search, searchType, communityId, teamId } = req.body;
    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (searchType == "teams") {
        const result = await searchFunction.teamSearch(id, search, communityId);
        res.status(200).send({ message: "Teams Search List", result });
      } else if (searchType == "subTeams") {
        const result = await searchFunction.subTeamSearch(id, search, teamId);
        res.status(200).send({ message: "Sub Teams Search List", result });
      } else res.status(400).send({ message: "Search Type Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Privacy Settings Buddys Search :
router.post("/privacyBuddysList", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      await buddyListFunction(req, res);
    } else res.status(400).send({ message: "User Does Not Exists" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// General Search : NOT IN USE
router.post("/generalSearch", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const search = req.body.search;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      const searchTypeCategories = [
        "buddy",
        "buds",
        "trends",
        "community",
        "events",
      ];
      const searchResults = {};

      for (const searchType of searchTypeCategories) {
        let result = [];

        if (searchType === "buddy") {
          result = await searchFunction.searchBuddys(search, id);
        } else if (searchType === "buds") {
          result = await searchFunction.budsSearch(search);
        } else if (searchType === "trends") {
          result = await searchFunction.tagsList(search);
        } else if (searchType === "community") {
          result = await searchFunction.communitySearch(search);
        } else if (searchType === "events") {
          result = await searchFunction.eventSearch(search);
        }
        searchResults[searchType] = result.slice(0, 5);
      }
      res
        .status(200)
        .send({ message: "Your Search Result", result: searchResults });
    } else {
      res.status(400).send({ message: "User Does Not Exist" });
    }
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

module.exports = router;
