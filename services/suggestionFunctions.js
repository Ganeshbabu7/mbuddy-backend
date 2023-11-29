const { buddyWithFollowStatus } = require("./buddyFunctions");
const { buddyFollowerDetailsModel } = require("../schema/buddysSchema");
const { communityModel } = require("../schema/communitySchema");
const { eventModel } = require("../schema/eventsSchema");

// 1. Experience Buddys Suggestion Function :
const experienceSuggestion = async (search, model, id) => {
  const idMine = id;
  const promises = search.map(async (search) => {
    const userId = await model.find(
      { companyName: { $regex: search, $options: "i" } },
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

// 2. My-Community Category Function :
const myCommunityCategoryFunction = async (id) => {
  const communityCategory = await communityModel.distinct("selectCategory", {
    buddysList: { $in: [id] },
    status: { $in: ["Approved", "Request Sent"] },
  });
  return communityCategory;
};

// 3. Suggestion Community Function :
const suggestionCommunityFunction = async (suggestedBuddys, id) => {
  const communityPromises = suggestedBuddys.map(async (e) => {
    const community = await communityModel.distinct("selectCategory", {
      buddysList: { $in: e._id.toString() },
    });
    const communityPromises = community.map(async (category) => {
      const community = await communityModel.find(
        { selectCategory: category },
        {
          communityName: 1,
          selectCategory: 1,
          profilePic: 1,
          coverPic: 1,
          buddysList: 1,
        }
      );
      return community;
    });
    const result = await Promise.all(communityPromises);
    return result;
  });
  const suggestedCommunitiesList = await Promise.all(communityPromises);
  const flatSuggestedCommunity = suggestedCommunitiesList.flat();
  const communityCategory = await myCommunityCategoryFunction(id);

  // Checking Weather already Joined in Community :
  const suggestedCommunities = flatSuggestedCommunity.filter(
    (community) =>
      !communityCategory.some(
        (category) => category === community.selectCategory
      )
  );
  const result = suggestedCommunities.flat();
  return result;
};

// 4. Read My Events :
const myEventFunction = async (id) => {
  let result = await eventModel.aggregate([
    {
      $match: {
        $and: [
          // { eventName: { $in: [new RegExp(search, "i")] } },
          { userId: id },
          { isActive: true },
        ],
      },
    },
    {
      $addFields: {
        eventStatus: "My Events",
      },
    },
  ]);
};

// 5. Event Suggestion Function :
const suggestionEventFunction = async (suggestedBuddys, id) => {
  const communityPromises = suggestedBuddys.map(async (e) => {
    const suggestionEvents = await eventModel
      .find(
        {
          $and: [{ userId: id }, { isActive: true }],
        },
        {
          _id: 1,
          eventName: 1,
          eventCategory: 1,
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
      .limit(5);
    return suggestionEvents;
  });
  const suggestedEventsList = await Promise.all(communityPromises);
  const myEventsList = await myEventFunction(id);

  // Filter out undefined or falsy events
  const suggestedEvents = suggestedEventsList
    .filter((events) => events && events.length)
    .flat();

  // Exclude My Events
  const result = suggestedEvents.filter(
    (event) => !myEventsList.some((myEvent) => myEvent._id === event._id)
  );
  
  return result;
};

module.exports = {
  experienceSuggestion,
  suggestionCommunityFunction,
  suggestionEventFunction,
};
