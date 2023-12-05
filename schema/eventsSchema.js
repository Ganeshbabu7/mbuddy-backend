// Use Mongoose :
const mongoose = require("mongoose");
const validator = require("validator");

// Event Schema :
const eventSchema = new mongoose.Schema(
  {
    userId: { type: String, require: true },
    communityId: { type: String, default: "" },
    // teamId: { type: String },
    // subTeamId: { type: String },
    eventName: { type: String },
    eventCategory: { type: String },
    eventType: { type: String },
    startDate: { type: String },
    startTime: { type: String },
    endDate: { type: String },
    endTime: { type: String },
    aboutEvent: { type: String },
    eventTermsAndCondition: { type: String },
    eventPrivacy: { type: String },
    eventLocationTitle: { type: String },
    eventLocationDetails: {
      lat: { type: String },
      long: { type: String },
      address: { type: String },
    },
    supportContact1: { type: String },
    supportContact2: { type: String },
    ticketType: { type: String },
    ticketPriceCurrency: { type: String },
    ticketPrice: { type: Number },
    totalParticipants: { type: Number },
    ticketCountPerParicipant: { type: Number },
    ticketPurchaseDeadlineDate: { type: String },
    choosePayoutMethod: { type: String },
    maybeList: { type: Array, default: [] },
    intrestedList: { type: Array, default: [] },
    favouriteList: { type: Array, default: [] },
    registeredList: { type: Array, default: [] },
    registeredTicketCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    coverPic: { type: Array },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Event Details" }
);

const ticketDeatils = new mongoose.Schema(
  {
    userId: { type: String, require: true },
    eventId: { type: String, require: true },
    eventName: { type: String },
    eventLocation: { type: Object },
    eventDate: { type: Date },
    eventTime: { type: String },
    eventVenue: { type: String },
    noOfSeat: { type: String },
    communityOrganized: {
      communityId: { type: String },
      communityName: { type: String },
      communityCategory: { type: String },
    },
    eventPic: { type: Array },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Event Ticket Details" }
);

const withDrawBankAccountSchema = new mongoose.Schema(
  {
    yourAccountName: { type: String },
    bankName: { type: String },
    accountNo: { type: String, required: true },
    ifscCode: { type: String },
    bankBranch: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Bank Account Details" }
);

const upiAccountSchema = new mongoose.Schema(
  {
    yourUpiAddress: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Upi Account Details" }
);

const transactionsHistorySchema = new mongoose.Schema(
  {
    userId: { type: String, require: true },
    eventId: { type: String, require: true },
    typeOfTransaction: { type: String },
    transactionDate: { type: Date },
    transactionTime: { type: String },
    transactionAmount: { type: String },
    transactionStatus: { type: String },
    buddyDetails: {
      _id: { type: String },
      fullName: { type: String },
      isVerified: { type: String },
      userName: { type: String },
      profilePic: { type: String },
      title: { type: String },
      district: { type: String },
      state: { type: String },
      country: { type: String },
    },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Event Transaction Details" }
);

// Event Category Schema :
const eventCategorySchema = new mongoose.Schema(
  {
    label: { type: String },
    value: { type: String },
    image: { type: String },
    status: { type: String },
  },
  { timestamps: true },
  { versionKey: false },
  { collection: "Event Category" }
);

const eventModel = mongoose.model("Event Details", eventSchema);
const upiAccountModel = mongoose.model("Upi Account Details", upiAccountSchema);
const eventCategoryModel = mongoose.model(
  "Event Category",
  eventCategorySchema
);
const ticketDeatilsModel = mongoose.model(
  "Event Ticket Details",
  ticketDeatils
);

const withDrawBankAccountModel = mongoose.model(
  "Bank Account Details",
  withDrawBankAccountSchema
);
const transactionsHistoryModel = mongoose.model(
  "Event Transaction Details",
  transactionsHistorySchema
);

module.exports = {
  eventModel,
  upiAccountModel,
  eventCategoryModel,
  ticketDeatilsModel,
  withDrawBankAccountModel,
  transactionsHistoryModel,
};
