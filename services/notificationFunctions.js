const {
  notificationModel,
  communityNotificationModel,
} = require("../schema/notificationSchema");
const { sendPushNotification } = require("../config/notificationConfig");
const { buddyFollowerDetailsModel } = require("../schema/buddysSchema");
const { buddyDetails } = require("./buddyFunctions");
const { imageModel, budsModel } = require("../schema/budsSchema");

// Notification Controller :
const pushNotification = async (type, data) => {
  if (type == "community") {
    const result = new communityNotificationModel(data);
    await result.save();
  } else if (type == "none") {
    const result = new notificationModel(data);
    await result.save();
  }
  // sendPushNotification(notification);
};

// Notification Read Function :
const ntfReadFunction = async (res, id, model, skip) => {
  try {
    const following = await buddyFollowerDetailsModel
      .find({ $and: [{ followId: id }, { status: "Accepted" }] })
      .distinct("userId");

    const notificationList = await model
      .find({
        userId: { $in: following },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(50);

    const resultPromises = notificationList.map(async (e) => {
      let readCheck = await model.findOne({
        $and: [
          { userId: e.userId },
          { budId: e.budId },
          { readBy: { $in: id } },
        ],
      });
      let buddyDetail = await buddyDetails(e.userId);
      let bud = await budsModel.findOne({ _id: e.budId });
      let budDetails;
      if (bud) {
        if (bud.budType == "image") {
          budDetails = bud.image[0].imageUrl;
        } else if (bud.budType == "video") {
          budDetails = bud.video[0].thumbnailUrl;
        }
      } else {
        budDetails = "none";
      }
      let response = {
        ...e.toObject(),
        buddyDetail: buddyDetail,
        budType: bud ? bud.budType : "none",
        budDetail: budDetails ? budDetails : "none",
        isRead: readCheck ? true : false,
      };
      return response;
    });
    const result = await Promise.all(resultPromises);
    const unreadNtfCount = result.filter((e) => e.isRead === true).length;
    res.status(200).send({ message: "Notification List", result });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

// Notification Count Function :
const ntfCountFunction = async (res, id, model) => {
  try {
    const following = await buddyFollowerDetailsModel
      .find({ $and: [{ followId: id }, { status: "Accepted" }] })
      .distinct("userId");

    const notificationList = await model.find({ userId: { $in: following } });
    const resultPromises = notificationList.map(async (e) => {
      let readCheck = await model.findOne({
        $and: [
          { userId: e.userId },
          { budId: e.budId },
          { readBy: { $in: id } },
        ],
      });
      let response = {
        isRead: readCheck ? true : false,
      };
      return response;
    });
    const result = await Promise.all(resultPromises);
    const unreadNtfCount = result.filter((e) => e.isRead == false).length;
    res.status(200).send({ message: "Notification Count", unreadNtfCount });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

// Notification Messages :
const generalNotifications = {
  birthdayMessage: (name) => {
    return `Wish ${name} a happy birthday`;
  },
};

const buddyNotifications = {
  viewMessage: (name) => {
    return `${name} Liked your bud`;
  },
  followMessage: (name) => {
    return `${name} Liked your bud`;
  },
};

const budNotifications = {
  tagMessage: () => {},
  mentionMessge: () => {},
  likeMessage: (name) => {
    return `${name} Liked your bud`;
  },
  commentMessage: (name) => {
    return `${name} Commented on your bud`;
  },
  likeCommentMessage: (name) => {
    return `${name} Liked your comment`;
  },
  replyCommentMessage: (name) => {
    return `${name} Replied  on your comment`;
  },
  reBudMessage: (name) => {
    return `${name} rebuded your bud`;
  },
  giftMessage: (name) => {
    return `${name} Gifted to your bud`;
  },
};

const chatNotification = {
  chatMessage: (name) => {
    return `${name} has sent you a message`;
  },
};

module.exports = {
  ntfReadFunction,
  ntfCountFunction,
  pushNotification,
  generalNotifications,
  buddyNotifications,
  budNotifications,
  chatNotification,
};
