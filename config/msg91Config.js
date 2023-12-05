const http = require("https");

const authKey = '291994AC3kSr1BuJgk5d6a20ab'
const templateId = 'MyBuddyRegistrationOTP'
const templateIdOtp = '64a56d23d6fc0521901f2752' //DLT ID : 1307168812722758647 Template Id :64a56d23d6fc0521901f2752
const senderIdOtp = 'MBcode'

// Email OTP Integration :
const sendOtpToEmail = async ({userName, userEmail, otp })=>{

    const options = {
        "method": "POST",
        "hostname": "api.msg91.com",
        "port": null,
        "path": "/api/v5/email/send",
        "headers": {
            "Content-Type": "application/JSON",
            "Accept": "application/json",
            "authkey": `${authKey}`
        }
    };

    const req = http.request(options, function (res) {
        const chunks = [];
        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            const body = Buffer.concat(chunks);
            console.log(body.toString());
        });
    });

    req.write(JSON.stringify({
        "to": [{"name": `${userName}`, "email": `${userEmail}`}],
        "from": {"name": "MyBuddy Team", "email": "no_reply@app.mybuddysapp.com"},
        "domain": "app.mybuddysapp.com",
        "template_id": `${templateId}`,
        "variables": {"name": `${userName}`, "OTP": `${otp}`}
    }));      
    req.end();
}

// Mobile OTP Integration :
const sendOtpToMobno = async ({countryCode, mobNo, otp})=>{
    const options = {
        method: 'POST',
        hostname: 'control.msg91.com',
        port: null,
        path: '/api/v5/flow/',
        headers: {
            "accept": 'application/json',
            'content-type': 'application/json',
            "authkey":`${authKey}`
        }
    };

    const req = http.request(options, function (res) {
        const chunks = [];

        res.on('data', function (chunk) {
            chunks.push(chunk);
        });

        res.on('end', function () {
            const body = Buffer.concat(chunks);
            console.log(body.toString());
        });
    });

    req.write(JSON.stringify({
        template_id: `${templateIdOtp}`,
        sender: `${senderIdOtp}`,
        short_url: '0',
        mobiles: `${countryCode}${mobNo}`,
        var: `${otp}`,
    }));
    req.end();
}

// const inviteMsgToMobNo = async ({countryCode, mobNo, otp})=>{
//     const options = {
//         method: 'POST',
//         hostname: 'control.msg91.com',
//         port: null,
//         path: '/api/v5/flow/',
//         headers: {
//             "accept": 'application/json',
//             'content-type': 'application/json',
//             "authkey":`${authKey}`
//         }
//     };

//     const req = http.request(options, function (res) {
//         const chunks = [];

//         res.on('data', function (chunk) {
//             chunks.push(chunk);
//         });

//         res.on('end', function () {
//             const body = Buffer.concat(chunks);
//             console.log(body.toString());
//         });
//     });

//     req.write(JSON.stringify({
//         template_id: `${templateIdOtp}`,
//         sender: `${senderIdOtp}`,
//         short_url: '0',
//         mobiles: `${countryCode}${mobNo}`,
//         var: `${otp}`,
//     }));
//     req.end();
// }

module.exports = { sendOtpToEmail, sendOtpToMobno };