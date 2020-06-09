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
        console.log(JSON.stringify(array), userId);

        mongoose.connect(mongodb_url, { useNewUrlParser: true, useUnifiedTopology: true }, async (err, db) => {
            if (err) {
                console.log(err);
                callback(false);
            } else {
                console.log("addshoplist");
                var dbo = db.db;
                await asyncForEach(array, async (shopitem) => {
                    // await waitFor(1000);
                    // console.log(shopitem.buttons[0].url);
                    var str = shopitem.buttons[0].url
                    var arr = str.split("place_id=");
                    var findShop = { place_id: arr[1] };
                    console.log(arr[1]);
                    dbo.collection("shopList_collection").find(findShop).toArray(function (err, result) {
                        console.log(result);
                        try {
                            if (!result.length) {
                                var insertShop = { place_id: arr[1], shopName: shopitem.title, timeSlot: timeArray.timeslot };
                                dbo.collection("shopList_collection").insertOne(insertShop, function (err, res) {
                                    if (err) throw err;
                                    console.log("1 shop document inserted");
                                });
                            }
                        } catch (err) {
                            console.log(err);
                        }
                    });
                })
                console.log("finished");
                // db.close();
                callback(true);
            }
        });
    },

    read_timeslot: function (place_id, callback) {

        mongoose.connect(mongodb_url, { useNewUrlParser: true, useUnifiedTopology: true }, async (err, db) => {
            if (err) {
                console.log(err);

            }
            else {
                var dbo = db.db;
                /*Return only the documents with the address "Park Lane 38":*/
                var query = { place_id: place_id };
                dbo.collection("shopList_collection").find(query).toArray(function (err, result) {
                    try {
                        console.log(result);

                        callback(result[0].timeSlot);
                        db.close();
                    } catch (error) {
                        console.log(error);
                    }

                });
            }
        });
    },

    update_timeslot: function (place_id, time, callback) {
        mongoose.connect(mongodb_url, { useNewUrlParser: true, useUnifiedTopology: true }, async (err, db) => {
            if (err) {
                console.log(err);

            }
            else {
                var dbo = db.db;
                console.log(place_id);
                console.log(typeof(time));
                var query = { place_id: place_id };
                dbo.collection("shopList_collection").find(query).toArray(async function (err, result) {
                    var timearray = result[0].timeSlot;
                    var array = [];
                    await asyncForEach(timearray, async (timeitem) => {
                        if (timeitem != time){
                            console.log(typeof(timeitem));
                            array.push(timeitem);
                        }

                    });
                    console.log(array);
                });


                /*Return only the documents with the address "Park Lane 38":*/
                
            }
        });
    }
}
