
const request = require('request');
const config = require('./config');

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
        // array.shift();

        var options = {
            'method': 'POST',
            'url': 'https://graph.facebook.com/v7.0/me/messages?access_token=EAADhs54CZBV4BABKwmkprEkUcbg3ResZChZBZAWiwoKFZBP4hc5O7oDfgJ7W0XprZByCOcY1jCqHgSUmuZAXMtOk58c6DJPBktGfdilgx7cnH6oRhVENW2ygZBsaa9uM6jT36orlY84Njt0aTX7gzHQ8YNBMqxQaBmA38k2sPcZCC1QZDZD',
            'headers': {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "recipient": { "id": userID }, "message": {
                    "attachment": {
                        "type": "template", "payload": {
                            "template_type": "generic",
                            "elements": [{ "title": "Sushil Aggrawal Grocery Store", "image_url": " https://static3.depositphotos.com/1000556/110/i/950/depositphotos_1102733-stock-photo-shopping-cart.jpg", "buttons": [{ "type": "web_url", "url": "https://facebookmessengerapp-1.herokuapp.com/webview?address=Back St, Block B, Shastri Nagar, Delhi, 110052, India&name=Sushil Aggrawal Grocery Store&place_id=ChIJozsimGUCDTkRiGWolw4L6D8", "title": "Booking schedule time", "webview_height_ratio": "compact", "messenger_extensions": "true" }] }]
                        }
                    }
                }
            })

        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            console.log(response.body);
        });
    },

    addTimeslot: function (userID, array, callback) {
        var buttons = [];

        array.forEach(item => {
            console.log(item);
            button = {
                "type": "postback",
                "title": item,
                "payload": "DEVELOPER_DEFINED_PAYLOAD"
            };
            buttons.push(button);
        });
        if (array.length == buttons.length) {
            console.log(JSON.stringify(buttons));
            var options = {
                'method': 'POST',
                'url': 'https://graph.facebook.com/v7.0/me/messages?access_token=EAADhs54CZBV4BABhvflRJh3J03zD8zkZBRUtgAFEjm6gruGRyoyX8JZB2bRk8PvzTRTSZBKTZC232llCZBhipVIPPbZCoHgbSZCUgcwqxc1tdvbtOO930vEmCMEHM5JdGnoK7vGBkZBwRijZAAXd43jhG1MFJ4Sko2Sv7Elt9ZAN30SeMHcKsCvXY8M',
                'headers': {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "recipient": {
                        "id": userID
                    },
                    "message": {
                        "attachment": {
                            "type": "template",
                            "payload": {
                                "template_type": "generic",
                                "elements": [
                                    {
                                        "buttons": buttons,
                                        "title": "Welcome!"
                                    }
                                ]
                            }
                        }
                    }
                })

            };

            request(options, function (error, response) {
                if (error) throw new Error(error);
                console.log(response.body);

            });
        }


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