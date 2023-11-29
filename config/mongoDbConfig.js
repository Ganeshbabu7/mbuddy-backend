// MongoDB Configurations :
const mongodb = require('mongodb')
const dbUrl = 'mongodb://mybuddy:mybuddy123@13.233.23.16:27017/admin'
// const dbUrl = 'mongodb+srv://Ganesh:Ganesh@mybuddyapp.tw3vhsn.mongodb.net/'
const MongoClient = mongodb.MongoClient

module.exports = {dbUrl,MongoClient}
