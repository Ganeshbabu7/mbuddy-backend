const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { dbUrl } = require("../config/mongoDbConfig.js");
const { tokenValidation, createAdminToken } = require("../auth/auth.js");
const { hashCompare, hashPassword, createToken } = require("../auth/auth.js");
const { sendOtpToEmail, sendOtpToMobno } = require("../config/msg91Config.js");
const {
  otpModel,
  tokenModel,
  BuddysModel,
  referralModel,
} = require("../schema/loginSchema.js");
const {
  generateReferralCode,
  generateUsername,
  generateOTP,
  hashOtp,
  hashCompareOtp,
  createOtpToken,
  otpValidation,
} = require("../services/loginFunctions.js");

// Mongoose Connect :
mongoose.set("strictQuery", true);
mongoose.connect(dbUrl);
// Listen for the connection error
mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err.message);
});

// 1. Buddy Registration :
router.post("/signup", async (req, res) => {
  try {
    const {
      fullName,
      type,
      email,
      email_mobNo,
      countryCode,
      mobNo,
      dob,
      password,
      referredByCode,
    } = req.body;

    // Check if either email or mobile number is provided
    if (!email && !email_mobNo) {
      return res
        .status(400)
        .json({ message: "Email or mobile number is required" });
    }

    let existingUser;

    // Check if email is already registered
    if (type === "email") {
      existingUser = await BuddysModel.findOne({
        $and: [{ emailId: email_mobNo }, { mobNo: "" }],
        countryCode,
      });
      if (existingUser)
        return res.status(400).json({ message: "Email is already registered" });
    }

    // Check if mobile number is already registered
    if (type === "mobNo") {
      existingUser = await BuddysModel.findOne({
        $and: [{ emailId: "" }, { mobNo: email_mobNo }],
        countryCode,
      });
      if (existingUser)
        return res
          .status(400)
          .json({ message: "Mobile number is already registered" });
    }

    // Generate OTP and hash it
    const otpLength = 6;
    const Otp = await generateOTP(otpLength);
    const hash = await hashOtp(Otp);

    // Create the OTP record
    let otpSave;
    if (type === "email") {
      // await sendOtpToEmail({mailTo : email_mobNo, otp : Otp})
      await sendOtpToEmail({
        userName: fullName,
        userEmail: email_mobNo,
        otp: Otp,
      });
      otpSave = new otpModel({
        emailId: email_mobNo,
        countryCode: "",
        mobNo: "",
        otp: hash,
      });
    } else if (type === "mobNo") {
      await sendOtpToMobno({
        otp: Otp,
        countryCode: req.body.countryCode,
        mobNo: email_mobNo,
      });
      otpSave = new otpModel({
        emailId: "",
        countryCode,
        mobNo: email_mobNo,
        otp: hash,
      });
    }
    await otpSave.save();

    // Generate User Name :
    const genUserName = await generateUsername(fullName, dob);

    // If Buddy entered referredByCode :
    if (referredByCode) {
      let referralCode = await BuddysModel.findOne({
        referralCode: referredByCode,
      });
      if (referralCode) {
        let result = new referralModel({
          referredBy: referralCode._id,
          referredTo: email_mobNo,
          referralCode: referredByCode,
        });
        await result.save();

        // Create the buddy user
        const buddy = new BuddysModel({
          fullName: req.body.fullName,
          emailId: type === "email" ? email_mobNo : "",
          mobNo: type === "mobNo" ? email_mobNo : "",
          countryCode: req.body.countryCode,
          dob: req.body.dob,
          password: await hashPassword(password),
          referralCode: await generateReferralCode(6),
          referredBy: req.body.referredBy,
          otp: Otp,
          userName: genUserName,
        });
        await buddy.save();

        // Generate OTP token
        const otpToken = await createOtpToken({
          otp: Otp,
          email: email || email_mobNo,
        });
        res.status(201).send({
          message:
            "Registration successful! We have sent you an OTP. Please check your email or mobile number.",
          otpToken,
          buddy,
        });
      } else {
        res.status(400).send({ message: "Referral Code Does not Match" });
      }
    } else {
      // Create the buddy user
      const buddy = new BuddysModel({
        fullName: req.body.fullName,
        emailId: type === "email" ? email_mobNo : "",
        mobNo: type === "mobNo" ? email_mobNo : "",
        countryCode: req.body.countryCode,
        dob: req.body.dob,
        password: await hashPassword(password),
        referralCode: await generateReferralCode(6),
        referredBy: req.body.referredBy,
        otp: Otp,
        userName: genUserName,
      });
      await buddy.save();

      // Generate OTP token
      const otpToken = await createOtpToken({
        otp: Otp,
        email: email || email_mobNo,
      });
      res.status(201).send({
        message:
          "Registration successful! We have sent you an OTP. Please check your email or mobile number.",
        otpToken,
        buddy,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// 2.OTP Verification :
router.post("/otpVerification", otpValidation, async (req, res) => {
  try {
    const { otp, email, mobNo } = req.body;

    if (otp) {
      let buddy;
      let otpCheck;
      if (email !== "") {
        otpCheck = await otpModel
          .findOne({ $and: [{ emailId: email }, { mobNo: "" }] })
          .sort({ createdAt: -1 })
          .limit(1);
      } else if (mobNo !== "") {
        otpCheck = await otpModel
          .findOne({ $and: [{ emailId: "" }, { mobNo: mobNo }] })
          .sort({ createdAt: -1 })
          .limit(1);
      }

      if (email !== "") {
        buddy = await BuddysModel.findOne({
          $and: [{ emailId: email }, { mobNo: "" }],
        })
          .sort({ createdAt: -1 })
          .limit(1);
      } else if (mobNo !== "") {
        buddy = await BuddysModel.findOne({
          $and: [{ emailId: "" }, { mobNo: mobNo }],
        })
          .sort({ createdAt: -1 })
          .limit(1);
      }

      if (buddy) {
        if (await hashCompareOtp(otp, otpCheck.otp)) {
          let token = await createToken({
            id: buddy._id,
            fullName: buddy.fullName,
            email: buddy.emailId,
            mobNo: buddy.mobNo,
            dob: buddy.dob,
          });
          req.body.token = token;
          if (token) {
            req.body.userId = buddy._id;
            let tokenStore = new tokenModel(req.body);
            await tokenStore.save();
          }
          await BuddysModel.findOneAndUpdate(
            { _id: buddy._id },
            { $set: { isOtpVerified: true } }
          );
          res
            .status(201)
            .send({ message: "OTP Verified Successfully", token, buddy });
        } else {
          res.status(400).send({ message: "Invalid OTP" });
        }
      } else {
        res.status(200).send({ message: "OTP Does Not Exist" });
      }
    }
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// 3.Resend OTP :
router.post("/resendOtp", async (req, res) => {
  try {
    let buddy = await BuddysModel.findOne({
      $or: [
        { emailId: req.body.email },
        {
          $and: [
            { countryCode: req.body.countryCode },
            { mobNo: req.body.mobNo },
          ],
        },
      ],
    });

    if (buddy) {
      let otpLength = 6;
      let Otp = await generateOTP(otpLength);
      let hash = await hashOtp(Otp);

      if (req.body.email) {
        await sendOtpToEmail({
          userName: buddy.fullName,
          userEmail: req.body.email,
          otp: Otp,
        });
      } else if (req.body.countryCode && req.body.mobNo) {
        await sendOtpToMobno({
          otp: Otp,
          countryCode: req.body.countryCode,
          mobNo: req.body.mobNo,
        });
      }

      let otpSave = new otpModel({
        emailId: req.body.email,
        countryCode: req.body.countryCode,
        mobNo: req.body.mobNo,
        otp: hash,
      });
      await otpSave.save();
      const otpToken = await createOtpToken({
        otp: Otp,
        email: req.body.email,
      });
      res.status(201).send({
        message:
          "We have sent you an OTP. Please check your email or mobile number",
        otpToken,
        Otp,
      });
    } else {
      res.status(400).send({ message: "User Does Not Exist" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// 4. User Login :
router.post("/login", async (req, res) => {
  try {
    const { email, mobNo, role } = req.body;
    let buddy;
    let roleCheck;
    if (email !== "") {
      buddy = await BuddysModel.findOne({
        $and: [{ emailId: email }, { mobNo: "" }],
      })
        .sort({ createdAt: -1 })
        .limit(1);
      // res.status(201).send({message:"Login Successfully",buddy})
    } else if (mobNo !== "") {
      buddy = await BuddysModel.findOne({
        $and: [{ emailId: "" }, { mobNo: mobNo }],
      })
        .sort({ createdAt: -1 })
        .limit(1);
      // res.status(201).send({message:"Login Successfully",buddy})
    }

    if (buddy) {
      let isOtpVerified = buddy.isOtpVerified;
      if (isOtpVerified) {
        if (await hashCompare(req.body.password, buddy.password)) {
          let token;
          if (role) {
            if (role == buddy.role) {
              token = await createAdminToken({
                id: buddy._id,
                fullName: buddy.fullName,
                email: buddy.emailId,
                mobNo: buddy.mobNo,
                dob: buddy.dob,
                role: "admin",
              });
            } else {
              return res
                .status(400)
                .send({ message: "Only Admins can access" });
            }
          } else {
            token = await createToken({
              id: buddy._id,
              fullName: buddy.fullName,
              email: buddy.emailId,
              mobNo: buddy.mobNo,
              dob: buddy.dob,
            });
          }
          req.body.token = token;
          if (token) {
            req.body.userId = buddy._id;
            let tokenStore = new tokenModel(req.body);
            await tokenStore.save();
          }
          res.status(201).send({ message: "Login Successfully", token, buddy });
        } else res.status(400).send({ message: "Invalid Credentials" });
      } else {
        let result = isOtpVerified;
        res.status(200).send({ message: "Still OTP is not verified", result });
      }
    } else {
      res.status(400).send({ message: "User Does Not Exist" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// 5. User Token Details :
router.post("/token/:id", tokenValidation, async (req, res) => {
  try {
    let tokenn = req.params.id;
    if (tokenn == 0) {
      const data = await tokenModel.find();
      res.status(200).send({ message: "Token Details", data });
    }
    if (tokenn != 0) {
      let data = await tokenModel.findOne({ token: tokenn });
      res.status(200).send({ message: "Token Details", data });
    }
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// 6. Forget Password :
router.post("/forgetPassword", async (req, res) => {
  try {
    const email = req.body.email;
    const mobNo = req.body.mobNo;
    const confirmPassword = req.body.confirmPassword;
    let buddy;
    if (email !== "") {
      buddy = await BuddysModel.findOne({
        $and: [{ emailId: email }, { mobNo: "" }],
      })
        .sort({ createdAt: -1 })
        .limit(1);
      // res.status(201).send({message:"Login Successfully",buddy})
    } else if (mobNo !== "") {
      buddy = await BuddysModel.findOne({
        $and: [{ emailId: "" }, { mobNo: mobNo }],
      })
        .sort({ createdAt: -1 })
        .limit(1);
      // res.status(201).send({message:"Login Successfully",buddy})
    }

    if (buddy && email !== "") {
      req.body.confirmPassword = await hashPassword(confirmPassword);
      await BuddysModel.updateOne(
        { emailId: email },
        { $set: { password: req.body.confirmPassword } }
      );

      let token = await createToken({
        id: buddy._id,
        fullName: buddy.fullName,
        email: buddy.emailId,
        mobNo: buddy.mobNo,
        dob: buddy.dob,
      });
      req.body.token = token;
      if (token) {
        req.body.userId = buddy._id;
        let tokenStore = new tokenModel(req.body);
        await tokenStore.save();
      }
      res.status(200).send({ message: "Reset Password Successfully", token });
    } else if (buddy && mobNo !== "") {
      req.body.confirmPassword = await hashPassword(confirmPassword);
      await BuddysModel.updateOne(
        { mobNo: mobNo },
        { $set: { password: req.body.confirmPassword } }
      );

      let token = await createToken({
        id: buddy._id,
        fullName: buddy.fullName,
        email: buddy.emailId,
        mobNo: buddy.mobNo,
        dob: buddy.dob,
      });
      req.body.token = token;
      if (token) {
        req.body.userId = buddy._id;
        let tokenStore = new tokenModel(req.body);
        await tokenStore.save();
      }
      res.status(200).send({ message: "Reset Password Successfully", token });
    } else {
      res.status(400).send({ message: "User Does Not Exist" });
    }
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error", error });
  }
});

// 7. Referral Codes List :
router.post("/referralCodeDetails", tokenValidation, async (req, res) => {
  const id = req.userId;
  const action = req.body.action;
  const referralCode = req.body.referralCode;
  try {
    let buddy = await BuddysModel.findOne({ _id: id });
    if (buddy) {
      if (action == "readByCode") {
        let result = await referralModel.find({ referralCode: referralCode });
        res.status(200).send({ message: "Referral Code List", result });
      } else if (action == "readMine") {
        let result = await referralModel.find({ referredBy: id });
        res.status(200).send({ message: "Referral Code List", result });
      } else res.status(400).send({ message: "Action Does Not Exist" });
    } else res.status(400).send({ message: "UserId Does Not Exist" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// 8. Edit Email or MobNo Router for Otp verification Page :
router.post("/editEmailMobNo", async (req, res) => {
  const { oldType, newType, countryCode, email_mobNo, oldEmailMobNo } =
    req.body;
  try {
    let buddy;
    if (oldType == "email") {
      buddy = await BuddysModel.findOne({ emailId: oldEmailMobNo });
    } else if (oldType == "mobNo") {
      buddy = await BuddysModel.findOne({ mobNo: oldEmailMobNo });
    } else res.status(400).send({ message: "Old Type is missing" });
    if (buddy) {
      const otpLength = 6;
      const Otp = await generateOTP(otpLength);
      const hash = await hashOtp(Otp);
      if (newType == "email") {
        let buddy = await BuddysModel.findOne({ emailId: email_mobNo });
        if (!buddy && email_mobNo) {
          await BuddysModel.findOneAndUpdate(
            { _id: buddy._id },
            {
              $set: {
                emailId: email_mobNo,
              },
            },
            { new: true }
          );
          const otpSave = new otpModel({
            emailId: email_mobNo,
            countryCode: "",
            mobNo: "",
            otp: hash,
          });
          await otpSave.save();
          await sendOtpToEmail({
            userName: buddy.fullName,
            userEmail: email_mobNo,
            otp: Otp,
          });
          res
            .status(201)
            .send({ message: "Email or Mobile Number Updated Successfully" });
        } else res.status(400).send({ message: "Email Id Already Exists" });
      } else if (newType == "mobNo") {
        let buddy = await BuddysModel.findOne({ mobNo: email_mobNo });
        if (!buddy && email_mobNo) {
          await BuddysModel.findOneAndUpdate(
            { _id: buddy._id },
            {
              $set: {
                countryCode: countryCode,
                mobNo: email_mobNo,
              },
            },
            { new: true }
          );
          const otpSave = new otpModel({
            emailId: "",
            countryCode,
            mobNo: email_mobNo,
            otp: hash,
          });
          await otpSave.save();
          await sendOtpToMobno({
            otp: Otp,
            countryCode: countryCode,
            mobNo: email_mobNo,
          });
          res
            .status(201)
            .send({ message: "Mobile Number Updated Successfully" });
        } else res.status(400).send({ message: "Mob No Already Exists" });
      } else res.status(400).send({ message: "New Type is missing" });
    }
    res.status(400).send({ message: "Email or Mob No Does Not Exists" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Block Buddy :
router.post("/blockBuddy", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const buddy = await BuddysModel.findOne({ _id: id, isBlocked: false });
    if (buddy) {
      const update = await BuddysModel.findOneAndUpdate(
        { _id: id },
        { isBlocked: true }
      );
      res.status(400).send({ message: "User Blocked Successfully", update });
    } else res.status(400).send({ message: "User Does Not Exists" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Soft Delete Buddy :
router.post("/deleteBuddy", tokenValidation, async (req, res) => {
  try {
    const id = req.userId;
    const buddy = await BuddysModel.findOne({ _id: id, isBlocked: false });
    if (buddy) {
      const update = await BuddysModel.findOneAndUpdate(
        { _id: id },
        { isDeleted: true }
      );
      res.status(400).send({ message: "User Deleted Successfully", update });
    } else res.status(400).send({ message: "User Does Not Exists" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

module.exports = router;
