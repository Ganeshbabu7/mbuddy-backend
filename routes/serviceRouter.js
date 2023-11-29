// const express = require('express');
// const router = express.Router();
// const { mongoose } = require('mongoose');
// const { dbUrl } = require ('../config/mongoDbConfig')
// const {tokenValidation} = require('../auth/auth.js')
// const {generateOTP,hashOtp,hashCompareOtp} = require('../services/otpService')
// const {profileVerificationModel,otpVerificationModel} = require('../schema/verificationSchema.js')

// // Mongoose Connect :
// mongoose.set('strictQuery',true)
// mongoose.connect(dbUrl)

// // 2-Email Verification
// router.post('/emailVerification',tokenValidation,async(req,res)=>{
//   try {
//     let buddys = await buddysModel.find({},{userName:1,email:1})
//     for(e in buddys)
//     {
//       await MailService({
//         userName:leads[e].firstName,
//         email:leads[e].email,
//         subject:req.body.subject,
//         message:req.body.message
//       })
//       break;
//     }
//     res.status(200).send({
//       message:"Email Sent Successfully",
//     })
//   } catch (error) {
//     console.log(error)
//     res.status(500).send({message:"Internal Server Error",error})
//   }
// })

// // 3-Profile Verifiction:
// router.post('/profileVerification',tokenValidation,async(req,res)=>{
//   try {
//     let doc = new profileVerificationModel(req.body)
//     await doc.save()
//     res.status(201).send({message:"Profile Verified Successfully"})
//   }
//   catch (error) {
//     console.log(error);  
//     res.status(500).send({message:"Internal Server Error",error})
//   }
// })

// module.exports = router;

// // 1-Sending OTP : Will comes under sign in :
// // router.post('/sendOtp',async(req,res)=>{
// //   try {
// //     let mobileNumber = req.body.mobileNumber
// //     // let buddy = db.query(`SELECT * FROM users (mobNo) VALUES ('${req.body.mobNo}')`)
// //     // const buddy = await buddysModel.findOne({ mobileNumber });
// //     if (!mobileNumber) { 
// //       res.status(400).send({message: "Please Enter Mobile Number"}) 
// //     }
// //     else{
// //       const otp = generateOTP(6);
// //       req.body.otp =  hashOtp(otp);
      
// //       // save otp to user collection
// //       // user.phoneOtp = otp;
// //       // user.isAccountVerified = true;
// //       // await user.save();
// //       // send otp to phone number
// //       // await fast2sms(
// //       //   {
// //       //     message: `Your OTP is ${otp}`,
// //       //     contactNumber: user.phone,
// //       //   },
// //       //   next
// //       // );
// //       res.status(201).send({message: "OTP sended to your registered phone number",
// //         data: {
// //           userId: user._id,
// //         },
// //       });
// //     }
// //   } catch (error) {
// //       res.status(500).send({message:"Internal Server Error", error})
// //   }
// // })