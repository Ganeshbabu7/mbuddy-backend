// Use Mongoose :
const mongoose = require('mongoose')

// 1-Upload Contacts Schema :
const contactSchema = new mongoose.Schema({
    userId : {type: String},
    contactDetails : [{
        name : {type:String},
        mobNo : {type:Array},
        emailId :{type:Array},
        location : {type:String} 
    }]
},{timestamps:true},{versionKey:false},{collection:"Contacts Details"})

const contactModel = mongoose.model('Contacts Details',contactSchema)

module.exports = {contactModel}