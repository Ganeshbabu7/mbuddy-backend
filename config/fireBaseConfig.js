// const admin = require("firebase-admin");

// const serviceAccount = require("path/to/serviceAccountKey.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// const sendOtpMessage = async ({mobileNumber, otp}) => {
//     const message = {
//       notification: {
//         title: "OTP Verification",
//         body: `Your OTP is: ${otp}`
//       },
//       android: {
//         priority: "high"
//       },
//       token: mobileNumber // Use the user's device token as the recipient
//     };
  
//     // Send the message using the Firebase Admin SDK
//     const response = await admin.messaging().send(message);
  
//     console.log("OTP message sent:", response);
//   }

// module.exports = {sendOtpMessage}
