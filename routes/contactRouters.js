const express = require("express");
const router = express.Router();
const { mongoose } = require("mongoose");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { tokenValidation } = require("../auth/auth.js");
const { contactModel } = require("../schema/contactSchema.js");
const { BuddysModel } = require("../schema/loginSchema.js");
const { buddyDetails } = require("../services/buddyFunctions.js");
const { buddyFollowerDetailsModel } = require("../schema/buddysSchema.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// 1. Upload Contact Details :
router.post("/uploadContacts", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    req.body.userId = id;
    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      let result = new contactModel(req.body);
      await result.save();
      res.status(201).send({ message: "Contacts Saved Successfully", result });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// 2. Get Contact Details :
router.post("/findBuddys", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      // Suggestion List :
      const contactDetails = await contactModel.distinct("mobNo",{userId:id})
      const suggestedList = await BuddysModel.find({ mobNo: { $in: contactDetails } }, {_id:1});
      const suggestedBuddysPromises = suggestedList.map(async (id)=>{
        const idMine = req.userId
        const buddy = await buddyDetails(id) 
        const followStatus = await buddyFollowerDetailsModel
          .find({ $and: [{ userId: idMine }, { followId: id }] })
          .distinct("status");
        const result = {...buddy, followStatus: followStatus ? followStatus[0] : "",}
        return result;
      })
      const suggestedBuddys = await Promise.all(suggestedBuddysPromises)

      // Invite List :
      const inviteBuddys = contactDetails.filter(
        (contactDetail) => {
          const isAlreadyFollowing = myCommunities.some(
            (suggestedItem) => suggestedItem.mobNo === contactDetail
          );
          return !isAlreadyFollowing;
        }
      );

      // Result :
      const result = {suggestedBuddys, inviteBuddys}
      res.status(200).send({message:"Buddy Contact Suggestion details", result})
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// 3. Search Buddy Using Contact Details : 
router.post("/searchContact", tokenValidation, async (req,res)=>{
  try {
    const id = req.userId;
    const search = req.body.search

    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      const contactDetails = await contactModel.distinct("mobNo",{userId:id})
      const suggestedBuddys = await BuddysModel.find({ mobNo: { $in: contactDetails } });
      const buddySearch = suggestedBuddys.find((e) => {
        return e.fullName.toLowerCase().includes(search.toLowerCase());
      });
      const result = buddySearch
      res.status(200).send({message:"Buddy Contact Suggestion details", result})
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    res.status(500).send({ message: "No Search List Found", error });
  }
})

module.exports = router;
