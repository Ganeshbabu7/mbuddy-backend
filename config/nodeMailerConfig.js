// const nodemailer = require('nodemailer');

// // Create a transporter with SMTP transport
// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 587,
//   secure: false, // Set to true for SSL
//   auth: {
//     user: 'eganeshbabu7@gmail.com',
//     pass: 'bwdpjubgdgfymqjv'
//   }
// }); 

// // Send an email
// const sendOtpToEmail = async ({mailTo, otp})=>{
//     transporter.sendMail({
//     from: 'naveen.mybuddys44@gmail.com',
//     to: `${mailTo}`,
//     subject: 'Welcome to My Buddy App',
//     html: `
//         <h2>Thanks for Registering My Buddy App</h2>
//         <h3>Your OTP : ${otp}</h3>
//     `
//     }, (error, info) => {
//     if (error) {
//       console.error('Error sending email:', error);
//     } else {
//       console.log('Email sent:', info.response);
//     }
//   })
// }

// module.exports = {sendOtpToEmail}