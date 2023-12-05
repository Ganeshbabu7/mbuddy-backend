const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { tokenValidation, adminTokenValidation } = require("../auth/auth.js");

// Schema :
const { communityPipeline } = require("./pipelines.js");
const { BuddysModel } = require("../schema/loginSchema.js");
const { idCardFunction } = require("../services/communityFunctions.js");
const {
  communityModel,
  communityCategoryModel,
} = require("../schema/communitySchema.js");

// Multer :
const { s3Client, PutObjectCommand } = require("../config/awsConfig");
const multer = require("multer");
const upload = multer();

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);

// Manage Buddys Router :
router.post("/manageCommunity", adminTokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const { action, currentPage, pageSize } = req.body;
    let admin = await BuddysModel.findOne({ _id: id });
    if (admin) {
      if (action == "totalCommunity") {
        const pipeline = await communityPipeline(currentPage, pageSize);
        const query = [
          {
            $match: {},
          },
          ...pipeline,
        ];
        const result = await communityModel.aggregate(query);
        const resultLength = result.length;
        res.status(200).send({
          message: "Total Community List",
          resultLength,
          result,
        });
      } else if (action == "requestCommunity") {
        const pipeline = await communityPipeline(currentPage, pageSize);
        const query = [
          {
            $match: { status: "Request Sent" },
          },
          ...pipeline,
        ];
        const result = await communityModel.aggregate(query);
        const resultLength = result.length;
        res
          .status(200)
          .send({ message: "Requested Community List", resultLength, result });
      } else if (action == "suspendedCommunity") {
        const pipeline = await communityPipeline(currentPage, pageSize);
        const query = [
          {
            $match: { status: "Rejected" },
          },
          ...pipeline,
        ];
        const result = await communityModel.aggregate(query);
        const resultLength = result.length;
        res
          .status(200)
          .send({ message: "Suspended Community List", resultLength, result });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "Admin Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Community Approval :
router.post("/communityApproval", adminTokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    req.body.userId = id;
    const { action, communityId, adminComment } = req.body;

    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "Approved") {
        try {
          let community = await communityModel.findOne({ _id: communityId });
          if (community) {
            let result = await communityModel.findOneAndUpdate(
              { _id: communityId },
              {
                $set: { status: "Approved" },
                $addToSet: {
                  admins: community.userId,
                  buddysList: community.userId,
                },
              },
              { new: true }
            );
            // Id Card Generation
            await idCardFunction(communityId, community.userId, "create", res);
            res
              .status(200)
              .send({ message: "Community Approved Successfully", result });
          }
        } catch (error) {
          console.log(error);
          res.status(500).send({ message: "Internal Server Error", error });
        }
      } else if (action == "Rejected") {
        let result = await communityModel.findOneAndUpdate(
          {
            $and: [{ _id: communityId }],
          },
          {
            $set: {
              adminId: id,
              status: "Rejected",
              adminComment: adminComment,
            },
          },
          { new: true }
        );
        res
          .status(200)
          .send({ message: "Community Suspended Successfully", result });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "User Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// Community Category Add Function :
const addCategoryFunction = async (req, res) => {
  try {
    const id = req.userId;
    const { action, type, categoryName, subCategoryName } = req.body;
    const file = req.file;
    const userIdRandom = String(id).slice(7, 12);
    const timestamp = Date.now();

    const buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "create") {
        let categoryImageUrl;
        if (file) {
          const params = {
            Bucket: process.env.S3_BUCKET,
            Key: `mb_img_${userIdRandom}_${timestamp}`,
            Body: file.buffer,
            ContentType: file.mimetype,
          };

          const command = new PutObjectCommand(params);
          await s3Client.send(command);
          categoryImageUrl = `https://`+process.env.S3_BUCKET+`.s3.ap-south-1.amazonaws.com/${params.Key}`;
        }

        let result;
        if (type == "category") {
          result = new communityCategoryModel({
            label: categoryName,
            value: categoryName,
            image: file ? categoryImageUrl : "",
            status: "Active",
            subCategory: [],
          });
        } else if (type == "subCategory") {
          result = await communityCategoryModel.findOneAndUpdate(
            {
              value: categoryName,
            },
            {
              $addToSet: {
                subCategory: {
                  label: subCategoryName,
                  value: subCategoryName,
                  image: file ? categoryImageUrl : "",
                  status: "Active",
                },
              },
            }
          );
        }
        await result.save();
        res.status(201).send({
          message: `Community ${
            type == "category" ? "Category" : "SubCategory"
          } Created Successfully`,
          result,
        });
      }
    } else res.status(400).send({ message: "Admin Does Not Exists" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

router.post(
  "/communityCategory",
  adminTokenValidation,
  upload.single("image"),
  addCategoryFunction
);

module.exports = router;
