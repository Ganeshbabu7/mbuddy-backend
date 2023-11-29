// Buddys Report Pipeline :
const buddysReportPipeline = async (currentPage, pageSize) => {
  return [
    {
      $addFields: {
        adminIdObjectId: { $toObjectId: "$adminDetails.userId" },
        userIdObjectId: { $toObjectId: "$otherUserId" },
        reportCount: { $size: "$reportedBy" },
      },
    },
    {
      $lookup: {
        from: "buddys",
        localField: "userIdObjectId",
        foreignField: "_id",
        as: "buddysDetails",
      },
    },
    {
      $lookup: {
        from: "buddys",
        localField: "adminIdObjectId",
        foreignField: "_id",
        as: "adminDetails",
      },
    },
    {
      $project: {
        adminIdObjectId: 0,
        userIdObjectId: 0,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: (currentPage - 1) * pageSize,
    },
    {
      $limit: pageSize,
    },
  ];
};

// Buds Pipeline :
const budsReportPipeline = async (currentPage, pageSize) => {
  return [
    {
      $addFields: {
        adminIdObjectId: { $toObjectId: "$adminDetails.userId" },
        budIdObjectId: { $toObjectId: "$budId" },
        reportCount: { $size: "$reportedBy" },
      },
    },
    {
      $lookup: {
        from: "buds",
        localField: "budIdObjectId",
        foreignField: "_id",
        as: "budsDetails",
      },
    },
    {
      $lookup: {
        from: "buddys",
        localField: "adminIdObjectId",
        foreignField: "_id",
        as: "adminDetails",
      },
    },
    {
      $project: {
        adminIdObjectId: 0,
        budIdObjectId: 0,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: (currentPage - 1) * pageSize,
    },
    {
      $limit: pageSize,
    },
  ];
};

// Comments Pipeline :
const commentsReportPipeline = async (currentPage, pageSize) => {
  return [
    {
      $addFields: {
        adminIdObjectId: { $toObjectId: "$adminDetails.userId" },
        commentIdObjectId: { $toObjectId: "$commentId" },
        budIdObjectId: { $toObjectId: "$budId" },
        reportCount: { $size: "$reportedBy" },
      },
    },
    {
      $lookup: {
        from: "buds",
        localField: "budIdObjectId",
        foreignField: "_id",
        as: "budsDetails",
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "commentIdObjectId",
        foreignField: "_id",
        as: "commentDetails",
      },
    },
    {
      $lookup: {
        from: "buddys",
        localField: "adminIdObjectId",
        foreignField: "_id",
        as: "adminDetails",
      },
    },
    {
      $project: {
        budIdObjectId: 0,
        adminIdObjectId: 0,
        commentIdObjectId: 0,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: (currentPage - 1) * pageSize,
    },
    {
      $limit: pageSize,
    },
  ];
};

// Story Pipeline :
const storiesReportPipeline = async (currentPage, pageSize) => {
  return [
    {
      $addFields: {
        adminIdObjectId: { $toObjectId: "$adminDetails.userId" },
        storyIdObjectId: { $toObjectId: "$storyId" },
        reportCount: { $size: "$reportedBy" },
      },
    },
    {
      $lookup: {
        from: "stories",
        localField: "storyIdObjectId",
        foreignField: "_id",
        as: "storyDetails",
      },
    },
    {
      $lookup: {
        from: "buddys",
        localField: "adminIdObjectId",
        foreignField: "_id",
        as: "adminDetails",
      },
    },
    {
      $project: {
        adminIdObjectId: 0,
        storyIdObjectId: 0,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: (currentPage - 1) * pageSize,
    },
    {
      $limit: pageSize,
    },
  ];
};

// Chat Pipeline :
const chatsReportPipeline = async (currentPage, pageSize) => {
  return [
    {
      $addFields: {
        adminIdObjectId: { $toObjectId: "$adminDetails.userId" },
        chatIdObjectId: { $toObjectId: "$chatId" },
        reportCount: { $size: "$reportedBy" },
      },
    },
    {
      $lookup: {
        from: "messages",
        localField: "chatIdObjectId",
        foreignField: "_id",
        as: "chatDetails",
      },
    },
    {
      $lookup: {
        from: "buddys",
        localField: "adminIdObjectId",
        foreignField: "_id",
        as: "adminDetails",
      },
    },
    {
      $project: {
        adminIdObjectId: 0,
        chatIdObjectId: 0,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: (currentPage - 1) * pageSize,
    },
    {
      $limit: pageSize,
    },
  ];
};

// Community Pipeline :
const communitiesReportPipeline = async (currentPage, pageSize) => {
  return [
    {
      $addFields: {
        adminIdObjectId: { $toObjectId: "$adminDetails.userId" },
        communityIdObjectId: { $toObjectId: "$communityId" },
        subTeamIdObjectId: { $toObjectId: "$subTeamId" },
        teamIdObjectId: { $toObjectId: "$teamId" },
        reportCount: { $size: "$reportedBy" },
      },
    },
    {
      $lookup: {
        from: "communities",
        localField: "communityIdObjectId",
        foreignField: "_id",
        as: "communityDetails",
      },
    },
    {
      $lookup: {
        from: "teams",
        localField: "teamIdObjectId",
        foreignField: "_id",
        as: "teamDetails",
      },
    },
    {
      $lookup: {
        from: "subteams",
        localField: "subTeamIdObjectId",
        foreignField: "_id",
        as: "subTeamDetails",
      },
    },
    {
      $lookup: {
        from: "buddys",
        localField: "adminIdObjectId",
        foreignField: "_id",
        as: "adminDetails",
      },
    },
    {
      $project: {
        communityIdObjectId: 0,
        subTeamIdObjectId: 0,
        adminIdObjectId: 0,
        teamIdObjectId: 0,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: (currentPage - 1) * pageSize,
    },
    {
      $limit: pageSize,
    },
  ];
};

// Events Pipeline :
const eventsReportPipeline = async (currentPage, pageSize) => {
  return [
    {
      $addFields: {
        adminIdObjectId: { $toObjectId: "$adminDetails.userId" },
        eventIdObjectId: { $toObjectId: "$eventId" },
        reportCount: { $size: "$reportedBy" },
      },
    },
    {
      $lookup: {
        from: "events",
        localField: "chatIdObjectId",
        foreignField: "_id",
        as: "eventDetails",
      },
    },
    {
      $lookup: {
        from: "buddys",
        localField: "eventIdObjectId",
        foreignField: "_id",
        as: "adminDetails",
      },
    },
    {
      $project: {
        adminIdObjectId: 0,
        eventIdObjectId: 0,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: (currentPage - 1) * pageSize,
    },
    {
      $limit: pageSize,
    },
  ];
};

module.exports = {
  budsReportPipeline,
  chatsReportPipeline,
  eventsReportPipeline,
  buddysReportPipeline,
  storiesReportPipeline,
  commentsReportPipeline,
  communitiesReportPipeline,
  // reportPipelineFunction,
};
