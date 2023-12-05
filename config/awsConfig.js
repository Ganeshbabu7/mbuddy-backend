// Configure AWS S3

require('dotenv').config();
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

let s3Client
try {
  s3Client = new S3Client(
  { region: process.env.AWS_REGION },
  { credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }}
);
}
catch (error) {
  console.error("Error occurred while initializing AWS credentials:", error);
}

module.exports = {s3Client, PutObjectCommand}

// const s3Client = new S3Client(
//   { region: process.env.AWS_REGION },
//   { credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   }}
// );

// const s3Client = new S3Client(
//   { region: "ap-south-1" },
//   { credentials: {
//     accessKeyId: 'AKIATMT6IRHDSS2EKPPJ',
//     secretAccessKey: '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'
//   }}
// );


// const configuration = {
//   aws: {
//     region: process.env.AWS_REGION,
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// };

// const credentials = {
//   region: configuration.aws.region,
//   credentials: {
//     accessKeyId: configuration.aws.accessKeyId,
//     secretAccessKey: configuration.aws.secretAccessKey,
//   },
// };

// let s3Client

// try {
//   s3Client = new S3Client(credentials);
// } catch (error) {
//   console.error("Error occurred while initializing AWS credentials:", error);
// }