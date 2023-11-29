// Buddy Pipeline :
const buddysPipeline = async (currentPage, pageSize) => {
  return [
    {
      $project: {
        _idString: { $toString: "$_id" },
        userName: 1,
        fullName: 1,
        createdAt: 1,
        isVerified: 1,
        countryCode: 1,
        lastActive: 1,
        mobNo: 1,
        emailId: 1,
        buddyStatus: 1,
      },
    },
    {
      $lookup: {
        from: "buds",
        localField: "_idString",
        foreignField: "userId",
        as: "Buds",
      },
    },
    {
      $addFields: {
        budsCount: { $size: "$Buds" },
      },
    },
    {
      $lookup: {
        from: "buddyfollowerdetails",
        localField: "_idString",
        foreignField: "userId",
        as: "followers",
      },
    },
    {
      $addFields: {
        followersCount: {
          $size: {
            $filter: {
              input: "$followers",
              as: "follower",
              cond: {
                $eq: ["$$follower.status", "Accepted"],
              },
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        userName: 1,
        fullName: 1,
        createdAt: 1,
        isVerified: 1,
        countryCode: 1,
        emailId: 1,
        mobNo: 1,
        emailId: 1,
        budsCount: 1,
        followersCount: 1,
        buddyStatus: 1,
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
const budsPipeline = async (currentPage, pageSize) => {
  return [
    {
      $project: {
        _id: 1,
        userId: 1,
        budType: 1,
        likeCount: 1,
        commentCount: 1,
        buddyDetails: 1,
        budStatus: 1,
        adminComment: 1,
        createdAt: 1,
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
const communityPipeline = async (currentPage, pageSize) => {
  return [
    {
      $addFields: {
        userIdObjectId: { $toObjectId: "$userId" },
        // adminIdObjectId: { $toObjectId: "$adminId" },
      },
    },
    {
      $lookup: {
        from: "buddys",
        localField: "userIdObjectId",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $unwind: "$ownerDetails",
    },
    // {
    //   $lookup: {
    //     from: "buddys",
    //     localField: "adminIdObjectId",
    //     foreignField: "_id",
    //     as: "adminDetails",
    //   },
    // },
    // {
    //   $unwind: "$adminDetails",
    // },
    {
      $lookup: {
        from: "teams",
        localField: "communityId",
        foreignField: "_idString",
        as: "teams",
      },
    },
    {
      $addFields: {
        members: { $size: "$buddysList" },
        teamsCount: { $size: "$teams" },
      },
    },
    {
      $project: {
        status: 1,
        userId: 1,
        communityName: 1,
        selectCategory: 1,
        selectSubCategory: 1,
        communityGuidelines: 1,
        adminComment: 1,
        ownerDetails: 1,
        members: 1,
        teamsCount: 1,
        mobNo: 1,
        // adminDetails: 1,
        adminComment: 1,
        createdAt: 1,
        updatedAt: 1,
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
const eventPipeline = async (currentPage, pageSize) => {
  return [
    {
      $addFields: {
        userIdObjectId: { $toObjectId: "$userId" },
      },
    },
    {
      $lookup: {
        from: "buddys",
        localField: "userIdObjectId",
        foreignField: "_id",
        as: "eventOwnerDetails",
      },
    },
    {
      $unwind: "$eventOwnerDetails",
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        eventName: 1,
        eventCategory: 1,
        eventType: 1,
        startDate: 1,
        endDate: 1,
        eventStatus: {
          $cond: {
            if: {
              $gt: ["$startDate", new Date()],
            },
            then: "Upcoming",
            else: {
              $cond: {
                if: {
                  $lt: ["$endDate", new Date()],
                },
                then: "Ended",
                else: "Active",
              },
            },
          },
        },
        eventPostType: {
          $cond: {
            if: {
              $eq: ["$communityId", "None"],
            },
            then: "Community",
            else: "Self Organized",
          },
        },
        eventLocationTitle: 1,
        registeredTicketCount: 1,
        eventOwnerDetails: 1,
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

// Community Category Pipeline :
const communityCategoryPipeline = async (currentPage, pageSize) => {
  return [
    {
      $lookup: {
        from: "communities",
        localField: "value",
        foreignField: "selectCategory",
        as: "communitiesCategory",
      },
    },
    {
      $project: {
        _id: 1,
        value: 1,
        image: 1,
        status: 1,
        subcategoryCount: { $size: "$subCategory" },
        communityCount: { $size: "$communitiesCategory" },
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
    // {
    //   $unwind: "$communitiesCategory",
    // },
    // {
    //   $group: {
    //     _id: null,
    //     uniqueSelectCategories: {
    //       $addToSet: "$communitiesCategory.selectSubCategory",
    //     },
    //     uniqueSelectSubCategories: {
    //       $addToSet: "$communitiesCategory.selectSubCategory",
    //     },
    //   },
    // },
    // {
    //   $project: {
    //     _id: 0, // Exclude _id field if not needed
    //     uniqueSelectSubCategories: { $size: "$uniqueSelectSubCategories" },
    //   },
    // },
  ];
};

// Community Category Pipeline :
const eventCategoryPipeline = async (currentPage, pageSize) => {
  return [
    {
      $lookup: {
        from: "event details",
        localField: "value",
        foreignField: "eventCategory",
        as: "eventDetails",
      },
    },
    {
      $project: {
        _id: 1,
        value: 1,
        image: 1,
        status: 1,
        eventCount: { $size: "$eventDetails" },
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
  budsPipeline,
  eventPipeline,
  buddysPipeline,
  communityPipeline,
  eventCategoryPipeline,
  communityCategoryPipeline,
};
