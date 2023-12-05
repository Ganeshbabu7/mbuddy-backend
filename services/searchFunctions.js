const {
  blockCheck,
  followList,
  buddyDetails,
  buddyWithFollowStatus,
  buddyPromisesFunction,
} = require("../services/buddyFunctions.js");
const { buddyFollowerDetailsModel } = require("../schema/buddysSchema");
const { budsModel, tagsModel } = require("../schema/budsSchema");
const {
  communityModel,
  teamsModel,
  subTeamsModel,
} = require("../schema/communitySchema");
const { eventModel } = require("../schema/eventsSchema");
const { BuddysModel } = require("../schema/loginSchema");
const { pipeline } = require("nodemailer/lib/xoauth2/index.js");
const {
  hideStoriesModel,
  shareStoriesModel,
  blockCommentersModel,
} = require("../schema/settingsSchema.js");

// Community Search Function :
const communityResultFunction = async (search, id, type) => {
  try {
    console.log(id);
    const pipeLine = [
      {
        $addFields: {
          isOwner: { $eq: [id, "$userId"] },
          // isAdmin: { $in: [id, "$admins"] },
          isJoined: { $in: [id, "$buddysList"] },
          buddysListCount: { $size: "$buddysList" },
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
          isAdmin: 1,
          isJoined: 1,
          buddysListCount: 1,
        },
      },
    ];
    if (type == "all") {
      pipeLine.unshift({
        $match: { communityName: { $in: [new RegExp(search, "i")] } },
      });
    } else if (type == "myCommunity") {
      pipeLine.unshift({
        $match: {
          communityName: { $in: [new RegExp(search, "i")] },
          userId: id,
        },
      });
    } else if (type == "joinedCommunity") {
      pipeLine.unshift({
        $match: {
          communityName: { $in: [new RegExp(search, "i")] },
          buddysList: { $in: [id] },
        },
      });
    } else {
      pipeLine.unshift({ $match: {} });
    }
    const result = await communityModel.aggregate(pipeLine);
    return result;
  } catch (error) {
    console.log(error);
  }
};

