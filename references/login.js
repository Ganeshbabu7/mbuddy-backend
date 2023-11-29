// const express = require('express');
// const router = express.Router();
// const db = require('../config/mySqlDbConfig')
// const { hashCompare,hashPassword,createToken } = require('../auth/auth.js'); 
// const { generateReferralCode,generateOTP,hashOtp } = require('../services/otpService');
// const {tokenValidation} = require('../auth/auth.js')

// // 1. User Signup :
// router.post('/signup',async(req,res)=>{
//   try {
//     db.query(`SELECT * FROM users WHERE LOWER(email) = LOWER(${db.escape(req.body.email)})`, 
//     async (err, result) => {
//       if (result.length) {
//         return res.status(400).send({message: 'Email Id already Exist'});
//       } 
//       else {
//         req.body.password = await hashPassword(req.body.password)
//         req.body.referralCode = await generateReferralCode(6)
//         // const otp = generateOTP(6);
//         // req.body.otp =  await hashOtp(otp);
//         db.query(`INSERT INTO users 
//         (deviceName, deviceType, deviceVersion, appVersion, fullName, email, countryCode, mobNo, dob, password, referralCode, createdAt) 
//         VALUES 
//         ('${req.body.deviceName}',
//         '${req.body.deviceType}',
//         '${req.body.deviceVersion}',
//         '${req.body.appVersion}',
//         '${req.body.fullName}',
//         '${req.body.email}',
//         '${req.body.countryCode}',
//         '${req.body.mobNo}',
//         '${req.body.dob}',
//         '${req.body.password}',
//         '${req.body.referralCode}',
//         CURRENT_TIMESTAMP)`,
//         (err, result) => {
//           if (err) return res.status(400).send({ message: err });
//           else return res.status(201).send({message: 'Registration successful! We have sent you an OTP, Please check your email or Mobile Number'})
//         })
//       } 
//     })
//   } 
//   catch (error) {
//     res.status(500).send({message:"Internal Server Error",error})
//   }
// })

// //  Test :
// router.post('/test',async(req,res)=>{
//   try {
//         db.query(`INSERT INTO test 
//         (userName,createdAt) 
//         VALUES 
//         ('${req.body.userName}',
//         CURRENT_TIMESTAMP)`,
//         (err, result) => {
//           if (err) return res.status(400).send({ message: err });
//           else return res.status(201).send({message: 'Test working'})
//         })
//   } 
//   catch (error) {
//     res.status(500).send({message:"Internal Server Error",error})
//   }
// })

// // CREATE TABLE `test` (
// //   `id` int NOT NULL PRIMARY KEY AUTO_INCREMENT,
// //   `userName` varchar(100),
// //   `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// // )

// // router.post('/signup', async (req, res) => {
// //   try {
// //     db.query(`SELECT * FROM users WHERE LOWER(email) = LOWER(${db.escape(req.body.email)})`,
// //       async (err, result) => {
// //         if (result.length) {
// //           return res.status(400).send({ message: 'Email Id already Exist' });
// //         } else {
// //           req.body.password = await hashPassword(req.body.password);
// //           req.body.referralCode = await generateReferralCode(6);
// //           // const otp = generateOTP(6);
// //           // req.body.otp =  await hashOtp(otp);
// //           db.query(`INSERT INTO users 
// //             (deviceName, deviceType, deviceVersion, appVersion, fullName, email, countryCode, mobNo, dob, password, referralCode, createdAt) 
// //             VALUES 
// //             ('${req.body.deviceName}',
// //             '${req.body.deviceType}',
// //             '${req.body.deviceVersion}',
// //             '${req.body.appVersion}',
// //             '${req.body.fullName}',
// //             '${req.body.email}',
// //             '${req.body.countryCode}',
// //             '${req.body.mobNo}',
// //             '${req.body.dob}',
// //             '${req.body.password}',
// //             '${req.body.referralCode}',
// //             CURRENT_TIMESTAMP)`,
// //             (err, result) => {
// //               if (err) return res.status(400).send({ message: err });
// //               else return res.status(201).send({ message: 'Registration successful! We have sent you an OTP, Please check your email or Mobile Number' });
// //             });
// //         }
// //       });
// //   } catch (error) {
// //     res.status(500).send({ message: "Internal Server Error", error });
// //   }
// // });

// // router.post('/signup', async (req, res) => {
// //   try {
// //     const emailCheckQuery = `SELECT * FROM users WHERE LOWER(email) = LOWER(${db.escape(req.body.email)})`;
// //     const emailCheckResult = await db.query(emailCheckQuery);

// //     if (emailCheckResult.length) {
// //       return res.status(400).send({ message: 'Email Id already exists' });
// //     }

// //     req.body.password = await hashPassword(req.body.password);
// //     req.body.referralCode = await generateReferralCode(6);
// //     // const otp = generateOTP(6);
// //     // req.body.otp =  await hashOtp(otp);

