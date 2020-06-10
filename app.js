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



const fbService = require('./facebook_service')
const external_api = require('./external_api')
const userService = require('./user');
const config = require('./config');


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
    console.log(`/webhook will accept the Verify Token "${FB_VERIFY_TOKEN}"`);
});


// ----------------------------------------------------------------------------
// Messenger API specific code
// See the Send API reference
// https://developers.facebook.com/docs/messenger-platform/send-api-reference


const sessionIds = new Map();
const usersMap = new Map();

const fbMessage = (id, text) => {
    const body = JSON.stringify({
        recipient: {
            id
        },
        message: {
            text
        },
    });
    const qs = 'access_token=' + encodeURIComponent(FB_PAGE_TOKEN);
    return fetch('https: //graph.facebook.com/me/messages?' + qs, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body,
    })
        .then(rsp => rsp.json())
        .then(json => {
            if (json.error && json.error.message) {
                throw new Error(json.error.message);
            }
            return json;
        });
};

// ----------------------------------------------------------------------------
// Wit.ai bot specific code
// This will contain all user sessions.
// Each session has an entry:
// sessionId -> {fbid: facebookUserId, context: sessionState}
const sessions = {};

const findOrCreateSession = (fbid) => {
    let sessionId;
    // Let's see if we already have a session for the user fbid
    Object.keys(sessions).forEach(k => {
        if (sessions[k
        ].fbid === fbid) {
            // Yep, got it!
            sessionId = k;
        }
    });
    if (!sessionId) {
        // No session found for user fbid, let's create a new one
        sessionId = new Date().toISOString();
        sessions[sessionId
        ] = {
            fbid: fbid, context: {}
        };
    }
    return sessionId;
};

// Setting up our bot
const wit = new Wit({
    accessToken: WIT_TOKEN,
    logger: new log.Logger(log.INFO)
});

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

app.get('/timeslot', (req, res) => {
    try {
        console.log(req.query.text);
        const time = req.query.text;
        const ids = req.query.ids;
        var idss = ids.split("??")
        userService.update_timeslot(ids, time, function () {
            // fbService.sendQuickReply
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
            var responseText = "You can use QR code in following to verify yourself in the shop";
            fbService.sendQuickReply(idss[0], responseText, replies);
            QRCode.toDataURL('I am a pony!', function (err, url) {
                console.log(url);
                let data = url.replace(/.*,/, '')
                let img = new Buffer(data, 'base64');
                console.log(img);
            });
            httpsMsgs.sendJSON(req, res, {
                from: "success"
            });
        });

    } catch (e) {
        console.log(e);

    }
});
// app.post('/webview', function (req, res){
//     console.log(typeof(req));
//     console.log(req.body.text);
//     httpsMsgs.sendJSON(req, res, {
//         from: "res.result.output.text[0]"
//     });
// });

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
                            fbMessage(sender, 'Sorry I can only process text messages for now.')
                                .catch(console.error);
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
            // if (JSON.parse(payload).address) {
            //     var payload = JSON.parse(payload);
            //     var shopName = payload.name;
            //     console.log("____received timeslot_____");
            //     console.log(shopName);
            //     var place_id = payload.place_id;
            //     userService.add_Timeslot(shopName, place_id, function (timearray) {
            //         fbService.addTimeslot(senderID, timearray, function (updated) {
            //             if (updated) {
            //                 console.log("display");
            //             }
            //         });

            //     });
            // }
            break;
    }
}

function receivedMessage(event) {
    console.log('_____________We received message___________');
    console.log(JSON.stringify(event));
    var senderID = event.sender.id;
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
    console.log("______________We received welcomemessage._________________");
    let responseText = "Welcome to Localize. Here you can book your slots for shopping at your nearest shop, Requires delivery of goods or Become a volunteer. What would you like to choose? ";

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

            break;

        case 'be_volunteer':

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


