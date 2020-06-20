/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 */

'use strict';

// Messenger API integration example
// We assume you have:
// * a Wit.ai bot setup (https://wit.ai/docs/quickstart)


const bodyParser = require('body-parser');
const crypto = require('crypto');
const express = require('express');
const uuid = require('uuid');
var path = require('path');
var QRCode = require('qrcode')
var md5 = require('md5');
var schedule = require('node-schedule');



const n_v_s = require('./controllers/need_volunteer')
const be_v = require('./controllers/be_volunteer')
const fbService = require('./External_API/facebook_service')
const external_api = require('./External_API/external_api')
const userService = require('./models/user');
const config = require('./config');
const { SSL_OP_MICROSOFT_BIG_SSLV3_BUFFER } = require('constants');


let Wit = null;
let log = null;


try {
    // if running from repo
    Wit = require('../').Wit;
    log = require('../').log;
} catch (e) {
    Wit = require('node-wit').Wit;
    log = require('node-wit').log;
}
// Webserver parameter
const PORT = process.env.PORT || 5000;

// Wit.ai parameters
const WIT_TOKEN = config.WIT_TOKEN;
// Messenger API parameters
const FB_PAGE_TOKEN = config.FB_PAGE_TOKEN;
if (!FB_PAGE_TOKEN) {
    throw new Error('missing FB_PAGE_TOKEN')
}
const FB_APP_SECRET = config.FB_APP_SECRET;
if (!FB_APP_SECRET) {
    throw new Error('missing FB_APP_SECRET')
}

let FB_VERIFY_TOKEN = null;
crypto.randomBytes(8, (err, buff) => {
    if (err) throw err;
    FB_VERIFY_TOKEN = buff.toString('hex');
    var j = schedule.scheduleJob('30 18 * * *', function () {
        console.log('database format!');
        userService.formatdatabase(() => {
            sessionIds = new Map();
            usersMap = new Map();

            console.log("formated database");
        });
    });

    console.log(`/webhook will accept the Verify Token "${FB_VERIFY_TOKEN}"`);
});


const sessionIds = new Map();
const usersMap = new Map();


const sessions = {};



// Starting our webserver and putting it all together
const app = express();
app.use(({ method, url
}, rsp, next) => {
    rsp.on('finish', () => {
        console.log(`${rsp.statusCode
            } ${method
            } ${url
            }`);
    });
    next();
});
// app.use(bodyParser.json({
//     verify: verifyRequestSignature
// }));
app.use(bodyParser.json());

app.use(express.static('./public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// Webhook setup
app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'
    ] === 'subscribe' &&
        req.query['hub.verify_token'
        ] === FB_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge'
        ]);
    } else {
        res.sendStatus(400);
    }
});

app.get('/', (req, res) => {
    res.send("This is my facebookMessengerBot.");
});

app.get('/webview', (req, res) => {
    try {
        console.log(req.query.place_id);
        var place_id = req.query.place_id;
        var ID = req.query.userID + '??' + req.query.place_id;
        userService.read_timeslot(place_id, (timeSlot) => {
            console.log(timeSlot);
            res.render('timeslot', { array: timeSlot, id: ID });
        });
    } catch (e) {
        console.log(e);

    }
});


// timeslot handler
app.get('/timeslot', (req, res) => {
    try {
        console.log(req.query.text);
        const time = req.query.text;
        const ids = req.query.ids;
        var idss = ids.split("??")
        userService.update_timeslot(ids, time, function (order_infor) {
            var tokenstr = JSON.stringify(order_infor);
            var token = md5(tokenstr);
            let replies = [
                {
                    "content_type": "text",
                    "title": "Start Over",
                    "payload": "start_over"
                },
                {
                    "content_type": "text",
                    "title": "Previous ",
                    "payload": "inputaddress"
                },
                {
                    "content_type": "text",
                    "title": "Cancel ",
                    "payload": "cancel"
                }
            ];
            var responseText = token;
            fbService.sendQuickReply(idss[0], responseText, replies);
            console.log(JSON.stringify(order_infor));
            let qr_str = JSON.stringify(order_infor);
            QRCode.toDataURL(qr_str.toString(), function (err, url) {
                try {
                    if (!url) {
                        return res.status(400).json({
                            status: 'error',
                            error: 'url cannot be empty',
                        });
                    }

                    res.status(200).json({
                        status: 'succes',
                        from: url,
                    })

                } catch (err) {
                    console.log(err);
                };

            });

        });

    } catch (e) {
        console.log(e);

    }
});


