const {
  budNotifications,
  pushNotification,
} = require("./notificationFunctions");
const {
  buddyDetails,
  followingList,
  followersList,
} = require("./buddyFunctions");
const {
  budsModel,
  pollModel,
  imageModel,
  videoModel,
  resultModel,
  commentsModel,
  locationModel,
  documentModel,
} = require("../schema/budsSchema");
const {
  teamsModel,
  communityModel,
  subTeamsModel,
} = require("../schema/communitySchema");

// Read Bud Common Functions :
const getBudDetails = async (bud, id) => {
  try {
    let isComment;
    let docDetails;
    let pollDetails;
    let buddyDetail;
    let imageDetails;
    let videoDetails;
    let locationDetails;
    let tagBuddysDetails;

    if (bud.budOwner) {
      buddyDetail = await buddyDetails(bud.budOwner);
    }

    if (bud.pollsId) {
      let updateAnswer;
      if (id) {
        updateAnswer = await resultModel.findOne({
          userId: id,
          pollId: bud.pollsId,
        });
      }

      let poll = await pollModel.findOne({ _id: bud.pollsId });
      if (id) {
        pollDetails = {
          ...poll.toObject(),
          isAnswered: updateAnswer ? updateAnswer.optionId : null,
        };
      } else pollDetails = poll;
    }

    if (bud.locationId) {
      locationDetails = await locationModel
        .find({ _id: bud.locationId })
        .sort({ createdAt: -1 });
    }

    if (bud.imageId.length > 0) {
      let imageDetail = [];
      let imgId = bud.imageId;
      for (const id of imgId) {
        const details = await imageModel
          .find({ _id: id })
          .sort({ createdAt: -1 });
        imageDetail.push(...details);
      }
      imageDetails = imageDetail;
    } else {
      imageDetails = null;
    }

    if (bud.videoId) {
      videoDetails = await videoModel
        .find({ _id: bud.videoId })
        .sort({ createdAt: -1 });
    }

    if (bud.docId) {
      docDetails = await documentModel
        .find({ _id: bud.docId })
        .sort({ createdAt: -1 });
    }

    if (bud.tagBuddys.length > 0) {
      let tagsList = bud.tagBuddys;
      let tagBuddysDetailsPromises = tagsList.map((id) => buddyDetails(id));
      tagBuddysDetails = await Promise.all(tagBuddysDetailsPromises);
    } else {
      tagBuddysDetails = null;
    }

    isComment = await isCommentFunction(bud, id);

    bud.doc = docDetails;
    bud.polls = pollDetails;
    bud.image = imageDetails;
    bud.video = videoDetails;
    bud.isComment = isComment;
    bud.buddyDetails = buddyDetail;
    bud.location = locationDetails;
    bud.tagBuddysDetails = tagBuddysDetails;
    // bud.isHide = id ? bud.hideBy.includes(id) : false;
    bud.isSaved = id ? bud.savedBy.includes(id) : false;
    bud.isDelete = bud.userId == id || bud.budOwner == id ? true : false;
  } catch (error) {
    console.log(error);
  }
};

// Community Buds Read Function :
const communityBudsFunction = async (req, res) => {
  try {
    const id = req.userId;
    const { communityId, teamId, subTeamId, skip } = req.body;

    let result;
    if (communityId.length > 0 && teamId.length <= 0 && subTeamId.length <= 0) {
      let communityBudsPromises = communityId.map(async (id) => {
        try {
          let result = await budsModel
            .find({
              $and: [
                { communityId: id },
                { whoCanViewyourBud: "communityOnly" },
                { hideBy: { $nin: [id] } },
              ],
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(10);
          return result;
        } catch (error) {
          console.log(error);
        }
      });
      result = (await Promise.all(communityBudsPromises)).flat();
    } else if (
      communityId.length > 0 &&
      teamId.length > 0 &&
      subTeamId.length <= 0
    ) {
      result = await budsModel
        .find({
          $and: [
            { communityId: { $in: [communityId] } },
            { teamId: { $in: [teamId] } },
            { whoCanViewyourBud: "communityOnly" },
            { hideBy: { $nin: [id] } },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(10);
    } else if (teamId.length > 0 && subTeamId.length > 0) {
      result = await budsModel
        .find({
          $and: [
            { teamId: { $in: [teamId] } },
            { subTeamId: { $in: [subTeamId] } },
            { whoCanViewyourBud: "communityOnly" },
            { hideBy: { $nin: [id] } },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(10);
    }

    for (let i = 0; i < result.length; i++) {
      let bud = result[i];
      await getBudDetails(bud, id);
    }

    let budsLength = result.length;
    let finalResult = result;
    res.status(200).send({
      message: "Community Buds List",
      budsLength,
      result: finalResult,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

// Bud Comments Fuinction :
const budCommentsFunction = async (req, res, bud, buddy) => {
  try {
    const id = req.userId;
    const { budId, commentId } = req.body;
    const isCommunity =
      bud.communityId.length > 0 ||
      bud.teamId.length > 0 ||
      bud.subTeamId.length > 0;

    let result = new commentsModel(req.body);
    await result.save();

    let updatedBuds = await budsModel.findOneAndUpdate(
      { _id: budId },
      { $inc: { commentCount: 1 } },
      { new: true }
    );

    const notificationData = {
      // token: pushToken[0],
      userId: id,
      budId: budId,
      commentId: commentId,
      notificationType: "Comment",
      body: budNotifications.commentMessage(buddy.userName),
    };
    await pushNotification(
      isCommunity ? "community" : "none",
      notificationData
    );
    res.status(201).send({ message: "Bud Commented Successfully", result });
  } catch (error) {
    console.log(error);
  }
};

const isCommentFunction = async (bud, id) => {
  try {
    let isComment;
    // Block List :
    if (bud.whoCanComment == "anyOne") {
      isComment = true;
    } else if (bud.whoCanComment == "noOne") {
      isComment = false;
    } else if (bud.whoCanComment == "communityOnly") {
      let communityId = bud.communityId[0];
      let teamId = bud.teamId[0];
      let subTeamId = bud.subTeamId[0];
      const checkCommunity = await communityModel.findOne({
        _id: communityId,
        buddysList: { $in: [id] },
      });
      const checkTeams = await teamsModel.findOne({
        _id: teamId,
        buddysList: { $in: [id] },
      });
      const checkSubTeams = await subTeamsModel.findOne({
        _id: subTeamId,
        buddysList: { $in: [id] },
      });
      if (checkCommunity || checkTeams || checkSubTeams) {
        isComment = true;
      } else isComment = false;
    } else if (bud.whoCanComment == "buddyYouFollow") {
      let following = await followingList(bud.userId, id);
      let followingCheck = following.includes(id);
      if (followingCheck) isComment = true;
      else isComment = false;
    } else if (bud.whoCanComment == "yourFollowers") {
      let followers = await followersList(bud.userId, id);
      let followersCheck = followers.includes(id);
      if (followersCheck) isComment = true;
      else isComment = false;
    } else isComment = false;
    return isComment;
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getBudDetails,
  isCommentFunction,
  budCommentsFunction,
  communityBudsFunction,
};
