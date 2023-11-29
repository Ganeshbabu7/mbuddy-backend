const { BuddysModel } = require("../schema/loginSchema.js");
const { eventModel } = require("../schema/eventsSchema.js");
const { storyModel } = require("../schema/storiesSchema.js");
const { communityModel } = require("../schema/communitySchema.js");
const { budsModel, commentsModel } = require("../schema/budsSchema.js");
const {
  reportBudsModel,
  reportChatsModel,
  reportEventsModel,
  reportBuddysModel,
  reportStoriesModel,
  reportCommentsModel,
  reportCommunitiesModel,
} = require("../schema/reportsSchema.js");

const handleReport = async (
  req,
  res,
  itemType,
  keyWord,
  value,
  keyWord1,
  value1,
  keyWord2,
  value2,
  keyWord3,
  value3
) => {
  try {
    const id = req.userId;
    const {
      budId,
      teamId,
      action,
      storyId,
      eventId,
      subTeamId,
      commentId,
      reportType,
      communityId,
      otherUserId,
      reportDescription,
    } = req.body;

    let buddy = await BuddysModel.find({ _id: id });
    if (!buddy) {
      return res.status(400).json({ message: "User Does Not Exist" });
    }

    let item;
    if (itemType == "buddys") {
      item = await BuddysModel.findOne({ _id: otherUserId });
      if (!item) {
        return res.status(400).json({ message: "Buddy Does Not Exist" });
      }
    } else if (itemType === "buds") {
      item = await budsModel.findOne({ _id: budId });
      if (!item) {
        return res.status(400).json({ message: "Bud Does Not Exist" });
      }
    } else if (itemType === "comments") {
      item = await commentsModel.findOne({ _id: commentId });
      if (!item) {
        return res.status(400).json({ message: "Comment Does Not Exist" });
      }
    } else if (itemType === "stories") {
      item = await storyModel.findOne({ _id: storyId });
      if (!item) {
        return res.status(400).json({ message: "Stories Does Not Exist" });
      }
    } else if (itemType === "communities") {
      if (reportType == "community") {
        item = await communityModel.findOne({ _id: communityId });
        if (!item) {
          return res.status(400).json({ message: "Community Does Not Exist" });
        }
      } else if (reportType == "teams") {
        item = await communityModel.findOne({ _id: teamId });
        if (!item) {
          return res.status(400).json({ message: "Teams Does Not Exist" });
        }
      } else if (reportType == "subTeams") {
        item = await communityModel.findOne({ _id: subTeamId });
        if (!item) {
          return res.status(400).json({ message: "Sub Teams Does Not Exist" });
        }
      }
    } else if (itemType === "events") {
      item = await eventModel.findOne({ _id: eventId });
      if (!item) {
        return res.status(400).json({ message: "Event Does Not Exist" });
      }
    } else {
      return res.status(400).json({ message: "Invalid Item Type" });
    }

    const reportModel =
      itemType === "buddys"
        ? reportBuddysModel
        : itemType === "buds"
        ? reportBudsModel
        : itemType === "comments"
        ? reportCommentsModel
        : itemType === "stories"
        ? reportStoriesModel
        : itemType === "communities"
        ? reportCommunitiesModel
        : itemType === "events"
        ? reportEventsModel
        : "none";

    if (action === "create") {
      let data = {
        reportedBy: [
          {
            userId: id,
            reportDescription: reportDescription,
          },
        ],
        $inc: { noOfReports: 1 },
      };

      if (itemType == "comments") {
        data[keyWord] = value;
        data[keyWord1] = value1;
      } else if (itemType == "communities") {
        data[keyWord] = value;
        data[keyWord1] = value1;
        data[keyWord2] = value2;
        data[keyWord3] = value3;
      } else data[keyWord] = value;

      let result = new reportModel(data);
      await result.save();
      if (itemType === "buds") {
        await budsModel.findOneAndUpdate({ _id: budId }, { isReported: true });
      } else if (itemType == "comments") {
        await commentsModel.findOneAndUpdate(
          { _id: commentId },
          { isReported: true }
        );
      }
      res.status(201).send({ message: "Reported Successfully", result });
    } else if (action === "read") {
      result = await reportModel.findOne({
        $or:
          itemType === "buddys"
            ? [{ otherUserId: otherUserId }]
            : "buds"
            ? [{ budId: budId }]
            : "comments"
            ? [{ commentId: commentId }]
            : "stories"
            ? [{ storyId: storyId }]
            : "communities"
            ? [{ communityId: communityId }]
            : "events"
            ? [{ eventId: eventId }]
            : {},
      });
      return res
        .status(200)
        .send({ message: `${itemType} Reported List`, result });
    } else {
      return res.status(400).json({ message: "Action Does Not Exist" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { handleReport };

// Do Not Delete :
// else if (action === "update") {
//   result = await reportModel.findOneAndUpdate(
//     { _id: commentId },
//     { isVerified: false }
//   );
//   return res
//     .status(200)
//     .send({ message: "Report Updated Successfully", result });
// }
