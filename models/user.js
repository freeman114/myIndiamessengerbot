'use strict';
const request = require('request');
var timeArray = require('../public/timeslot.json');

// const config = require('./config');
const config = require('../config');
// const fbService = require('./facebook_service')
const external_api = require('../External_API/external_api')

const mongoose = require('mongoose');
const mongodb_url =
    "mongodb+srv://admin:admin@facebookbotcluster0-cqfb6.mongodb.net/Messenger_Bot";
// 


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
                        console.log("Check user database");
                        mongoose.connect(mongodb_url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, db) => {
                            if (err) {
                                console.log(err);
                            } else {
                                var dbo = db.db;
                                var findUser = { fb_id: userId };
                                var order_array = [];
                                dbo.collection("users").find(findUser).toArray(function (err, result) {
                                    if (err) throw err;
                                    console.log(result.length);
                                    if (!result.length) {
                                        var insertUser = { fb_id: userId, firstname: user.first_name, lastname: user.last_name, profile_picture: user.profile_pic, oderArray: order_array };
                                        dbo.collection("users").insertOne(insertUser, function (err, res) {
                                            if (err) throw err;
                                            console.log("1 user inserted");
                                            callback();
                                            db.close();
                                        });
                                    }
                                    console.log("completed db check successfully.");
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
                    var result = await dbo.collection("shopList_collection").find(findShop).toArray();
                    console.log(result);

                    if (!result.length) {
                        var insertShop = { place_id: arr[1], shopName: shopitem.title, timeSlot: timeArray.timeslot };
                        var resultss = await dbo.collection("shopList_collection").insertOne(insertShop);

                        console.log("1 shop document inserted");

                    }


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

    update_timeslot: function (ids, slot, callback) {
        mongoose.connect(mongodb_url, { useNewUrlParser: true, useUnifiedTopology: true }, async (err, db) => {
            if (err) {
                console.log(err);
            }
            else {
                console.log(ids);
                var idss = ids.split("??");
                var dbo = db.db;
                console.log(slot);
                var userId = idss[0];
                var place_id = idss[1];
                var query = { place_id: place_id };
                dbo.collection("shopList_collection").find(query).toArray(async function (err, result) {
                    var timearray = result[0].timeSlot;
                    var shopname = result[0].shopName;
                    var array = [];
                    timearray.forEach(item => {
                        if (item.toString() != slot.toString()) {
                            array.push(item);
                        }
                    });


                    var myquery = { timeSlot: timearray };
                    var newvalues = { $set: { timeSlot: array } };
                    dbo.collection("shopList_collection").updateOne(myquery, newvalues)
                        .then(async function (res) {
                            console.log("success");
                            let userquery = { fb_id: userId };
                            let result = await dbo.collection("users").find(userquery).toArray();

                            //getting user name from user collection
                            let username = result[0].firstname;


                            //updating user collection
                            let order_array = result[0].oderArray;
                            let newvalue = { place_id: place_id, shopName: shopname, time: slot };
                            order_array.push(newvalue);
                            var newquery = { $set: { fb_id: userId, oderArray: order_array } };
                            dbo.collection("users").updateOne(userquery, newquery)
                                .then(function (result) {
                                    var dateTime = external_api.date_time();
                                    console.log(dateTime);
                                    var order_infor = {
                                        userId: userId,
                                        username: username,
                                        shopname: shopname,
                                        place_id: place_id,
                                        time: slot,
                                        ordertime: dateTime
                                    };

                                    callback(order_infor);
                                }).catch(function (err) {
                                    console.log(err);
                                });

                        }).catch(function (err) {
                            console.log(err);
                        });
                });
            }
        });
    },

    formatdatabase: function (callback) {

        mongoose.connect(mongodb_url, { useNewUrlParser: true, useUnifiedTopology: true }, async (err, db) => {
            if (err) {
                console.log(err);
            }
            else {
                var dbo = db.db;
                dbo.collection("users").drop()
                    .then(function (delOK) {
                        dbo.collection("shopList_collection").drop()
                            .then(function (res) {
                                callback();
                            }).catch(function (error) {
                                console.log(error);
                            });

                    }).catch(function (err) {
                        console.log(err);
                    });

            }
        });
    },

    // customer's role setting 
    set_userrole: function (userID, userrole, callback) {
        mongoose.connect(mongodb_url, { useNewUrlParser: true, useUnifiedTopology: true })
            .then((db) => {
                var dbo = db.db;
                var findUser = { fb_id: userId };
                var newvalues = { $set: { fb_id: userID, userrole: userrole } };
                dbo.collection("users").updateOne(findUser, newvalues)
                    .then(function (result) {
                        callback();
                    }).catch(function (err) {
                        console.log(err);
                    });
            }).catch((err) => {
                console.log(err);
            });
    },

    read_userrole: function (userId) {
        return new Promise(function (resolve, reject) {
            mongoose.connect(mongodb_url, { useNewUrlParser: true, useUnifiedTopology: true })
                .then((db) => {
                    var dbo = db.db;
                    console.log(dbo);
                    console.log(db);
                    var findUser = { fb_id: userId };
                    // var newvalues = { $set: { fb_id: userID, userrole: userrole } };
                    dbo.collection("users").find(findUser).toArray()
                        .then(function (result) {
                            resolve(result[0].userrole);
                        }).catch(function (err) {
                            console.log(err);
                        });
                }).catch((err) => {
                    console.log(err);
                });
        });

    }
}
