const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { tokenValidation } = require("../auth/auth.js");
const { BuddysModel } = require("../schema/loginSchema.js");
const { buddyIdPromisesFunction } = require("../services/buddyFunctions.js");
const { messageModel, createMessageModel } = require("../schema/chatSchema.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Add new message : CD
router.post("/list", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, chatId, messageType, users } = req.body;

    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        let chatDetails = null;
        if (messageType == "oneToOne") {
          chatDetails = await createMessageModel.findOne({
            $and: [{ users: { $all: users } }, { messageType: "oneToOne" }],
          });
        }
        if (chatDetails) {
          res.status(200).send({ message: "Chat Already Exists", result: chatDetails });
        } else {
          const result = new createMessageModel(req.body);
          await result.save();
          res.status(201).send({ message: "Chat Created Successfully", result });
        }
      } else if (action == "readList") {
        const result = await createMessageModel.find({ users: { $in: [id] } });
        const buddyPromises = result.map(async (e) => {
          if (e.messageType == "oneToOne") {
            let buddyDetail = await buddyIdPromisesFunction(req, e.users);
            const lastMessage = await messageModel
              .findOne({ chatId: e._id })
              .sort({ createdAt: -1 })
              .limit(1);
            return {
              ...e.toObject(),
              buddyDetail: buddyDetail[0],
              lastMessage,
            };
          } else {
            const lastMessage = await messageModel
              .findOne({ chatId: e._id })
              .sort({ createdAt: -1 })
              .limit(1);
            return { ...e.toObject(), lastMessage };
          }
        });
        const chatList = await Promise.all(buddyPromises);
        // chatList.sort((a, b) => {
        //   const dateA = a.lastMessage
        //     ? new Date(a.lastMessage.message.createdAt)
        //     : null;
        //   const dateB = b.lastMessage
        //     ? new Date(b.lastMessage.message.createdAt)
        //     : null;
        //   if (dateA && dateB) {
        //     return dateB - dateA;
        //   } else if (dateA) {
        //     return -1;
        //   } else if (dateB) {
        //     return 1;
        //   } else {
        //     return 0;
        //   }
        // });
        res.status(201).send({ message: "Chat List", result: chatList });
      } else if (action == "delete") {
        const result = await createMessageModel.findOneAndDelete({
          _id: chatId,
        });
        res.status(200).send({ message: "Chat Deleted Successfully", result });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Read Particular Chat : CRUD
router.post("/readChat", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, chatId, message, messageId } = req.body;

    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        const result = new messageModel({
          chatId: chatId,
          message: {
            senderId: id,
            type: message.type,
            text: message.text,
            image: message.image,
            video: message.video,
            audio: message.audio,
            contact: message.contact,
            location: message.location,
            document: message.document,
          },
        });
        await result.save();
        res.status(201).send({ message: "Chat Created Successfully", result });
      } else if (action == "readList") {
        const userCheck = await createMessageModel.findOne({
          _id: chatId,
          users: { $in: [id] },
        });
        if (userCheck) {
          const result = await messageModel.find({ chatId: chatId });
          res
            .status(201)
            .send({ message: "Chat Created Successfully", result });
        } else res.status(400).send({ message: "No Chats found" });
      } else if (action == "delete") {
        const result = await messageModel.findOneAndDelete({
          _id: chatId,
        });
        res.status(200).send({ message: "Chat Deleted Successfully", result });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

module.exports = router;
