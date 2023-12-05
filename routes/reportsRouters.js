const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { tokenValidation } = require("../auth/auth.js");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { handleReport } = require("../services/reportFunctions.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Buddys Report Router :
router.post("/buddys", tokenValidation, async (req, res) => {
  const { otherUserId } = req.body;
  await handleReport(req, res, "buddys", "otherUserId", otherUserId);
});
// Buds Report Router :
router.post("/buds", tokenValidation, async (req, res) => {
  const { budId } = req.body;
  await handleReport(req, res, "buds", "budId", budId);
});

// Comment Report Router
router.post("/comments", tokenValidation, async (req, res) => {
  const { budId, commentId } = req.body;
  await handleReport(
    req,
    res,
    "comments",
    "budId",
    budId,
    "commentId",
    commentId
  );
});

// Stories Report Router
router.post("/stories", tokenValidation, async (req, res) => {
  const { storyId } = req.body;
  await handleReport(req, res, "stories", "storyId", storyId);
});

// Chats Report Router
router.post("/chats", tokenValidation, async (req, res) => {
  const { chatId } = req.body;
  await handleReport(req, res, "chats", "chatId", chatId);
});

// Communities Report Router
router.post("/communities", tokenValidation, async (req, res) => {
  const { communityId, teamId, subTeamId, reportType } = req.body;
  await handleReport(
    req,
    res,
    "communities",
    "communityId",
    communityId,
    "teamId",
    teamId,
    "subTeamId",
    subTeamId,
    "reportType",
    reportType
  );
});

// Events Report Router
router.post("/events", tokenValidation, async (req, res) => {
  await handleReport(req, res, "events");
});

module.exports = router;

// Buds Report Router :
// router.post("/buds", tokenValidation, async (req, res) => {
//   try {
//     const id = req.userId;
//     const { budId, action, reportDescription } = req.body;

//     let buddy = await BuddysModel.find({ _id: id });
//     if (buddy) {
//       let bud = await budsModel.findOne({ _id: budId });
//       if (bud) {
//         if (action === "create") {
//           let result = new reportBudsModel({
//             budId: budId,
//             reportedBy: [
//               {
//                 reportedUserId: id,
//                 reportDescription: reportDescription,
//               },
//             ],
//             $inc: { noOfReports: 1 },
//           });
//           await result.save();
//           await budsModel.findOneAndUpdate(
//             { _id: budId },
//             { isReported: true }
//           );
//           res.status(201).send({ message: "Reported Successfully", result });
//         } else if (action === "read") {
//           let result = await reportBudsModel.findOne({ budId: budId });
//           res.status(200).send({ message: "Reported List", result });
//         } else if (action === "update") {
//           let result = await reportBudsModel.findOneAndUpdate(
//             { budId: budId, "reportedBy.reportedUserId": { $ne: id } },
//             {
//               $addToSet: {
//                 reportedBy: {
//                   reportedUserId: id,
//                   reportDescription: reportDescription,
//                 },
//               },
//             },
//             { new: true }
//           );
//           res
//             .status(200)
//             .send({ message: "Report Updated Successfully", result });
//         } else {
//           res.status(400).json({ message: "Action Does Not Exist" });
//         }
//       } else {
//         res.status(400).json({ message: "Bud Does Not Exist" });
//       }
//     } else {
//       res.status(400).json({ message: "User Does Not Exist" });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// });

// Comment Report Router :
// router.post("/commentReports", tokenValidation, async (req, res) => {
//   try {
//     const id = req.userId;
//     const { budId, commentId, action, reportDescription } = req.body;

//     let buddy = await BuddysModel.find({ _id: id });
//     if (buddy) {
//       let comment = await commentsModel.findOne({ _id: commentId });
//       if (comment) {
//         if (action === "create") {
//           let result = new commentReportModel({
//             budId: budId,
//             commentId: commentId,
//             reportedBy: [
//               {
//                 reportedUserId: id,
//                 reportDescription: reportDescription,
//               },
//             ],
//             $inc: { noOfReports: 1 },
//           });
//           await result.save();
//           await budsModel.findOneAndUpdate(
//             { _id: budId },
//             { isVerified: true }
//           );
//           res.status(201).send({ message: "Reported Successfully", result });
//         } else if (action === "read") {
//           let result = await commentReportModel.findOne({
//             $or: [{ budId: budId }, { commentId: commentId }],
//           });
//           res.status(200).send({ message: "Comment Reported List", result });
//         } else if (action === "update") {
//           let result = await commentReportModel.findOneAndUpdate(
//             { _id: commentId },
//             { isVerified: false }
//           );
//           res
//             .status(200)
//             .send({ message: "Report Updated Successfully", result });
//         } else {
//           res.status(400).json({ message: "Action Does Not Exist" });
//         }
//       } else {
//         res.status(400).json({ message: "Comment Does Not Exist" });
//       }
//     } else {
//       res.status(400).json({ message: "User Does Not Exist" });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// });
