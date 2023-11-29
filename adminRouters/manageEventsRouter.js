const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { tokenValidation, adminTokenValidation } = require("../auth/auth.js");

// Schema :
const { eventPipeline } = require("./pipelines.js");
const { BuddysModel } = require("../schema/loginSchema.js");
const { eventModel, eventCategoryModel } = require("../schema/eventsSchema.js");

// Multer :
const { s3Client, PutObjectCommand } = require("../config/awsConfig");
const multer = require("multer");
const upload = multer();

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Manage Buddys Router :
router.post("/manageEvents", adminTokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, currentPage, pageSize } = req.body;
    let admin = await BuddysModel.findOne({ _id: id });
    if (admin) {
      const currentDate = new Date();
      if (action == "totalEvents") {
        const pipeline = await eventPipeline(currentPage, pageSize);
        const query = [
          {
            $match: {},
          },
          ...pipeline,
        ];
        const result = await eventModel.aggregate(query);
        const resultLength = result.length;
        res.status(200).send({
          message: "Total Events List",
          resultLength,
          result,
        });
      } else if (action == "upcomingEvents") {
        const pipeline = await eventPipeline(currentPage, pageSize);
        const query = [
          {
            $match: {
              $expr: {
                $gt: ["$startDate", currentDate],
              },
            },
          },
          ...pipeline,
        ];
        const result = await eventModel.aggregate(query);
        const resultLength = result.length;
        res
          .status(200)
          .send({ message: "Upcoming Events List", resultLength, result });
      } else if (action == "pastEvents") {
        const pipeline = await eventPipeline(currentPage, pageSize);
        const query = [
          {
            $match: {
              $or: [{ isActive: false }, { endDate: { $lt: currentDate } }],
            },
          },
          ...pipeline,
        ];
        const result = await eventModel.aggregate(query);
        const resultLength = result.length;
        res
          .status(200)
          .send({ message: "Past Events List", resultLength, result });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "Admin Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Events Category Router :
const addCategoryFunction = async (req, res) => {
  try {
    const id = req.userId;
    const { action, categoryName, eventId } = req.body;
    const file = req.file;
    const userIdRandom = String(id).slice(7, 12);
    const timestamp = Date.now();

    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        let categoryImageUrl;
        if (file) {
          const params = {
            Bucket: "mybuddy-sanorac",
            Key: `mb_img_${userIdRandom}_${timestamp}`,
            Body: file.buffer,
            ContentType: file.mimetype,
          };

          const command = new PutObjectCommand(params);
          await s3Client.send(command);
          categoryImageUrl = `https://mybuddy-sanorac.s3.ap-south-1.amazonaws.com/${params.Key}`;
        }

        let result = new eventCategoryModel({
          label: categoryName,
          value: categoryName,
          image: file ? categoryImageUrl : "",
          status: "Active",
        });
        await result.save();
        res.status(201).send({
          message: "Events Category Created Successfully",
          result,
        });
      } else res.status(400).send({ message: "Action Does Not Exists" });
    } else res.status(400).send({ message: "Admin Does Not Exists" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

router.post(
  "/eventCategory",
  adminTokenValidation,
  upload.single("image"),
  addCategoryFunction
);

module.exports = router;

// Events Category Router :
// router.post("/eventCategory", tokenValidation, async (req, res) => {
//   try {
//     const id = req.userId;
//     const { action, categoryName, eventId } = req.body;
//     const buddy = await BuddysModel.findOne({ _id: id });
//     if (buddy) {
//       if (action == "create") {
//         const result = new eventCategoryModel({
//           label: categoryName,
//           value: categoryName,
//           status: "Active",
//         });
//         await result.save();
//         res
//           .status(201)
//           .send({ message: "Event Category Created Successfully", result });
//       } else if (action == "update") {
//         const result = await eventCategoryModel.findOneAndUpdate(
//           { _id: categoryId },
//           { $set: req.body }
//         );
//         res
//           .status(200)
//           .send({ message: "Event Category Updated Successfully", result });
//       } else if (action == "delete") {
//         const result = await eventCategoryModel.findOneAndDelete({
//           _id: eventId,
//         });
//         res
//           .status(200)
//           .send({ message: "Event Category Deleted Successfully", result });
//       } else res.status(400).send({ message: "Action Does Not Exists" });
//     } else res.status(400).send({ message: "User Does Not Exists" });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({ message: "Internal Server Error", error });
//   }
// });
