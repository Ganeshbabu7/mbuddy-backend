const { eventModel } = require("../schema/eventsSchema");
const { communityModel } = require("../schema/communitySchema");
const {
  buddyWithFollowStatus,
  buddyPromisesFunction,
} = require("./buddyFunctions");
const {
  personalDetailsModel,
  educationDetailsModel,
  experienceDetailsModel,
  buddyFollowerDetailsModel,
} = require("../schema/buddysSchema");

const suggestionFunction = async (search, model, id) => {
  const idMine = id;
  const promises = search.map(async (search) => {
    const userId = await model.find(
      { institutionName: { $regex: search, $options: "i" } },
      { userId: 1, institutionName: 1 }
    );
    return userId;
  });
  const userList = await Promise.all(promises);
  const userId = userList.flat();

  // User Details List :
  const userDetailPromises = userId.map(async (id) => {
    if (idMine !== id) {
      const userDetail = await buddyWithFollowStatus(idMine, id.userId);
      return userDetail;
    }
  });
  const buddyDetail = await Promise.all(userDetailPromises);

  // Following  Buddys List :
  const followingFunction = async (id) => {
    let following = await buddyFollowerDetailsModel.distinct("userId", {
      $and: [{ followId: id }, { status: "Accepted" }],
    });
    return following;
  };
  const followingId = await followingFunction(id);

  // Suggestion Buddy Details :
  const suggestedBuddys = buddyDetail.filter((buddys) => {
    const isAlreadyFollowing = followingId.some(
      (id) => id.toString() === buddys._id.toString()
    );
    return !isAlreadyFollowing;
  });
  return suggestedBuddys;
};

const discoverSuggestion = {
  buddySuggestion: async (id) => {
    const educationDetail = await educationDetailsModel.distinct(
      "institutionName",
      { userId: id }
    );
    // const experienceDetail = await experienceDetailsModel.distinct(
    //   "companyName",
    //   { userId: id }
    // );

    const result = await suggestionFunction(
      educationDetail,
      educationDetailsModel,
      id
    );
    return result;
  },
  communitySuggestion: async (id) => {
    try {
      const community = await communityModel
        .find(
          { buddysList: { $nin: [id] }, status: "Approved" },
          {
            communityName: 1,
            selectCategory: 1,
            profilePic: 1,
            coverPic: 1,
            buddysList: 1,
          }
        )
        .sort({ createdAt: -1 })
        .limit(50);

      const buddyPromises = community.map(async (e) => {
        const buddyList = e.buddysList;
        let buddyDetail = [];
        if (buddyList && buddyList.length > 0) {
          const buddyPromises = buddyList.map((otherUserId) =>
            buddyWithFollowStatus(id, otherUserId)
          );
          buddyDetail = await Promise.all(buddyPromises);
        } else buddyDetail = [];
        return {
          ...e.toObject(),
          buddyDetail,
        };
      });

      const result = await Promise.all(buddyPromises);
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  eventSuggestion: async (id) => {
    const buddyLocation = await personalDetailsModel.distinct("district", {
      userId: id,
    });
    const communityId = await communityModel.find(
      {
        buddyList: { $in: [id] },
        status: "Approved",
      },
      { _id: 1 }
    );
    const idArray = communityId.map((item) => item._id.toString());
    const event = await eventModel
      .find(
        {
          $or: [
            { communityId: { $in: idArray } },
            {
              eventLocationTitle: {
                $regex: new RegExp(`\\b${buddyLocation[0]}\\b`, "i"),
              },
            },
          ],
        },
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
      )
      .sort({ createdAt: -1 })
      .limit(50);
    return event;
  },
};

module.exports = { discoverSuggestion };
