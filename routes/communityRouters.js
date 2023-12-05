const express = require("express");
const router = express.Router();
const { mongoose } = require("mongoose");
const { tokenValidation } = require("../auth/auth.js");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { eventModel } = require("../schema/eventsSchema.js");
const { BuddysModel } = require("../schema/loginSchema.js");
const {
  buddyDetails,
  blockCheck,
  buddyWithFollowStatus,
} = require("../services/buddyFunctions.js");
const {
  blockFunction,
  adminFunction,
  idCardFunction,
  communityCount,
  leaveFunction,
  boardFunction,
  requestFunction,
  communityChatFunction,
} = require("../services/communityFunctions.js");
const {
  teamsModel,
  boardModel,
  subTeamsModel,
  communityModel,
  communityIDModel,
  buddyJoinedModel,
  joinRequestModel,
  joinTeamRequestModel,
  communityQuestionModel,
  communityCategoryModel,
} = require("../schema/communitySchema.js");
const { buddyFollowerDetailsModel } = require("../schema/buddysSchema.js");
const { budsModel } = require("../schema/budsSchema.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Create Community:
router.post("/", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, communityId, communityName, profilePic } = req.body;
    req.body.userId = id;
    req.body.admins = [id];
    req.body.buddysList = [id];

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        let result = await communityModel.find({
          communityName: req.body.communityName,
        });
        if (result.length > 0) {
          res.status(400).send({ message: "Community Name Already Exists" });
        } else {
          let community = new communityModel(req.body);
          const result = await community.save();
          await communityChatFunction({
            id,
            communityName,
            profilePic,
            result,
          });
          res
            .status(200)
            .send({ message: "Community Created Successfully", result });
        }
      } else if (action == "read") {
        let result = await communityModel.findOne({
          $and: [{ _id: communityId }, { status: "Approved" }],
        });
        if (result) {
          try {
            const buddyList = result.buddysList;
            const buddyDetailPromises = buddyList.map((id) => buddyDetails(id));
            const buddyDetail = await Promise.all(buddyDetailPromises);

            const isRequest = await joinRequestModel.distinct(
              "buddysList.userStatus",
              { communityId: communityId, "buddysList.userId": id }
            );

            const finalResult = {
              ...result.toObject(),
              buddyDetail,
              isRequested: isRequest ? isRequest[0] : "",
              isOwner: result.userId == id ? true : false,
              isAdmin: result.admins.includes(id) ? true : false,
              createdBy: await buddyDetails(result.userId),
            };
            res
              .status(200)
              .send({ message: "Community Details", result: finalResult });
          } catch (error) {
            console.log(error);
          }
        } else
          res.status(400).send({ message: "Community Waiting for Approval" });
      } else if (action == "update") {
        let buddyCheck = await communityModel.distinct("admins", {
          _id: communityId,
        });
        if (buddyCheck.includes(id)) {
          let result = await communityModel.findOneAndUpdate(
            {
              $and: [{ _id: communityId }, { status: "Approved" }],
            },
            { $set: req.body },
            { new: true }
          );
          res
            .status(200)
            .send({ message: "Community Updated Successfully", result });
        } else res.status(400).send({ message: "Only Admins Can Update" });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Read Community Category Router :
router.post("/communityCategory", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action } = req.body;
    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "category") {
        const result = await communityCategoryModel.find();
        res.status(200).send({ message: "Category List", result });
      } else if (action == "subCategory") {
        const result = await communityCategoryModel.find(
          {},
          { subCategory: 1 }
        );
        res.status(200).send({ message: "Category List", result });
      } else res.status(400).send({ message: "Action Does Not Exists" });
    } else res.status(400).send({ message: "User Does Not Exists" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Join Community Request :
router.post("/joinRequest", tokenValidation, async (req, res) => {
  try {
    const model = joinRequestModel;
    return await requestFunction(req, res, model);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// My Community and Joined Community :
router.post("/communityList", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { skip, action, userId, category } = req.body;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "myCommunity") {
        let result = await communityModel.aggregate([
          {
            $match: {
              $and: [
                { $or: [{ userId: id }, { admins: { $in: [id] } }] },
                { status: "Approved" },
              ],
            },
          },
          {
            $addFields: {
              isOwner: { $eq: [id, "$userId"] },
              isAdmin: { $in: [id, "$admins"] },
              isJoined: { $in: [id, "$buddysList"] },
              buddysListCount: { $size: "$buddysList" },
            },
          },
          { $sort: { createdAt: -1 } },
          { $skip: parseInt(skip) },
          { $limit: 50 },
          {
            $project: {
              _id: 1,
              communityName: 1,
              selectCategory: 1,
              selectSubCategory: 1,
              profilePic: 1,
              coverPic: 1,
              communityGuidelines: 1,
              buddysListCount: 1,
              isJoined: 1,
              isOwner: 1,
              isAdmin: 1,
            },
          },
        ]);

        let requestCount = result.map(async (e) => {
          let joinRequestCount = await joinRequestModel.find({
            $and: [
              {
                communityId: e._id,
                "buddysList.userStatus": "Request Sent",
              },
            ],
          });
          let details = {
            ...e,
            joinRequestCount: joinRequestCount ? joinRequestCount.length : 0,
          };
          return details;
        });
        let finalResult = await Promise.all(requestCount);
        res
          .status(200)
          .send({ message: "Your Community List", result: finalResult });
      } else if (action === "joinedCommunity") {
        let result = await buddyJoinedModel
          .find({ userId: id })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(10);

        const mutualBuddysFunction = result.map(async (e) => {
          let followingBuddys = await buddyFollowerDetailsModel
            .find({ $and: [{ followId: id }, { status: "Accepted" }] })
            .distinct("userId");

          let communityIds = e.details;
          let communityPromises = communityIds.map(async (communityIds) => {
            try {
              let checkCommunityBuddys = await communityModel.findOne(
                { _id: communityIds.communityId },
                {
                  _id: 1,
                  communityName: 1,
                  selectCategory: 1,
                  selectSubCategory: 1,
                  profilePic: 1,
                  coverPic: 1,
                  buddysList: 1,
                }
              );

              let isOwnerCheck = await communityModel.distinct("userId", {
                _id: e.details[0].communityId,
              });

              let isAdminCheck = await communityModel.findOne({
                _id: e.details[0].communityId,
                admins: { $in: [id] },
              });

              let mutualBuddys = followingBuddys.filter((id) =>
                checkCommunityBuddys.buddysList.includes(id)
              );

              let idMine = req.userId;
              let mutualBuddysPromises = mutualBuddys.map((id) => {
                if (idMine !== id) buddyWithFollowStatus(idMine, id);
              });
              let mutual = await Promise.all(mutualBuddysPromises);
              let finalList = mutual.filter((e) => e != null);

              return {
                ...checkCommunityBuddys.toObject(),
                mutualConnections: finalList,
                isOwner: isOwnerCheck[0] == id ? true : false,
                isAdmin: isAdminCheck > 0 ? true : false,
              };

              // return checkCommunityBuddys
              // let checkCommunityBuddys = await communityModel.aggregate([
              //   {
              //     $match: {
              //       _id: communityIds.communityId,
              //     },
              //   },
              //   {
              //     $addFields: {
              //       isOwner: { $eq: [id, "$userId"] },
              //       isAdmin: { $in: [id, "$admins"] },
              //     },
              //   },
              //   {
              //     $project: {
              //       _id: 1,
              //       communityName: 1,
              //       selectCategory: 1,
              //       selectSubCategory: 1,
              //       profilePic: 1,
              //       coverPic: 1,
              //       buddysList: 1,
              //       isOwner: 1,
              //       isAdmin: 1,
              //     },
              //   },
              // ]);
            } catch (error) {
              console.log(error);
            }
          });
          let communityResult = await Promise.all(communityPromises);
          return communityResult;
        });

        const reResult = await Promise.all(mutualBuddysFunction);
        res
          .status(200)
          .send({ message: "Joined Community List", result: reResult[0] });
      } else if (action == "readOthers") {
        const check = await blockCheck(userId, id);
        if (!check.blockCheck) {
          const result = await communityModel.aggregate([
            {
              $match: {
                buddysList: userId,
                status: "Approved",
              },
            },
            {
              $addFields: {
                isOwner: { $eq: [id, "$userId"] },
              },
            },
            {
              $project: {
                _id: 1,
                communityName: 1,
                selectCategory: 1,
                selectSubCategory: 1,
                profilePic: 1,
                coverPic: 1,
                isOwner: 1,
              },
            },
          ]);

          res
            .status(200)
            .send({ message: "Read Others Community List", result });
        } else res.status(400).send({ message: "Sorry you have been blocked" });
      } else if (action == "readAll") {
        let result = await communityModel
          .find(
            { status: "Approved" },
            {
              _id: 1,
              communityName: 1,
              selectCategory: 1,
              selectSubCategory: 1,
              profilePic: 1,
              coverPic: 1,
            }
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(10);
        res.status(200).send({ message: "Community List", result });
      } else if (action == "categoryFilter") {
        let result = await communityModel.aggregate([
          {
            $match: {
              $and: [
                { status: "Approved" },
                { selectCategory: category },
                { userId: { $ne: id } },
                { buddysList: { $nin: [id] } },
              ],
            },
          },
          { $sort: { createdAt: -1 } },
          {
            $lookup: {
              from: "joinRequestModel",
              let: { communityId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$communityId", "$$communityId"] },
                        { $eq: ["$buddysList.userId", id] },
                      ],
                    },
                  },
                },
              ],
              as: "joinRequests",
            },
          },
          {
            $addFields: {
              isRequested: { $gt: [{ $size: "$joinRequests" }, 0] },
            },
          },
          {
            $project: {
              _id: 1,
              communityName: 1,
              selectCategory: 1,
              selectSubCategory: 1,
              profilePic: 1,
              coverPic: 1,
              isRequested: 1,
            },
          },
        ]);
        // .skip(skip)
        // .limit(10);

        res.status(200).send({ message: "Community Category List", result });
      } else if (action == "globalCommunities") {
        let result = await communityModel.aggregate([
          {
            $match: {
              $and: [
                { status: "Approved" },
                { userId: { $ne: id } },
                { buddysList: { $nin: [id] } },
              ],
            },
          },
          { $sort: { createdAt: -1 } },
          {
            $lookup: {
              from: "joinRequestModel",
              let: { communityId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$communityId", "$$communityId"] },
                        { $eq: ["$buddysList.userId", id] },
                      ],
                    },
                  },
                },
              ],
              as: "joinRequests",
            },
          },
          {
            $addFields: {
              isRequested: { $gt: [{ $size: "$joinRequests" }, 0] },
            },
          },
          {
            $project: {
              _id: 1,
              communityName: 1,
              selectCategory: 1,
              selectSubCategory: 1,
              profilePic: 1,
              coverPic: 1,
              isRequested: 1,
            },
          },
        ]);
        res.status(200).send({ message: "Community Category List", result });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Mutual Buddy List :
