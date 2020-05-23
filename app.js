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
if (!FB_PAGE_TOKEN) { throw new Error('missing FB_PAGE_TOKEN') }
const FB_APP_SECRET = 'eefa395df9bfb2939b74b19f6168231b';
if (!FB_APP_SECRET) { throw new Error('missing FB_APP_SECRET') }

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
        recipient: { id },
        message: { text },
    });
    const qs = 'access_token=' + encodeURIComponent(FB_PAGE_TOKEN);
    return fetch('https://graph.facebook.com/me/messages?' + qs, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        if (sessions[k].fbid === fbid) {
            // Yep, got it!
            sessionId = k;
        }
    });
    if (!sessionId) {
        // No session found for user fbid, let's create a new one
        sessionId = new Date().toISOString();
        sessions[sessionId] = { fbid: fbid, context: {} };
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
app.use(({ method, url }, rsp, next) => {
    rsp.on('finish', () => {
        console.log(`${rsp.statusCode} ${method} ${url}`);
    });
    next();
});
app.use(bodyParser.json({ verify: verifyRequestSignature }));

// Webhook setup
app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === FB_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
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
    console.log("JSON.stringify(data)");
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
                    const { text, attachments } = event.message;

                    if (attachments) {
                        // We received an attachment
                        // Let's reply with an automatic message
                        fbMessage(sender, 'Sorry I can only process text messages for now.')
                            .catch(console.error);
                    } else if (text) {
                        // We received a text message
                        // Let's run /message on the text to extract some entities, intents and traits
                        wit.message(text).then(({ entities, intents, traits }) => {
                            // You can customize your response using these
                            console.log(intents);
                            console.log(entities);
                            console.log(traits);
                            // For now, let's reply with another automatic message
                            fbMessage(sender, `We have received your message: ${text}.`);
                        })
                            .catch((err) => {
                                console.error('Oops! Got an error from Wit: ', err.stack || err);
                            })
                    }
                } else if (event.postback.payload) {
                    receivedPostback(event);
                    // const sender = event.sender.id;
                    // fbMessage(sender, `We have received your message:`);


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
            //ask user to send a .csv
            sendWelcomeMessage(senderID);
            break;
        case 'FACEBOOK_WELCOME1':
            //get information from user before they subscribe
            sendBizNewsSubscribe(senderID);
            break;
        case 'FACEBOOK_WELCOME2':
            sendTextMessage(senderID, "Great! What would you like advice on?");
            break;
        case 'FACEBOOK_WELCOME3':
            greetUserText(senderID);
            break;

        default:
            //unindentified payload
            // sendTextMessage(senderID, "I'm sorry, I didn't understand your last message. I'm new and just a bot so it will take some time to train me. Can you repeat that again?");
            break;

    }

}

function sendWelcomeMessage(userId) {
    console.log("wecomemessage");
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
    var signature = req.headers["x-hub-signature"];
    console.log(signature);

    if (!signature) {
        // For testing, let's log an error. In production, you should throw an
        // error.
        console.error("Couldn't validate the signature.");
    } else {
        var elements = signature.split('=');
        var method = elements[0];
        var signatureHash = elements[1];

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
