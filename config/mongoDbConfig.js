// MongoDB Configurations :
const mongodb = require('mongodb')
const dbUrl = 'mongodb://mybuddy:mybuddy123@13.233.23.16:27017/admin'
//const dbUrl = 'mongodb://mybyddyuat:mybuddyuat123@216.48.187.178:27017/mybuddyuat'
// const dbUrl = 'mongodb+srv://Ganesh:Ganesh@mybuddyapp.tw3vhsn.mongodb.net/'
const MongoClient = mongodb.MongoClient

module.exports = {dbUrl,MongoClient}