app.get('/n_v_timeslot', (req, res) => {
    try {
        console.log(req.query.place_id);
        var ID = req.query.userID;
        userService.read_n_v_timeslot(ID, (n_v_timeSlot, address) => {
            console.log(n_v_timeSlot);
            res.render('n_v_timeslot', { array: n_v_timeSlot, id: ID, address: address });

        });
    } catch (e) {
        console.log(e);

    }
});

app.post('/n_v_timeslot', (req, res) => {
    console.log(req);
    console.log(req.body);
    var userId = req.body.text;
    var timeslot = req.body.time;
    userService.n_v_timeSlot(userId, timeslot, function (updated) {
        if (updated) {
            fbService.notify_template(userId, () => {
                res.status(200).json({
                    status: 'succes'
                });
            });

        }
    });

});

function compare(a, b) {
    if (a.distance < b.distance)
        return -1;
    if (a.distance > b.distance)
        return 1;
    return 0;
}

app.get('/b_v_list', (req, res) => {
    try {
        var userId = req.query.userID
        var origin_add = req.query.address;
        userService.read_nvorder(userId, function (result) {
            if (result.length) {
                var arr = [];
                result.forEach(element => {
                    var target_add = element.address;
                    external_api.get_add(origin_add, target_add, function (distance) {
                        console.log(distance);
                        var obj = { userID: element.fb_id, name: element.name, address: element.address, Time: element.time, distance: distance, items:element.items, token: element.token };
                        arr.push(obj);
                        if (arr.length == result.length && arr.length < 16) {
                            arr.sort(compare);
                            console.log(JSON.stringify(arr));
                            res.render('b_v_timeslot', { array: arr, id: userId, address: origin_add });

                        }

                    });



                });
            } else {
                res.send("No exist order data. Please wait until someone request order.");
                fbService.sendTextMessage(userId, "No exist order data. Please wait until someone request order.");
            }

        });

    

        // });
    } catch (e) {
        console.log(e);

    }
});

app.post('/b_v_list', (req, res) => {
    var userId = req.body.userid
    var token = req.body.token;
    console.log(`userId: ${userId}`);
    userService.delete_order(token, userId, (phone_number, name) => {

        fbService.otn_message(name, phone_number,  token, function (){
            res.status(200).json({
                status: 'succes'
            });
        });
        
    });
});


// Message handler
app.post('/webhook', (req, res) => {
    // Parse the Messenger payload
    // See the Webhook reference
    // https://developers.facebook.com/docs/messenger-platform/webhook-reference

    const data = req.body;
    console.log("****************We received webhook event.***************");
    console.log(`JSON.stringify(data): ${JSON.stringify(data)}`);

    if (data.object === 'page' && data.entry[0].messaging) {
        try {
            console.log("webhook message:");
            data.entry.forEach(entry => {
                entry.messaging.forEach(event => {
                    if (event.message && !event.message.is_echo) {
                        // Yay! We got a new message!
                        // We retrieve the Facebook user ID of the sender
                        const sender = event.sender.id;

                        const { text, attachments
                        } = event.message;

                        if (attachments) {
                            // We received an attachment
                            // Let's reply with an automatic message

                        } else if (text) {
                            receivedMessage(event);


                        }
                    } else if (event.postback) {
                        receivedPostback(event);
                        // const sender = event.sender.id;
                    } else if (event.optin) {
                        received_otn(event);
                    }
                    else {
                        console.log('received event', JSON.stringify(event));
                    }
                });
            });
        }
        catch (e) {
            console.log(e);
        }

    }
    res.sendStatus(200);
});


