'use strict';
const request = require('request');
var timeArray = require('./public/timeslot.json');
// const config = require('./config');
const config = require('./config');


const mongoose = require('mongoose');
const mongodb_url =
    "mongodb+srv://admin:admin@facebookbotcluster0-cqfb6.mongodb.net/Messenger_Bot";
// 

const waitFor = (ms) => new Promise(r => setTimeout(r, ms));
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }
module.exports = {

    addUser: function (callback, userId) {
        request({
            uri: 'https://graph.facebook.com/v3.2/' + userId,
            qs: {
                access_token: config.FB_PAGE_TOKEN
            }

        },
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var user = JSON.parse(body);

                    if (user.first_name != "undefined") {
                        console.log("success save user");
                        mongoose.connect(mongodb_url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log("completed data successfully.");
                                var dbo = db.db;
                                var findUser = { fb_id: userId };
                                dbo.collection("users").find(findUser).toArray(function (err, result) {
                                    if (err) throw err;
                                    console.log(result.length);
                                    if (!result.length) {
                                        var insertUser = { fb_id: userId, firstname: user.first_name, lastname: user.last_name, profile_picture: user.profile_pic };
                                        dbo.collection("users").insertOne(insertUser, function (err, res) {
                                            if (err) throw err;
                                            console.log("1 document inserted");
                                            callback();
                                            db.close();
                                        });
                                    }
                                });


                            }
                        });


                    } else {
                        console.log("Cannot get data for fb user with id",
                            userId);
                    }
                } else {
                    console.error(response.error);
                }

            });
    },

    add_Shoplist: function (userId, array, callback) {
        console.log(array, userId);

        mongoose.connect(mongodb_url, { useNewUrlParser: true, useUnifiedTopology: true }, async (err, db) => {
            if (err) {
                console.log(err);
                callback(false);
            } else {
                console.log("addshoplist");
                var dbo = db.db;
                asyncForEach(array, async (shopitem) => {
                    await waitFor(3350);
                    console.log(shopitem);
                })
                // array.forEach(shopitem => {
                //     var findShop = { place_id: shopitem.place_id };
                //     dbo.collection("shopList_collection").find(findShop).toArray(function (err, result) {
                //         // console.log(result);
                //         try {
                //             if (result) {
                //                 console.log("already exist that shop");
                //             } else {
                //                 var insertShop = { place_id: shopitem.place_id, shopName: shopitem.title, timeSlot: timeArray.timeslot };
                //                 dbo.collection("shopList_collection").insertOne(insertShop, function (err, res) {
                //                     if (err) throw err;
                //                     console.log("1 shop document inserted");
                //                 });
                //             }
                //         } catch (err) {
                //             console.log(err);
                //         }
                //     });
                // });

                db.close();
                callback(true);
            }
        });
    }
}
