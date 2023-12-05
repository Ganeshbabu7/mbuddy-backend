// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const {s3} = require('../config/awsConfig')
// // const multerS3 = require('multer-s3');
// const fs = require('fs');
// const path = require('path');
// // const s3Client = require('../config/awsConfig')

// // Images Uploading :
// // const imageStorage = multer.diskStorage({
// //     destination :(req, file, cb)=>{
// //         cb(null,'uploads/Images')
// //     },
// //     filename:(req, file, cb)=>{
// //         cb(null, file.originalname.replace(/\.[^/.]+$/,"")+ '_' + Date.now() + path.extname( file.originalname ) )
// //     }
// // })

// // const storage = multer.memoryStorage()
// // const storage = multer({
// //     s3: s3,
// //     bucket: 'mybuddy-sanorac',
// //     acl: 'public-read',
// //     // contentType: multerS3.AUTO_CONTENT_TYPE,
// //     key: function (req, file, cb) {
// //       cb(null, file.originalname);
// //     }

// //     // metadata: function (req, file, cb) {
// //     //     cb(null, { fieldName: file.fieldname });
// //     // },
// //     // key: function (req, file, cb) {
// //     //     cb(null, Date.now().toString())
// //     //   }
// //   });

// const imageMaxSize = 2 * 1000 * 1000;


// // const upload = multer({
// //     storage : storage,
// //     limits : {
// //         fileSize : imageMaxSize 
// //     },
// //     fileFilter : function (req, file, cb,){
// //     let filetypes = /jpeg|jpg|png/;

// //     let mimetype = filetypes.test(file.mimetype);
// //     let extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    
// //     if(mimetype && extname) return cb(null, true);
// //         cb("Error: File upload only supports the following filetypes: " + filetypes )
// //     }
// // }).single('photo');
// // }).array('photo',5);

// // Videos Uploading :

// // const videoStorage = multer.diskStorage({
// //     destination :(req, file, cb)=>{
// //         cb(null,'uploads/Videos')
// //     },
// //     filename:(req, file, cb)=>{
// //         cb(null, file.originalname.replace(/\.[^/.]+$/,"")+ '_' + Date.now() + path.extname( file.originalname ) )
// //     }
// // })

// const videoMaxSize = 5 * 1000 * 1000;

// const uploadVideo = multer({
//     storage : storage,
//     limits : {
//         fileSize : videoMaxSize 
//     },
//     fileFilter : function (req, file, cb,){
//     let filetypes = /mp4|mov|avi|wmv/;

//     let mimetype = filetypes.test(file.mimetype);
//     let extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    
//     if(mimetype && extname) return cb(null, true);
//         cb("Error: File upload only supports the following filetypes: " + filetypes )
//     }
// // }).single('photo');
// }).array('video',2);

// // Documents Uploading :

// // const documentStorage = multer.diskStorage({
// //     destination :(req, file, cb)=>{
// //         cb(null,'uploads/Documents')
// //     },
// //     filename:(req, file, cb)=>{
// //         cb(null, file.originalname.replace(/\.[^/.]+$/,"")+ '_' + Date.now() + path.extname( file.originalname ) )
// //     }
// // })

// const documentMaxSize = 2 * 1000 * 1000;

// const uploadDocument = multer({
//     storage : storage,
//     limits : {
//         fileSize : documentMaxSize 
//     },
//     fileFilter : function (req, file, cb,){
//     let filetypes = /doc|docx|xls|xlsx|pdf/;

//     let mimetype = filetypes.test(file.mimetype);
//     let extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    
//     if(mimetype && extname) return cb(null, true);
//         cb("Error: File upload only supports the following filetypes: " + filetypes )
//     }
// // }).single('photo');
// }).array('document',5);

// module.exports = {upload}

// //   const upload = multer({
// //     storage: multerS3({
// //       s3: s3,
// //       bucket: 'medium-test',
// //       acl: 'public-read',
// //       metadata: function (req, file, cb) {
// //         cb(null, {fieldName: file.fieldname});
// //       },
// //       key: function (req, file, cb) {
// //         cb(null, Date.now().toString())
// //       }
// //     })
// //   })

// // Reference :
// // router.post('/uploadImages',async (req, res, next)=>{
// //     try {
// //       uploadImage(req, res, async function (err){
// //         if(err) {
// //           if(err instanceof multer.MulterError && err.code == "LIMIT_FILE_SIZE"){
// //             return res.status(400).send("File size is maximum 2mb");
// //           }
// //           if(err instanceof multer.MulterError && err.code == "LIMIT_UNEXPECTED_FILE"){
// //             return res.status(400).send("You can't upload more than 5 Images");
// //           }
// //           res.status(400).send(err);
// //         }
// //         else{
//         //   let newImage = new imageModel ({
//         //     images:{
//         //       // data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
//         //       data : req.file.filename,
//         //       // data : req.file,
//         //       // contentType : req.file.mimetype
//         //       contentType : 'image/png'
//         //     }
//         //   })
  
//         //   let imageArray = [];
//         //   for (let i = 0; i < req.files.length; i++) {
//         //     imageArray.push({
//         //       data: req.files[i].filename,
//         //       contentType: req.files[i].mimetype
//         //     });
//         //   }
  
// //           let imageArray = [];
// //           for (let i = 0; i < req.files.length; i++) {
// //             imageArray.push({
// //               data: req.files[i].buffer,
// //               contentType: req.files[i].mimetype
// //             });
// //           }
          
// //           let newImage = new imageModel({
// //             images: imageArray
// //           });
  
// //           await newImage.save()
// //           res.status(201).send({message:"Image Uploaded Successfully!",_id: newImage._id})
// //         }
// //       })
// //     } catch (error) {
// //         res.status(500).send({message:"Internal Server Error",error})
// //     }
// //   })