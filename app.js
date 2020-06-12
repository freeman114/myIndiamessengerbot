/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 */

'use strict';

// Messenger API integration example
// We assume you have:
// * a Wit.ai bot setup (https://wit.ai/docs/quickstart)
// * a Messenger Platform setup (https://developers.facebook.com/docs/messenger-platform/quickstart)
// You need to `npm install` the following dependencies: body-parser, express, node-fetch.
//
// 1. npm install body-parser express node-fetch
// 2. Download and install ngrok from https://ngrok.com/download
// 3. ./ngrok http 5000
// 4. WIT_TOKEN=your_access_token FB_APP_SECRET=your_app_secret FB_PAGE_TOKEN=your_page_token node examples/messenger.js
// 5. Subscribe your page to the Webhooks using verify_token and `https://<your_ngrok_io>/webhook` as callback URL.
// 6. Talk to your bot on Messenger!

const bodyParser = require('body-parser');
const crypto = require('crypto');
const express = require('express');
const fetch = require('node-fetch');
const uuid = require('uuid');
var path = require('path');
var httpsMsgs = require('http-msgs');
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
    var j = schedule.scheduleJob('20 22 * * *', function () {
        console.log('database format!');
        userService.formatdatabase(() => {
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
app.use(bodyParser.json({
    verify: verifyRequestSignature
}));
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
                // console.log(url);
                // let data = url.replace(/.*,/, '')
                // let img = new Buffer.from(data, 'base64');
                // console.log(img);
                // res.writeHead(200,{
                //     'Content-Type' : 'image/png',
                //     'Content-Length' : img.length
                // })


                // res.end(img);
                // res.status(200).json({
                //     status: 'succes',
                //     from: url,
                // })
                // res.end(url);
                // res.write(url);
                // res.json({ from: url });
            });

        });

    } catch (e) {
        console.log(e);

    }
});

// Message handler
app.post('/webhook', (req, res) => {
    // Parse the Messenger payload
    // See the Webhook reference
    // https://developers.facebook.com/docs/messenger-platform/webhook-reference

    const data = req.body;
    console.log("****************We received webhook event.***************");
    console.log(JSON.stringify(data));

    if (data.object === 'page' && data.entry[0].messaging) {
        try {
            data.entry.forEach(entry => {
                entry.messaging.forEach(event => {
                    if (event.message && !event.message.is_echo) {
                        // Yay! We got a new message!
                        // We retrieve the Facebook user ID of the sender
                        const sender = event.sender.id;

                        // We could retrieve the user's current session, or create one if it doesn't exist
                        // This is useful if we want our bot to figure out the conversation history
                        // const sessionId = findOrCreateSession(sender);
                        // We retrieve the message content
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


function receivedPostback(event) {
    var senderID = event.sender.id;
    setSessionAndUser(senderID);
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

function receivedMessage(event) {
    console.log('_____________We received message___________');
    console.log(JSON.stringify(event));
    var senderID = event.sender.id;
    setSessionAndUser(senderID);
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
        sendToWit(event);
        return;
    }


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
/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
    var signature = req.headers[
        "x-hub-signature"
    ];
    console.log(signature);

    if (!signature) {
        // For testing, let's log an error. In production, you should throw an
        // error.
        console.error("Couldn't validate the signature.");
    } else {
        var elements = signature.split('=');
        var method = elements[
            0
        ];
        var signatureHash = elements[
            1
        ];

        var expectedHash = crypto.createHmac('sha1', FB_APP_SECRET)
            .update(buf)
            .digest('hex');

        if (signatureHash != expectedHash) {
            throw new Error("Couldn't validate the request signature.");
        }
    }
}

app.listen(PORT);
console.log('Listening on :' + PORT + '...');

function setSessionAndUser(senderID) {
    if (!sessionIds.has(senderID)) {
        sessionIds.set(senderID, uuid.v1());
    }

    if (!usersMap.has(senderID)) {
        userService.addUser(function (user) {
            usersMap.set(senderID, user);
        }, senderID);
    }
}

function handleQuickreply(userId, quickReply, messageId) {
    console.log('_________Received quickreply response________');
    var quickReplyPayload = quickReply.payload;
    var cash;
    switch (quickReplyPayload) {
        case 'self_service':
            console.log(quickReplyPayload);
            inputName(userId);
            break;
        case 'need_volunteers':
            n_v_s.self_certify(userId);
            break;

        case 'be_volunteer':
            be_v.self_certify(userId);


            break;
        case 'start_over':
            sendWelcomeMessage(userId);
            break;
        case 'inputname':
            inputName(userId);
            break;
        case 'inputaddress':
            inputAddress(userId);
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

function sendToWit(event) {
    try {
        console.log('__________received text message___________');
        var userId = event.sender.id;
        console.log(JSON.stringify(event));

        if (event.message.nlp.entities.intent) {
            var wit_confience = event.message.nlp.entities.intent.confidence;
            var intent = event.message.nlp.entities.intent[0].value;

            console.log(intent);
            switch (intent) {
                case 'name':
                    if (event.message.nlp.entities.intent[0].confidence > 0.95) {
                        var value = event.message.nlp.entities.name[0].value;
                        console.log(value);
                        inputAddress(userId);
                    } else {
                        let responseText = 'Please enter correct data.';

                        fbService.sendTextMessage(userId, responseText);
                    }

                    break;
                case 'greeting':
                    sendWelcomeMessage(userId);
                    break;

                case 'address':
                    var value = event.message.nlp.entities.location[0].value;
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


