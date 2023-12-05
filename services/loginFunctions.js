require('dotenv').config();
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const saltRound = 7;
const secretKey = 'Qw3$er5*ty&7Uio8*9okjP'
const {buddyProfileModel} = require('../schema/buddysSchema')

// Generate Referral Code
const generateReferralCode = async (length)=> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let referralCode = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    referralCode += characters.charAt(randomIndex);
  }
  return referralCode;
}

// Generate OTP :
const generateOTP = async (otpLength) => {
  let digits = "123456789";
  let OTP = "";
  for (let i = 0; i < otpLength; i++) {
    OTP += digits[Math.floor(Math.random() * 9)]; 
  }
  return OTP;
};

// Hash OTP :
const hashOtp = async(otp)=>{
  try {
    let salt = await bcrypt.genSalt(saltRound)
    let hash = await bcrypt.hash(otp,salt)
    return String(hash);
  } catch (error) {
    console.log(error);
  }
}

// Hash Compare OTP :
const hashCompareOtp = (otp, hashOtp)=>{
    return bcrypt.compare(otp,hashOtp)
}

// OTP Token :
const createOtpToken = async ({otp, email})=>{
  let otpToken = jwt.sign({otp, email},secretKey,{expiresIn:'2m'})
  return otpToken
}

const decodeOtpToken = (otpToken)=>{
  let data = jwt.decode(otpToken)
  return data
}

// OTP Token Validation :
const otpValidation = async (req,res,next)=>{
  try {
      if(req.headers.authorization){
          let otpToken = req.headers.authorization.split(" ")[1]
          let data = decodeOtpToken(otpToken)
          if((Math.floor(Date.now()/1000))<=data.exp)
              next()
          else
              res.status(401).send({message:"OTP Expired"})
      }
      else{
          res.status(401).send({message:"OTP Token Not Found"})
      }
  } catch (error) {
      res.status(500).send({message:"Internal Server Error",error})
  }
}

const generateUsername = async (name, dob) => {
  const date = new Date(dob);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Combine the name, year, month, and day
  const combinedUsername = name + "_" + year + month + day;

  // Remove special characters and spaces
  const sanitizedUsername = combinedUsername.replace(/[^A-Za-z0-9._]/g, "");
  return sanitizedUsername;  
}

module.exports = {
  generateReferralCode,
  generateOTP,
  hashOtp,
  hashCompareOtp,
  createOtpToken,
  decodeOtpToken,
  otpValidation,
  generateUsername
}