// //     const insertUserQuery = `INSERT INTO users 
// //       (deviceName, deviceType, deviceVersion, appVersion, fullName, email, countryCode, mobNo, dob, password, referralCode, createdAt) 
// //       VALUES 
// //       ('${req.body.deviceName}',
// //       '${req.body.deviceType}',
// //       '${req.body.deviceVersion}',
// //       '${req.body.appVersion}',
// //       '${req.body.fullName}',
// //       '${req.body.email}',
// //       '${req.body.countryCode}',
// //       '${req.body.mobNo}',
// //       '${req.body.dob}',
// //       '${req.body.password}',
// //       '${req.body.referralCode}',
// //       CURRENT_TIMESTAMP)`;

// //     await db.query(insertUserQuery);

// //     return res.status(201).send({ message: 'Registration successful! We have sent you an OTP. Please check your email or mobile number.' });
// //   } catch (error) {
// //     return res.status(500).send({ message: 'Internal Server Error', error });
// //   }
// // });


// // 2. User Login :
// router.post('/login',async(req,res)=>{
//   try {
//     let email = req.body.email;
//     let mobNo = req.body.mobNo;
//     let deviceName = req.body.device_name;
//     let deviceType = req.body.device_type;
//     let appVersion = req.body.appVersion;
//     let countryCode = req.body.countryCode;
//     let deviceVersion = req.body.device_version;
//     let user = db.query('SELECT * FROM users WHERE email =? OR mobNo =?', [email,mobNo], 
//         async function (err, data, fields) {
//           if(err) throw err 
//           if(data.length>0){
//             if(await hashCompare(req.body.password, data[0].password)){
//               let token = await createToken({fullName:user.fullName, email:user.email, mobNo:user.mobNo, dob:user.dob})
//               res.status(200).send({message:"Login Successfully",token})
//             }
//             else{
//               res.status(400).send({message:"Invalid Credentials"})
//             }
//           }
//           else{
//             res.status(400).send({ message: 'User does not exist'})
//           } 
//         })
//   } catch (error) {console.log(error)
//     res.status(500).send({message:"Internal Server Error",error})
//   }
// })

// // 3.Session Token:
// router.post('/sessions',async(req,res)=>{
//   try {
//     let userId = req.body.userId
//       if (userId == 0){
//         let users = db.query('SELECT * FROM users',
//         async function (err, data, fields) {
//           if(err) throw err 
//           if(data.length>0){ res.status(200).send({message:"User List",users}) }
//           else{ res.status(400).send({message:"Invalid User"}) }
//         })
//       }
//       if (userId != 0){
//         let user = db.query('SELECT * FROM users WHERE userId =?', [userId],
//         async function (err, data, fields) {
//           if(err) throw err 
//           if(data.length>0){ res.status(200).send({message:"User List",user}) }
//           else{ res.status(400).send({message:"Invalid User"}) }
//         })
//       }
//       if (!userId) {
//         db.query(`INSERT INTO mbToken 
//         (userId, deviceName, deviceVersion, appVersion, token, createdAt) 
//         VALUES 
//         ('${req.body.userId}',
//         '${req.body.deviceName}',
//         '${req.body.deviceType}',
//         '${req.body.deviceVersion}',
//         '${req.body.appVersion}',
//         '${req.body.token}',
//         '${req.body.createdAt}',
//         CURRENT_TIMESTAMP)`,
//         (err, result) => {
//           if (err) return res.status(400).send({ message: err });
//           else return res.status(201).send({message: 'Token Stored Successfully'})
//         })}
//       else {
//         return res.status(400).send({message:'User Id does not Exist'});
//       }}
//   catch (error) {
//     res.status(500).send({message:"Internal Server Error",error})
//   }
// })

// // 4.User Profile:
// router.get('/userProfile',tokenValidation,async(req,res)=>{
//   try {
//     let email = req.body.email;
//     let mobNo = req.body.mobNo;
//     let user = db.query('SELECT * FROM users WHERE email =? OR mobNo =?', [email,mobNo], 
//         async function (err, data, fields) {
//           if(err) throw err 
//           if(data.length>0){
//             res.status(200).send({message:"User Details",user})
//           }
//           else{
//             res.status(400).send({ message: 'User does not exist'})
//           } 
//         })
//   } catch (error) {console.log(error)
//     res.status(500).send({message:"Internal Server Error",error})
//   }
// })

// module.exports = router;

// // db.query(`use mybuddyapp;
// //         INSERT INTO mbToken 
// //         (userId, deviceName, deviceType, deviceVersion, appVersion, token, createdAt) 
// //         VALUES 
// //         ('${req.body.deviceName}',
// //         '${req.body.deviceType}',
// //         '${req.body.deviceVersion}',
// //         '${req.body.appVersion}',
// //         '${req.body.fullName}',
// //         '${req.body.email}',
// //         '${req.body.countryCode}',
// //         '${req.body.mobNo}',
// //         '${req.body.dob}',
// //         '${req.body.password}',
// //         '${req.body.referralCode}',
// //         CURRENT_TIMESTAMP)`,