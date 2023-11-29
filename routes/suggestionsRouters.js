const express = require("express");
const router = express.Router();
const { mongoose } = require("mongoose");
const { tokenValidation } = require("../auth/auth.js");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { BuddysModel } = require("../schema/loginSchema.js");
const {
  buddyDetails,
  buddyWithFollowStatus,
  buddyPromisesFunction,
} = require("../services/buddyFunctions.js");
const { communityModel } = require("../schema/communitySchema.js");
const {
  buddyFollowerDetailsModel,
  personalDetailsModel,
  educationDetailsModel,
  experienceDetailsModel,
} = require("../schema/buddysSchema.js");
const { contactModel } = require("../schema/contactSchema.js");
const {
  eventModel,
  registeredEventModel,
} = require("../schema/eventsSchema.js");
const {
  experienceSuggestion,
  suggestionCommunityFunction,
  suggestionEventFunction,
} = require("../services/suggestionFunctions.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Buddy Suggestions :
router.post("/buddySuggestion", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      const followingFunction = async (id) => {
        let following = await buddyFollowerDetailsModel
          .find({ $and: [{ followId: id }, { status: "Accepted" }] })
          .distinct("userId");
        return following;
      };
      const check = await followingFunction(id);

      // Following of Following Id :
      const suggestionPromises = check.map((id) => followingFunction(id));
      const fOfF = await Promise.all(suggestionPromises);
      const flatFOfF = fOfF.flat();
      const uniqueIdsSet = new Set(flatFOfF);
      const uniqueIds = Array.from(uniqueIdsSet);

      // My Id and My Following Id List Filtering :
      const isAllUnique = uniqueIds.filter((id) => {
        let idMine = req.userId;
        if (id != idMine) !check.includes(id);
      });

      // Following of Following Buddy Details finding :
      const buddyDetailsPromises = isAllUnique.map((id) => buddyDetails(id));
      const result = await Promise.all(buddyDetailsPromises);

      res.status(200).send({ message: "Your Buddy List", result });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Community Category Wise Suggestion :
router.post(
  "/communityCategorySuggestion",
  tokenValidation,
  async (req, res) => {
    try {
      const id = req.userId;
      let buddy = await BuddysModel.findOne({ _id: id });
      if (buddy) {
        let uniqueSelectCategories = await communityModel.distinct(
          "selectCategory"
        );
        let result = await Promise.all(
          uniqueSelectCategories.map(async (category) => {
            const community = await communityModel.findOne(
              { selectCategory: category },
              { selectCategory: 1, profilePic: 1 }
            );
            return community;
          })
        );
        res.status(200).send({ message: "Community Suggestions", result });
      } else res.status(400).send({ message: "User Does Not Exist" });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Internal Server Error" });
    }
  }
);

// All Community Suggestion :
router.post("/communitySuggestion", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      let uniqueSelectCategories = await communityModel.distinct(
        "selectCategory"
      );
      let result = await Promise.all(
        uniqueSelectCategories.map(async (category) => {
          const community = await communityModel
            .findOne(
              { selectCategory: category },
              {
                communityName: 1,
                selectCategory: 1,
                profilePic: 1,
                coverPic: 1,
                buddysList: 1,
              }
            )
            .limit(1);
          const buddyList = community.buddysList;
          const buddyPromises = buddyList.map(async (id) => {
            const buddys = await buddyDetails(id);
            return buddys;
          });
          const buddyDetailsList = await Promise.all(buddyPromises);
          const result = {
            ...community.toObject(),
            buddyDetails: buddyDetailsList,
          };
          return result;
        })
      );
      res.status(200).send({ message: "Community Suggestions", result });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Buddy and Community Suggestion for Web Page-wise :
router.post("/suggestionBuddys", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action } = req.body;
    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      const contactDetail = await contactModel
        .findOne({ userId: id })
        .sort({ createdAt: -1 });
      const personalDetail = await personalDetailsModel
        .findOne({ userId: id })
        .sort({ createdAt: -1 });
      const educationDetail = await educationDetailsModel
        .findOne({ userId: id })
        .sort({ createdAt: -1 });
      const experienceDetail = await experienceDetailsModel.distinct(
        "companyName",
        { userId: id }
      );
      const communityDetail = await communityModel
        .find({ buddysList: { $in: [id] }, status: "Approved" })
        .sort({ createdAt: -1 });
      const eventDetail = await eventModel
        .find({ registeredList: { $in: [id] } })
        .sort({ createdAt: -1 })
        .limit(50);
      // ___________________________________________________________________________________
      const defaultSuggestionDetail = await BuddysModel.find({
        _id: { $ne: id },
      })
        .sort({ createdAt: -1 })
        .limit(50);
      const defaultSuggestionCommunity = await communityModel
        .find({ userId: { $ne: id } })
        .sort({ createdAt: -1 })
        .limit(5);
      // ___________________________________________________________________________________
      // Following List :
      const followingFunction = async (id) => {
        let following = await buddyFollowerDetailsModel.distinct("userId", {
          $and: [{ followId: id }, { status: "Accepted" }],
        });
        return following;
      };
      const followingId = await followingFunction(id);

      // Community Category List :
      const communityCategory = await communityModel.distinct(
        "selectCategory",
        {
          buddysList: { $in: [id] },
          status: { $in: ["Approved", "Request Sent"] },
        }
      );
      // ___________________________________________________________________________________
      // Dashboard Page :
      if (action == "dashboard" && contactDetail) {
        // Suggestion List Buddys:
        const contactDetails = await contactModel.distinct("mobNo", {
          userId: id,
        });
        const suggestedList = await BuddysModel.find(
          { mobNo: { $in: contactDetails } },
          { _id: 1 }
        );
        const suggestedBuddysPromises = suggestedList.map(async (id) => {
          const idMine = req.userId;
          if (id !== idMine) {
            const buddy = await buddyDetails(id);
            const result = buddy;
            return result;
          }
        });
        const suggestedBuddysList = await Promise.all(suggestedBuddysPromises);

        // const filteredBuddysList = suggestedBuddysList.filter(
        //   (buddy) => buddy !== undefined
        // );
        // const uniqueBuddySet = new Set(
        //   filteredBuddysList.map((buddy) => buddy._id)
        // );
        // const uniqueBuddy = Array.from(uniqueBuddySet);
        // console.log(uniqueBuddy);

        // Checking Weather already followed :
        const suggestedBuddys = suggestedBuddysList.filter(
          (buddys) => !followingId.some((id) => id === buddys._id)
        );

        // Suggestion List Communities:
        const communityPromises = suggestedBuddys.map(async (e) => {
          const community = await communityModel.distinct("selectCategory", {
            buddysList: { $in: [e._id] },
            status: "Approved",
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
          const flatResult = result.flat();
          return flatResult;
        });
        const suggestedCommunitiesList = await Promise.all(communityPromises);

        // Checking Weather already Joined in Community :
        const suggestedCommunities = suggestedCommunitiesList.filter(
          (community) =>
            !communityCategory.some(
              (category) => category === community.selectCategory
            )
        );

        // Result
        const result = {
          buddys: suggestedBuddys,
          communities: suggestedCommunities,
        };
        res
          .status(200)
          .send({ message: "Buddy And Community Suggestion List", result });
      }
      // ___________________________________________________________________________________
      // Community Page :
      else if (action == "communities" && communityDetail) {
        // Suggestion List Communities:
        const communityCategory = await communityModel.distinct(
          "selectCategory",
          { status: "Approved" }
        );
        const communityPromises = communityCategory.map(async (category) => {
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
        const communityList = await Promise.all(communityPromises);
        const suggestedCommunitiesList = communityList.flat();

        // const finalListPromises = suggestedCommunitiesList.map(async (e) => {
        //   console.log(req, e.buddysList);
        //   if (e.buddysList && e.buddysList.length > 0)
        //     await buddyPromisesFunction(req, e.buddysList);
        // });
        // const finalList = await Promise.allSettled(finalListPromises)
        // console.log(finalList);

        // Checking Weather already Joined in Community :
        const myCommunities = await communityModel.find({
          userId: id,
          status: "Approved",
          // status: { $in: ["Approved", "Request Sent"] },
        });

        const suggestedCommunities = suggestedCommunitiesList.filter(
          (community) => {
            const isAlreadyJoined = myCommunities.some(
              (e) => e._id.toString() === community._id.toString()
            );
            return !isAlreadyJoined;
          }
        );

        // Suggestion List Buddys :
        const buddyIdListPromises = suggestedCommunities.map(
          async (community) => {
            const buddyId = community.buddysList;
            return buddyId;
          }
        );
        const buddyIdList = await Promise.all(buddyIdListPromises);
        const buddyId = buddyIdList.flat();
        // Remove empty values
        const nonEmptyArray = buddyId.filter((item) => item !== "");
        // Remove duplicate values
        const uniqueArray = [...new Set(nonEmptyArray)];

        const idMine = req.userId;
        const suggestedBuddysPromises = uniqueArray.map((id) => {
          if (idMine !== id) buddyWithFollowStatus(idMine, id);
        });
        const buddyDetail = await Promise.all(suggestedBuddysPromises);

        let suggestedBuddys;
        if (buddyDetail > 0) {
          suggestedBuddys = buddyDetail.filter((buddys) => {
            const isAlreadyFollowing = followingId.some(
              (id) => id.toString() === buddys._id.toString()
            );
            return !isAlreadyFollowing;
          });
        } else suggestedBuddys = [];

        // Result :
        const result = {
          buddys: suggestedBuddys,
          communities: suggestedCommunities,
        };
        res
          .status(200)
          .send({ message: "Buddys And Community Suggestion List", result });
      }
      // ___________________________________________________________________________________
      // Profile Page :
      else if (action == "profile" && personalDetail) {
        // Suggestion Buddys Based On Location:
        // const locationSearch = await personalDetailsModel.aggregate([
        //   {
        //     $group: {
        //       _id: "$district",
        //       userIds: { $addToSet: "$userId" }
        //     }
        //   },
        //   {
        //     $project: {
        //       _id: 0,
        //       userIds: 1
        //     }
        //   }
        // ]);

        // const userIdSet = new Set();
        // locationSearch.forEach(location => {
        //   location.userIds.forEach(userId => {
        //     userIdSet.add(userId);
        //   });
        // });

        // const uniqueUserIds = Array.from(userIdSet);

        // Suggestion Buddys Based On Location:
        const locationSearch = await personalDetailsModel.distinct("district");
        const locationPromises = locationSearch.map(async (location) => {
          const userId = await personalDetailsModel.find(
            { district: { $regex: location, $options: "i" } },
            { userId: 1, district: 1 }
          );
          return userId;
        });
        const userList = await Promise.all(locationPromises);
        const userId = userList.flat();

        // User Details List :
        const userDetailPromises = userId.map(async (id) => {
          const userDetail = await buddyDetails(id.userId);
          return userDetail;
        });
        const buddyDetail = await Promise.all(userDetailPromises);
        const suggestedBuddys = buddyDetail.filter((buddys) => {
          const isAlreadyFollowing = followingId.some(
            (id) => id.toString() === buddys._id.toString()
          );
          return !isAlreadyFollowing;
        });

        // Suggestion List Communities:
        const communityPromises = suggestedBuddys.map(async (e) => {
          const community = await communityModel.distinct("selectCategory", {
            buddysList: { $in: [e._id] },
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
          const flatResult = result.flat();
          return flatResult;
        });
        const suggestedCommunitiesList = await Promise.all(communityPromises);

        // Checking Weather already Joined in Community :
        const suggestedCommunities = suggestedCommunitiesList.filter(
          (community) =>
            !communityCategory.some(
              (category) => category === community.selectCategory
            )
        );

        const result = {
          buddys: suggestedBuddys,
          communities: suggestedCommunities,
        };
        res.status(200).send({ message: "Buddy Suggestion List", result });
      }
      // ___________________________________________________________________________________
      // Events Page:
      else if (action == "events" && eventDetail.length > 0) {
        // Suggestion Buddy List :
        const userDetails = (
          await Promise.all(
            eventDetail.map(async (event) => {
              const registeredList = await eventModel.distinct(
                "registeredList",
                {
                  _id: event._id,
                }
              );
              return registeredList;
            })
          )
        ).flat();

        // Step 2: Get unique user IDs and fetch user details for each
        const uniqueUserIds = Array.from(
          new Set(userDetails.filter((otherUserId) => otherUserId !== id))
        );

        const buddyDetailPromises = uniqueUserIds.map((otherUserId) =>
          buddyWithFollowStatus(id, otherUserId)
        );

        const buddyDetail = await Promise.all(buddyDetailPromises);

        // Step 3: Filter the user details based on a condition
        const suggestedBuddys = buddyDetail.filter(
          (buddy) =>
            buddy !== undefined &&
            (buddy.followStatus === false ||
              buddy.followStatus === "Request Send")
        );

        // Suggestion Community List :
        const communityPromises = suggestedBuddys.map(async (e) => {
          const community = await communityModel.distinct("selectCategory", {
            buddysList: { $in: [e._id] },
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
          const flatResult = result.flat();
          return flatResult;
        });
        const suggestedCommunitiesList = await Promise.all(communityPromises);

        // Checking Weather already Joined in Community :
        const suggestedCommunities = suggestedCommunitiesList.filter(
          (community) =>
            !communityCategory.some(
              (category) => category === community.selectCategory
            )
        );

        // Suggestion Events :
        const suggestionEvents = await eventModel
          .find(
            {
              $nor: [
                { userId: { $eq: id } },
                { favouriteList: { $elemMatch: { $eq: id } } },
                { intrestedList: { $elemMatch: { $eq: id } } },
                { registeredList: { $elemMatch: { $eq: id } } },
              ],
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

        // Result :
        const result = {
          buddys: suggestedBuddys,
          communities: suggestedCommunities,
          events: suggestionEvents,
        };
        res.status(200).send({ message: "Buddy Suggestion List", result });
      }
      // ___________________________________________________________________________________
      // None of above conditions :
      else if (action == "notification" && experienceDetail.length > 0) {
        const suggestedBuddys = await experienceSuggestion(
          experienceDetail,
          experienceDetailsModel,
          id
        );
        const suggestedCommunities = await suggestionCommunityFunction(
          suggestedBuddys,
          id
        );
        const suggestedEvents = await suggestionEventFunction(
          suggestedBuddys,
          id
        );

        const result = {
          buddys: suggestedBuddys,
          communities: suggestedCommunities,
          events: suggestedEvents,
        };

        res.status(200).send({ message: "Experience List", result });
      }
      // ___________________________________________________________________________________
      // None of above conditions :
      else {
        // Suggestion Buddy List :
        const userDetails = defaultSuggestionDetail;
        const userDetailPromises = userDetails.map(async (buddy) => {
          const userDetail = await buddyWithFollowStatus(id, buddy._id);
          return userDetail;
        });
        const buddyDetail = await Promise.all(userDetailPromises);
        const suggestedBuddys = buddyDetail.filter(
          (buddy) =>
            buddy !== undefined &&
            (buddy.followStatus === false ||
              buddy.followStatus === "Request Send")
        );

        // Community Suggestion List :
        const communityCategory = await communityModel.distinct(
          "selectCategory",
          { status: "Approved" }
        );
        const suggestedCommunities = defaultSuggestionCommunity.filter(
          (community) =>
            !communityCategory.some(
              (category) => category === community.selectCategory
            )
        );

        // Result :
        const result = {
          buddys: suggestedBuddys,
          communities: suggestedCommunities,
        };
        res.status(200).send({ message: "Buddy Suggestion List", result });
      }
    } else res.status(400).send({ message: "User Does Not Exists" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;
