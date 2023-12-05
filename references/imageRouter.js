// const express = require("express");
// const router = express.Router();
// const mongoose = require("mongoose");
// // const { tokenValidation } = require("../auth/auth.js");
// const { dbUrl } = require("../config/mongoDbConfig.js");
// const { imageModel } = require("../schema/budsSchema.js");

// // Connection Mongo DB :
// mongoose.set("strictQuery", true);
// mongoose.connect(dbUrl);

// app.post('/api/upload', async (req, res) => {
//     await fileparser(req)
//     .then(data => {
//       res.status(200).json({
//         message: "Success",
//         data
//       })
//     })
//     .catch(error => {
//       res.status(400).json({
//         message: "An error occurred.",
//         error
//       })
//     })
//   });
  
//   app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}.`);
//   })

// ______________________________________________________________________
// const express = require("express");
// const router = express.Router();
// // const multer = require("multer");
// // const AWS = require("aws-sdk");
// const { v4: uuidv4 } = require("uuid");
// const mongoose = require("mongoose");
// const { dbUrl } = require("../config/mongoDbConfig.js");
// const { tokenValidation } = require("../auth/auth.js");

// mongoose.set("strictQuery", true);
// mongoose.connect(dbUrl);

// // Javascript v3 :
// const { S3Client, Upload } = require("@aws-sdk/client-s3");
// const s3Client = new S3Client({ region: "your-aws-region" });

// router.post(
//   "/upload",
//   tokenValidation,
//   upload.array("photo", 5),
//   async (req, res) => {
//     const id = req.userId;
//     const uploadImages = async (req, res) => {
//       const files = req.files;
//       if (!files || files.length === 0) {
//         return res.status(400).json({ message: "No files provided" });
//       }

//       const uploadPromises = files.map((file) => {
//         const params = {
//           Bucket: "mybuddy-sanorac",
//           Key: `MB_Img_${uuidv4()}_${file.originalname}`,
//           Body: file.buffer,
//         };

//         const uploadCommand = new Upload(params, { client: s3Client });

//         return uploadCommand
//           .promise()
//           .then((data) => {
//             const imageUrl = data.Location;
//             const image = new imageModel({
//               userId: id,
//               imageType: imageType,
//               imageUrl: imageUrl,
//             });
//             return image.save();
//           })
//           .catch((error) => {
//             console.error(error);
//             throw error;
//           });
//       });

//       try {
//         const images = await Promise.all(uploadPromises);
//         res.status(201).send({
//           message: "Images uploaded successfully",
//           images: images,
//         });
//       } catch (error) {
//         console.error(error);
//         res.status(500).send({ message: "Image Uploading Error" });
//       }
//     };
//   }
// );

// // Configure AWS S3
// AWS.config.update({
//   accessKeyId: 'AKIATMT6IRHDSS2EKPPJ',
//   secretAccessKey: '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',
//   region: 'ap-south-1',
// });

// const s3 = new AWS.S3();

// // Configure Multer storage for file uploads
// const storage = multer.memoryStorage();
// const upload = multer({ storage });

// // const storage = multer({
// //     s3: s3Client,
// //     bucket: 'mybuddy-sanorac',
// //     acl: 'public-read',
// //     // contentType: multerS3.AUTO_CONTENT_TYPE,
// //     key: function (req, file, cb) {
// //       cb(null, file.originalname);
// //     }
// //   });

// // Mongoose Connect :
// mongoose.set('strictQuery',true)
// mongoose.connect(dbUrl)

// const ImageSchema = new mongoose.Schema({
//   url: String,
// });

// const Image = mongoose.model('Image', ImageSchema);

// const router = express();

// // Upload image route
// router.post('/upload', upload.single('image'), (req, res) => {
//   const file = req.file;

//   if (!file) {
//     return res.status(400).json({ message: 'No file provided' });
//   }

//   const params = {
//     Bucket: 'mybuddy-sanorac',
//     Key: `${uuidv4()}_${file.originalname}`,
//     Body: file.buffer,
//   };

//   s3.upload(params, async (err, data) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).json({ message: 'Error uploading image',err });
//     }

//     const imageUrl = data.Location;

//     try {
//       // Save the image URL to MongoDB
//       const image = new Image({ url: imageUrl });
//       await image.save();

//       res.status(201).json({ message: 'Image uploaded successfully', imageUrl });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: 'Error saving image URL' });
//     }
//   });
// });

// Updated 07-01-2023 _______________________________________________________________________________________

// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const AWS = require("aws-sdk");
// const { v4: uuidv4 } = require("uuid");
// const mongoose = require("mongoose");
// const { tokenValidation } = require("../auth/auth.js");
// const { dbUrl } = require("../config/mongoDbConfig.js");
// const { imageModel } = require("../schema/budsSchema.js");
// const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// // Connection Mongo DB :
// mongoose.set("strictQuery", true);
// mongoose.connect(dbUrl);

// // AWS S3 configuration
// const s3Client = new S3Client({ region: "ap-south-1" });

// // Define the imageModel schema and model here
// const upload = multer(); // Create multer instance

// const uploadImages = async (req, res) => {
//   const id = req.userId;
//   const files = req.files;
//   const userIdRandom = String(id).slice(7, 12);
//   const timestamp = Date.now();
//   const date = new Date(timestamp);
//   const s3DateFormat = date.toISOString().split('T')[0];

//   if (!files || files.length === 0) {
//     return res.status(400).json({ message: "No files provided" });
//   }

//   const uploadPromises = files.map((file) => {
//     const params = {
//       Bucket: "mybuddy-sanorac",
//       Key: `MB_Img_${userIdRandom}_${s3DateFormat}`,
//       Body: file.buffer,
//     };

//     const command = new PutObjectCommand(params);

//     return s3Client
//       .send(command)
//       .then(() => {
//         const imageUrl = `https://mybuddy-sanorac.s3.ap-south-1.amazonaws.com/${params.Key}`;
//         const image = new imageModel({
//           userId: id,
//           imageType: "Testing", // Make sure to define and assign a value to imageType
//           imageUrl: imageUrl,
//         });
//         return image.save();
//       })
//       .catch((error) => {
//         console.error(error);
//         throw error;
//       });
//   });

//   try {
//     const images = await Promise.all(uploadPromises);
//     res.status(201).send({
//       message: "Images uploaded successfully",
//       images: images,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ message: "Image Uploading Error" });
//   }
// };

// router.post("/upload", tokenValidation, upload.array("photo", 5), uploadImages);

// module.exports = router;