const searchFunction = {
  searchBuddys: async (search, id, skip) => {
    try {
      const buddys = await BuddysModel.find(
        { fullName: { $in: [new RegExp(search, "i")] } },
        { _id: 1, fullName: 1, isVerified: 1 }
      )
        .skip(skip)
        .limit(20);

      const buddyDetaisPromises = buddys.map(async (e) => {
        let checkWeatherMe = id == e._id;
        if (!checkWeatherMe) {
          const check = await blockCheck(e._id, id);
          if (!check.blockCheck && !check.userBlockedCheck) {
            const user = await buddyWithFollowStatus(id, e._id);
            return user;
          }
        }
      });

      const result = (await Promise.all(buddyDetaisPromises)).filter(
        (item) => item !== undefined
      );
      return result;
    } catch (error) {
      console.log(error);
    }
  },
  searchCommunityBuddys: async (search) => {
    try {
      const buddys = await BuddysModel.find(
        { fullName: { $in: [new RegExp(search, "i")] } },
        { _id: 1, fullName: 1, isVerified: 1 }
      );

      const buddyDetaisPromises = buddys.map(async (e) => {
        let checkWeatherMe = id == e._id;
        console.log(checkWeatherMe);
        if (!checkWeatherMe) {
          const check = await blockCheck(e._id, id);
          if (!check.blockCheck) {
            const user = await buddyDetails(e._id);
            const followStatus = await buddyFollowerDetailsModel
              .find({ $and: [{ userId: id }, { followId: e._id }] })
              .distinct("status");
            return {
              ...user,
              followStatus: followStatus ? followStatus[0] : "",
            };
          }
        }
      });

      const result = (await Promise.all(buddyDetaisPromises)).filter(
        (item) => item !== undefined
      );
      return result;
    } catch (error) {
      console.log(error);
    }
  },
  budsSearch: async (search) => {
    try {
      const result = await budsModel.find({
        "buddyDetails.fullName": { $in: [new RegExp(search, "i")] },
      });
      return result;
    } catch (error) {
      console.log(error);
    }
  },
  tagSearch: async (search) => {
    try {
      let buddyNameSearch = await tagsModel.distinct("userId", {
        tagName: { $in: [new RegExp(search, "i")] },
      });

      let resultPromises = buddyNameSearch.map(async (id) => {
        let budsSearch = await budsModel.find({ userId: id });

        let tagsFilter = budsSearch.map(async (e) => {
          let hashtags = [];
          let extractHashtags = (description) => {
            const regex = /#(\w+)/g;
            hashtags = description.match(regex) || [];
          };
          extractHashtags(e.description);

          let searchRegex = new RegExp(search, "i");
          let tagsCheck = hashtags.some((tag) => searchRegex.test(tag));
          return tagsCheck ? e._id : null;
        });
        let descriptionResult = await Promise.all(tagsFilter);
        let budIds = descriptionResult.filter((id) => id !== null);

        let budsList = budIds.map(async (id) => {
          const buds = await budsModel.findOne({ _id: id });
          return buds;
        });
        let result = await Promise.all(budsList);
        return result;
      });
      let result = await Promise.all(resultPromises);
      let finalResult = result.flat();
      return finalResult;
    } catch (error) {
      console.log(error);
    }
  },
  tagsList: async (search) => {
    try {
      let result = await tagsModel.find({
        tagName: { $in: [new RegExp(search, "i")] },
      });
      return result;
    } catch (error) {
      console.log(error);
    }
  },
  communitySearch: async (search, id) => {
    try {
      const result = await communityResultFunction(search, id, "all");
      return result;
    } catch (error) {
      console.log(error);
    }
  },
  myCommunitySearch: async (search, id, type) => {
    try {
      let result;
      if (type == "myCommunity") {
        result = await communityResultFunction(search, id, "myCommunity");
      } else if (type == "joinedCommunity") {
        result = await communityResultFunction(search, id, "joinedCommunity");
      }
      return result;
    } catch (error) {
      console.log(error);
    }
  },
  teamSearch: async (id, search, communityId) => {
    try {
      let result = await teamsModel.aggregate([
        {
          $match: {
            teamName: { $in: [new RegExp(search, "i")] },
            communityId: communityId,
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
          },
        },
      ]);
      return result;
    } catch (error) {
      console.log(error);
    }
  },
  subTeamSearch: async (id, search, teamId) => {
    try {
      let result = await subTeamsModel.aggregate([
        {
          $match: {
            teamName: { $in: [new RegExp(search, "i")] },
            teamId: teamId,
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
        {
          $project: {
            _id: 1,
            subTeamName: 1,
            teamDescription: 1,
            teamPic: 1,
            shortCode: 1,
            buddysList: 1,
            buddysListCount: 1,
            joinPrivacy: 1,
            isOwner: 1,
            isAdmin: 1,
            isJoined: 1,
          },
        },
      ]);
      return result;
    } catch (error) {
      console.log(error);
    }
  },
  eventSearch: async (search) => {
    try {
      const result = await eventModel.find(
        { eventName: { $in: [new RegExp(search, "i")] } },
        {
          _id: 1,
          eventName: 1,
          eventCategory: 1,
          eventStatus: 1,
          coverPic: 1,
          startDate: 1,
          startTime: 1,
          endDate: 1,
          endTime: 1,
          eventLocationTitle: 1,
          eventLocationDetails: 1,
        }
      );
      return result;
    } catch (error) {
      console.log(error);
    }
  },
};

const buddySearchListFunction = async (req, res, model, teamId, search) => {
  try {
    const buddys = await model.distinct("buddysList", {
      _id: teamId,
    });
    const buddyPromise = buddys.map(async (id) => buddyDetails(id));
    const buddysList = await Promise.all(buddyPromise);
    const list = [];
    const finalBuddysList = buddysList.map((e) => {
      const idMine = req.userId;
      if (idMine != e._id.toString() && e.fullName.includes(search)) {
        list.push(e);
      }
    });
    const result = await buddyPromisesFunction(req, list);
    return result;
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const buddysSearchFunction = {
  verifiedBuddysSearch: async (req, res, search) => {
    try {
      const id = req.userId;
      const buddys = await BuddysModel.find({
        _id: { $ne: id },
        fullName: { $in: [new RegExp(search, "i")] },
        isVerified: true,
      });
      const result = await buddyPromisesFunction(req, buddys);
      return result;
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Internal Server Error" });
    }
  },
  communityBuddysSearch: async (req, res, model, teamId, search) => {
    let result = buddySearchListFunction(req, res, model, teamId, search);
    return result;
  },
};

const buddyListFunction = async (req, res) => {
  try {
    const id = req.userId;
    const { action, search, skip } = req.body;
    if (action == "blockCommenterBuddys") {
      const blockedCommenters = await blockCommentersModel.findOne({
        userId: id,
      });
      const buddysList = await searchFunction.searchBuddys(search, id, skip);
      const result = buddysList.filter((buddy) => {
        return !blockedCommenters.blockedUserId.includes(buddy._id);
      });
      const resultLength = result.length;
      res
        .status(200)
        .send({ message: "Block Commenters Buddy List", resultLength, result });
    } else if (action == "storyBuddys") {
      const hideStoryBuddys = await hideStoriesModel.findOne({ userId: id });
      const showStoryBuddys = await shareStoriesModel.findOne({ userId: id });
      const followBuddysList = await followList(id);

      const buddyList = followBuddysList.filter((buddy) => {
        return (
          !showStoryBuddys.shareUserId.includes(buddy) &&
          !hideStoryBuddys.hideUserId.includes(buddy)
        );
      });
      const result = await Promise.all(
        buddyList.map(async (e) => {
          return await buddyWithFollowStatus(id, e);
        })
      );
      const resultLength = result.length;
      res
        .status(200)
        .send({ message: "Story Buddy List", resultLength, result });
    } else res.status(400).send({ message: "Action Does Not Exists" });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { searchFunction, buddysSearchFunction, buddyListFunction };

// Reference Query :
// const result = await communityModel.aggregate([
//   {
//     $match: { _id: commmunityId } // Match the specified community
//   },
//   {
//     $lookup: {
//       from: "BuddysModel",
//       localField: "buddysList",
//       foreignField: "_id",
//       as: "buddysDetails" // Fetch details for buddies in the community
//     }
//   },
//   {
//     $unwind: "$buddysDetails" // Unwind the array to work with individual buddies
//   },
//   {
//     $match: {
//       "buddysDetails.fullName": { $regex: new RegExp(search, "i") } // Filter by fullName
//     }
//   },
//   {
//     $group: {
//       _id: null,
//       finalBuddysList: { $push: "$buddysDetails" } // Reconstruct the filtered list
//     }
//   },
//   {
//     $project: {
//       _id: 0,
//       finalBuddysList: 1
//     }
//   }
// ])
// return result[0]?.finalBuddysList || [];
// return finalBuddysList;

// ____________________________________________________________________________________________

// // else if (action == "categoryFilter") {
//   let result = await communityModel
//     .find(
//       {
//         $and: [{ status: "Approved" }, { selectCategory: category }],
//       },
//       {
//         _id: 1,
//         communityName: 1,
//         selectCategory: 1,
//         selectSubCategory: 1,
//         profilePic: 1,
//         coverPic: 1,
//       }
//     )
//     .sort({ createdAt: -1 })
//     // .skip(skip)
//     // .limit(10);
//   res.status(200).send({ message: "Community Category List", result });
// // } else res.status(400).send({ message: "Action Does Not Exist" });
// // }

// let title = await titleModel.findOne()
// if (search) {
//   if (search.includes("@")) {
//     // Search by email
//     result = await BuddysModel.find({ "buddyDetails.emailId": { $regex: search, $options: "i" } });
//   } else if (/^\d+$/.test(search)) {
//     // Search by mobNo
//     result = await BuddysModel.find({ "buddyDetails.mobNo": { $regex: search, $options: "i" } });
//   } else {
//     // Search by fullName
//     result = await BuddysModel.find({ "buddyDetails.fullName": { $regex: search, $options: "i" } });
//   }
// }
// $or: [
// { fullName: { $in: [new RegExp(search, "i")] } },
// { email: { $in: [new RegExp(search, "i")] } },
// { mobNo: { $in: [new RegExp(search, "i")] } }
// ]
// let resultLength = result.length;
// res
//   .status(200)
//   .send({ message: "Buddy Search List", resultLength, result });
