const express = require("express");
const router = express.Router();
const { mongoose } = require("mongoose");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { tokenValidation } = require("../auth/auth.js");
const { BuddysModel } = require("../schema/loginSchema.js");
const {
  hideStoriesModel,
  muteStoriesModel,
  shareStoriesModel,
  blockedAccountModel,
  blockCommentersModel,
  privacySettingsModel,
} = require("../schema/settingsSchema.js");
const {
  profileImageModel,
  personalDetailsModel,
  buddyFollowerDetailsModel,
} = require("../schema/buddysSchema.js");
const { buddyDetails } = require("../services/buddyFunctions.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Privacy Settings Router :
router.post("/privacySettings", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const action = req.body.action;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id }).sort({ createdAt: -1 });
    if (buddy) {
      if (action == "create") {
        let check = await privacySettingsModel.findOne({ userId: id });
        if (!check) {
          let result = new privacySettingsModel(req.body);
          await result.save();
          res
            .status(200)
            .send({ message: "Privacy Settings Created Successfully" });
        } else res.status(400).send({ message: "Use Action Update" });
      } else if (action == "read") {
        let privacySettings = await privacySettingsModel
          .findOne({ userId: id })
          .sort({ createdAt: -1 });

        if (privacySettings) {
          let blockList = await blockedAccountModel.distinct(
            "blockedUserDetails",
            {
              userId: id,
            }
          );
          let blockCount = blockList ? blockList.length : 0;

          let result = {
            ...privacySettings.toObject(),
            blockedUsersCount: blockCount,
          };
          res.status(200).send({ message: "Privacy Settings", result });
        } else
          res.status(400).send({ message: "Privacy Settings Not Created" });
      } else if (action == "update") {
        await privacySettingsModel.findOneAndUpdate(
          { userId: id },
          { $set: req.body }
        );
        res.status(200).send({ message: "Saved Successfully" });
      }
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Common Create Function :
const createFunction = async (req, res, model, userId, id, checkKey) => {
  try {
    const userCheck = await model.findOne({ userId: id });
    if (userCheck) {
      let result;
      if (userCheck[checkKey].includes(userId)) {
        result = await model.findOneAndUpdate(
          { userId: id },
          { $pull: { [checkKey]: userId } },
          { new: true }
        );
      } else {
        result = await model.findOneAndUpdate(
          { userId: id },
          { $addToSet: { [checkKey]: userId } },
          { new: true }
        );
      }
      res.status(200).send({ message: "Updated Successfully", result });
    } else {
      const result = new model(req.body);
      await result.save();
      res.status(200).send({ message: "Created Successfully", result });
    }
  } catch (error) {
    console.log(error);
  }
};

// Common Read Function :
const readFunction = async (req, res, model, id) => {
  try {
    let result = await model
      .findOne({ userId: id })
      .sort({ createdAt: -1 })
      .skip(req.body.skip)
      .limit(10);
    res.status(200).send({ message: "Read List", result });
  } catch (error) {
    console.log("error: ", error);
  }
};

// Block Commentors :
router.post("/blockCommenters", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, blockedUserId } = req.body;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id }).sort({ createdAt: -1 });
    if (buddy) {
      if (action == "create") {
        await createFunction(
          req,
          res,
          blockCommentersModel,
          blockedUserId,
          id,
          "blockedUserId"
        );
      } else if (action == "read") {
        await readFunction(req, res, blockCommentersModel, id);
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Hide Stories :
router.post("/hideStories", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, hideUserId, skip } = req.body;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id }).sort({ createdAt: -1 });
    if (buddy) {
      if (action == "create") {
        await createFunction(
          req,
          res,
          hideStoriesModel,
          hideUserId,
          id,
          "hideUserId"
        );
      } else if (action == "read") {
        await readFunction(req, res, hideStoriesModel, id);
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Share Stories :
router.post("/shareStories", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, shareUserId } = req.body;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id }).sort({ createdAt: -1 });
    if (buddy) {
      if (action == "create") {
        await createFunction(
          req,
          res,
          shareStoriesModel,
          shareUserId,
          id,
          "shareUserId"
        );
      } else if (action == "read") {
        await readFunction(req, res, shareStoriesModel, id);
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Mute Stories :
router.post("/muteStories", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, muteUserId } = req.body;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id }).sort({ createdAt: -1 });
    if (buddy) {
      if (action == "create") {
        await createFunction(
          req,
          res,
          muteStoriesModel,
          muteUserId,
          id,
          "muteUserId"
        );
      } else if (action == "read") {
        await readFunction(req, res, muteStoriesModel, id);
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Block Accounts :
router.post("/blockAccounts", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, blockedUserId } = req.body;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id }).sort({ createdAt: -1 });
    if (buddy) {
      if (action == "create") {
        const userCheck = await blockedAccountModel.findOne({ userId: id });
        if (userCheck) {
          const isBlocked = userCheck.blockedUserDetails.some(
            (user) => user.blockedUserId === blockedUserId
          );
          if (!isBlocked) {
            let result = await blockedAccountModel.findOneAndUpdate(
              { userId: id },
              {
                $addToSet: {
                  blockedUserDetails: {
                    blockedUserId: blockedUserId,
                    createdAt: new Date().toISOString(),
                  },
                },
              },
              { new: true }
            );
            res
              .status(200)
              .send({ message: "User Blocked Successfully", result });
          } else {
            let result = await blockedAccountModel.findOneAndUpdate(
              { userId: id },
              {
                $pull: {
                  blockedUserDetails: { blockedUserId: blockedUserId },
                },
              },
              { new: true }
            );
            res
              .status(200)
              .send({ message: "User UnBlocked Successfully", result });
          }
        } else {
          let checkWeatherMe = blockedUserId == id;
          if (!checkWeatherMe) {
            let result = new blockedAccountModel({
              userId: id,
              blockedUserDetails: [
                {
                  blockedUserId: blockedUserId,
                  createdAt: new Date().toISOString(),
                },
              ],
            });
            await result.save();
            res
              .status(200)
              .send({ message: "User Blocked Successfully", result });
          } else res.status(400).send({ message: "You Cannot Block Yourself" });
        }
      } else if (action == "read") {
        const blockedUserId = await blockedAccountModel
          .findOne({ userId: id })
          .distinct("blockedUserDetails.blockedUserId");

        const blockedUserPromises = blockedUserId.map(async (id) => {
          const user = await buddyDetails(id);
          const idMine = req.userId;
          const blockedUser = await blockedAccountModel
            .findOne(
              { userId: idMine },
              { "blockedUserDetails.blockedUserId": id }
            )
            .distinct("blockedUserDetails.createdAt");
          return {
            ...user,
            createdAt: blockedUser ? blockedUser[0] : null,
          };
        });
        const block = await Promise.all(blockedUserPromises);
        res.status(200).send({ message: "Blocked Users List", result: block });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Block User Search : NOT IN USE
// router.post("/blockUsersList", tokenValidation, async (req, res) => {
//   try {
//     const id = req.userId;

//     let buddy = await BuddysModel.findOne({ _id: id });
//     if (buddy) {
//       const follower = await buddyFollowerDetailsModel
//         .find({ $and: [{ userId: id }, { status: "Accepted" }] })
//         .distinct("followId");
//       const following = await buddyFollowerDetailsModel
//         .find({ $and: [{ followId: id }, { status: "Accepted" }] })
//         .distinct("userId");

//       const mergedArray = follower.concat(following);
//       const uniqueIds = [...new Set(mergedArray)];

//       const blockedUserId = await blockedAccountModel
//         .findOne({ userId: id })
//         .distinct("blockedUserDetails.blockedUserId");

//       const usersList = uniqueIds.filter((id) => !blockedUserId.includes(id));
//       const blockedUserPromises = blockedUserId.map(async (id) => {
//         const user = await buddyDetails(id);
//         const idMine = req.userId;
//         const blockedUser = await blockedAccountModel
//           .findOne(
//             { userId: idMine },
//             { "blockedUserDetails.blockedUserId": id }
//           )
//           .distinct("blockedUserDetails.createdAt");
//         return {
//           ...user,
//           createdAt: blockedUser ? blockedUser[0] : null,
//         };
//       });
//       const block = await Promise.all(blockedUserPromises);

//       const UserListPromises = usersList.map(async (id) => buddyDetails(id));
//       const users = await Promise.all(UserListPromises);
//       users.sort((a, b) => a.fullName.localeCompare(b.fullName));

//       const result = { blockedUsers: block, userDetails: users };

//       res.status(201).send({
//         message: "Tag Buddys Details",
//         result,
//       });
//     } else {
//       res.status(400).send({ message: "User Does Not Exist" });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({ message: "Internal Server Error", error });
//   }
// });

module.exports = router;

// const userCheck = await blockCommentersModel.findOne({ userId: id });
// if (userCheck) {
//   // let check = await blockCommentersModel.findOne({
//   //   $and: [{ userId: id }, { blockedUserId: $in[blockedUserId] }],
//   // });
//   let result;
//   if (userCheck.blockedUserId.includes(blockedUserId)) {
//     result = await blockCommentersModel.findOneAndUpdate(
//       { userId: id },
//       { $pull: { blockedUserId: blockedUserId } },
//       { new: true }
//     );
//   } else {
//     result = await blockCommentersModel.findOneAndUpdate(
//       { userId: id },
//       { $addToSet: { blockedUserId: blockedUserId } },
//       { new: true }
//     );
//   }
//   res
//     .status(200)
//     .send({ message: "Block Commenters Updated Successfully", result });
// } else {
//   const result = new blockCommentersModel(req.body);
//   await result.save();
//   res.status(200).send({ message: "User Added Successfully", result });
// }
