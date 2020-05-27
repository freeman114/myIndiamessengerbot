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
const request = require('request');
const uuid = require('uuid');


const fbService = require('./facebook_service')
const external_api = require('./external_api')
const userService = require('./user');

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
const WIT_TOKEN = 'PQDZSQIUDITQSG4PEPWSTQSAOCL5HMIA';

// Messenger API parameters
const FB_PAGE_TOKEN = 'EAADhs54CZBV4BABhvflRJh3J03zD8zkZBRUtgAFEjm6gruGRyoyX8JZB2bRk8PvzTRTSZBKTZC232llCZBhipVIPPbZCoHgbSZCUgcwqxc1tdvbtOO930vEmCMEHM5JdGnoK7vGBkZBwRijZAAXd43jhG1MFJ4Sko2Sv7Elt9ZAN30SeMHcKsCvXY8M';
if (!FB_PAGE_TOKEN) {
    throw new Error('missing FB_PAGE_TOKEN')
}
const FB_APP_SECRET = 'eefa395df9bfb2939b74b19f6168231b';
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

// Message handler
app.post('/webhook', (req, res) => {
    // Parse the Messenger payload
    // See the Webhook reference
    // https://developers.facebook.com/docs/messenger-platform/webhook-reference

    const data = req.body;
    console.log("****************We received webhook event.***************");
    console.log(JSON.stringify(data));

    if (data.object === 'page') {
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
                        // We received a text message
                        // Let's run /message on the text to extract some entities, intents and traits
                        // wit.message(text).then(({ entities, intents, traits
                        // }) => {
                        //     // You can customize your response using these
                        //     console.log(intents);
                        //     console.log(entities);
                        //     console.log(traits);
                        //     console.log(evnet);
                        //     // For now, let's reply with another automatic message
                        //     // fbMessage(sender, `We have received your message: ${text}.`);
                        //     // receivedMessage(event);
                        // })
                        //     .catch((err) => {
                        //         console.error('Oops! Got an error from Wit: ', err.stack || err);
                        //     })
                    }
                } else if (event.postback.payload) {
                    receivedPostback(event);
                    // const sender = event.sender.id;
                }
                else {
                    console.log('received event', JSON.stringify(event));
                }
            });
        });
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

        case 'FACEBOOK_WELCOME':
            sendWelcomeMessage(senderID);
            break;
        case 'FACEBOOK_WELCOME1':

            break;
        case 'FACEBOOK_WELCOME2':
            break;
        case 'FACEBOOK_WELCOME3':
            break;

        default:
            //unindentified payload
            // sendTextMessage(senderID, "I'm sorry, I didn't understand your last message. I'm new and just a bot so it will take some time to train me. Can you repeat that again?");
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
            inputName(userId, cash);
            break;
        case 'need_volunteers':

            break;

        case 'be_volunteer':

            break;
        case 'start_over':
            sendWelcomeMessage(userId);
            break;
        case 'previous':

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

function inputName(userId, cash) {
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
            "payload": "previous"
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
    console.log('__________received text message___________');
    var userId = event.sender.id;
    console.log(JSON.stringify(event));

    if (event.message.nlp.entities.intent) {
        var wit_confience = event.message.nlp.entities.intent.confidence;
        var intent = event.message.nlp.entities.intent[0].value;

        console.log(intent);
        switch (intent) {
            case 'name':
                var value = event.message.nlp.entities.name[0].value;
                console.log(value);

                inputAddress(userId);
                break;
            case 'greeting':
                sendWelcomeMessage(userId);
                break;

            case 'address_position':
                var value = event.message.nlp.entities.location[0].value;
                console.log(value);
                external_api.displayShop(userId, value, function (array) {
                    if (array){
                        var count = 0;
                        console.log(array[count]);
                        fbService.showStore(userId, array[count], function (){

                        })

                        
                    }
                    
                });
                break;

            default:
                break;
        }
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
            "payload": "previous"
        },
        {
            "content_type": "text",
            "title": "Cancel ",
            "payload": "cancel"
        }
    ];

    fbService.sendQuickReply(userId, responseText, replies);
}

