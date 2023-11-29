const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { tokenValidation } = require("../auth/auth.js");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { budsModel } = require("../schema/budsSchema.js");
const { BuddysModel } = require("../schema/loginSchema.js");
const {
  blockedAccountModel,
  privacySettingsModel,
} = require("../schema/settingsSchema.js");
const {
  followList,
  buddyDetails,
  followerFollowingFunction,
} = require("../services/buddyFunctions.js");
const {
  profileImageModel,
  buddyProfileModel,
  skillsDetailsModel,
  intrestDetailsModel,
  personalDetailsModel,
  educationDetailsModel,
  experienceDetailsModel,
  achievementDetailsModel,
  buddyFollowerDetailsModel,
} = require("../schema/buddysSchema.js");
const { communityModel } = require("../schema/communitySchema.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// buddyProfileRouter :
router.post("/buddyProfile", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, otherUserId } = req.body;
    req.body.userId = id;

    const buddy = await BuddysModel.findOne({
      _id: action == "read" ? id : otherUserId,
    });

    if (buddy) {
      let privacy;
      let followStatus = await buddyFollowerDetailsModel
        .find({ $and: [{ userId: id }, { followId: otherUserId }] })
        .distinct("status");

      if (action == "readOthers") {
        let privacyCheck = await privacySettingsModel.findOne({
          userId: otherUserId,
        });
        privacy = privacyCheck.accountPrivacy;
      }

      let [
        profileImageDetails,
        personalDetails,
        educationDetails,
        experienceDetails,
        achievementDetails,
        skillsDetails,
        intrestDetails,
        buddyDetails,
      ] = await Promise.all([
        profileImageModel
          .find({ userId: action == "read" ? id : otherUserId })
          .sort({ createdAt: -1 })
          .limit(1),
        privacy === false
          ? personalDetailsModel
              .find({ userId: action == "read" ? id : otherUserId })
              .sort({ createdAt: -1 })
              .limit(1)
          : followStatus[0] != false && followStatus[0] != "Accepted"
          ? personalDetailsModel
              .find(
                { userId: action == "read" ? id : otherUserId },
                { fullName: 1, userName: 1, title: 1 }
              )
              .sort({ createdAt: -1 })
              .limit(1)
          : personalDetailsModel
              .find({ userId: action == "read" ? id : otherUserId })
              .sort({ createdAt: -1 })
              .limit(1),
        privacy == false
          ? educationDetailsModel
              .find({ userId: action == "read" ? id : otherUserId })
              .sort({ createdAt: -1 })
          : null,
        privacy == false
          ? experienceDetailsModel
              .find({ userId: action == "read" ? id : otherUserId })
              .sort({ createdAt: -1 })
          : null,
        privacy == false
          ? achievementDetailsModel
              .find({ userId: action == "read" ? id : otherUserId })
              .sort({ createdAt: -1 })
          : null,
        privacy == false
          ? skillsDetailsModel
              .find({ userId: action == "read" ? id : otherUserId })
              .sort({ createdAt: -1 })
          : null,
        privacy == false
          ? intrestDetailsModel
              .find({ userId: action == "read" ? id : otherUserId })
              .sort({ createdAt: -1 })
          : null,
        privacy == false
          ? BuddysModel.find(
              { _id: action == "read" ? id : otherUserId },
              {
                _id: 0,
                otp: 0,
                password: 0,
                useAgree: 0,
                updatedAt: 0,
                createdAt: 0,
              }
            )
              .sort({ createdAt: -1 })
              .limit(1)
          : BuddysModel.find(
              { _id: action == "read" ? id : otherUserId },
              { fullName: 1, userName: 1 }
            )
              .sort({ createdAt: -1 })
              .limit(1),
        console.log("status: ", followStatus),
      ]);

      // if (action == "readOthers" && privacy == true) {
      //   personalDetails = personalDetails.map((detail) => {
      //     const { gender, ...filteredDetail } = detail;
      //     return filteredDetail;
      //   });
      // }

      req.body.profileImageDetails = profileImageDetails;
      req.body.personalDetails =
        personalDetails.length > 0 ? personalDetails : buddyDetails;
      req.body.educationDetails = educationDetails;
      req.body.experienceDetails = experienceDetails;
      req.body.achievementDetails = achievementDetails;
      req.body.skillsDetails = skillsDetails;
      req.body.intrestDetails = intrestDetails;

      if (action == "read") {
        const result = req.body;
        return res
          .status(200)
          .send({ message: "Buddy's Profile Details", result });
      } else if (action == "readOthers") {
        const blockCheck = await blockedAccountModel.findOne({
          userId: otherUserId,
          "blockedUserDetails.blockedUserId": id,
        });

        if (!blockCheck) {
          let buddy = req.body;
          let followStatus = await buddyFollowerDetailsModel
            .find({ $and: [{ userId: id }, { followId: otherUserId }] })
            .distinct("status");
          const result = {
            ...buddy,
            followStatus: followStatus[0] ? followStatus[0] : false,
            isPrivacy: privacy,
          };
          return res
            .status(200)
            .send({ message: "Buddy's Profile Details", result });
        } else {
          const personalDetails = (req.body.personalDetails =
            personalDetails.length > 0 ? personalDetails : buddyDetails);
          const profileImageDetails = req.body.profileImageDetails;
          const result = {
            personalDetails,
            profileImageDetails,
            isBlocked: true,
          };
          res
            .status(200)
            .send({ message: "Sorry you have been blocked", result });
        }
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Profile Screen Count:
router.post("/profileCount", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const action = req.body.action;
    const otherUserId = req.body.otherUserId;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      const countFunction = async (id) => {
        let buds = await budsModel.countDocuments({ userId: id });
        let follower = await buddyFollowerDetailsModel.countDocuments({
          $and: [{ userId: id }, { status: "Accepted" }],
        });
        let following = await buddyFollowerDetailsModel.countDocuments({
          $and: [{ followId: id }, { status: "Accepted" }],
        });
        let community = await communityModel.countDocuments({
          $and: [{ userId: id, status: "Approved" }],
        });
        let privacy = await privacySettingsModel.findOne({ userId: id });
        
        let result = {
          buds,
          follower,
          community,
          following,
          isPrivacy: privacy.accountPrivacy,
        };
        res.status(201).send({
          message: "Buddys Count Details",
          result,
        });
      };

      if (action == "read") {
        return await countFunction(id);
      } else if (action == "readOthers") {
        // let blockCheck = await blockedAccountModel.findOne({
        //   userId: otherUserId,
        //   // blockedUserId: { $in: [id] },
        //   "blockedUserDetails.blockedUserId": id,
        // });
        // if (!blockCheck) {
        return await countFunction(otherUserId);
        // } else res.status(400).send({ message: "Sorry you have been blocked" });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else {
      res.status(400).send({ message: "User Does Not Exist" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Tag Buddys Function :
const tagBuddysFunction = async (id) => {
  const uniqueIds = await followList(id);
  let buddyDetailPromises = uniqueIds.map((id) => buddyDetails(id));
  let result = await Promise.all(buddyDetailPromises);

  const finalResult = [];
  for (const buddyItem of result) {
    let privacyCheck = await privacySettingsModel.distinct("whoCanTagYou", {
      userId: buddyItem._id,
    });

    if (
      privacyCheck[0] === "everyOne" ||
      privacyCheck[0] === "buddyYouFollow"
    ) {
      finalResult.push(buddyItem);
    }
  }
  return finalResult;
};

// Tag Buddys List:
router.post("/tagBuddysList", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const action = req.body.action;
    const search = req.body.search;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "list") {
        const result = await tagBuddysFunction(id);
        res.status(201).send({
          message: "Tag Buddys Details",
          result,
        });
      } else if (action == "search") {
        const result = await tagBuddysFunction(id);
        if (result.length > 0) {
          const resultFinal = result.filter((e) =>
            e.fullName.toLowerCase().includes(search.toLowerCase())
          );
          res
            .status(200)
            .send({ message: "Tag Buddy Search Details", result: resultFinal });
        } else
          res.status(400).send({ message: "Buddy Tags List Does Not Exist" });
      }
    } else {
      res.status(400).send({ message: "User Does Not Exist" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Mention Buddys List:
router.post("/mentionBuddysList", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      let follower = await buddyFollowerDetailsModel
        .find({ $and: [{ userId: id }, { status: "Accepted" }] })
        .distinct("followId");
      let following = await buddyFollowerDetailsModel
        .find({ $and: [{ followId: id }, { status: "Accepted" }] })
        .distinct("userId");

      let mergedArray = follower.concat(following);
      let uniqueIds = [...new Set(mergedArray)];
      const title = await personalDetailsModel.find(
        { userId: { $in: uniqueIds } },
        { userId: 1, title: 1 }
      );
      const buddyDetails = await BuddysModel.find(
        { _id: { $in: uniqueIds } },
        { _id: 1, fullName: 1 }
      );

      let result = [];

      for (const buddyItem of buddyDetails) {
        let privacyCheck = await privacySettingsModel.distinct("whoCanTagYou", {
          userId: buddyItem._id,
        });

        if (
          privacyCheck[0] === "everyOne" ||
          privacyCheck[0] === "buddyYouFollow"
        ) {
          const buddyTitle =
            title.find((e) => e.userId == buddyItem._id)?.title || "";
          result.push({
            _id: buddyItem._id,
            fullName: buddyItem.fullName,
            title: buddyTitle,
          });
        }
      }

      res.status(201).send({
        message: "Tag Buddys Details",
        result,
      });
    } else {
      res.status(400).send({ message: "User Does Not Exist" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Title Router :
router.post("/profileImage", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const action = req.body.action;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        let result = new profileImageModel(req.body);
        await result.save();
        res.status(201).send({
          message: "Buddys Profile Image Created Successfully",
          result,
        });
      } else if (action == "read") {
        let result = await profileImageModel.findOne({ userId: id });
        res
          .status(200)
          .send({ message: "Buddys Profile Image Details", result });
      } else if (action == "update") {
        let result = await profileImageModel.findOneAndUpdate(
          { userId: id },
          { $set: req.body }
        );
        res.status(200).send({
          message: "Buddys Profile Image Updated Successfully",
          result,
        });
      } else res.status(400).send({ message: "Action Does not Exists" });
    } else {
      res.status(400).send({ message: "User Does Not Exist" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// personalDetailsRouter :
router.post("/personalDetails", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const action = req.body.action;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        let userNameCheck = await BuddysModel.find({
          userName: buddy.userName,
        });
        if (userNameCheck.length > 0) {
          if (userNameCheck[0]._id == id) {
            let result = new personalDetailsModel(req.body);
            await result.save();
            res.status(201).send({
              message: "Personal Details Created Successfully",
              result,
            });
          } else res.status(400).send({ message: "User Name Already Exists" });
        } else {
          let result = new personalDetailsModel(req.body);
          await result.save();
          res.status(201).send({
            message: "Personal Details Created Successfully",
            result,
          });
        }
      } else if (action == "read") {
        let check = await personalDetailsModel.findOne({ userId: id });
        if (check) {
          let result = await personalDetailsModel.findOne({ userId: id });
          res.status(200).send({ message: "Buddy Personal Details", result });
        } else {
          let result = await BuddysModel.findOne({ _id: id });
          res.status(200).send({ message: "Buddy Personal Details", result });
        }
      } else if (action == "update") {
        let userNameCheck = await personalDetailsModel.find({
          userName: req.body.userName,
        });
        if (userNameCheck.length > 0) {
          if (userNameCheck[0].userId == id) {
            let result = await personalDetailsModel.findOneAndUpdate(
              { userId: id },
              {
                title: req.body.title,
                gender: req.body.gender,
                languages: req.body.languages,
                district: req.body.district,
                state: req.body.state,
                country: req.body.country,
                aboutMe: req.body.aboutMe,
              },
              { new: true }
            );
            let update = await BuddysModel.findOneAndUpdate(
              { _id: id },
              {
                fullName: req.body.fullName,
                userName: req.body.userName,
                dob: req.body.dob,
              },
              { new: true }
            );
            res.status(200).send({
              message: "Buddys Personal Details Updated Successfully",
              result,
            });
          } else {
            res.status(400).send({ message: "User Name Already Exists..." });
          }
        } else {
          let result = await personalDetailsModel.findOneAndUpdate(
            { userId: id },
            { $set: req.body },
            { new: true }
          );
          res.status(200).send({
            message: "Buddys Personal Details Updated Successfully",
            result,
          });
        }
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "UserId Does Not Exist" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// educationDetailsRouter :
router.post("/educationDetails", tokenValidation, async (req, res) => {
  try {
    const user = req.userId;
    const action = req.body.action;
    req.body.userId = user;
    let id = req.body.id;

    let buddy = await BuddysModel.findOne({ _id: user });
    if (buddy) {
      // CreateExperience for User :
      if (action == "create") {
        let result = new educationDetailsModel(req.body);
        await result.save();
        res
          .status(201)
          .send({ message: "Education Details Created Successfully" });
      }
      // Read a w.r.t Edu Id :
      else if (action == "read") {
        try {
          let result = await educationDetailsModel
            .findOne({ _id: id })
            .sort({ createdAt: -1 });
          if (!result)
            res.status(400).send({ message: "Buddy Education Not Found" });
          else
            res
              .status(200)
              .send({ message: "Buddy Education Details", result });
        } catch (error) {
          res
            .status(400)
            .send({ message: "Invalid Buddy Education ID", error });
        }
      }
      // Update w.r.t Edu Id :
      else if (action == "update") {
        let result = await educationDetailsModel.updateOne(
          { _id: id },
          { $set: req.body }
        );
        if (result.nModified === 0)
          res.status(404).send({ message: "Buddy Education Not Found" });
        else
          res.status(200).send({ message: "Buddy Education Updated", result });
      }
      // Delete w.r.t Edu Id :
      else if (action == "delete") {
        let check = await educationDetailsModel.findOne({ _id: id });
        if (check) {
          let result = await educationDetailsModel.findOneAndDelete({
            _id: id,
          });
          res
            .status(200)
            .send({ message: "Buddy Education Deleted Successfully" });
        } else {
          res
            .status(200)
            .send({ message: "Education details Id does not exist" });
        }
      }
      // If No Action :
      else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "UserId Does Not Exist" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// experienceDetailsRouter :
router.post("/experienceDetails", tokenValidation, async (req, res) => {
  try {
    const user = req.userId;
    const action = req.body.action;
    req.body.userId = user;
    let id = req.body.id;

    let buddy = await BuddysModel.findOne({ _id: user });
    if (buddy) {
      // CreateExperience for User :
      if (action == "create") {
        let result = new experienceDetailsModel(req.body);
        await result.save();
        res
          .status(201)
          .send({ message: "Experience Details Created Successfully" });
      }
      // Read All Experience of a User :
      else if (action == "readAll") {
        let result = await experienceDetailsModel
          .find({ userId: user })
          .sort({ createdAt: -1 });
        res.status(200).send({ message: "Buddy Experience Details", result });
      }
      // Read a w.r.t Exp Id :
      else if (action == "read") {
        try {
          let result = await experienceDetailsModel
            .findOne({ _id: id })
            .sort({ createdAt: -1 });
          if (!result)
            res.status(400).send({ message: "Buddy Experience Not Found" });
          else
            res
              .status(200)
              .send({ message: "Buddy Experience Details", result });
        } catch (error) {
          res
            .status(400)
            .send({ message: "Invalid Buddy Experience ID", error });
        }
      }
      // Update w.r.t Exp Id :
      else if (action == "update") {
        let result = await experienceDetailsModel.updateOne(
          { _id: id },
          { $set: req.body }
        );
        if (result.nModified === 0)
          res.status(404).send({ message: "Buddy Experience Not Found" });
        else
          res.status(200).send({ message: "Buddy Experience Updated", result });
      }
      // Delete w.r.t Exp Id :
      else if (action == "delete") {
        let check = await experienceDetailsModel.findOne({ _id: id });
        if (check) {
          let result = await experienceDetailsModel.findOneAndDelete({
            _id: id,
          });
          res
            .status(200)
            .send({ message: "Buddy Experience Deleted Successfully" });
        } else {
          res
            .status(200)
            .send({ message: "Experience details Id does not exist" });
        }
      }
      // If No Action :
      else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "UserId Does Not Exist" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// achievementDetailsRouter :
router.post("/achievementDetails", tokenValidation, async (req, res) => {
  try {
    const user = req.userId;
    const action = req.body.action;
    req.body.userId = user;
    let id = req.body.id;

    let buddy = await BuddysModel.findOne({ _id: user });
    if (buddy) {
      // CreateExperience for User :
      if (action == "create") {
        let result = new achievementDetailsModel(req.body);
        await result.save();
        res
          .status(201)
          .send({ message: "Achivements Details Created Successfully" });
      }
      // Read a w.r.t Achievement Id :
      else if (action == "read") {
        try {
          let result = await achievementDetailsModel
            .findOne({ _id: id })
            .sort({ createdAt: -1 });
          if (!result)
            res.status(400).send({ message: "Buddy Achivements Not Found" });
          else
            res
              .status(200)
              .send({ message: "Buddy Achivements Details", result });
        } catch (error) {
          res
            .status(400)
            .send({ message: "Invalid Buddy Achivements ID", error });
        }
      }
      // Update w.r.t Achievement Id :
      else if (action == "update") {
        let result = await achievementDetailsModel.updateOne(
          { _id: id },
          { $set: req.body }
        );
        if (result.nModified === 0)
          res.status(404).send({ message: "Buddy Achivements Not Found" });
        else
          res
            .status(200)
            .send({ message: "Buddy Achivements Updated", result });
      }
      // Delete w.r.t Achievement Id :
      else if (action == "delete") {
        let check = await achievementDetailsModel.findOne({ _id: id });
        if (check) {
          let result = await achievementDetailsModel.findOneAndDelete({
            _id: id,
          });
          res
            .status(200)
            .send({ message: "Buddy Experience Deleted Successfully" });
        } else {
          res
            .status(200)
            .send({ message: "Experience details Id does not exist" });
        }
      }
      // If No Action :
      else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "UserId Does Not Exist" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// skillsDetailsRouter :
router.post("/skills", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const action = req.body.action;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        let buddy = new skillsDetailsModel(req.body);
        await buddy.save();
        res.status(201).send({ message: "Skills Details Created Successful" });
      } else if (action == "read") {
        let result = await skillsDetailsModel.findOne({ userId: id });
        res.status(200).send({ message: "Buddy Skills Details", result });
      } else if (action == "update") {
        let result = await skillsDetailsModel.updateOne(
          { userId: id },
          { $set: req.body }
        );
        res.status(201).send({ message: "Buddy Skills Updated", result });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "UserId Does Not Exist" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// IntrestesDetailsRouter :
router.post("/intrest", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const action = req.body.action;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        let buddy = new intrestDetailsModel(req.body);
        await buddy.save();
        res
          .status(201)
          .send({ message: "Intrests Details Created Successful" });
      } else if (action == "read") {
        let result = await intrestDetailsModel.findOne({ userId: id });
        res.status(200).send({ message: "Buddy Intrests Details", result });
      } else if (action == "update") {
        let result = await intrestDetailsModel.updateOne(
          { userId: id },
          { $set: req.body }
        );
        res.status(201).send({ message: "Buddy Intrests Updated", result });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "UserId Does Not Exist" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Buddys List for Follow:
router.post("/buddyList", tokenValidation, async (req, res) => {
  try {
    let result = await BuddysModel.find();
    let length = result.length;
    if (result) {
      res.status(200).send({ message: "Buddy About Details", length, result });
    } else {
      res.status(400).send({ message: "Buddy Does Not Exist" });
    }
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Single Buddys List :
router.post("/buddyDetails", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    let result = await BuddysModel.findOne({ _id: id });
    if (result) {
      res.status(200).send({ message: "Buddy About Details", result });
    } else {
      res.status(400).send({ message: "Buddy Does Not Exist" });
    }
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Single Buddys List using ID:
router.post("/buddyDetailsById", async (req, res) => {
  try {
    const id = req.body.userId;
    let result = await BuddysModel.findOne({ _id: id });
    res.status(200).send({ message: "Otp Verification Detail", result });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Buddys Request List for Follow:
router.post("/buddyRequestProcess", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    req.body.userId = id;
    const { action, followId, reqId, status } = req.body;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (!buddy) {
      return res.status(400).send({ message: "Buddy Does Not Exist" });
    }
    // Finding Weather Already Sent By Us :
    let buddyReq = await BuddysModel.findOne({ _id: followId });
    if (buddyReq && action === "follow") {
      const checkItsMe = id == followId;

      if (!checkItsMe) {
        const requestExists = await buddyFollowerDetailsModel.exists({
          userId: id,
          followId: followId,
          status: { $in: ["Request Send", "Accepted"] },
        });

        if (requestExists) {
          return res
            .status(400)
            .send({ message: "Buddy Request Already Sent" });
        }
      } else {
        res.status(400).send({ message: "You cannot request yourself" });
      }
    }

    // Read Request Sent By Us :
    else if (action === "readSentRequests") {
      let result = await buddyFollowerDetailsModel
        .find({ userId: id })
        .sort({ created: -1 });
      let length = result.length;
      await buddyFollowerDetailsModel.updateMany(
        { userId: id },
        { $set: { type: "Following" } }
      );
      return res
        .status(200)
        .send({ message: "Buddy's Requested List", length, result });
    }
    // Read Request Sent To Us:
    else if (action === "readReceivedRequests") {
      try {
        let buddyIds = await buddyFollowerDetailsModel.distinct("userId", {
          $and: [{ followId: id }, { status: "Request Send" }],
        });
        let buddyDetailPromises = buddyIds.map(async (id) => {
          let idMine = req.userId;

          // Updating the Type as Follower :
          let request = await buddyFollowerDetailsModel
            .findOne({
              $and: [
                { userId: id },
                { followId: idMine },
                { status: "Request Send" },
              ],
            })
            .sort({ created: -1 });
          if (request) {
            await buddyFollowerDetailsModel.findOneAndUpdate(
              { _id: request._id },
              { $set: { type: "Follower" } }
            );
          }

          // Request Send Date :
          let follow = await buddyFollowerDetailsModel.findOne(
            {
              $and: [
                { userId: id },
                { followId: idMine },
                { status: "Request Send" },
              ],
            },
            { createdAt: 1 }
          );
          let buddy = await buddyDetails(id);
          console.log(follow);
          let result = {
            ...buddy,
            createdAt: follow.createdAt,
            reqId: follow._id,
          };
          return result;
        });
        let result = await Promise.all(buddyDetailPromises);
        let length = result.length;
        return res
          .status(200)
          .send({ message: "Buddy's Requested List", length, result });
      } catch (error) {
        console.log(error);
      }
    }
    // Status Update :
    else if (action === "update") {
      if (status === "accept") {
        let result = await buddyFollowerDetailsModel.updateOne(
          { $and: [{ _id: reqId }, { followId: id }] },
          { $set: { status: "Accepted" } }
        );
        await buddyFollowerDetailsModel.updateMany(
          { followId: id },
          { $set: { type: "Follower" } }
        );
        return res
          .status(200)
          .send({ message: "Buddy Request Accepted Successfully", result });
      } else if (status === "decline") {
        let result = await buddyFollowerDetailsModel.updateOne(
          { $and: [{ _id: reqId }, { followId: id }] },
          { $set: { status: "Declined" } }
        );
        await buddyFollowerDetailsModel.updateMany(
          { followId: id },
          { $set: { type: "None" } }
        );
        return res
          .status(200)
          .send({ message: "Buddy Request Declined Successfully", result });
      } else return res.status(400).send({ message: "Invalid Status" });
    }

    // Create Request :
    if (buddyReq) {
      // Follow Request :
      const checkPrivacySettings = await privacySettingsModel.findOne({
        userId: followId,
      });

      if (action === "follow") {
        if (checkPrivacySettings == true) {
          req.body.isRequested = true;
          let result = new buddyFollowerDetailsModel(req.body);
          await result.save();
          res
            .status(200)
            .send({ message: "Buddy Request Sent Successfully", result });
        } else {
          let result = new buddyFollowerDetailsModel({
            userId: id,
            followId: followId,
            status: "Accepted",
            isRequested: true,
          });
          await result.save();
          res
            .status(200)
            .send({ message: "Buddy Following Successfully", result });
        }
      }
      // UnFollow Request :
      else if (action === "unfollow") {
        let deleteResult = await buddyFollowerDetailsModel.deleteOne({
          userId: id,
          followId: req.body.followId,
          status: { $in: ["Follow", "Request Send"] },
        });
        if (deleteResult.deletedCount === 0) {
          return res
            .status(400)
            .send({ message: "Buddy is not currently followed" });
        }
        res.status(200).send({ message: "Buddy Unfollowed Successfully" });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "FollowId Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Follower and Following List :
router.post("/followList", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { type, otherUserId } = req.body;
    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (type == "readMine") {
        return await followerFollowingFunction(req, res, id);
      } else if (type == "readOthers") {
        return await followerFollowingFunction(req, res, otherUserId);
      } else res.status(400).send({ message: "Type Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

module.exports = router;

// // changeMobNoRouter :
// router.post("/buddyMobNo", tokenValidation, async (req, res) => {
//   try {
//     const id = req.userId;
//     let buddy = await BuddysModel.findOne({ _id: id });
//     if (buddy) {
//       if (req.body.mobNo) {
//         await BuddysModel.updateOne(
//           { _id: id },
//           { $set: { countryCode: req.body.countryCode, mobNo: req.body.mobNo } }
//         );
//         res.status(201).send({ message: "Mobile Number Updated Successfully" });
//       } else res.status(400).send({ message: "Please Enter Mobile Number" });
//     } else {
//       res.status(400).send({ message: "User Does Not Exist" });
//     }
//   } catch (error) {
//     res.status(500).send({ message: "Internal Server Error", error });
//   }
// });

// // changeEmailRouter :
// router.post("/buddyEmail", tokenValidation, async (req, res) => {
//   try {
//     const id = req.userId;
//     let buddy = await BuddysModel.findOne({ _id: id });
//     if (buddy) {
//       if (req.body.email) {
//         await BuddysModel.updateOne(
//           { _id: id },
//           { $set: { email: req.body.email } }
//         );
//         res.status(201).send({ message: "Email Updated Successfully" });
//       } else res.status(400).send({ message: "Please Enter Email" });
//     } else {
//       res.status(400).send({ message: "User Does Not Exist" });
//     }
//   } catch (error) {
//     res.status(500).send({ message: "Internal Server Error", error });
//   }
// });
