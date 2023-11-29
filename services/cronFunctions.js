const cron = require("node-cron");
const { eventModel } = require("../schema/eventsSchema");
const { storyModel } = require("../schema/storiesSchema");

const deleteOldStoriesCron = async () => {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
  try {
    const result = await storyModel.deleteMany({
      createdAt: { $lt: twentyFourHoursAgo },
      isActive: true,
    });
  } catch (error) {
    console.error("Error deleting stories:", error);
  }
};

const updateInactiveEventsCron = async () => {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
  try {
    const result = await eventModel.updateMany(
      {
        endDate: { $lt: new Date() },
        isActive: true,
      },
      { $set: { isActive: false } }
    );
  } catch (error) {
    console.error("Error updating events:", error);
  }
};

const runCronJobs = () => {
  cron.schedule("* * * * *", deleteOldStoriesCron);
  cron.schedule("0 0 * * *", updateInactiveEventsCron);
};

module.exports = runCronJobs;
