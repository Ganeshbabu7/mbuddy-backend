const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();
const { mongoose } = require("mongoose");
const { tokenValidation } = require("../auth/auth.js");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { BuddysModel } = require("../schema/loginSchema.js");
const {
  getBudDetails,
  isCommentFunction,
  budCommentsFunction,
  communityBudsFunction,
} = require("../services/budFunctions.js");
const { blockedAccountModel } = require("../schema/settingsSchema.js");
const { s3Client, PutObjectCommand } = require("../config/awsConfig.js");
const { buddyFollowerDetailsModel } = require("../schema/buddysSchema.js");
const {
  pushNotification,
  budNotifications,
} = require("../services/notificationFunctions.js");
const {
  communityModel,
  teamsModel,
  subTeamsModel,
} = require("../schema/communitySchema.js");
const {
  buddyDetails,
  followList,
  blockCheck,
  followingList,
  followersList,
} = require("../services/buddyFunctions.js");
const {
  budsModel,
  tagsModel,
  pollModel,
  likesModel,
  imageModel,
  videoModel,
  giftsModel,
  resultModel,
  saveBudsModel,
  documentModel,
  commentsModel,
  locationModel,
  tagsResultModel,
  commentLikeModel,
  commentReplyModel,
  audioModel,
} = require("../schema/budsSchema.js");
const {
  notificationModel,
  pushTokenModel,
  communityNotificationModel,
} = require("../schema/notificationSchema.js");
const { v1 } = require("@google-cloud/firestore");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Create Buds Router:
router.post("/createBuds", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const {
      budId,
      action,
      pollsId,
      docId,
      imageId,
      videoId,
      locationId,
      description,
      whoCanViewyourBud,
      communityId,
      subTeamId,
      teamId,
    } = req.body;

    req.body.userId = id;
    req.body.budOwner = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        // Buddy Details :
        req.body.buddyDetails = await buddyDetails(req.body.budOwner);

        // Location Details :
        let locationDetails = [];
        if (locationId !== "") {
          locationDetails = await locationModel
            .find({ _id: locationId })
            .sort({ createdAt: -1 });
          req.body.location = locationDetails;
        } else {
          req.body.location = "";
        }

        // Image Details:
        if (imageId.length >= 0) {
          const imageDetails = [];
          for (const id of imageId) {
            const details = await imageModel
              .find({ _id: id })
              .sort({ createdAt: -1 });
            imageDetails.push(...details);
          }
          req.body.image = imageDetails;
        } else {
          req.body.image = [];
        }

        // Video Details :
        if (videoId !== "") {
          videoDetails = await videoModel
            .find({ _id: videoId })
            .sort({ createdAt: -1 });
          req.body.video = videoDetails;
        } else {
          req.body.video = "";
        }

        //Doc Deatils :
        if (docId !== "") {
          docDetails = await documentModel
            .find({ _id: docId })
            .sort({ createdAt: -1 });
          req.body.doc = docDetails;
        } else {
          req.body.doc = "";
        }
        // if (docId.length >= 0) {
        //   const docDetails = [];
        //   for (const id of docId) {
        //     const details = await documentModel
        //       .find({ _id: id })
        //       .sort({ createdAt: -1 });
        //     docDetails.push(...details);
        //   }
        //   req.body.doc = docDetails;
        // } else {
        //   req.body.doc = [];
        // }

        // Polls and Result Details :
        if (pollsId !== "") {
          let pollDetails = await pollModel
            .findOne({ _id: pollsId })
            .sort({ createdAt: -1 });
          req.body.polls = pollDetails || {};
        } else {
          req.body.polls = {};
        }

        try {
          // Hash tags :
          let hashtags = [];
          const extractHashtags = (description) => {
            const regex = /#(\w+)/g;
            hashtags = description.match(regex) || [];
          };
          extractHashtags(description);

          let tagList = [];
          if (hashtags.length > 0) {
            for (let tag of hashtags) {
              let tagCheck = await tagsModel.findOne({ tagName: tag });
              if (!tagCheck) {
                req.body.tagName = tag;
                let obj = {
                  userId: id,
                  tagName: tag,
                  trendingScore: 1,
                  update: [new Date()],
                };
                tagList.push(obj);
              } else {
                tagCheck.trendingScore++;
                await tagsModel.findOneAndUpdate(
                  { tagName: tag },
                  {
                    $inc: { trendingScore: 1 },
                    $push: { updated: new Date() },
                  },
                  { new: true, useFindAndModify: false }
                );
              }
            }
          }
          if (tagList.length > 0) {
            await tagsModel.insertMany(tagList);
          }
        } catch (error) {
          console.log(error);
        }

        let result = new budsModel(req.body);
        await result.save();
        if (whoCanViewyourBud == "everyOne" || "communityOnly") {
          res.status(201).send({ message: "Bud Created Successfully", result });
        } else if (whoCanViewyourBud == "archive") {
          res
            .status(201)
            .send({ message: "Bud Archived Successfully", result });
        }
      } else if (action == "update") {
        let buds = await budsModel.updateOne(
          { _id: budId },
          { $set: req.body }
        );
        res.status(201).send({ message: "Bud Updated Successfully" });
      } else if (action == "delete") {
        let ownerCheck = await budsModel.findOne({ budOwner: id });
        if (ownerCheck) {
          let budDelete = await budsModel.deleteOne({ _id: budId });
          let likesDelete = await likesModel.deleteMany({ budId: budId });
          let commentDelete = await commentsModel.deleteMany({ budId: budId });
          res.status(201).send({ message: "Bud Deleted Successfully" });
        } else
          res
            .status(400)
            .send({ message: "Bud Owner Only can able to Delete Bud" });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Community and Teams List :
router.post("/communityTeamList", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      const community = await communityModel.find(
        { buddysList: { $in: [id] } },
        { _id: 1, communityName: 1, profilePic: 1 }
      );

      const resultPromises = community.map(async (com) => {
        const teams = await teamsModel.find(
          { communityId: com._id, buddysList: { $in: [id] } },
          { _id: 1, teamName: 1, communityId: 1 }
        );

        const teamsWithSubTeams = await Promise.all(
          teams.map(async (team) => {
            const subTeams = await subTeamsModel.find(
              { teamId: team._id, buddysList: { $in: [id] } },
              { _id: 1, subTeamName: 1, teamId: 1, communityId: 1 }
            );

            return {
              ...team.toObject(),
              subTeams: subTeams,
            };
          })
        );

        return {
          ...com.toObject(),
          teams: teamsWithSubTeams,
        };
      });

      const result = await Promise.all(resultPromises);
      res.status(200).send({ message: "Community List", result });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Buds Read Router :
router.post("/readBuds", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { skip, budId, action, otherUserId, communityId } = req.body;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      const currentData = new Date();
      await BuddysModel.findOneAndUpdate(
        { _id: id },
        { $set: { lastActive: currentData } }
      );
      if (action == "read") {
        let bud = await budsModel.findOne({ _id: budId });
        if (bud) {
          await getBudDetails(bud, id);
          res.status(200).json({ message: "Bud List", bud });
        } else res.status(400).json({ message: "Bud Does Not Exists" });
      } else if (action == "readMine") {
        let result = await budsModel
          .find({ $and: [{ userId: id }, { whoCanViewyourBud: "everyOne" }] })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(20);

        for (let i = 0; i < result.length; i++) {
          let bud = result[i];
          await getBudDetails(bud, id);
        }

        let budsLength = result.length;
        res.status(200).send({ message: "Buds List", budsLength, result });
      } else if (action == "readArchive") {
        let result = await budsModel
          .find({ $and: [{ userId: id }, { whoCanViewyourBud: "archive" }] })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(10);

        for (let i = 0; i < result.length; i++) {
          let bud = result[i];
          await getBudDetails(bud, id);
        }

        let budsLength = result.length;
        res
          .status(200)
          .send({ message: "Archived Buds List", budsLength, result });
      } else if (action == "readOthers") {
        let blockCheck = await blockedAccountModel.findOne({
          userId: otherUserId,
          "blockedUserDetails.blockedUserId": id,
        });
        if (!blockCheck) {
          let result = await budsModel
            .find({
              $and: [
                { userId: otherUserId },
                {
                  $or: [
                    { whoCanViewyourBud: "everyOne" },
                    { whoCanViewyourBud: "myBuddys" },
                  ],
                },
                { hideBy: { $nin: [id] } },
              ],
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(30);

          for (let i = 0; i < result.length; i++) {
            let bud = result[i];
            await getBudDetails(bud, id);
          }

          let budsLength = result.length;
          res.status(200).send({ message: "Buds List", budsLength, result });
        } else {
          let result = { isBlocked: true };
          res
            .status(200)
            .send({ message: "Sorry You have been blocked", result });
        }
      } else if (action == "readAll") {
        let startIndex = 0;
        let budsFetched = 0;
        let buds = await budsModel
          .find({
            $and: [
              {
                $or: [
                  { whoCanViewyourBud: "everyOne" },
                  { whoCanViewyourBud: "myBuddys" },
                ],
              },
              { hideBy: { $nin: [id] } },
            ],
          })
          .sort({ createdAt: -1 });

        let result = [];
        for (let i = 0; i < buds.length; i++) {
          if (budsFetched < 10) {
            let bud = buds[i];
            if (bud.userId == id) {
              result.push(bud);
              budsFetched++;
              await getBudDetails(bud, id);
            } else {
              let check = await blockCheck(bud.userId, id);
              if (!check.blockCheck && !check.userBlockedCheck) {
                let followBuddys = await followersList(bud.userId, id);
                if (followBuddys.length > 0) {
                  result.push(bud);
                  budsFetched++;
                  await getBudDetails(bud, id);
                }
              }
            }
          } else {
            break;
          }
        }

        let budsLength = result.length;
        if (result.length > 0) {
          res.status(200).send({ message: "Buds List", budsLength, result });
        } else {
          let result = await budsModel
            .find({ whoCanViewyourBud: "newUser" })
            .sort({ createdAt: -1 });
          res.status(200).send({ message: "Buds List", result });
        }
      } else if (action == "readCommunity") {
        const result = await communityBudsFunction(req, res);
      } else if (action === "readGrid") {
        let result = await budsModel
          .find({
            $and: [
              { userId: id },
              {
                $or: [
                  { budType: "image" },
                  { budType: "video" },
                  { budType: "doc" },
                ],
              },
              { hideBy: { $nin: [id] } },
            ],
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(10);

        for (let i = 0; i < result.length; i++) {
          let bud = result[i];
          let blockCheck = await blockedAccountModel.findOne({
            userId: bud.userId,
            "blockedUserDetails.blockedUserId": id,
          });
          if (!blockCheck) {
            await getBudDetails(bud, id);
          }
        }
        let budsLength = result.length;
        res.status(200).send({ message: "Buds List", budsLength, result });
      } else if (action === "readOthersGrid") {
        let result = await budsModel
          .find({
            $and: [
              { userId: otherUserId },
              {
                $or: [
                  { budType: "image" },
                  { budType: "video" },
                  { budType: "doc" },
                ],
              },
            ],
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(10);

        for (let i = 0; i < result.length; i++) {
          let bud = result[i];
          let blockCheck = await blockedAccountModel.findOne({
            userId: bud.userId,
            "blockedUserDetails.blockedUserId": id,
          });
          if (!blockCheck) {
            await getBudDetails(bud, id);
          }
        }
        let budsLength = result.length;
        res.status(200).send({ message: "Buds List", budsLength, result });
      } else if (action == "newUser") {
        let result = await budsModel
          .find({ whoCanViewyourBud: "newUser" })
          .sort({ createdAt: -1 });

        for (let i = 0; i < result.length; i++) {
          let bud = result[i];
          let blockCheck = await blockedAccountModel.findOne({
            userId: bud.userId,
            "blockedUserDetails.blockedUserId": id,
          });
          if (!blockCheck) {
            await getBudDetails(bud, id);
          }
        }
        let budsLength = result.length;
        res.status(200).send({ message: "Buds List", budsLength, result });
      } else res.status(400).json({ message: "Action Does Not Exist" });
    } else res.status(400).json({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Tags Router :
router.post("/tags", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    let action = req.body.action;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      let currentData = [];
      const performAction = async () => {
        const currentDate = new Date();
        const lastCreatedAt = new Date(
          currentDate.getTime() - 1 * 24 * 60 * 60 * 1000
        );
        const minimumCreatedAt = new Date(
          currentDate.getTime() - 3 * 24 * 60 * 60 * 1000
        );

        currentData = await tagsResultModel.find();

        const filteredResult = await tagsModel.aggregate([
          {
            $match: {
              $or: [
                { createdAt: { $gte: minimumCreatedAt } },
                { updatedAt: { $gte: minimumCreatedAt } },
              ],
            },
          },
          {
            $project: {
              tagName: 1,
              trendingScore: 1,
              updatedCount: {
                $reduce: {
                  input: "$updated",
                  initialValue: 0,
                  in: {
                    $cond: [
                      { $gte: [{ $toDate: "$$this" }, lastCreatedAt] },
                      { $add: ["$$value", 1] },
                      "$$value",
                    ],
                  },
                },
              },
            },
          },
          {
            $group: {
              _id: "$tagName",
              trendingScore: { $first: "$trendingScore" },
              updatedCount: { $sum: "$updatedCount" },
            },
          },
          { $sort: { updatedCount: -1 } },
          { $limit: 25 },
        ]);

        const arrangedResult = [];
        for (const item of filteredResult) {
          const resultItem = {
            tagName: item._id,
            totalTrendingScore: item.trendingScore,
            trendingScoreInLast24Hours: item.updatedCount,
          };
          arrangedResult.push(resultItem);
        }
        try {
          await tagsResultModel.deleteMany({});
          await tagsResultModel.create(arrangedResult);
          currentData = [];
        } catch (error) {
          console.error("Error saving data:", error);
        }
      };
      // Start the initial execution
      performAction();
      setInterval(performAction, 60 * 60 * 1000);

      if (action == "readTrendingTags") {
        if (currentData.length > 0) {
          let result = currentData;
          res.status(200).send({ message: "Trending Tags List", result });
        } else {
          let result = await tagsResultModel.find();
          res.status(200).send({ message: "Trending Tags List", result });
        }
      } else if ((action = "readRecentlyUsed")) {
        let result = await tagsModel
          .find({ userId: id })
          .sort({ trendingScore: -1 })
          .limit(10);
        res.status(200).json({ message: "Recently Used Tags List", result });
      } else res.status(400).json({ message: "Action Does Not Exist" });
    } else res.status(400).json({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Location Router :
router.post("/location", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const action = req.body.action;
    const location = req.body.locationId;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        let result = new locationModel(req.body);
        await result.save();
        res
          .status(201)
          .send({ message: "Location Created Successfully", result });
      } else if (action == "read") {
        let result = await locationModel.findOne({ _id: location });
        res.status(200).json({ message: "Location List", result });
      } else if (action == "readRecentLocation") {
        let result = await locationModel.findOne(
          { userId: id },
          { _id: 1, address: 1 }
        );
        res.status(200).json({ message: "Recent Location List", result });
      } else if (action == "update") {
        let result = await locationModel.findOneAndUpdate(
          { _id: location },
          { $set: req.body },
          { new: true }
        );
        res
          .status(201)
          .send({ message: "Location Updated Successfully", result });
      } else res.status(400).json({ message: "Action Does Not Exist" });
    } else res.status(400).json({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Polls Router :
router.post("/polls", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const action = req.body.action;
    const pollId = req.body.pollId;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        let result = new pollModel(req.body);
        await result.save();
        res.status(201).send({ message: "Polls Created Successfully", result });
      } else if (action == "read") {
        let result = await pollModel
          .findOne({ _id: pollId })
          .sort({ createdAt: -1 });
        res.status(200).send({ message: "Poll Details", result });
      } else if (action == "update") {
        let result = await pollModel.findOneAndUpdate(
          { _id: pollId },
          { $set: req.body },
          { new: true }
        );
        res.status(201).send({ message: "Polls Updated Successfully", result });
      } else res.status(400).json({ message: "Action Does Not Exist" });
    } else res.status(400).json({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Polls Results Router :
router.post("/results", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const action = req.body.action;
    const pollId = req.body.pollId;
    const optionId = req.body.optionId;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        let findBuddys = await resultModel.findOne({
          $and: [{ pollId: pollId }, { userId: id }],
        });

        if (!findBuddys) {
          let result = new resultModel(req.body);
          await result.save();
          const pollResult = await pollModel.findOne({ _id: pollId });
          const resultCount = await resultModel.countDocuments({
            pollId: pollId,
          });
          const resultDetails = await resultModel.aggregate([
            { $match: { pollId: pollId } },
            {
              $group: {
                _id: "$optionId",
                count: { $sum: 1 },
                pollId: { $first: "$pollId" },
                // userId: { $first: "$userId" },
              },
            },
            {
              $project: {
                _id: 1,
                pollId: 1,
                // userId: 1,
                optionId: "$_id",
                average: {
                  $multiply: [{ $divide: ["$count", resultCount] }, 100],
                },
              },
            },
          ]);

          const updatedPollOptions = pollResult.pollOptions.map((option) => {
            const resultDetail = resultDetails.find(
              (result) => result.optionId == option._id
            );
            if (resultDetail) {
              option.average = resultDetail.average;
            }
            return option;
          });

          const updateResult = {
            ...pollResult.toObject(),
            pollOptions: updatedPollOptions,
            results: resultDetails,
            totalNoofResult: resultCount,
          };

          await pollModel.findOneAndUpdate({ _id: pollId }, updateResult, {
            new: true,
          });
          res.status(201).send({
            message: "Result Submitted Successfully",
            result,
            updateResult,
          });
        } else {
          res.status(200).json({ message: "Oops! You have already Done..." });
        }
      } else res.status(400).json({ message: "Action Does Not Exist" });
    } else res.status(400).json({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Likes Router:
router.post("/likes", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { skip, budId, action } = req.body;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      let bud = await budsModel.findOne({ _id: budId });
      const pushToken = await pushTokenModel.distinct("pushToken", {
        userId: id,
      });
      if (bud) {
        // Community Check :
        const isCommunity =
          bud.communityId.length > 0 ||
          bud.teamId.length > 0 ||
          bud.subTeamId.length > 0;
        // Creating Like :
        if (action === "create") {
          try {
            const result = new likesModel({
              budId: budId,
              likeCount: 1,
              likedBy: [
                {
                  userId: id,
                  weatherLiked: true,
                  currentUser: true,
                },
              ],
            });
            await result.save();
            const update = await budsModel.findOneAndUpdate(
              { _id: budId },
              {
                $inc: { likeCount: 1 },
                weatherLiked: true,
                currentUser: true,
              },
              { new: true }
            );
            // Notification Details Prep :
            const notificationData = {
              token: pushToken[0],
              userId: id,
              budId: budId,
              notificationType: "Like",
              body: budNotifications.likeMessage(buddy.userName),
            };
            await pushNotification(
              isCommunity ? "community" : "none",
              notificationData
            );
            res
              .status(201)
              .send({ message: "Buds Liked Successfully", result });
          } catch (error) {
            console.log(error);
            res.status(500).send({ message: "Internal Server Error", error });
          }
        }
        // Updating Likes :
        else if (action == "update") {
          let findBuddys = await likesModel.findOne({
            budId: budId,
            "likedBy.userId": id,
          });
          if (!findBuddys) {
            const result = await likesModel.findOneAndUpdate(
              { budId: budId },
              {
                $inc: { likeCount: 1 },
                $push: {
                  likedBy: {
                    userId: id,
                    weatherLiked: true,
                    currentUser: true,
                  },
                },
              },
              { new: true }
            );
            await budsModel.findOneAndUpdate(
              { _id: budId },
              {
                $inc: { likeCount: 1 },
                weatherLiked: true,
                currentUser: true,
              },
              { new: true }
            );

            const notificationData = {
              token: pushToken[0],
              userId: id,
              budId: budId,
              notificationType: "Like",
              body: budNotifications.likeMessage(buddy.userName),
            };
            await pushNotification(
              isCommunity ? "community" : "none",
              notificationData
            );
            res.status(201).send({ message: "Bud Liked Successfully", result });
          } else {
            const result = await likesModel.findOneAndUpdate(
              { budId: budId },
              {
                $inc: { likeCount: -1 },
                $pull: {
                  likedBy: {
                    userId: id,
                  },
                },
              },
              { new: true }
            );

            await budsModel.findOneAndUpdate(
              { _id: budId },
              {
                $inc: { likeCount: -1 },
                weatherLiked: false,
                currentUser: false,
              },
              { new: true }
            );

            if (isCommunity) {
              await communityNotificationModel.findOneAndDelete({
                userId: id,
                budId: budId,
                notificationType: "Like",
              });
            } else {
              await notificationModel.findOneAndDelete({
                userId: id,
                budId: budId,
                notificationType: "Like",
              });
            }

            if (result.likeCount === 0) {
              await likesModel.deleteOne({ budId: budId, likeCount: 0 });
              res
                .status(200)
                .send({ message: "Bud Unliked and Removed Successfully" });
            } else {
              res.status(200).send({ message: "Bud Unliked Successfully" });
            }
          }
        }
        // Read Likes List :
        else if (action == "read") {
          let buddys = await likesModel
            .find({ budId: budId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(50);
          let buddyIds = buddys[0]?.likedBy.map((e) => e.userId);
          if (buddyIds) {
            const buddyDetaisPromises = buddyIds.map(async (id) => {
              const idMine = req.userId;
              const checkWeatherMe = idMine == id;
              const user = await buddyDetails(id);
              const followStatus = await buddyFollowerDetailsModel
                .find({ $and: [{ userId: idMine }, { followId: id }] })
                .distinct("status");
              return {
                ...user,
                followStatus: followStatus ? followStatus[0] : "",
                isCurrentUser: checkWeatherMe ? true : false,
              };
            });

            const result = await Promise.all(buddyDetaisPromises);
            res.status(200).json({ message: "Bud Liked List", result });
          } else res.status(200).json({ message: "No List found" });
        }
        // If No Action :
        else res.status(400).json({ message: "Action Does Not Exist" });
      } else res.status(400).json({ message: "Bud Does Not Exist" });
    } else res.status(400).json({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Comments Router:
router.post("/comments", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { skip, budId, action, commentId, commentedUserId } = req.body;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      let bud = await budsModel.findOne({ _id: budId });
      const pushToken = await pushTokenModel.distinct("pushToken", {
        userId: id,
      });
      if (bud) {
        if (action == "create") {
          await budCommentsFunction(req, res, bud, buddy);
        } else if (action == "read") {
          let buddys = await commentsModel
            .find({ budId: budId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(50);

          let result = [];
          for (const buddy of buddys) {
            const buddyDetail = await buddyDetails(buddy.userId);
            const checkLikeFunction = async (commentId, id) => {
              try {
                let likeCheck = await commentLikeModel.find({
                  commentId: commentId,
                  "likedBy.userId": id,
                });
                return likeCheck.length > 0;
              } catch (error) {
                console.log(error);
              }
            };

            let bud = await budsModel.findOne({ _id: buddy.budId });
            // let isComment = await isCommentFunction(bud, id);

            const budOwner = await budsModel.distinct("budOwner", {
              _id: buddy.budId,
            });
            const commentOwner = await commentsModel.distinct("userId", {
              _id: buddy._id,
            });
            const comment = {
              _id: buddy._id,
              userId: buddy.userId,
              userDetails: buddyDetail,
              budId: buddy.budId,
              comment: buddy.comment,
              commentLikeCount: buddy.commentLikeCount,
              commentReplyCount: buddy.commentReplyCount,
              createdAt: buddy.createdAt,
              updatedAt: buddy.updatedAt,
              // isComment: isComment,
              isCommentLiked: (await checkLikeFunction(buddy._id, id))
                ? true
                : false,
              isDelete:
                buddy.userId == budOwner[0] || commentOwner[0] ? true : false,
            };
            result.push(comment);
          }
          res.status(200).json({ message: "Bud Comment List", result });
        } else if (action == "update") {
          let buds = await commentsModel.updateOne(
            { _id: commentId },
            { $set: req.body }
          );
          res.status(201).send({ message: "Bud Comment Updated Successfully" });
        } else if (action == "delete") {
          let comment = await commentsModel.findOne({ _id: commentId });
          if (comment) {
            let owner = await budsModel.findOne({
              $and: [{ _id: budId }, { budOwner: id }],
            });
            let userId = await commentsModel.findOne({
              $and: [{ _id: commentId }, { userId: commentedUserId }],
            });
            if (owner !== null || userId !== null) {
              let result = await commentsModel.deleteOne({ _id: commentId });

              await budsModel.findOneAndUpdate(
                { _id: budId },
                { $inc: { commentCount: -1 } },
                { new: true }
              );

              if (isCommunity) {
                await communityNotificationModel.findOneAndDelete({
                  userId: id,
                  budId: budId,
                  commentId: commentId,
                  notificationType: "Comment",
                });
              } else {
                await notificationModel.findOneAndDelete({
                  userId: id,
                  budId: budId,
                  commentId: commentId,
                  notificationType: "Comment",
                });
              }

              res
                .status(201)
                .send({ message: "Comment Deleted Successfully", result });
            } else
              res
                .status(200)
                .send({ message: "Delete action does not exist for others" });
          } else res.status(200).send({ message: "Comment Id Does not exist" });
        } else res.status(400).json({ message: "Action Does Not Exist" });
      } else res.status(400).json({ message: "Bud Does Not Exist" });
    } else res.status(400).json({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Comment Like Router :
router.post("/commentLikes", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { skip, commentId, action } = req.body;
    req.body.likedBy = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      const comment = await commentsModel.findOne({ _id: commentId });
      const pushToken = await pushTokenModel.distinct("pushToken", {
        userId: id,
      });
      if (comment) {
        // Community Check :
        const bud = await budsModel.findOne({ _id: comment.budId });
        const communityCheck =
          bud.communityId.length > 0 ||
          bud.teamId.length > 0 ||
          bud.subTeamId.length > 0;

        if (action === "create") {
          try {
            const result = new commentLikeModel({
              commentId: commentId,
              likeCount: 1,
              likedBy: [
                {
                  userId: id,
                  weatherLiked: true,
                },
              ],
            });
            await result.save();

            const update = await commentsModel.findOneAndUpdate(
              { _id: commentId },
              {
                $inc: { commentLikeCount: 1 },
                weatherLiked: true,
              },
              { new: true }
            );

            const notificationData = {
              token: pushToken[0],
              userId: id,
              commentId: commentId,
              notificationType: "Comment Like",
              body: budNotifications.likeCommentMessage(buddy.userName),
            };
            await pushNotification(
              communityCheck ? "community" : "none",
              notificationData
            );

            res
              .status(201)
              .send({ message: "Comment Liked Successfully", result });
          } catch (error) {
            console.log(error);
            res.status(500).send({ message: "Internal Server Error", error });
          }
        }
        // Updating Likes :
        else if (action == "update") {
          let findBuddys = await commentLikeModel.findOne({
            commentId: commentId,
            "likedBy.userId": id,
          });
          if (!findBuddys) {
            const result = await commentLikeModel.findOneAndUpdate(
              { commentId: commentId },
              {
                $inc: { likeCount: 1 },
                $push: {
                  likedBy: {
                    userId: id,
                    weatherLiked: true,
                  },
                },
              },
              { new: true }
            );
            await commentsModel.findOneAndUpdate(
              { _id: commentId },
              {
                $inc: { commentLikeCount: 1 },
                weatherLiked: true,
              },
              { new: true }
            );

            const notificationData = {
              token: pushToken[0],
              userId: id,
              commentId: commentId,
              notificationType: "Comment Like",
              body: budNotifications.likeCommentMessage(buddy.userName),
            };
            await pushNotification(
              communityCheck ? "community" : "none",
              notificationData
            );

            res
              .status(201)
              .send({ message: "Comment Liked Successfully", result });
          } else {
            const result = await commentLikeModel.findOneAndUpdate(
              { commentId: commentId },
              {
                $inc: { likeCount: -1 },
                $pull: {
                  likedBy: {
                    userId: id,
                  },
                },
              },
              { new: true }
            );

            await commentsModel.findOneAndUpdate(
              { _id: commentId },
              {
                $inc: { commentLikeCount: -1 },
                weatherLiked: false,
              },
              { new: true }
            );

            if (communityCheck) {
              await communityNotificationModel.findOneAndDelete({
                userId: id,
                commentId: commentId,
                notificationType: "Comment Like",
              });
            } else {
              await notificationModel.findOneAndDelete({
                userId: id,
                commentId: commentId,
                notificationType: "Comment Like",
              });
            }
            if (result.likeCount === 0) {
              await commentLikeModel.deleteOne({
                commentId: commentId,
                likeCount: 0,
              });
              res
                .status(200)
                .send({ message: "Comment Unliked and Removed Successfully" });
            } else {
              res.status(200).send({ message: "Comment Unliked Successfully" });
            }
          }
        } else res.status(400).json({ message: "Action Does Not Exist" });
      } else res.status(400).json({ message: "Comment Does Not Exist" });
    } else res.status(400).json({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Comments Reply Router:
router.post("/replyComments", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { skip, action, replyId, commentId, replyUserId } = req.body;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      const comment = await commentsModel.findOne({ _id: commentId });
      const pushToken = await pushTokenModel.distinct("pushToken", {
        userId: id,
      });
      if (comment) {
        // Community Check :
        const bud = await budsModel.findOne({ _id: comment.budId });
        const communityCheck =
          bud.communityId.length > 0 ||
          bud.teamId.length > 0 ||
          bud.subTeamId.length > 0;

        if (action == "create") {
          let result = new commentReplyModel(req.body);
          await result.save();
          let updatedComments = await commentsModel.findOneAndUpdate(
            { _id: commentId },
            { $inc: { commentReplyCount: 1 } },
            { new: true }
          );
          const notificationData = {
            token: pushToken[0],
            userId: id,
            budId: bud.budId,
            commentId: commentId,
            replyId: replyId,
            notificationType: "Comment Reply",
            body: budNotifications.replyCommentMessage(buddy.userName),
          };
          await pushNotification(
            communityCheck ? "community" : "none",
            notificationData
          );
          res
            .status(201)
            .send({ message: "Comment Replyed Successfully", result });
        } else if (action == "read") {
          let buddys = await commentReplyModel
            .find({ commentId: commentId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(50);

          let result = [];
          for (const buddy of buddys) {
            const userDetails = await buddyDetails(buddy.userId);
            const comment = {
              _id: buddy._id,
              userId: buddy.userId,
              userDetails: userDetails,
              budId: buddy.budId,
              commentId: buddy.commentId,
              reply: buddy.reply,
              createdAt: buddy.createdAt,
              updatedAt: buddy.updatedAt,
            };
            result.push(comment);
          }
          res.status(200).json({ message: "Comment Reply List", result });
        } else if (action == "update") {
          let buds = await commentReplyModel.updateOne(
            { _id: replyId },
            { $set: req.body }
          );
          res
            .status(201)
            .send({ message: "Comment Reply Updated Successfully" });
        } else if (action == "delete") {
          let commentUser = await commentsModel.findOne({
            $and: [{ _id: commentId }, { userId: id }],
          });
          let replyUser = await commentsModel.findOne({
            $and: [{ _id: replyId }, { userId: replyUserId }],
          });
          if (commentUser !== null || replyUser !== null) {
            let result = await commentsModel.deleteOne({ _id: replyId });

            await commentsModel.findOneAndUpdate(
              { _id: commentId },
              { $inc: { commentReplyCount: 1 } },
              { new: true }
            );

            if (communityCheck) {
              await communityNotificationModel.findOneAndDelete({
                userId: id,
                commentId: commentId,
                replyId: replyId,
                notificationType: "Comment Reply",
              });
            } else {
              await notificationModel.findOneAndDelete({
                userId: id,
                commentId: commentId,
                replyId: replyId,
                notificationType: "Comment Reply",
              });
            }
            res
              .status(201)
              .send({ message: "Comment Reply Deleted Successfully", result });
          } else
            res
              .status(200)
              .send({ message: "Delete action does not exist for others" });
        } else res.status(400).json({ message: "Action Does Not Exist" });
      } else res.status(400).json({ message: "Comment Does Not Exist" });
    } else res.status(400).json({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Gifts Router:
router.post("/gifts", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { skip, budId, action } = req.body;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      const pushToken = await pushTokenModel.distinct("pushToken", {
        userId: id,
      });
      // Community Check :
      const isCommunity =
        bud.communityId.length > 0 ||
        bud.teamId.length > 0 ||
        bud.subTeamId.length > 0;

      if (action == "create") {
        let result = new giftsModel(req.body);
        await result.save();

        const notificationData = {
          token: pushToken[0],
          userId: id,
          budId: budId,
          notificationType: "Gift",
          body: budNotifications.giftMessage(buddy.userName),
        };
        await pushNotification(
          isCommunity ? "community" : "none",
          notificationData
        );

        res.status(201).send({ message: "Gift Shared Successfully", result });
      } else if (action == "read") {
        let result = await giftsModel
          .find({ budId: budId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(50);
        res.status(200).json({ message: "Bud Gift List", result });
      } else res.status(400).json({ message: "Action Does Not Exist" });
    } else res.status(400).json({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Re-Bud Router:
router.post("/reBud", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { skip, budId, action } = req.body;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      let bud = await budsModel.findOne({ _id: budId });
      const pushToken = await pushTokenModel.distinct("pushToken", {
        userId: id,
      });
      if (bud) {
        // Community Check :
        const isCommunity =
          bud.communityId.length > 0 ||
          bud.teamId.length > 0 ||
          bud.subTeamId.length > 0;

        if (action == "create") {
          let buddyDetail = await buddyDetails(id);
          let reBud = {
            ...bud.toObject(),
            reBudStatus: true,
            likeCount: 0,
            commentCount: 0,
            reBudCount: 0,
            weatherLiked: false,
            currentUser: false,
            createdAt: new Date(),
            buddyOwnerDetails: await buddyDetails(bud.budOwner),
            buddyDetails: buddyDetail,
          };
          delete reBud._id;
          req.body.userId = id;
          req.body.budOwner = reBud.userId;
          reBud.reBudDetails.push({
            reBudUserId: buddyDetails._id,
            reBudUserName: buddyDetails.userName,
            reBudFullName: buddyDetails.fullName,
            reBudUserProfilePic: buddyDetails.profilePic,
            reBudTitle: buddyDetails.title,
            reBudisVerified: buddyDetails.isVerified,
            reBudThoughts: req.body.reBudThoughts,
          });

          let updateBuds = await budsModel.findOneAndUpdate(
            { _id: budId },
            { $inc: { reBudCount: 1 } },
            {
              $push: {
                reBudDetails: {
                  reBudUserId: id,
                  reBudThoughts: req.body.reBudThoughts,
                },
              },
            },
            { new: true }
          );

          let result = new budsModel(reBud);
          await result.save();

          const notificationData = {
            token: pushToken[0],
            userId: id,
            budId: budId,
            notificationType: "Rebud",
            body: budNotifications.reBudMessage(buddy.userName),
          };
          await pushNotification(
            isCommunity ? "community" : "none",
            notificationData
          );

          res
            .status(200)
            .send({ message: "Bud ReBudded Successfully", result });
        }
      } else {
        res.status(400).json({ message: "Bud Id Does Not Exist" });
      }
    } else {
      res.status(400).json({ message: "User Does Not Exist" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Save Buds Router :
router.post("/save", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    req.body.userId = id;
    const { budId, action, skip } = req.body;

    let buddy = await BuddysModel.find({ _id: id });
    if (buddy) {
      if (action == "save") {
        let check = await budsModel.findOne({
          $and: [{ _id: budId }, { savedBy: { $in: [id] } }],
        });
        if (!check) {
          let result = new saveBudsModel(req.body);
          await result.save();
          await budsModel.findOneAndUpdate(
            { _id: budId },
            { $addToSet: { savedBy: id } }
          );
          res.status(201).send({ message: "Bud Saved Successfully", result });
        } else {
          res.status(400).send({ message: "Bud Already Saved" });
        }
      } else if (action == "unSave") {
        let check = await budsModel.findOne({
          $and: [{ _id: budId }, { savedBy: { $in: [id] } }],
        });
        if (check) {
          let result = await saveBudsModel.findOneAndDelete({
            $and: [{ budId: budId }, { userId: id }],
          });
          await budsModel.findOneAndUpdate(
            { _id: budId },
            { $pull: { savedBy: id } }
          );
          res.status(201).send({ message: "Bud unsaved Successfully", result });
        } else res.status(400).send({ message: "Bud havent saved yet" });
      } else if (action == "readMine") {
        let budDetail = await saveBudsModel.distinct("budId", { userId: id });
        let budPromises = budDetail.map(async (budId) => {
          let bud = await budsModel
            .findOne({ _id: budId })
            .skip(skip)
            .limit(10);
          if (bud) return bud;
        });
        let result = await Promise.all(budPromises);
        let resultLength = result.length;
        res
          .status(200)
          .send({ message: "Your Saved Buds List", resultLength, result });
      } else if (action == "readMindGrid") {
        let budDetail = await saveBudsModel.distinct("budId", { userId: id });
        let budPromises = budDetail.map(async (budId) => {
          let bud = await budsModel.findOne({
            _id: budId,
            budType: { $in: ["image", "video"] },
          });
          if (bud) return bud;
        });
        let result = await Promise.all(budPromises);
        res.status(200).send({ message: "Your Saved Buds List Grid", result });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Hide Bud Router :
router.post("/hide", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const budId = req.body.budId;
    const action = req.body.action;

    let buddy = await BuddysModel.find({ _id: id });
    if (buddy) {
      if (action == "hide") {
        let check = await budsModel.findOne({
          $and: [{ _id: budId }, { hideBy: { $in: [id] } }],
        });
        if (!check) {
          await budsModel.findOneAndUpdate(
            { _id: budId },
            { $addToSet: { hideBy: id } }
          );
          res.status(200).json({ message: "Bud Hide Successfully" });
        } else res.status(400).json({ message: "Bud Already Hided" });
      } else if (action == "unhide") {
        let check = await budsModel.findOne({
          $and: [{ _id: budId }, { hideBy: { $in: [id] } }],
        });
        if (check) {
          await budsModel.findOneAndUpdate(
            { _id: budId },
            { $pull: { hideBy: id } }
          );
          res.status(200).json({ message: "Bud Unhide Successfully" });
        } else res.status(400).json({ message: "Bud havent Hided" });
      } else res.status(400).json({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Report Router :
router.post("/reports", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const budId = req.body.budId;
    const action = req.body.action;
    const reportDescription = req.body.reportDescription;

    let buddy = await BuddysModel.find({ _id: id });
    if (buddy) {
      let bud = await budsModel.findOne({ _id: budId });
      if (bud) {
        if (action === "create") {
          let result = new reportModel({
            budId: budId,
            reportedBy: [
              {
                reportedUserId: id,
                reportDescription: reportDescription,
              },
            ],
            $inc: { noOfReports: 1 },
          });
          await result.save();
          await budsModel.findOneAndUpdate(
            { _id: budId },
            { isVerified: true }
          );
          res.status(201).send({ message: "Reported Successfully", result });
        } else if (action === "read") {
          let result = await reportModel.findOne({ budId: budId });
          res.status(200).send({ message: "Reported List", result });
        } else if (action === "update") {
          let result = await reportModel.findOneAndUpdate(
            { budId: budId, "reportedBy.reportedUserId": { $ne: id } },
            {
              $addToSet: {
                reportedBy: {
                  reportedUserId: id,
                  reportDescription: reportDescription,
                },
              },
            },
            { new: true }
          );
          res
            .status(200)
            .send({ message: "Report Updated Successfully", result });
        } else {
          res.status(400).json({ message: "Action Does Not Exist" });
        }
      } else {
        res.status(400).json({ message: "Bud Does Not Exist" });
      }
    } else {
      res.status(400).json({ message: "User Does Not Exist" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Comment Report Router :
router.post("/commentReports", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const budId = req.body.budId;
    const action = req.body.action;
    const commentId = req.body.commentId;
    const reportDescription = req.body.reportDescription;

    let buddy = await BuddysModel.find({ _id: id });
    if (buddy) {
      let comment = await commentsModel.findOne({ _id: commentId });
      if (comment) {
        if (action === "create") {
          let result = new commentReportModel({
            budId: budId,
            commentId: commentId,
            reportedBy: [
              {
                reportedUserId: id,
                reportDescription: reportDescription,
              },
            ],
            $inc: { noOfReports: 1 },
          });
          await result.save();
          await budsModel.findOneAndUpdate(
            { _id: budId },
            { isVerified: true }
          );
          res.status(201).send({ message: "Reported Successfully", result });
        } else if (action === "read") {
          let result = await commentReportModel.findOne({
            $or: [{ budId: budId }, { commentId: commentId }],
          });
          res.status(200).send({ message: "Comment Reported List", result });
        } else if (action === "update") {
          let result = await commentReportModel.findOneAndUpdate(
            { _id: commentId },
            { isVerified: false }
          );
          res
            .status(200)
            .send({ message: "Report Updated Successfully", result });
        } else {
          res.status(400).json({ message: "Action Does Not Exist" });
        }
      } else {
        res.status(400).json({ message: "Comment Does Not Exist" });
      }
    } else {
      res.status(400).json({ message: "User Does Not Exist" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Upload Images
const uploadImages = async (req, res) => {
  const id = req.userId;
  const action = req.body.action;
  const imageId = req.body.imageId;
  const imageType = req.body.imageType;

  const userIdRandom = String(id).slice(7, 12);
  const timestamp = Date.now();
  const date = new Date(timestamp);
  // const s3DateFormat = date.toISOString().split("T")[0];

  let buddy = await BuddysModel.findOne({ _id: id });
  if (buddy) {
    if (action == "create") {
      const files = req.files["photo"];
      const tempImageFile = req.files["tempImage"]
        ? req.files["tempImage"][0]
        : null;

      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }

      const uploadPromises = files.map((file, index) => {
        const params = {
          Bucket: "mybuddy-sanorac",
          Key: `mb_img_${userIdRandom}_${timestamp}_${index}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        const tempParams = {
          Bucket: "mybuddy-sanorac",
          Key: `mb_tempImg_${userIdRandom}_${timestamp}_${index}`,
          Body: tempImageFile ? tempImageFile.buffer : null,
          ContentType: tempImageFile ? tempImageFile.mimetype : null,
        };

        const command = new PutObjectCommand(params);

        const uploadImagePromise = s3Client.send(command).then(() => {
          const imageUrl = `https://mybuddy-sanorac.s3.ap-south-1.amazonaws.com/${params.Key}`;
          const tempImageUrl = tempParams.Body
            ? `https://mybuddy-sanorac.s3.ap-south-1.amazonaws.com/${tempParams.Key}`
            : null;
          const image = new imageModel({
            userId: id,
            imageType: imageType,
            imageUrl: imageUrl,
            tempImageUrl: tempImageUrl,
          });
          return image.save();
        });

        return Promise.all([uploadImagePromise])
          .then(([image]) => {
            return image;
          })
          .catch((error) => {
            console.error(error);
            throw error;
          });
      });

      try {
        const images = await Promise.all(uploadPromises);
        res.status(201).send({
          message: "Images uploaded successfully",
          images: images,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Image Uploading Error" });
      }
    } else if (action == "read") {
      const result = await imageModel
        .findOne({ _id: imageId })
        .sort({ createdAt: -1 });
      res.status(200).send({ message: "Image Details", result });
    } else if (action == "update") {
      const result = await imageModel.findOneAndUpdate(
        { _id: imageId },
        { $set: req.body },
        { new: true }
      );
      res.status(200).send({ message: "Image Updated Successfully" });
    } else {
      res.status(400).send({ message: "Action Does Not Exist" });
    }
  } else {
    res.status(400).send({ message: "User Does Not Exist" });
  }
};

router.post(
  "/uploadImages",
  tokenValidation,
  upload.fields([
    { name: "photo", maxCount: 5 },
    { name: "tempImage", maxCount: 1 },
  ]),
  uploadImages
);

// Upload Video :
const uploadVideos = async (req, res) => {
  const id = req.userId;
  const action = req.body.action;
  const videoId = req.body.videoId;
  const thumbnailUrl = req.body.thumbnailUrl;

  const userIdRandom = String(id).slice(7, 12);
  const timestamp = Date.now();
  const date = new Date(timestamp);
  const s3DateFormat = date.toISOString().split("T")[0];

  let buddy = await BuddysModel.findOne({ _id: id });
  if (buddy) {
    if (action === "create") {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const params = {
        Bucket: "mybuddy-sanorac",
        Key: `MB_Video_${userIdRandom}_${s3DateFormat}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(params);

      try {
        await s3Client.send(command);
        const videoUrl = `https://mybuddy-sanorac.s3.ap-south-1.amazonaws.com/${params.Key}`;
        const video = new videoModel({
          userId: id,
          videoUrl: videoUrl,
        });
        await video.save();
        res.status(201).send({
          message: "Video uploaded successfully",
          video: video,
          thumbnailUrl: thumbnailUrl,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Video Uploading Error" });
      }
    } else if (action === "read") {
      const result = await videoModel
        .findOne({ _id: videoId })
        .sort({ createdAt: -1 });
      res.status(200).send({ message: "Video Details", result });
    } else if (action === "update") {
      const result = await videoModel.findOneAndUpdate(
        { _id: videoId },
        { $set: req.body },
        { new: true }
      );
      res.status(200).send({ message: "Video Updated Successfully" });
    } else {
      res.status(400).send({ message: "Action Does Not Exist" });
    }
  } else {
    res.status(400).send({ message: "User Does Not Exist" });
  }
};
router.post(
  "/uploadVideo",
  tokenValidation,
  upload.single("video"),
  uploadVideos
);

// Upload Audio :
const uploadAudios = async (req, res) => {
  const id = req.userId;
  const { action, audioId } = req.body;

  const userIdRandom = String(id).slice(7, 12);
  const timestamp = Date.now();
  const date = new Date(timestamp);
  const s3DateFormat = date.toISOString().split("T")[0];

  let buddy = await BuddysModel.findOne({ _id: id });
  if (buddy) {
    if (action === "create") {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const params = {
        Bucket: "mybuddy-sanorac",
        Key: `MB_Audio_${userIdRandom}_${s3DateFormat}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(params);

      try {
        await s3Client.send(command);
        const audioUrl = `https://mybuddy-sanorac.s3.ap-south-1.amazonaws.com/${params.Key}`;
        const audio = new audioModel({
          userId: id,
          audioUrl: audioUrl,
        });
        await audio.save();
        res.status(201).send({
          message: "Audio uploaded successfully",
          audio: audio,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Audio Uploading Error" });
      }
    } else if (action === "read") {
      const result = await audioModel
        .findOne({ _id: audioId })
        .sort({ createdAt: -1 });
      res.status(200).send({ message: "Video Details", result });
    } else if (action === "update") {
      const result = await audioModel.findOneAndUpdate(
        { _id: audioId },
        { $set: req.body },
        { new: true }
      );
      res.status(200).send({ message: "Video Updated Successfully" });
    } else {
      res.status(400).send({ message: "Action Does Not Exist" });
    }
  } else {
    res.status(400).send({ message: "User Does Not Exist" });
  }
};
router.post(
  "/uploadAudio",
  tokenValidation,
  upload.single("audio"),
  uploadAudios
);

// Upload Images :
const uploadDocuments = async (req, res) => {
  const id = req.userId;
  const docId = req.body.docId;
  const action = req.body.action;

  const userIdRandom = String(id).slice(7, 12);
  const timestamp = Date.now();
  const date = new Date(timestamp);
  const s3DateFormat = date.toISOString().split("T")[0];

  let buddy = await BuddysModel.findOne({ _id: id });
  if (buddy) {
    if (action == "create") {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }

      const uploadPromises = files.map((file) => {
        const params = {
          Bucket: "mybuddy-sanorac",
          Key: `MB_Doc_${userIdRandom}_${s3DateFormat}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        const command = new PutObjectCommand(params);

        return s3Client
          .send(command)
          .then(() => {
            const documentUrl = `https://mybuddy-sanorac.s3.ap-south-1.amazonaws.com/${params.Key}`;
            const document = new documentModel({
              userId: id,
              documentUrl: documentUrl,
              documentName: file.originalname.split(".")[0],
              documentFormat: file.originalname.split(".")[1],
            });
            return document.save();
          })
          .catch((error) => {
            console.error(error);
            throw error;
          });
      });

      try {
        const document = await Promise.all(uploadPromises);
        res.status(201).send({
          message: "Document uploaded successfully",
          documents: document,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Document Uploading Error" });
      }
    } else if (action == "read") {
      const result = await documentModel
        .findOne({ _id: docId })
        .sort({ createdAt: -1 });
      res.status(200).send({ message: "Document Deatils", result });
    } else if (action == "update") {
      const result = await documentModel.findOneAndUpdate(
        { _id: docId },
        { $set: req.body },
        { new: true }
      );
      res
        .status(200)
        .send({ message: "Document Updated Successfully", result });
    } else res.status(400).send({ message: "Action Does Not Exist" });
  } else {
    res.status(400).send({ message: "User Does Not Exist" });
  }
};

router.post(
  "/uploadDocuments",
  tokenValidation,
  upload.array("document", 5),
  uploadDocuments
);

module.exports = router;

// Upload Images :
// const uploadImages = async (req, res) => {
//   const id = req.userId;
//   const action = req.body.action;
//   const imageId = req.body.imageId;
//   const imageType = req.body.imageType;

//   const userIdRandom = String(id).slice(7, 12);
//   const timestamp = Date.now();
//   const date = new Date(timestamp);
//   // const s3DateFormat = date.toISOString().split("T")[0];

//   let buddy = await BuddysModel.findOne({ _id: id });
//   if (buddy) {
//     if (action == "create") {
//       const files = req.files;
//       if (!files || files.length === 0) {
//         return res.status(400).json({ message: "No files provided" });
//       }

//       const uploadPromises = files.map((file) => {
//         const params = {
//           Bucket: "mybuddy-sanorac",
//           Key: `mb_img_${userIdRandom}_${timestamp}`,
//           Body: file.buffer,
//         };

//         const command = new PutObjectCommand(params);

//         return s3Client
//           .send(command)
//           .then(() => {
//             const imageUrl = `https://mybuddy-sanorac.s3.ap-south-1.amazonaws.com/${params.Key}`;
//             const image = new imageModel({
//               userId: id,
//               imageType: imageType, // Make sure to define and assign a value to imageType
//               imageUrl: imageUrl,
//             });
//             return image.save();
//           })
//           .catch((error) => {
//             console.error(error);
//             throw error;
//           });
//       });

//       try {
//         const images = await Promise.all(uploadPromises);
//         res.status(201).send({
//           message: "Images uploaded successfully",
//           images: images,
//         });
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ message: "Image Uploading Error" });
//       }
//     } else if (action == "read") {
//       const result = await imageModel
//         .findOne({ _id: imageId })
//         .sort({ createdAt: -1 });
//       res.status(200).send({ message: "Image Deatils", result });
//     } else if (action == "update") {
//       const result = await imageModel.findOneAndUpdate(
//         { _id: imageId },
//         { $set: req.body },
//         { new: true }
//       );
//       res.status(200).send({ message: "Image Updated Successfully" });
//     } else res.status(400).send({ message: "Action Does Not Exist" });
//   } else {
//     res.status(400).send({ message: "User Does Not Exist" });
//   }
// };

// router.post(
//   "/uploadImages",
//   tokenValidation,
//   upload.array("photo", 5),
//   uploadImages
// );
