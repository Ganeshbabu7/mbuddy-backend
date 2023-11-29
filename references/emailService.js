// Function to send OTP to email
// async function sendOtpToEmail(email, otp) {
//     const message = {
//       to: email,
//       message: {
//         subject: 'OTP Verification',
//         text: `Your OTP: ${otp}`
//       }
//     };
  
//     try {
//       const emailResult = await admin.messaging().send(message);
//       console.log('OTP sent to email:', emailResult);
//     } catch (error) {
//       console.error('Error sending OTP to email:', error);
//     }
//   }

// module.exports = {sendOtpToEmail}

// const sgMail = require('@sendgrid/mail')

// const MailService = async({email,subject,firstName,lastName,message})=>{
//     sgMail.setApiKey('jjj')
//     const msg = {
//     to: ``, // Change to your recipient
//     from: '', // Change to your verified sender
//     subject: `${subject}`,
//     text: '',
//     html: `
//     <div style="background-color: antiquewhite; margin-left:20%; margin-right:20%;padding:30px;">
//     <div>
//         <b>Hello ${firstName} ${lastName},</b>
//     </div>
//     <br>
//     <div>
//         ${message}    
//     </div>
//     <br>
//     <footer style="text-align: center;">
//         Guvi Geek Network Pvt Ltd, Chennai
//     </footer>
// </div>
//     `,
//     }
//     sgMail
//     .send(msg)
//     .then(() => {
//         console.log('Email sent successfully')
//     })
//     .catch((error) => {
//         console.error(error)
//     })

// }