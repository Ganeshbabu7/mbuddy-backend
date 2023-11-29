const express = require("express");
const router = express.Router();
const { mongoose } = require("mongoose");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { tokenValidation } = require("../auth/auth.js");
const {
  eventModel,
  upiAccountModel,
  ticketDeatilsModel,
  withDrawBankAccountModel,
  transactionsHistoryModel,
} = require("../schema/eventsSchema.js");
const { BuddysModel } = require("../schema/loginSchema.js");
const { communityModel } = require("../schema/communitySchema.js");
const {
  buddyDetails,
  buddyIdPromisesFunction,
} = require("../services/buddyFunctions.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Events - Create, Update, Delete:
router.post("/createEvents", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, eventId, status } = req.body;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        let result = new eventModel(req.body);
        await result.save();
        res.status(201).send({ message: "Event Created Successfully", result });
      } else if (action == "update") {
        let check = await eventModel.findOne({ _id: eventId });
        if (check) {
          let result = await eventModel.updateOne(
            { _id: eventId },
            { $set: req.body },
            { new: true }
          );
          res
            .status(200)
            .send({ message: "Event Updated Successfully", result });
        } else {
          res.status(200).send({ message: "Event Id does not exist" });
        }
      } else if (action == "updateFavourite") {
        let check = await eventModel.findOne({ _id: eventId });
        if (check) {
          let check = await eventModel.findOne({
            _id: eventId,
            favouriteList: { $in: [id] },
          });
          if (!check) {
            let result = await eventModel.findOneAndUpdate(
              { _id: eventId },
              { $addToSet: { favouriteList: id } },
              { new: true }
            );
            res
              .status(200)
              .send({ message: "Event added to favourite list", result });
          } else {
            let result = await eventModel.findOneAndUpdate(
              { _id: eventId },
              { $pull: { favouriteList: id } },
              { new: true }
            );
            res
              .status(200)
              .send({ message: "Event removed from favourite list", result });
          }
        } else {
          res.status(200).send({ message: "Event Id does not exist" });
        }
      } else if (action == "updateStatus") {
        let check = await eventModel.findOne({ _id: eventId });
        if (check) {
          if (status == "intrested") {
            let result = await eventModel.findOneAndUpdate(
              { _id: eventId },
              {
                $addToSet: { intrestedList: id },
                $pull: { maybeList: id },
              },
              { new: true }
            );
            res
              .status(200)
              .send({ message: "Event Status Updated Successfully", result });
          } else if (status == "maybe") {
            let check = await eventModel.findOne({ _id: eventId });
            if (check) {
              let result = await eventModel.findOneAndUpdate(
                { _id: eventId },
                {
                  $addToSet: { maybeList: id },
                  $pull: { intrestedList: id },
                },
                { new: true }
              );
              res
                .status(200)
                .send({ message: "Event Status Updated Successfully", result });
            }
          } else res.status(400).send({ message: "Status does not exist" });
        } else res.status(200).send({ message: "Event Id does not exist" });
      } else if (action == "delete") {
        let check = await eventModel.findOne({ _id: eventId });
        if (check) {
          let result = await eventModel.findOneAndDelete({ _id: id });
          res.status(200).send({ message: "Event Deleted Successfully" });
        } else {
          res.status(200).send({ message: "Event Id does not exist" });
        }
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "UserId Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Community List for Event Creation :
router.post("/communityList", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const result = await communityModel.find(
      { admins: { $in: [id] } },
      { _id: 1, communityName: 1, selectCategory: 1 }
    );
    res.status(200).send({ message: "Community Details List", result });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Read Events :
router.post("/getEvents", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, search, eventId, communityId } = req.body;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "read") {
        try {
          // let result = await eventModel.aggregate([
          //   { $match: { _id: eventId } },
          //   {
          //     $addFields: {
          //       isFavourite: { $in: [id, "$favouriteList"] },
          //       isRegistered: { $in: [id, "$registeredList"] },
          //       isOrganiser: { $eq: [id, "$userId"] },
          //       eventStatus: {
          //         $cond: {
          //           if: { $in: [id, "$userId"] },
          //           then: "My Events",
          //           else: {
          //             $cond: {
          //               if: { $in: [id, "$intrestedList"] },
          //               then: "Interested",
          //               else: {
          //                 $cond: {
          //                   if: { $in: [id, "$registeredList"] },
          //                   then: "Registered",
          //                   else: "Unknown",
          //                 },
          //               },
          //             },
          //           },
          //         },
          //       },
          //     },
          //   },
          // ]);

          let result = await eventModel.findOne({ _id: eventId });
          let organiserDetails = await buddyDetails(result.userId);
          let resgister = result.registeredList.includes(id);
          let favourite = result.favouriteList.includes(id);
          let intrested = result.intrestedList.includes(id);
          let maybe = result.maybeList.includes(id);
          let organiser = result.userId == id;
          let registeredBuddysDetails = await buddyIdPromisesFunction(
            req,
            result.registeredList
          );
          let intrestedBuddysDetails = await buddyIdPromisesFunction(
            req,
            result.intrestedList
          );
          let maybeBuddysDetails = await buddyIdPromisesFunction(
            req,
            result.maybeList
          );
          let finalresult = {
            ...result.toObject(),
            favourite: favourite,
            isOrganiser: organiser,
            isRegistered: resgister,
            eventStatus: resgister
              ? "Registered"
              : favourite
              ? "Favourite"
              : organiser
              ? "My Event"
              : intrested
              ? "Intrested"
              : maybe
              ? "Maybe"
              : "none",
            organiser: organiserDetails,
            intrestedBuddys: intrestedBuddysDetails,
            maybeBuddys: maybeBuddysDetails,
            registeredBuddys: registeredBuddysDetails,
          };
          if (result) {
            res
              .status(200)
              .send({ message: "Event Details", result: finalresult });
          } else res.status(200).send({ message: "Event Id does not exist" });
        } catch (error) {
          console.log(error);
        }
      } else if (action == "readAll") {
        let result = await eventModel.aggregate([
          {
            $match: {
              $and: [
                { eventName: { $regex: new RegExp(search, "i") } },
                { isActive: true },
              ],
            },
          },
          {
            $addFields: {
              isFavourite: { $in: [id, "$favouriteList"] },
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 50,
          },
        ]);
        res.status(200).send({ message: "Event List", result });
      } else if (action == "readMyEvents") {
        let result = await eventModel.aggregate([
          {
            $match: {
              $and: [
                { eventName: { $in: [new RegExp(search, "i")] } },
                { userId: id },
                { isActive: true },
              ],
            },
          },
          {
            $addFields: {
              eventStatus: "My Events",
              isFavourite: { $in: [id, "$favouriteList"] },
            },
          },
        ]);
        res.status(200).send({ message: "My Event List", result });
      } else if (action == "readIntrested") {
        let result = await eventModel.aggregate([
          {
            $match: {
              $and: [
                { eventName: { $in: [new RegExp(search, "i")] } },
                {
                  $or: [
                    { intrestedList: { $in: [id] } },
                    { registeredList: { $in: [id] } },
                  ],
                },
              ],
            },
          },
          {
            $addFields: {
              isFavourite: { $in: [id, "$favouriteList"] },
              eventStatus: {
                $cond: {
                  if: { $in: [id, "$intrestedList"] },
                  then: "Intrested",
                  else: {
                    $cond: {
                      if: { $in: [id, "$registeredList"] },
                      then: "Registered",
                      else: {
                        $cond: {
                          if: { $in: [id, "$maybeList"] },
                          then: "Maybe",
                          else: "None",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ]);
        res
          .status(200)
          .send({ message: "Interested and Registered Events List", result });
      } else if (action == "readFavourite") {
        let result = await eventModel.aggregate([
          {
            $match: {
              $and: [
                { eventName: { $in: [new RegExp(search, "i")] } },
                { favouriteList: { $in: [id] } },
              ],
            },
          },
          {
            $addFields: {
              isFavourite: { $in: [id, "$favouriteList"] },
              eventStatus: "Favourite",
            },
          },
        ]);
        res.status(200).send({ message: "Favourite Events List", result });
      } else if (action == "readPast") {
        let result = await eventModel.aggregate([
          {
            $match: {
              $and: [
                { eventName: { $in: [new RegExp(search, "i")] } },
                {
                  $or: [
                    { userId: id },
                    { maybeList: { $in: [id] } },
                    { intrestedList: { $in: [id] } },
                    { registeredList: { $in: [id] } },
                  ],
                },
                { isActive: false },
              ],
            },
          },
          {
            $addFields: {
              isFavourite: { $in: [id, "$favouriteList"] },
              eventStatus: {
                $cond: {
                  if: { $in: [id, "$userId"] },
                  then: "My Events",
                  else: {
                    $cond: {
                      if: { $in: [id, "$intrestedList"] },
                      then: "Interested",
                      else: {
                        $cond: {
                          if: { $in: [id, "$registeredList"] },
                          then: "Registered",
                          else: {
                            $cond: {
                              if: { $in: [id, "$maybeList"] },
                              then: "Maybe",
                              else: "None",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ]);
        res.status(200).send({ message: "Past Events List", result });
      } else if (action == "readCommunityEvents") {
        let result = await eventModel.aggregate([
          {
            $match: {
              $and: [
                { eventName: { $in: [new RegExp(search, "i")] } },
                { communityId: communityId },
                { isActive: true },
              ],
            },
          },
          {
            $addFields: {
              isFavourite: { $in: [id, "$favouriteList"] },
            },
          },
        ]);
        res.status(200).send({ message: "Community Event List", result });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "UserId Does Not Exist" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Event Registration :
router.post("/eventRegistration", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { eventId, ticketCount } = req.body;
    const eventCheck = await eventModel.find({ _id: eventId });
    if (eventCheck) {
      const isRegistered = await eventModel.findOne({
        _id: eventId,
        registeredList: { $in: id },
      });
      if (!isRegistered) {
        const result = await eventModel.findOneAndUpdate(
          { _id: eventId },
          {
            $addToSet: { registeredList: id },
            $inc: { registeredTicketCount: parseInt(ticketCount) },
          },
          { new: true }
        );

        // Ticket Generation :
        const eventDetails = eventCheck[0];
        const communityDetails = await communityModel.findOne({
          _id: eventDetails.communityId,
        });
        const ticketGeneration = new ticketDeatilsModel({
          userId: id,
          eventId: eventDetails._id,
          eventName: eventDetails.eventName,
          eventPic: eventDetails.coverPic,
          eventLocation: eventDetails.eventLocationDetails,
          eventDate: eventDetails.startDate,
          eventTime: eventDetails.startTime,
          eventVenue: eventDetails.eventLocationTitle,
          noOfSeat: ticketCount,
          communityOrganized: {
            communityId: communityDetails._id,
            communityName: communityDetails.communityName,
            communityCategory: communityDetails.selectCategory,
          },
        });
        await ticketGeneration.save();

        // Transactions Details:
        if (eventDetails.ticketType.toLowerCase() == "paid") {
          const currentDate = new Date();
          const currentDateTime = currentDate.toISOString();
          const currentTime = currentDateTime.split("T")[1].substring(0, 8);

          const buddyDetail = await buddyDetails(id);
          const transactions = new transactionsHistoryModel({
            userId: id,
            eventId: eventDetails._id,
            typeOfTransaction: "Cash",
            transactionDate: currentDate,
            transactionTime: currentTime,
            transactionAmount: "100",
            transactionStatus: "Success",
            buddyDetails: {
              _id: buddyDetail._id,
              fullName: buddyDetail.fullName,
              isVerified: buddyDetail.isVerified,
              userName: buddyDetail.userName,
              profilePic: buddyDetail.profilePic,
              title: buddyDetail.title,
              district: buddyDetail.district,
              state: buddyDetail.state,
              country: buddyDetail.country,
            },
          });
          await transactions.save();
        }
        res.status(200).send({ message: "Event Joined Successfully", result });
      } else res.status(400).send({ message: "Event Already Registered" });
    } else res.status(400).send({ message: "Event Does Not Exists" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Event Category Filter :
router.post("/eventCategory", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      let result = await eventModel
        .find({}, { eventCategory: 1 })
        .sort({ createdAt: -1 })
        .limit(20);
      res.status(200).send({ message: "Event List", result });
    } else res.status(400).send({ message: "UserId Does Not Exist" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Event Ticket Details :
router.post("/eventTickets", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { eventId } = req.body;
    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      let eventCheck = await eventModel.findOne({ _id: eventId });
      if (eventCheck) {
        let result = await ticketDeatilsModel.findOne({
          eventId: eventId,
          userId: id,
        });
        res.status(201).send({ message: "Event Ticket Details", result });
      } else res.status(400).send({ message: "Event Does Not Exist" });
    } else res.status(400).send({ message: "UserId Does Not Exist" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Event Transaction Details :
router.post("/eventTransactions", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { eventId } = req.body;
    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      let eventCheck = await eventModel.findOne({ _id: eventId });
      if (eventCheck) {
        let result = await transactionsHistoryModel
          .find({ eventId: eventId })
          .sort({ createdAt: -1 })
          .limit(50);
        res.status(201).send({ message: "Event Transaction Details", result });
      } else res.status(400).send({ message: "Event Does Not Exist" });
    } else res.status(400).send({ message: "UserId Does Not Exist" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Bank Account Details :
router.post("/accountDetails", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const action = req.body.action;
    const accountId = req.body.accountId;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        let result = new withDrawBankAccountModel(req.body);
        await result.save();
        res.status(201).send({ message: "Account Added Successfully" });
      } else if (action == "read") {
        let result = await withDrawBankAccountModel.findOne({ _id: accountId });
        if (result) {
          res.status(201).send({ message: "Account Details", result });
        } else res.status(200).send({ message: "Account Id does not exist" });
      } else if (action == "update") {
        let check = await withDrawBankAccountModel.findOne({ _id: accountId });
        if (check) {
          let result = await withDrawBankAccountModel.updateOne(
            { _id: accountId },
            { $set: req.body }
          );
          res
            .status(200)
            .send({ message: "Account Updated Successfully", result });
        } else res.status(200).send({ message: "Account Id does not exist" });
      } else if (action == "delete") {
        let check = await withDrawBankAccountModel.findOne({ _id: accountId });
        if (check) {
          let result = await withDrawBankAccountModel.deleteOne({
            _id: accountId,
          });
          res
            .status(200)
            .send({ message: "Account Removed Successfully", result });
        } else res.status(400).send({ message: "Account Id does not exist" });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "UserId Does Not Exist" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// UPI Details :
router.post("/upiDetails", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const upiId = req.body.upiId;
    const action = req.body.action;
    req.body.userId = id;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        let result = new upiAccountModel(req.body);
        await result.save();
        res.status(201).send({ message: "UPI Added Successfully" });
      } else if (action == "read") {
        let result = await upiAccountModel.findOne({ _id: upiId });
        if (result) {
          res.status(201).send({ message: "UPI Details", result });
        } else res.status(200).send({ message: "UPI Id does not exist" });
      } else if (action == "update") {
        let check = await upiAccountModel.findOne({ _id: upiId });
        if (check) {
          let result = await upiAccountModel.updateOne(
            { _id: upiId },
            { $set: req.body }
          );
          res.status(200).send({ message: "UPI Updated Successfully", result });
        } else res.status(200).send({ message: "UPI Id does not exist" });
      } else if (action == "delete") {
        let check = await upiAccountModel.findOne({ _id: upiId });
        if (check) {
          let result = await upiAccountModel.deleteOne({ _id: upiId });
          res.status(200).send({ message: "UPI Removed Successfully", result });
        } else res.status(400).send({ message: "UPI Id does not exist" });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "UserId Does Not Exist" });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

module.exports = router;

// createEvents - Done
// read single event - Done
// readFilters : all, myEvent, intrested, favourite, past - Done
// categoryFilters : Need to get unique community Category - Partially Done
// buddyStatus : mutualBuddysList, otherBuddys,
// eventTicket - Done
// withDrawDetails : Bank Account, UPI - Done