async function receivedPostback(event) {
    var senderID = event.sender.id;
    await setSessionAndUser(senderID);
    var recipientID = event.recipient.id;
    var timeOfPostback = event.timestamp;
    var payload = event.postback.payload;

    switch (payload) {
        case 'start_over':
            sendWelcomeMessage(senderID);
            break;

        case 'schedule_time':
            console.log('schedule_time');
            break;

        default:

            break;
    }
}

async function receivedMessage(event) {
    console.log('_____________We received message___________');
    console.log(JSON.stringify(event));
    var senderID = event.sender.id;
    await setSessionAndUser(senderID);

    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;
    var isEcho = message.is_echo;
    var messageId = message.mid;
    var appId = message.app_id;
    var metadata = message.metadata;

    // You may get a text or attachment but not both
    var messageText = message.text;
    var messageAttachments = message.attachments;
    var quickReply = message.quick_reply;
    if (quickReply) {
        handleQuickreply(senderID, quickReply, messageId);
        return;
    } else if (messageText) {
        var userrole = await userService.read_userrole(senderID);
        console.log(userrole);
        switch (userrole) {
            case "0":
                sendToWit_0(event);

                break;
            case "1":
                n_v_s.sendToWit_1(event);
                break;

            case "2":
                be_v.sendToWit_2(event);
                break;


            default:
                break;
        }
        return;
    }


}

function received_otn(event) {
    var senderid = event.sender.id;
    var otn_token = event.optin.one_time_notif_token;
    console.log(`otn_token: ${otn_token}`);
    userService.insert_order(senderid, otn_token, () => {
        console.log('____________saved token for one time notification.___________');
        let responseText = "You will be soon reecived message from volunteers. ";

        let replies = [
            {
                "content_type": "text",
                "title": "Start Over",
                "payload": "start_over"
            },
            {
                "content_type": "text",
                "title": "Previous ",
                "payload": "input_item"
            },
            {
                "content_type": "text",
                "title": "Cancel ",
                "payload": "cancel"
            }
        ];

        fbService.sendQuickReply(senderid, responseText, replies);
    });
}

function sendWelcomeMessage(userId) {
    console.log("______________We received welcomemessage!_________________");
    let responseText = "Welcome to Localize. Here you can book your slots for shopping at your nearest shop, Requires delivery of goods or Become a volunteer. What would you like to choose? ";
    setSessionAndUser(userId);
    let replies = [
        {
            "content_type": "text",
            "title": "Self-service",
            "payload": "self_service"
        },
        {
            "content_type": "text",
            "title": "Need for volunteers ",
            "payload": "need_volunteers"
        },
        {
            "content_type": "text",
            "title": "Be a volunteer ",
            "payload": "be_volunteer"
        },
        {
            "content_type": "text",
            "title": " Cancel",
            "payload": "cancel"
        }
    ];

    fbService.sendQuickReply(userId, responseText, replies);
}





app.listen(PORT);
console.log('Listening on :' + PORT + '...');

var setSessionAndUser = function (senderID) {
    return new Promise(function (resolve, reject) {
        if (!sessionIds.has(senderID)) {
            console.log(sessionIds.has(senderID));
            sessionIds.set(senderID, uuid.v1());
        }

        if (!usersMap.has(senderID)) {
            userService.addUser(function (user) {
                console.log("set senderid");
                usersMap.set(senderID, user);
                resolve();
            }, senderID);
        } else {
            console.log("usermap value is true.")
            resolve();
        }
    });

}