router.post("/mutualBuddys", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const communityId = req.body.communityId;

    const mutualBuddysFunction = async (communityId, id) => {
      let followingBuddys = await buddyFollowerDetailsModel
        .find({ $and: [{ followId: id }, { status: "Accepted" }] })
        .distinct("userId");

      let checkCommunityBuddys = await communityModel.distinct("buddysList", {
        _id: communityId,
      });

      let mutualBuddys = followingBuddys.filter((id) =>
        checkCommunityBuddys.includes(id)
      );
      return mutualBuddys;
    };

    let buddy = await mutualBuddysFunction(communityId, id);
    let mutualBuddysPromises = buddy.map((id) => buddyDetails(id));
    let result = await Promise.all(mutualBuddysPromises);
    let resultLength = result.length;

    res.status(200).send({ message: "Your Buddy List", resultLength, result });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Buddy List Function :
const buddyListFunction = async (req, res, model, id) => {
  try {
    let { buddyType } = req.body;
    let check = await model.findOne({ _id: id });
    if (check) {
      let buddysList;
      if (buddyType == "admin") {
        buddysList = await model.distinct("admins", { _id: id });
      } else if (buddyType == "buddy") {
        buddysList = await model.distinct("buddysList", { _id: id });
      }

      let buddyPromises = buddysList.map(async (id) => {
        const idMine = req.userId;
        const checkWeatherMe = id == idMine;
        if (!checkWeatherMe) {
          const user = await buddyDetails(id);
          const followStatus = await buddyFollowerDetailsModel
            .find({ $and: [{ userId: idMine }, { followId: id }] })
            .distinct("status");
          return {
            ...user,
            followStatus: followStatus.length > 0 ? followStatus[0] : "",
          };
        }
      });
      let result = await Promise.all(buddyPromises);
      const finalResult = result.filter((item) => item != null);
      res.status(200).send({ message: "Your Buddy List", result: finalResult });
    } else res.status(400).send({ message: "Id Does Not Exist" });
  } catch (error) {
    console.log(error);
  }
};

// Community Buddys List :
router.post("/buddysList", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, teamId, subTeamId, communityId } = req.body;
    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "community") {
        await buddyListFunction(req, res, communityModel, communityId);
      } else if (action == "team") {
        return await buddyListFunction(req, res, teamsModel, teamId);
      } else if (action == "subTeam") {
        return await buddyListFunction(req, res, subTeamsModel, subTeamId);
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Community Count Router :
router.post("/communityCount", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, communityId, teamId, subTeamId } = req.body;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "community") {
        await communityCount.communityCountFunction(res, communityId);
      } else if (action == "teams") {
        await communityCount.teamsCountFunction(res, communityId, teamId);
      } else if (action == "subTeams") {
        await communityCount.subTeamsCountFunction(res, teamId, subTeamId);
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Community Event List : eventModel
router.post("/eventList", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const communityId = req.body.communityId;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      let communityCheck = await communityModel.findOne({ _id: communityId });
      if (communityCheck) {
        let result = await eventModel.find({ communityId: communityId });
        res.status(200).send({ message: "Your Event List", result });
      } else res.status(400).send({ message: "Community Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Community `Board`s List :
router.post("/boardList", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { skip, budId, action, type, communityId, teamId, subTeamId } =
      req.body;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      let communityCheck = await communityModel.findOne({ _id: communityId });
      if (communityCheck) {
        if (action == "create") {
          let boardCheck = await boardModel.findOne({
            budId: budId,
            communityId: communityId,
          });
          if (!boardCheck) {
            try {
              const buddyDetail = await buddyDetails(id);
              const result = new boardModel({
                type: type,
                communityId: communityId,
                teamId: teamId,
                subTeamId: subTeamId,
                budId: budId,
                boardedBy: id,
                boardedOn: new Date().toISOString(),
                buddyDetails: buddyDetail,
              });
              await result.save();
              res
                .status(201)
                .send({ message: "Buds Added To Board Successfully", result });
            } catch (error) {
              console.log(error);
            }
          } else
            res
              .status(400)
              .send({ message: "Bud already Boarded in same community" });
        } else if (action == "readBoardCommunity") {
          const boardsList = await boardModel
            .find({ communityId: communityId, type: "community" })
            .skip(skip)
            .limit(10);
          await boardFunction(res, boardsList);
        } else if (action == "readBoardTeams") {
          const boardsList = await boardModel
            .find({ teamId: teamId, type: "teams" })
            .skip(skip)
            .limit(10);
          await boardFunction(res, boardsList);
        } else if (action == "readBoardSubTeams") {
          const boardsList = await boardModel
            .find({ subTeamId: subTeamId, type: "subTeams" })
            .skip(skip)
            .limit(10);
          await boardFunction(res, boardsList);
        } else res.status(400).send({ message: "Action Does Not Exist" });
      } else res.status(400).send({ message: "Community Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Create Community Questions:
router.post("/questions", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const action = req.body.action;
    const questionId = req.body.questionId;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        let result = new communityQuestionModel(req.body);
        await result.save();
        res
          .status(201)
          .send({ message: "Community Question Created Successfully", result });
      } else if (action == "read") {
        let result = await communityQuestionModel.find({ _id: questionId });
        res.status(200).send({ message: "Community Question List", result });
      } else if (action == "update") {
        let result = await communityQuestionModel.updateOne(
          { _id: questionId },
          { $set: req.body }
        );
        res
          .status(200)
          .send({ message: "Community Question Updated Successfully", result });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Id Card Router:
router.post("/idCard", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const communityId = req.body.communityId;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      console.log(id, communityId);
      let result = await communityIDModel.findOne({
        $and: [{ userId: id }, { communityId: communityId }],
      });
      res.status(200).send({ message: "Community ID List", result });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// ______________________________________________________________________________
// Teams Routers :
router.post("/teams", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, teamId, teamName, profilePic } = req.body;
    req.body.userId = id;
    req.body.admins = [id];
    req.body.buddysList = [id];

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        let team = new teamsModel(req.body);
        let result = await team.save();
        await communityChatFunction({
          id,
          teamName,
          profilePic,
          result,
        });
        res.status(201).send({ message: "Teams Created Successfully", result });
      } else if (action == "read") {
        try {
          // let result = await teamsModel.aggregate([
          //   {
          //     $match: { _id: teamId },
          //   },
          //   {
          //     $lookup: {
          //       from: "communityModel",
          //       localField: "communityId",s
          //       foreignField: "_id",
          //       as: "community",
          //     },
          //   },
          //   {
          //     $unwind: "$community",
          //   },
          //   {
          //     $project: {
          //       _id: 1,
          //       teamName: 1,
          //       teamDescription: 1,
          //       teamPic: 1,
          //       shortCode: 1,
          //       joinPrivacy: 1,
          //       joiningFee: 1,
          //       community: {
          //         _id: 1,
          //         communityName: 1,
          //         selectCategory: 1,
          //         selectSubCategory: 1,
          //         profilePic: 1,
          //         coverPic: 1,
          //       },s
          //     },
          //   },
          // ]);

          let teamDetail = await teamsModel.find({ _id: teamId });
          let community = await communityModel.findOne({
            _id: teamDetail[0].communityId,
          });
          let isOwner = teamDetail[0].userId == id;
          let isAdmin = teamDetail[0].admins.includes(id);

          let result = {
            ...teamDetail[0].toObject(),
            isOwner: isOwner,
            isAdmin: isAdmin,
            community,
          };
          res.status(200).send({ message: "Teams List", result });
        } catch (error) {
          console.log(error);
        }
      } else if (action == "update") {
        let adminCheck = await teamsModel.distinct("admins", {
          _id: teamId,
        });
        if (adminCheck.includes(id)) {
          let result = await teamsModel.findOneAndUpdate(
            { _id: teamId },
            { $set: req.body }
          );
          res
            .status(200)
            .send({ message: "Teams Updated Successfully", result });
        } else res.status(200).send({ message: "Only Admins Can Update" });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Read Teams List:
router.post("/teamList", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { skip, communityId } = req.body;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      let result = await teamsModel.aggregate([
        {
          $match: {
            communityId: communityId,
            teamVisibility: "everyOne",
          },
        },
        {
          $addFields: {
            isOwner: { $eq: [id, "$userId"] },
            isAdmin: { $in: [id, "$admins"] },
            isJoined: { $in: [id, "$buddysList"] },
            buddysListCount: { $size: "$buddysList" },
          },
        },
        // {
        //   $lookup: {
        //     from: "joinRequestModel",
        //     localField: "teamId",
        //     foreignField: "_id",
        //     as: "joinRequests",
        //   },
        // },
        // {
        //   $addFields: {
        //     isRequested: {
        //       $in: [id, "$joinRequests.buddysList.userId"],
        //     },
        //   },
        // },
        { $sort: { createdAt: -1 } },
        { $skip: parseInt(skip) },
        { $limit: 50 },
        {
          $project: {
            _id: 1,
            teamName: 1,
            teamDescription: 1,
            teamPic: 1,
            shortCode: 1,
            buddysListCount: 1,
            joinPrivacy: 1,
            joiningFee: 1,
            isOwner: 1,
            isAdmin: 1,
            isJoined: 1,
            // isRequested: 1,
          },
        },
      ]);
      let requestCount = result.map(async (e) => {
        let isRequested = await joinRequestModel.find({
          $and: [
            {
              teamId: e._id,
              "buddysList.userId": id,
            },
          ],
        });
        let details = {
          ...e,
          isRequested: isRequested.length > 0 ? true : false,
        };
        return details;
      });
      let finalResult = await Promise.all(requestCount);
      res.status(200).send({ message: "Team List", result: finalResult });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Join Request for Teams :
router.post("/teamsRequest", tokenValidation, async (req, res) => {
  try {
    const model = joinTeamRequestModel;
    return await requestFunction(req, res, model);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Admin User for Teams :
router.post("/adminRequest", tokenValidation, async (req, res) => {
  try {
    const { type, communityId, teamId, subTeamId } = req.body;
    if (type == "community") {
      const model = communityModel;
      const teamId = communityId;
      return await adminFunction(req, res, model, teamId);
    } else if (type == "teams") {
      const model = teamsModel;
      const teamsId = teamId;
      return await adminFunction(req, res, model, teamsId);
    } else if (type == "subTeams") {
      const model = subTeamsModel;
      const teamId = subTeamId;
      return await adminFunction(req, res, model, teamId);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Block User for Teams :
router.post("/blockRequest", tokenValidation, async (req, res) => {
  try {
    const { reqType, communityId, teamId, subTeamId } = req.body;
    if (reqType == "community") {
      const model = communityModel;
      const teamsId = communityId;
      return await blockFunction(req, res, model, teamsId);
    } else if (reqType == "teams") {
      const model = teamsModel;
      const teamsId = teamId;
      return await blockFunction(req, res, model, teamsId);
    } else if (reqType == "subTeams") {
      const model = subTeamsModel;
      const teamsId = subTeamId;
      return await blockFunction(req, res, model, teamsId);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// ______________________________________________________________________________
// Sub Team Routers :
router.post("/subTeams", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, subTeamId, subTeamName, profilePic } = req.body;
    req.body.userId = id;
    req.body.admins = [id];
    req.body.buddysList = [id];

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        let subTeam = new subTeamsModel(req.body);
        let result = await subTeam.save();
        await communityChatFunction({
          id,
          subTeamName,
          profilePic,
          result,
        });
        res
          .status(201)
          .send({ message: "Sub Teams Created Successfully", result });
      } else if (action == "read") {
        try {
          let subTeamDetail = await subTeamsModel.find({ _id: subTeamId });
          // let teamDetail = await teamsModel.find({ _id: teamId });
          let community = await communityModel.findOne({
            _id: subTeamDetail[0].teamId,
          });
          let isOwner = subTeamDetail[0].userId == id;
          let isAdmin = subTeamDetail[0].admins.includes(id);

          let result = {
            ...subTeamDetail[0].toObject(),
            isOwner: isOwner,
            isAdmin: isAdmin,
            // teamDetail,
          };
          res.status(200).send({ message: "Sub Teams List", result });
        } catch (error) {
          console.log(error);
        }
      } else if (action == "update") {
        let adminCheck = await subTeamsModel.distinct("admins", {
          _id: subTeamId,
        });
        if (adminCheck.includes(id)) {
          let result = await subTeamsModel.findOneAndUpdate(
            { _id: subTeamId },
            { $set: req.body }
          );
          res
            .status(200)
            .send({ message: "Sub Teams Updated Successfully", result });
        } else res.status(400).send({ message: "You are not admin" });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Sub Team List :
router.post("/subTeamList", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { skip, teamId } = req.body;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      let result = await subTeamsModel.aggregate([
        {
          $match: {
            teamId: teamId,
            teamVisibility: "everyOne",
          },
        },
        {
          $addFields: {
            isOwner: { $eq: [id, "$userId"] },
            isAdmin: { $in: [id, "$admins"] },
            isJoined: { $in: [id, "$buddysList"] },
            buddysListCount: { $size: "$buddysList" },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: parseInt(skip) },
        { $limit: 50 },
        {
          $project: {
            _id: 1,
            subTeamName: 1,
            teamKeyword: 1,
            teamDescription: 1,
            teamPic: 1,
            shortCode: 1,
            buddysListCount: 1,
            joinPrivacy: 1,
            joiningFee: 1,
            isOwner: 1,
            isAdmin: 1,
            isJoined: 1,
          },
        },
      ]);
      let requestCount = result.map(async (e) => {
        let isRequested = await joinRequestModel.find({
          $and: [
            {
              subTeamId: e._id,
              "buddysList.userId": id,
            },
          ],
        });
        let details = {
          ...e,
          isRequested: isRequested.length > 0 ? true : false,
        };
        return details;
      });
      let finalResult = await Promise.all(requestCount);
      res.status(200).send({ message: "Sub Team List", result: finalResult });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Leave Community, Teams & SubTeams API :
router.post("/leave", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, communityId, teamId, subTeamId } = req.body;
    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "community") {
        await leaveFunction(res, id, communityModel, communityId, action);
      } else if (action == "teams") {
        await leaveFunction(res, id, teamsModel, teamId, action);
      } else if (action == "subTeams") {
        await leaveFunction(res, id, subTeamsModel, subTeamId, action);
      } else res.status(400).send({ message: "Action Does Not Exists" });
    } else res.status(400).send({ message: "User Does Not Exists" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

module.exports = router;

// Create Request Community Request :
// router.post("/communityRequest", tokenValidation, async (req, res) => {
//   try {
//     const id = req.userId;
//     req.body.userId = id;
//     const { skip, action, communityId } = req.body;

//     let buddy = await BuddysModel.findOne({ _id: id });
//     if (buddy) {
//       if (action == "requestList") {
//         let result = await communityModel
//           .find({ status: "Request Sent" })
//           .sort({ createdAt: -1 })
//           .skip(skip)
//           .limit(50);
//         res.status(200).send({ message: "Community List", result });
//       } else if (action == "approve") {
//         try {
//           let community = await communityModel.findOne({ _id: communityId });
//           if (community) {
//             let result = await communityModel.findOneAndUpdate(
//               { _id: communityId },
//               {
//                 $set: { status: "Approved" },
//                 $addToSet: {
//                   admins: community.userId,
//                   buddysList: community.userId,
//                 },
//               },
//               { new: true }
//             );
//             // Id Card Generation
//             await idCardFunction(communityId, id, "create", res);
//             res
//               .status(200)
//               .send({ message: "Community Approved Successfully", result });
//           }
//         } catch (error) {
//           console.log(error);
//           res.status(500).send({ message: "Internal Server Error", error });
//         }
//       } else if (action == "reject") {
//         let result = await communityModel.findOneAndUpdate(
//           {
//             $and: [{ _id: communityId }],
//           },
//           { $set: { status: "Rejected" } },
//           { new: true }
//         );
//         res
//           .status(200)
//           .send({ message: "Community Suspended Successfully", result });
//       } else res.status(400).send({ message: "Action Does Not Exist" });
//     } else res.status(400).send({ message: "User Does Not Exist" });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({ message: "Internal Server Error", error });
//   }
// });

// const checking = await boardModel.aggregate([
//   { $match: { communityId: communityId } },
//   {
//     $lookup: {
//       from: "budsModel",
//       localField: "budId",
//       foreignField: "_id",
//       as: "buds",
//     },
//   },
//   {
//     $project: {
//       _id: 1,
//       communityId: 1,
//       budId: 1,
//       boardedBy: 1,
//       boardedOn: 1,
//       buds: 1,
//     },
//   },
//   { $skip: skip },
//   { $limit: 10 },
// ]);

// const checking = await boardModel.aggregate([
//   {
//     $match: { communityId: communityId }
//   },
//   {
//     $lookup: {
//       from: "budsModel",
//       let: { budId: "$budId" },
//       pipeline: [
//         {
//           $match: {
//             $expr: {
//               $eq: ["$budId", "$$budId"]
//             }
//           }
//         }
//       ],
//       as: "buds"
//     }
//   },
//   {
//     $project: {
//       _id: 1,
//       communityId: 1,
//       budId: 1,
//       boardedBy: 1,
//       boardedOn: 1,
//       buds: 1
//     }
//   },
//   {
//     $skip: skip
//   },
//   {
//     $limit: 10
//   }
// ]);
