require("dotenv").config();
const FCM = require("fcm-node");
let fcm;

const fcmInit = () => {
  fcm = new FCM(process.env.FIREBASE_SERVER_KEY);
};

const sendPushNotification = (data) => {
  return new Promise((resolve, reject) => {
    var message = {
      to: data.token,
      notification: {
        title: data.title,
        body: data.body,
        image: data.image,
      },
      apns: {
        payload: {
          aps: {
            "mutable-content": 1,
          },
        },
        fcm_options: {
          image: data.image,
        },
      },
    };

    fcm.send(message, function (err, response) {
      if (err) {
        console.log("Something has gone wrong!", err);
      } else {
        console.log("Successfully sent with response: ", response);
        resolve(message);
      }
    });
  });
};

module.exports = { fcmInit, sendPushNotification };

// const admin = require("firebase-admin");

// const serviceAccount = require("../my-buddy-app-7925e-firebase-adminsdk-gna4n-3c678f51a8.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// const sendPushNotification = async (token, notification) => {
//   admin
//     .messaging()
//     .sendToDevice(token, {
//       notification: notification,
//     })
//     .then((response) => {
//       console.log("Notification sent successfully:", response);
//     })
//     .catch((error) => {
//       console.error("Error sending notification:", error);
//     });
// };

// module.exports = { sendPushNotification };