function handleQuickreply(userId, quickReply, messageId) {
    console.log('_________Received quickreply response________');
    var quickReplyPayload = quickReply.payload;
    switch (quickReplyPayload) {
        case 'self_service':
            userService.set_userrole(userId, "0", () => {
                console.log(quickReplyPayload);
                inputName(userId);
            });
            break;
        case 'need_volunteers':
            userService.set_userrole(userId, "1", () => {
                n_v_s.self_certify(userId);

            });
            break;

        case 'be_volunteer':
            userService.set_userrole(userId, "2", () => {
                be_v.self_certify(userId);

            });
            break;
        case 'start_over':
            sendWelcomeMessage(userId);
            break;
        case 'inputname':
            inputName(userId);
            break;
        case 'input_item':
            n_v_s.item_require(userId);

            break;
        case 'inputaddress':
            inputAddress(userId);
            break;
        case 'be_v_yes':
            be_v.certify_yes(userId);
            break;
        case 'n_v_yes':
            n_v_s.certify_yes(userId);
            break;
        // case 'all_timeslot':
        //     n_v_s.all_timeslot(userId);
        //     break;
        case 'be_v_no':
            be_v.certify_no(userId);
            break;
        case 'n_v_no':
            n_v_s.certify_no(userId);
            break;

        case 'cancel':
            break;

        default:
            break;
    }
    console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload);
    //send payload to api.ai
    //sendToDialogFlow(senderID, quickReplyPayload);

}

function inputName(userId) {
    console.log('____________sent that input name___________');
    let responseText = "Please enter your name. ";

    let replies = [
        {
            "content_type": "text",
            "title": "Start Over",
            "payload": "start_over"
        },
        {
            "content_type": "text",
            "title": "Previous ",
            "payload": "start_over"
        },
        {
            "content_type": "text",
            "title": "Cancel ",
            "payload": "cancel"
        }
    ];

    fbService.sendQuickReply(userId, responseText, replies);
}

function sendToWit_0(event) {
    try {
        console.log('__________received text message___________');
        var userId = event.sender.id;
        console.log(JSON.stringify(event));

        var wit_confience = event.message.nlp.intents[0].confidence;
        console.log(wit_confience);
        if (wit_confience>0.95) {
            var intent = event.message.nlp.intents[0].name;
            console.log(intent);

            console.log(intent);
            switch (intent) {
                case 'name':
                    // if (event.message.nlp.entities.intent[0].confidence > 0.95) {
                        var value = event.message.text;
                        console.log(value);
                        inputAddress(userId);
                    // } else {
                    //     let responseText = 'Please enter correct data.';

                    //     fbService.sendTextMessage(userId, responseText);
                    // }

                    break;
                case 'greeting':
                    sendWelcomeMessage(userId);
                    break;

                case 'address':
                    var value = event.message.text;
                    console.log(value);
                    external_api.displayShop(value, function (array) {
                        if (array) {
                            userService.add_Shoplist(userId, array, function (updated) {
                                if (updated) {
                                    fbService.showStore(userId, array, function (s_h) {
                                        if (s_h) {
                                            console.log("success");
                                            let responseText = "Click Booking schedule time button to book shop. ";
                                            let replies = [
                                                {
                                                    "content_type": "text",
                                                    "title": "Start Over",
                                                    "payload": "start_over"
                                                },
                                                {
                                                    "content_type": "text",
                                                    "title": "Previous ",
                                                    "payload": "inputaddress"
                                                },
                                                {
                                                    "content_type": "text",
                                                    "title": "Cancel ",
                                                    "payload": "cancel"
                                                }
                                            ];
                                            fbService.sendQuickReply(userId, responseText, replies);
                                        }

                                    });
                                } else {
                                    console.log('error');
                                }

                            });



                        }

                    });
                    break;

                default:
                    let responseText = 'Please enter correct data.';

                    fbService.sendTextMessage(userId, responseText);
                    break;
            }
        } else {
            let responseText = 'sorry, more again.';

            fbService.sendTextMessage(userId, responseText);
            return;
        }
    }
    catch (error) {
        console.log(error);
    }
}

function inputAddress(userId) {
    console.log('____________we sent message that input address.____________');

    let responseText = "Please enter your address. ";
    let replies = [
        {
            "content_type": "text",
            "title": "Start Over",
            "payload": "start_over"
        },
        {
            "content_type": "text",
            "title": "Previous ",
            "payload": "inputname"
        },
        {
            "content_type": "text",
            "title": "Cancel ",
            "payload": "cancel"
        }
    ];



    fbService.sendQuickReply(userId, responseText, replies);
}

module.exports = setSessionAndUser;



