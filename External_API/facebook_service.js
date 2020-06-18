
const request = require('request');
const config = require('../config');
const { FB_PAGE_TOKEN } = require('../config');

module.exports = {

    sendTextMessage: function (recipientId, text) {
        let self = module.exports;
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text: text
            }
        }
        self.callSendAPI(messageData);
    },

    sendQuickReply: function (recipientId, text, replies, metadata) {
        let self = module.exports;
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                text: text,
                metadata: self.isDefined(metadata) ? metadata : '',
                quick_replies: replies
            }
        };

        self.callSendAPI(messageData);
    },

    callSendAPI: function (messageData) {
        request({
            uri: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {
                access_token: config.FB_PAGE_TOKEN
            },
            method: 'POST',
            json: messageData

        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var recipientId = body.recipient_id;
                var messageId = body.message_id;

                if (messageId) {
                    console.log("Successfully sent message with id %s to recipient %s",
                        messageId, recipientId);
                } else {
                    console.log("Successfully called Send API for recipient %s",
                        recipientId);
                }
            } else {
                console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
            }
        });
    },

    showStore: function (userID, array, callback) {

        var _array = [];
        array.forEach(item => {
            const obj = {
                "title": item.title,
                "image_url": item.image_url,
                "buttons": [
                    {
                        "type": "web_url",
                        "url": item.buttons[0].url + '&userID=' + userID,
                        "title": "Booking schedule time",
                        "webview_height_ratio": "tall",
                        "messenger_extensions": "true"
                    }
                ]
            };
            _array.push(obj);
        });

        var options = {
            'method': 'POST',
            'url': 'https://graph.facebook.com/v7.0/me/messages?access_token=' + config.FB_PAGE_TOKEN,
            'headers': {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "recipient": {
                    "id": userID
                },
                "message":
                {
                    "attachment":
                    {
                        "type": "template",
                        "payload":
                        {
                            "template_type": "generic",
                            "elements": _array
                        }
                    }
                }
            })

        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            console.log(response.body);
            callback(true);
        });
    },

    timeslot_template: function (userID, callback) {
        var request = require('request');
        var options = {
            'method': 'POST',
            'url': 'https://graph.facebook.com/v7.0/me/messages?access_token=' + config.FB_PAGE_TOKEN,
            'headers': {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "recipient":
                    { "id": userID },
                "message":
                {
                    "attachment":
                    {
                        "type": "template",
                        "payload":
                        {
                            "template_type": "generic",
                            "elements":
                                [{
                                    "title": "Please enter your timeslot.The time slots are 60 minutes slots from 9 AM to 6:30 PM (For example 9-10 AM, 10-11 AM and so on). ",
                                    "buttons":
                                        [{
                                            "type": "web_url",
                                            "url": "https://facebookmessengerapp-1.herokuapp.com/n_v_timeslot?userID=" + userID,
                                            "title": "All the timeslots",
                                            "messenger_extensions": "true"
                                        }]
                                }]
                        }
                    }
                }
            })

        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            console.log(response.body);
            callback();
        });
    },

    notify_template: function (userID, callback) {
        var options = {
            'method': 'POST',
            'url': 'https://graph.facebook.com/v7.0/me/messages?access_token=' + FB_PAGE_TOKEN,
            'headers': {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "recipient": { "id": userID }, "message": { "attachment": { "type": "template", "payload": { "template_type": "one_time_notif_req", "title": "Needed volunteer", "payload": "need_notification" } } } })

        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            console.log(response.body);
            callback();
        });
    },

    orderlist_template: function (userID, origin_add, callback) {
        var request = require('request');
        var options = {
            'method': 'POST',
            'url': 'https://graph.facebook.com/v7.0/me/messages?access_token=' + config.FB_PAGE_TOKEN,
            'headers': {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "recipient":
                    { "id": userID },
                "message":
                {
                    "attachment":
                    {
                        "type": "template",
                        "payload":
                        {
                            "template_type": "generic",
                            "elements":
                                [{
                                    "title": " Order List",
                                    "buttons":
                                        [{
                                            "type": "web_url",
                                            "url": "https://facebookmessengerapp-1.herokuapp.com/b_v_list?userID=" + userID + '&address=' + origin_add,
                                            "title": "All list",
                                            "messenger_extensions": "true"
                                        }]
                                }]
                        }
                    }
                }
            })

        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            console.log(response.body);
            callback();
        });
    },

    otn_message: function (userID, name, phone_number,  token, callback) {
        var options = {
            'method': 'POST',
            'url': 'https://graph.facebook.com/v7.0/me/messages?access_token=' + config.FB_PAGE_TOKEN,
            'headers': {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "recipient": { "one_time_notif_token": token },
                "message":
                {
                    "text": " Hello," + name + "Your order have accepted. Please contact with him using phonenumber" + phone_number
                }
            })

        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            console.log(response.body);
            callback();
        });
    },

    isDefined: function (obj) {
        if (typeof obj == 'undefined') {
            return false;
        }

        if (!obj) {
            return false;
        }

        return obj != null;
    }
}

