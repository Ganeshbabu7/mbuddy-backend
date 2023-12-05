const { BuddysModel } = require("../schema/loginSchema");
const {
  profileImageModel,
  personalDetailsModel,
  buddyFollowerDetailsModel,
} = require("../schema/buddysSchema");
const { blockedAccountModel } = require("../schema/settingsSchema");

const buddyDetails = async (id) => {
  const buddyDetails = await BuddysModel.findOne(
    { _id: id },
    { fullName: 1, isVerified: 1 }
  );

  // if (!buddyDetails) {
  //   return res.status(400).send({ message: "Buddy details not found" });
  // }

  const pic = await profileImageModel
    .findOne({ userId: id })
    .sort({ createdAt: -1 });

  const title = await personalDetailsModel
    .findOne({ userId: id })
    .sort({ createdAt: -1 });

  const userName = await personalDetailsModel.distinct("userName", {
    userId: id,
  });

  const user = await BuddysModel.distinct("userName", { _id: id });

  const buddyWithPic = {
    ...buddyDetails.toObject(),
    userName: userName ? userName[0] : user[0],
    profilePic: pic ? pic.profilePic : null,
    title: title ? title.title : null,
    district: title ? title.district : null,
    state: title ? title.state : null,
    country: title ? title.country : null,
  };
  return buddyWithPic;
};

// Follower and Following Function :
const followerFollowingFunction = async (req, res, id) => {
  try {
    const { action } = req.body;
    req.body.userId = id;

    if (action == "followerList") {
      let followerIds = await buddyFollowerDetailsModel.distinct("followId", {
        userId: id,
        status: "Accepted",
      });
      let buddy = await BuddysModel.find(
        { _id: { $in: followerIds } },
        { _id: 1, fullName: 1 }
      );
      const resultPromises = buddy.map((e) => buddyDetails(e._id));
      const result = await Promise.all(resultPromises);
      res.status(200).send({ message: "Your Follower List", result });
    } else if (action == "followingList") {
      let followingIds = await buddyFollowerDetailsModel.distinct("userId", {
        followId: id,
        status: "Accepted",
      });
      let buddy = await BuddysModel.find(
        { _id: { $in: followingIds } },
        { _id: 1, fullName: 1 }
      );
      const resultPromises = buddy.map((e) => buddyDetails(e._id));
      const result = await Promise.all(resultPromises);
      res.status(200).send({ message: "Your Follower List", result });
    } else res.status(400).send({ message: "Action Does Not Exist", error });
  } catch (error) {
    console.log(error);
  }
};

// Follower and Following List :
const followList = async (id) => {
  const follower = await buddyFollowerDetailsModel
    .find({ $and: [{ userId: id }, { status: "Accepted" }] })
    .distinct("followId");
  const following = await buddyFollowerDetailsModel
    .find({ $and: [{ followId: id }, { status: "Accepted" }] })
    .distinct("userId");

  const mergedArray = follower.concat(following);
  const uniqueIds = [...new Set(mergedArray)];
  return uniqueIds;
};

// Followers List - For Buds:
const followersList = async (userId, id) => {
  const following = await buddyFollowerDetailsModel
    .findOne({
      $and: [{ userId: id }, { followId: userId }, { status: "Accepted" }],
    })
    .distinct("userId");

  const uniqueIds = [...new Set(following)];
  return uniqueIds;
};

// Following List - For Buds:
const followingList = async (userId, id) => {
  const following = await buddyFollowerDetailsModel
    .findOne({
      $and: [{ userId: userId }, { followId: id }, { status: "Accepted" }],
    })
    .distinct("userId");

  const uniqueIds = [...new Set(following)];
  return uniqueIds;
};

// Block Check - For Buds :
const blockCheck = async (userId, id) => {
  let blockCheck = await blockedAccountModel.findOne({
    userId: userId.toString(),
    "blockedUserDetails.blockedUserId": id,
  });
  let userBlockedCheck = await blockedAccountModel.findOne({
    userId: id,
    "blockedUserDetails.blockedUserId": userId,
  });
  return { blockCheck, userBlockedCheck };
};

// Buddy Details with Follow Status Function :
const buddyWithFollowStatus = async (id, otherUserId) => {
  const check = await blockCheck(otherUserId, id);
  if (!check.blockCheck) {
    const buddy = await buddyDetails(otherUserId);
    const followStatus = await buddyFollowerDetailsModel
      .find({ $and: [{ userId: id }, { followId: otherUserId }] })
      .distinct("status");
    return {
      ...buddy,
      followStatus: followStatus.length > 0 ? followStatus[0] : false,
    };
  }
};

// Buddy Details with Block Check, followStatus, with removing undefined and null values :
const buddyPromisesFunction = async (req, buddys) => {
  const resultPromises = buddys.map(async (id) => {
    const idMine = req.userId;
    const buddyDetails = await buddyWithFollowStatus(idMine, id._id);
    return buddyDetails;
  });
  const result = await Promise.all(resultPromises);
  const finalResult = result.filter((e) => e != undefined || null);
  return finalResult;
};

// Buddy Details with Block Check, followStatus, with removing undefined and null values (By ID):
const buddyIdPromisesFunction = async (req, buddyIds) => {
  const resultPromises = buddyIds.map(async (id) => {
    const idMine = req.userId;
    if (idMine !== id) {
      const buddyDetails = await buddyWithFollowStatus(idMine, id);
      return buddyDetails;
    }
  });
  const result = await Promise.all(resultPromises);
  const finalResult = result.filter((e) => e != undefined || null);
  return finalResult;
};

module.exports = {
  followList,
  blockCheck,
  buddyDetails,
  followersList,
  followingList,
  buddyWithFollowStatus,
  buddyPromisesFunction,
  buddyIdPromisesFunction,
  followerFollowingFunction,
};
