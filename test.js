// const request = require('request');
// var timeArray = require('./public/timeslot.json');
// // const config = require('./config');
// const config = require('./config');


// const mongoose = require('mongoose');
// const mongodb_url =
//     "mongodb+srv://admin:admin@facebookbotcluster0-cqfb6.mongodb.net/Messenger_Bot";
// const waitFor = (ms) => new Promise(r => setTimeout(r, ms));
// const a = 1;
// async function start(callback) {

//     if (a == 0) {

//     } else {
//         await asyncForEach([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], (num) => {
//             const url = "https://facebookmessengerapp-1.herokuapp.com/webview?address=Back St, Block B, Shastri Nagar, Delhi, 110052, India&name=My Tokri&place_id=ChIJU2E9qGUCDTkRcRArWIm5kws";
//             console.log(num);

//         });
//         console.log('Done');
//         callback();
//     }



// }




// async function asyncForEach(array, callback) {
//     for (let index = 0; index < array.length; index++) {
//         await callback(array[index], index, array);
//     }
// }

// start(() => {
//     console.log("finished");
// });








const express = require('express')
const app = express()
const QRCode = require('qrcode');
const fs = require('fs');



app.get('/', (req, res) => {

    let inputStr = " req.params.qrcode";

    QRCode.toDataURL(inputStr, function (err, url) {


        let data = url.replace(/.*,/, '')
        let img = new Buffer.from(data, 'base64')
        fs.writeFileSync('./qr.html', `<img src="${url}">`);
        console.log('Wrote to ./qr.html');
        // let aa = JSON.stringify(img);
        // let as = aa.toString("utf-8");
        console.log(img);


        // res.writeHead(200,{
        //     'Content-Type' : 'image/png',
        //     'Content-Length' : img.length
        // })
        res.end(img)

    })


})

app.listen(3000, () => {
    console.log("success sever port 3000");
});