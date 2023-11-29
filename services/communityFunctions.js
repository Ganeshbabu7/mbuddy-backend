const { BuddysModel } = require("../schema/loginSchema");
const {
  Counter,
  teamsModel,
  LastMemberId,
  subTeamsModel,
  communityModel,
  buddyJoinedModel,
  communityIDModel,
  joinRequestModel,
  joinTeamRequestModel,
  joinSubTeamRequestModel,
} = require("../schema/communitySchema");
const { buddyDetails } = require("./buddyFunctions");
const { budsModel } = require("../schema/budsSchema");
const { eventModel } = require("../schema/eventsSchema");
const { createMessageModel } = require("../schema/chatSchema");

// Board Function :
const boardFunction = async (res, boardsList) => {
  try {
    const budDetails = boardsList.map(async (e) => {
      let buds = await budsModel.findOne({ _id: e.budId });
      let result = { ...e.toObject(), buds };
      return result;
    });
    const result = await Promise.all(budDetails);
    const resultLength = result.length;
    res.status(200).send({ message: `Board List`, resultLength, result });
  } catch (error) {
    console.log(error);
  }
};

// QR Code Generation Function :
const qrCodeGeneration = async () => {
  const length = 8;
  const characters =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let qrCode = "";
  for (let i = 0; i < length; i++) {
    qrCode += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return qrCode;
};

// ID Card Function :
const idCardFunction = async (communityId, userId, type, res) => {
  try {
    // Find the community and Buddy details:
    const communityDetails = await communityModel.findOne({ _id: communityId });
    let buddyDetail;
    if (type == "create") {
      buddyDetail = await buddyDetails(communityDetails.userId);
    } else if (type == "join") {
      buddyDetail = await buddyDetails(userId);
    }

    // If community exists, update member ID
    if (communityDetails) {
      let lastAssigned = await LastMemberId.findOne({
        communityId: communityId,
      });

      // If no lastAssigned document, create one
      if (!lastAssigned) {
        lastAssigned = new LastMemberId({ communityId: communityId });
      }

      // Increment last member ID and update
      const newLastMemberId = lastAssigned.lastMemberId + 1;
      lastAssigned.lastMemberId = newLastMemberId;
      await lastAssigned.save();

      // Create and save ID card
      const createIdCard = new communityIDModel({
        userId: type == "create" ? communityDetails.userId : buddyDetail._id,
        communityId: communityId,
        communityName: communityDetails.communityName,
        memberName: buddyDetail.fullName,
        positionName:
          type == "create"
            ? "Admin"
            : communityDetails.admins.includes(userId)
            ? "Admin"
            : "Member",
        location: `${buddyDetail.district}, ${buddyDetail.state}, ${buddyDetail.country}`,
        userProfilePic: buddyDetail.profilePic,
        communityProfilePic: communityDetails.profilePic,
        memberId: newLastMemberId.toString().padStart(4, "0"),
        qrCode: await qrCodeGeneration(),
      });

      await createIdCard.save();
    } else {
      // New community, start member ID from 555
      const counter = await Counter.findByIdAndUpdate(
        "community_member_counter",
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const memberId = Math.max(555, counter.seq); // Ensure it's at least 555
      const createIdCard = new communityIDModel({
        userId: communityDetails.userId,
        communityId: communityId,
        communityName: communityDetails.communityName,
        memberName: buddyDetail.fullName,
        positionName: "Admin",
        location: `${buddyDetail.district}, ${buddyDetail.state}, ${buddyDetail.country}`,
        userProfilePic: buddyDetail.profilePic,
        communityProfilePic: communityDetails.profilePic,
        memberId: memberId.toString().padStart(4, "0"),
      });

      await createIdCard.save();
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
};

// Approve or Public Join Function :
const publicJoinFunction = async (
  reqType,
  communityId,
  teamId,
  subTeamId,
  userId
) => {
  // Community Admin Finding :
  let communityAdmin = await communityModel.distinct("userId", {
    _id: communityId,
  });

  // Community Buddy List Update :
  let result;
  if (reqType == "community") {
    result = await communityModel.findOneAndUpdate(
      { _id: communityId, buddysList: { $nin: [userId] } },
      {
        $addToSet: { buddysList: userId },
      }
    );
  } else if (reqType == "teams") {
    result = await teamsModel.findOneAndUpdate(
      {
        _id: teamId,
        communityId: communityId,
      },
      {
        $addToSet: { buddysList: userId },
      }
    );
  } else if (reqType == "subTeams") {
    result = await subTeamsModel.findOneAndUpdate(
      {
        _id: subTeamId,
        teamId: teamId,
      },
      {
        $addToSet: { buddysList: userId },
      }
    );
  }

  // Id Card Function :
  if (reqType == "community") {
    let idCardCheck = await communityIDModel.findOne({
      userId: userId,
      communityId: communityId,
    });
    if (!idCardCheck) {
      await idCardFunction(communityId, userId, "join");
    }
  }

  // Add UserId in to Chat:
  if (reqType == "community" && communityId) {
    const chat = await createMessageModel.findOneAndUpdate(
      { communityId: communityId },
      { $addToSet: { users: userId } },
      { new: true }
    );
  } else if (reqType == "teams" && teamId) {
    const chat = await createMessageModel.findOneAndUpdate(
      { teamId: teamId },
      { $addToSet: { users: userId } },
      { new: true }
    );
  } else if (reqType == "subTeams" && subTeamId) {
    const chat = await createMessageModel.findOneAndUpdate(
      { subTeamId: subTeamId },
      { $addToSet: { users: userId } },
      { new: true }
    );
  }

  // Join Community List Update :
  const buddyCheck = await buddyJoinedModel.findOne({
    userId: userId,
  });
  if (buddyCheck) {
    const communityCheck = await buddyJoinedModel.findOne({
      userId: userId,
      "details.communityId": communityId,
    });

    const teamsCheck = await buddyJoinedModel.findOne({
      userId: userId,
      "details.communityId": communityId,
      "details.teamDetails": {
        $elemMatch: {
          teamId: teamId,
        },
      },
    });

    if (communityCheck && reqType == "teams") {
      const teamDetail = {
        teamId: teamId,
        subTeamId: [],
      };
      const update = await buddyJoinedModel.findOneAndUpdate(
        {
          userId: userId,
          "details.communityId": communityId,
        },
        {
          $addToSet: {
            "details.$[communityElem].teamDetails": teamDetail,
          },
        },
        {
          arrayFilters: [{ "communityElem.communityId": communityId }],
          new: true,
        }
      );
    } else if (teamsCheck && reqType == "subTeams") {
      const update = await buddyJoinedModel.findOneAndUpdate(
        {
          userId: userId,
          "details.communityId": communityId,
          details: {
            $elemMatch: {
              "teamDetails.teamId": teamId,
            },
          },
        },
        {
          $addToSet: {
            "details.$[communityElem].teamDetails.$[teamElem].subTeamId":
              subTeamId,
          },
        },
        {
          arrayFilters: [
            { "communityElem.communityId": communityId },
            { "teamElem.teamId": teamId },
          ],
          new: true,
        }
      );
    } else {
      await buddyJoinedModel.findOneAndUpdate(
        { userId: userId },
        {
          $addToSet: {
            details: {
              communityId: communityId,
              teamDetails: [],
            },
          },
        },
        { new: true }
      );
    }
  } else {
    try {
      const newDocument = new buddyJoinedModel({
        userId: userId,
        details: [
          {
            communityId: communityId,
            teamDetails: [
              // {
              //   teamId: "",
              //   subTeamId: [],
              // },
            ],
          },
        ],
      });
      await newDocument.save();
    } catch (error) {
      console.log(error);
    }
  }
  return result;
};

// Detail Function :
const detailFunction = async (reqType, communityId, teamId, subTeamId, res) => {
  let communityDetails;
  let teamDetails;
  let subTeamDetails;

  if (reqType == "community") {
    communityDetails = await communityModel.findOne({
      _id: communityId,
    });
  } else if (reqType == "teams") {
    teamDetails = await teamsModel.findOne({
      _id: teamId,
      // admins: { $in: [id] },
    });
  } else if (reqType == "subTeams") {
    subTeamDetails = await subTeamsModel.findOne({
      _id: subTeamId,
      // admins: { $in: [id] },
    });
  } else res.status(400).send({ message: "Request Type Not Exist" });
  return { communityDetails, teamDetails, subTeamDetails };
};

// Request Function :
const requestFunction = async (req, res, model) => {
  try {
    const id = req.userId;
    const { skip, reqType, action, userId, teamId, subTeamId, communityId } =
      req.body;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      const details = await detailFunction(
        reqType,
        communityId,
        teamId,
        subTeamId,
        res
      );
      if (action == "joinRequest") {
        let checkPrivacy;
        if (reqType == "community") {
          checkPrivacy =
            details.communityDetails.communityGuidelines.privacy.toLowerCase();
        } else if (reqType == "teams") {
          checkPrivacy = details.teamDetails.joinPrivacy.toLowerCase();
        } else if (reqType == "subTeams") {
          checkPrivacy = details.subTeamDetails.joinPrivacy.toLowerCase();
        } else
          res.status(400).send({ message: "Community Privacy hasn't defined" });

        if (checkPrivacy == "public") {
          const result = await publicJoinFunction(
            reqType,
            communityId,
            teamId,
            subTeamId,
            id
          );
          if (reqType == "community") {
            res.status(200).send({ message: "Joined Community Successfully" });
          } else if (reqType == "teams") {
            res.status(200).send({ message: "Joined Teams Successfully" });
          } else if (reqType == "subTeams") {
            res.status(200).send({ message: "Joined SubTeams Successfully" });
          }
        } else if (checkPrivacy == "private") {
          console.log(model);
          const result = new model({
            communityId: communityId,
            teamId: teamId,
            subTeamId: subTeamId,
            buddysList: {
              userId: id,
            },
          });
          await result.save();
          return res
            .status(201)
            .send({ message: "Request Sent Successfully", result });
        } else
          res.status(400).send({ message: "Community Privacy hasn't defined" });
      } else if (action == "readJoinRequest") {
        let reqList = await model
          .find(
            {
              communityId: communityId,
              teamId: teamId,
              subTeamId: subTeamId,
              "buddysList.userStatus": "Request Sent",
            },
            { "buddysList.userId": 1 }
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(50);
        const buddyPromises = reqList.map(async (e) => {
          const buddy = await buddyDetails(e.buddysList.userId);
          const result = { ...e.toObject(), buddyDetails: buddy };
          return result;
        });
        const result = await Promise.all(buddyPromises);
        res.status(200).send({ message: "Request List", result });
      } else if (action == "approve") {
        try {
          let check;
          if (reqType == "community") {
            check = details.communityDetails.admins.includes(id);
          } else if (reqType == "teams") {
            check = details.teamDetails.admins.includes(id);
          } else if (reqType == "subTeams") {
            check = details.subTeamDetails.admins.includes(id);
          }

          // if (
          //   details.communityDetails.admins.includes(id) ||
          //   details.teamDetails.admins.includes(id) ||
          //   details.subTeamDetails.admins.includes(id)
          // )
          if (check) {
            // Community Join Request List Update :
            const result = await model.findOneAndUpdate(
              {
                $and: [
                  {
                    communityId: communityId,
                    teamId: teamId,
                    subTeamId: subTeamId,
                    "buddysList.userId": userId,
                    "buddysList.userStatus": "Request Sent",
                  },
                ],
              },
              { $set: { "buddysList.userStatus": "Approved" } },
              { new: true }
            );
            await publicJoinFunction(
              reqType,
              communityId,
              teamId,
              subTeamId,
              userId
            );
            res.status(200).send({
              message: "Request Approved Successfully",
              result,
            });
          } else res.status(400).send({ message: "Only Admins can Approve" });
        } catch (error) {
          console.log(error);
          res.status(500).send({ message: "Internal Server Error" });
        }
      } else if (action == "reject") {
        if (
          details.communityDetails.admins.includes(id) ||
          details.teamDetails.admins.includes(id) ||
          details.subTeamDetails.admins.includes(id)
        ) {
          let result = await model.findOneAndUpdate(
            {
              $and: [
                {
                  communityId: communityId,
                  teamId: teamId,
                  subTeamId: subTeamId,
                  "buddysList.userId": userId,
                  "buddysList.userId": "Request Sent",
                },
              ],
            },
            { $set: { "buddysList.userId": "Rejected" } },
            { new: true }
          );
          res
            .status(200)
            .send({ message: "Request Rejected Successfully", result });
        } else res.status(400).send({ message: "Only Admins can Approve" });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
  }
};

// Make Admin or Remove Admin Function :
const adminFunction = async (req, res, model, teamId) => {
  try {
    const id = req.userId;
    const { action, userId } = req.body;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "addAdmin") {
        let check = await model.findOne({ _id: teamId });
        if (check) {
          let result = await model.findOneAndUpdate(
            { _id: teamId },
            { $addToSet: { admins: { $each: userId } } },
            { new: true }
          );
          res.status(201).send({ message: "Admin added Successfully", result });
        } else res.status(400).send({ message: "Team Does Not Exist" });
      } else if (action == "removeAdmin") {
        let result = await model.findOneAndUpdate(
          { _id: teamId },
          { $pull: { admins: { $in: userId } } },
          { new: true }
        );
        res.status(201).send({ message: "Admin Removed Successfully", result });
      } else if (action == "adminList") {
        let result = await model.distinct("admins", { _id: teamId });
        res.status(201).send({ message: "Admin List", result });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
  }
};

// Block Buddy or Unblock Buddy :
const blockFunction = async (req, res, model, teamId) => {
  try {
    const id = req.userId;
    const { action, userId } = req.body;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "block") {
        let check = await model.findOne({ _id: teamId });
        if (check) {
          const result = await model.findOneAndUpdate(
            { _id: teamId, "blockedBuddysList.userId": { $ne: userId } },
            { $addToSet: { blockedBuddysList: { userId: userId } } },
            { new: true }
          );
          res
            .status(201)
            .send({ message: "Buddy Blocked Successfully", result });
        } else res.status(400).send({ message: "Team Does Not Exist" });
      } else if (action == "unBlock") {
        const result = await model.findOneAndUpdate(
          { _id: teamId },
          { $pull: { blockedBuddysList: { userId: userId } } },
          { new: true }
        );
        res
          .status(201)
          .send({ message: "Buddy Unblocked Successfully", result });
      } else if (action == "blockList") {
        const blockList = await model.distinct("blockedBuddysList", {
          _id: teamId,
        });
        const buddyPromises = blockList.map(async (e) => {
          const buddy = await buddyDetails(e.userId);
          const result = { ...e, buddyDetails: buddy };
          return result;
        });
        const result = await Promise.all(buddyPromises);
        res.status(201).send({ message: "Blocked Users List", result });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
  }
};

// Leave Function :
const leaveFunction = async (res, id, model, teamId, action) => {
  try {
    const checkOwner = await model.distinct("userId", { _id: teamId });
    if (id !== checkOwner[0]) {
      const buddyCheck = await model.findOne({ _id: teamId });
      if (
        buddyCheck.buddysList.includes(id) ||
        buddyCheck.admins.includes(id)
      ) {
        const result = await model.findOneAndUpdate(
          { _id: teamId },
          { $pull: { admins: id, buddysList: id } }
        );

        // Remove user from Joined Community or Teams :
        // else if (action == "teams") {
        //   const chat = await buddyJoinedModel.findOneAndUpdate(
        //     { userId: id },
        //     { $pull: { "details.communityId.teamDetails.teamId": teamId } },
        //     { new: true }
        //   );
        // } else if (action == "subTeams") {
        //   const chat = await buddyJoinedModel.findOneAndUpdate(
        //     { userId: teamId },
        //     {
        //       $pull: {
        //         "details.communityId.teamDetails.subTeamId": { $in: [teamId] },
        //       },
        //     },
        //     { new: true }
        //   );
        // }

        // Remove user from group chat :
        if (action == "community") {
          const remove = await buddyJoinedModel.findOneAndUpdate(
            { userId: id },
            { $pull: { details: { communityId: teamId } } },
            { new: true }
          );
          const chat = await createMessageModel.findOneAndUpdate(
            { communityId: teamId },
            { $pull: { users: id } },
            { new: true }
          );
        } else if (action == "teams") {
          const chat = await createMessageModel.findOneAndUpdate(
            { teamId: teamId },
            { $pull: { users: id } },
            { new: true }
          );
        } else if (action == "subTeams") {
          const chat = await createMessageModel.findOneAndUpdate(
            { subTeamId: teamId },
            { $pull: { users: id } },
            { new: true }
          );
        }

        // if (action == "community"){
        //   const teamsList = await teamsModel.distinct({})
        // }
        res.status(200).send({ message: "Leaved Successfully", result });
      } else
        res
          .status(400)
          .send({ message: "You are not belongs to that community or team" });
    } else
      res.status(400).send({ message: "Owner Cannot Leave the Community" });
  } catch (error) {
    console.log(error);
  }
};

// Teams & Sub-Teams Function :
const communityCount = {
  communityCountFunction: async (res, communityId) => {
    try {
      let budsCount = await budsModel.countDocuments({
        communityId: communityId,
      });
      let requestCount = await joinRequestModel.countDocuments({
        communityId: communityId,
      });
      let buddyCount = await communityModel.findOne({ _id: communityId });
      let buddysCount = buddyCount.buddysList.length;
      let teamsCount = await teamsModel.countDocuments({
        communityId: communityId,
      });
      let eventList = await eventModel.countDocuments({
        communityId: communityId,
      });
      const result = {
        budsCount,
        buddysCount,
        requestCount,
        teamsCount,
        eventList,
      };
      res.status(200).send({ message: "Community Count Details List", result });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Internal Server Error" });
    }
  },
  teamsCountFunction: async (res, communityId, teamId) => {
    try {
      let budsCount = await budsModel.countDocuments({
        communityId: communityId,
        teamId: teamId,
      });
      let requestCount = await joinTeamRequestModel.countDocuments({
        communityId: communityId,
        teamId: teamId,
      });
      let buddyCount = await teamsModel.findOne({
        _id: teamId,
        communityId: communityId,
      });
      let buddysCount = buddyCount.buddysList.length;
      let subTeamsCount = await subTeamsModel.countDocuments({
        teamId: teamId,
      });
      let eventList = await eventModel.countDocuments({
        teamId: teamId,
      });
      const result = {
        budsCount,
        buddysCount,
        requestCount,
        subTeamsCount,
        eventList,
      };
      res.status(200).send({ message: "Community Count Details List", result });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Internal Server Error" });
    }
  },
  subTeamsCountFunction: async (res, teamId, subTeamId) => {
    try {
      let budsCount = await budsModel.countDocuments({
        teamId: teamId,
        subTeamId: subTeamId,
      });
      let requestCount = await joinSubTeamRequestModel.countDocuments({
        teamId: teamId,
        subTeamId: subTeamId,
      });
      let buddyCount = await subTeamsModel.findOne({
        _id: subTeamId,
        teamId: teamId,
      });
      let buddysCount = buddyCount.buddysList.length;
      let eventList = await eventModel.countDocuments({
        teamId: teamId,
        subTeamId: subTeamId,
      });
      const result = {
        budsCount,
        buddysCount,
        requestCount,
        eventList,
      };
      res.status(200).send({ message: "Community Count Details List", result });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Internal Server Error" });
    }
  },
};

// Chat Creation for Community, Teams & Sub-Teams
const communityChatFunction = async ({ id, name, pic, result }) => {
  try {
    await new createMessageModel({
      users: [id],
      messageType: "group",
      groupName: name,
      groupProfilePic: pic,
      communityId: result._id,
    }).save();
  } catch (error) {
    console.error("Error creating createMessageModel:", error);
  }
};

// Community Category Function :
const categoryFunction = async () => {};

module.exports = {
  boardFunction,
  leaveFunction,
  idCardFunction,
  adminFunction,
  blockFunction,
  communityCount,
  requestFunction,
  qrCodeGeneration,
  communityChatFunction,
};
