const express = require("express");
const router = express.Router();
const { mongoose } = require("mongoose");
const { tokenValidation } = require("../auth/auth.js");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { storyModel } = require("../schema/storiesSchema.js");
const { BuddysModel } = require("../schema/loginSchema.js");
const { imageModel, videoModel } = require("../schema/budsSchema.js");
const { buddyFollowerDetailsModel } = require("../schema/buddysSchema.js");
const {
  hideStoriesModel,
  shareStoriesModel,
  blockedAccountModel,
  muteStoriesModel,
} = require("../schema/settingsSchema.js");
const {
  followersList,
  buddyDetails,
} = require("../services/buddyFunctions.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Create Stories:
router.post("/stories", tokenValidation, async (req, res) => {
  try {
    let id = req.userId;
    let action = req.body.action;
    let imageId = req.body.imageId;
    let videoId = req.body.videoId;
    let storyId = req.body.storyId;
    let storyType = req.body.storyType;

    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        // Buddy Details :
        const buddyDetail = await buddyDetails(id);
        req.body.buddyDetails = buddyDetail;

        if (imageId || videoId || text) {
          // Image Details:
          if (imageId.length > 0) {
            for (const id of imageId) {
              const images = await imageModel
                .find({ _id: id })
                .sort({ createdAt: -1 });
              req.body.image = images;
              let result = new storyModel(req.body);
              await result.save();
            }
          } else {
            req.body.image = [];
          }

          // Video Details:
          if (videoId.length >= 0) {
            for (const id of videoId) {
              const videos = await videoModel
                .find({ _id: id })
                .sort({ createdAt: -1 });
              req.body.video = videos;
              let result = new storyModel(req.body);
              await result.save();
            }
          } else {
            req.body.video = [];
          }

          // Text Details :
          if (storyType == "text") {
            let result = new storyModel(req.body);
            await result.save();
          }
        }
        res.status(201).send({ message: "Story Created Successfully" });
      } else if (action == "update") {
        let check = await storyModel.findOne({
          _id: storyId,
          viewedBy: { $elemMatch: { userId: id } },
        });
        if (!check) {
          if (check.userId.toString() !== id.toString()) {
            let result = await storyModel.findOneAndUpdate(
              { _id: storyId },
              {
                $push: {
                  viewedBy: {
                    userId: id,
                    time: new Date().toISOString(),
                  },
                },
              }
            );
            res.status(200).send({ message: "Story Updated Successfully" });
          }
        } else
          res.status(200).send({ message: "Story Already Viewed By User" });
      } else if (action == "delete") {
        let result = await storyModel.deleteOne({ _id: storyId });
        res.status(200).send({ message: "Story Deleted Successfully", result });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "UserId Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Read List Stories:
router.post("/readList", tokenValidation, async (req, res) => {
  try {
    let id = req.userId;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      const userListFunction = async (buddy, viewedCheck, mutedCheck) => {
        const { userId, followId, ...buddyDetails } = buddy;
        const key = buddy._id.toString();
        if (mutedCheck) {
          if (mutedMap[key]) {
            mutedMap[key].storyCount += 1;
          } else {
            mutedMap[key] = [{ ...buddyDetails, storyCount: 1 }];
          }
        } else if (viewedCheck) {
          if (viewedMap[key]) {
            viewedMap[key].storyCount += 1;
          } else {
            if (!resultMap[key]) {
              viewedMap[key] = { ...buddyDetails, storyCount: 1 };
            }
          }
        } else {
          if (resultMap[key]) {
            resultMap[key].storyCount += 1;
          } else {
            if (viewedMap[key]) {
              delete viewedMap[key];
            }
            resultMap[key] = { ...buddyDetails, storyCount: 1 };
          }
        }
      };

      let stories = await storyModel.find({ isActive: true });
      let resultMap = {};
      let viewedMap = {};
      let mutedMap = {};

      const promises = stories.map(async (e) => {
        const idMine = req.userId;
        const blockCheck = await blockedAccountModel.findOne({
          userId: e.userId,
          "blockedUserDetails.blockedUserId": id,
        });
        if (!blockCheck) {
          const followCheck = await followersList(e.userId, idMine);
          const checkWeatherMe = e.userId != idMine;
          console.log(followCheck.length > 0, checkWeatherMe, e.userId);
          if (followCheck.length > 0 && checkWeatherMe) {
            const mutedCheck = await muteStoriesModel.findOne({
              userId: id,
              muteUserId: { $in: [e.userId] },
            });

            if (mutedCheck) {
              userListFunction(e.buddyDetails, mutedCheck);
            } else {
              const viewedCheck = await storyModel.findOne({
                _id: e._id,
                "viewedBy.userId": { $in: [idMine] },
              });

              if (viewedCheck && viewedCheck != null) {
                console.log("I am working");
                userListFunction(e.buddyDetails, viewedCheck);
              } else {
                if (e.whoCanSeeYourStories === "everyOne") {
                  userListFunction(e.buddyDetails);
                } else if (e.whoCanSeeYourStories === "myBuddys") {
                  const check = await buddyFollowerDetailsModel.findOne({
                    userId: id,
                    followId: e.userId,
                  });
                  if (check) userListFunction(e.buddyDetails);
                } else if (e.whoCanSeeYourStories === "myBuddysExcept") {
                  const check = await buddyFollowerDetailsModel.findOne({
                    userId: id,
                    followId: e.userId,
                  });
                  if (check) {
                    const hideUser = await hideStoriesModel
                      .findOne({
                        userId: e.userId,
                        hideUserId: { $in: [id] },
                      })
                      .sort({ createdAt: -1 });
                    if (!hideUser) userListFunction(e.buddyDetails);
                  }
                } else if (e.whoCanSeeYourStories === "onlyShowWith") {
                  const shareUser = await shareStoriesModel.findOne({
                    userId: e.userId,
                    shareUserId: { $in: [id] },
                  });
                  if (shareUser) userListFunction(e.buddyDetails);
                }
              }
            }
          }
        }
      });

      await Promise.all(promises);

      let recentStories = Object.values(resultMap);
      let viewedStories = Object.values(viewedMap);
      let mutedStories = Object.values(mutedMap);

      let result = { recentStories, viewedStories, mutedStories };
      let recentStoryLength = recentStories.length;
      let resultLength =
        recentStories.length + mutedStories.length + viewedStories.length;
      res.status(200).send({
        message: "Story List",
        resultLength,
        recentStoryLength,
        result,
      });
    } else res.status(400).send({ message: "UserId Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Read My List Of Stories:
router.post("/readMine", tokenValidation, async (req, res) => {
  try {
    let id = req.userId;
    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      let result = await storyModel
        .find({
          $and: [{ userId: id }, { isActive: true }],
        })
        .sort({ createdAt: -1 });
      res.status(200).send({ message: "Story List", result });
    } else res.status(400).send({ message: "UserId Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Read Others List Of Stories:
router.post("/readOthers", tokenValidation, async (req, res) => {
  try {
    let id = req.userId;
    let otherUserId = req.body.otherUserId;
    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      let result = await storyModel.find({
        $and: [{ userId: otherUserId }, { isActive: true }],
      });

      // Check if the story has been viewed by the current user
      const viewedByCurrentUser = result[0].viewedBy.some(
        (item) => item.userId === id
      );

      if (!viewedByCurrentUser) {
        // Add the viewedBy details and increase the noOfView by 1
        result[0].viewedBy.push({
          userId: id,
          time: new Date().toISOString(),
        });
        result[0].noOfView += 1;
        await result[0].save();
      }
      res.status(200).send({ message: "Story List", result });
    } else res.status(400).send({ message: "UserId Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Read Viewed Members List:
router.post("/viewedBy", tokenValidation, async (req, res) => {
  try {
    let id = req.userId;
    let storyId = req.body.storyId;
    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      let storyCheck = await storyModel.findOne({
        $and: [{ _id: storyId }, { isActive: true }],
      });
      if (storyCheck) {
        if (storyCheck.userId.toString() !== id.toString()) {
          let story = await storyModel.findOne(
            {
              $and: [{ _id: storyId }, { isActive: true }],
            },
            { _id: 0 }
          );
          let result = story.viewedBy;
          let buddyDetail = result.map(async (e) => {
            const buddyDetail = await buddyDetails(e.userId);
            const result = { ...e.toObject(), buddyDetail };
            return result;
          });
          let finalResult = await Promise.all(buddyDetail);
          res
            .status(200)
            .send({ message: "Story viewed by", result: finalResult });
        }
      } else res.status(400).send({ message: "Story Does Not Exist" });
    } else res.status(400).send({ message: "UserId Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

module.exports = router;

// router.post("/readList", tokenValidation, async (req, res) => {
//   try {
//     let id = req.userId;
//     req.body.userId = id;

//     let buddy = await BuddysModel.findOne({ _id: id });
//     if (buddy) {
//       const userListFunction = async (buddy, viewedCheck, mutedCheck) => {
//         // Function implementation remains the same
//       };

//       const pipeline = [
//         {
//           $match: {
//             isActive: true,
//             $or: [
//               { whoCanSeeYourStories: "everyOne" },
//               { whoCanSeeYourStories: "myBuddys" },
//             ],
//             hideBy: { $ne: id },
//           },
//         },
//         {
//           $lookup: {
//             from: "blockedAccountModel",
//             let: { userId: "$userId" },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: {
//                     $and: [
//                       { $eq: ["$userId", id] },
//                       { $in: [id, "$blockedUserDetails.blockedUserId"] },
//                     ],
//                   },
//                 },
//               },
//             ],
//             as: "blockedCheck",
//           },
//         },
//         {
//           $unwind: "$blockedCheck",
//         },
//         {
//           $match: {
//             blockedCheck: { $exists: false },
//           },
//         },
//         {
//           $lookup: {
//             from: "muteStoriesModel",
//             let: { muteUserId: "$userId" },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: {
//                     $and: [
//                       { $eq: ["$userId", id] },
//                       { $in: ["$$muteUserId", "$muteUserId"] },
//                     ],
//                   },
//                 },
//               },
//             ],
//             as: "mutedCheck",
//           },
//         },
//         {
//           $lookup: {
//             from: "storyModel",
//             let: { storyId: "$_id" },
//             pipeline: [
//               {
//                 $match: {
//                   $expr: {
//                     $and: [
//                       { $eq: ["$_id", "$$storyId"] },
//                       { "viewedBy.userId": id },
//                     ],
//                   },
//                 },
//               },
//             ],
//             as: "viewedCheck",
//           },
//         },
//         {
//           $project: {
//             userId: 1,
//             followId: 1,
//             buddyDetails: 1,
//             mutedCheck: { $arrayElemAt: ["$mutedCheck", 0] },
//             viewedCheck: { $arrayElemAt: ["$viewedCheck", 0] },
//           },
//         },
//       ];

//       const stories = await storyModel.aggregate(pipeline);
//       let resultMap = {};
//       let viewedMap = {};
//       let mutedMap = {};

//       for (const e of stories) {
//         const mutedCheck = e.mutedCheck;
//         const viewedCheck = e.viewedCheck;
//         if (mutedCheck) {
//           userListFunction(e.buddyDetails, null, mutedCheck);
//         } else if (viewedCheck) {
//           userListFunction(e.buddyDetails, viewedCheck, null);
//         } else {
//           userListFunction(e.buddyDetails, null, null);
//         }
//       }

//       let recentStories = Object.values(resultMap);
//       let viewedStories = Object.values(viewedMap);
//       let mutedStories = Object.values(mutedMap);

//       let result = { recentStories, viewedStories, mutedStories };
//       let resultLength = recentStories.length + mutedStories.length + viewedStories.length;
//       res.status(200).send({ message: "Story List", resultLength, result });
//     } else {
//       res.status(400).send({ message: "UserId Does Not Exist" });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({ message: "Internal Server Error", error });
//   }
// });
