//  My SQl configurations :
let mysql = require('mysql2');

let connection = mysql.createConnection({
  host: "216.48.187.178",
  user: "devserver",
  password: "devserver@123",
  database : "mybuddyapp",
  port : 5560

  // host: "localhost",
  // user: "root",
  // password: "Ganesh@007",
  // database : "mybuddyapp",  
});

connection.connect(function(err) {
  if (err) throw err;
  console.log("Database Connected!");
});

process.on('uncaughtException', function (err) {
  console.log(err);
}); 

module.exports = connection;