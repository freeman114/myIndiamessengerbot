
const request = require('request');
module.exports = {
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
                access_token: 'EAADhs54CZBV4BABhvflRJh3J03zD8zkZBRUtgAFEjm6gruGRyoyX8JZB2bRk8PvzTRTSZBKTZC232llCZBhipVIPPbZCoHgbSZCUgcwqxc1tdvbtOO930vEmCMEHM5JdGnoK7vGBkZBwRijZAAXd43jhG1MFJ4Sko2Sv7Elt9ZAN30SeMHcKsCvXY8M'
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
        array.shift();

        var options = {
            'method': 'POST',
            'url': 'https://graph.facebook.com/v7.0/me/messages?access_token=EAADhs54CZBV4BABhvflRJh3J03zD8zkZBRUtgAFEjm6gruGRyoyX8JZB2bRk8PvzTRTSZBKTZC232llCZBhipVIPPbZCoHgbSZCUgcwqxc1tdvbtOO930vEmCMEHM5JdGnoK7vGBkZBwRijZAAXd43jhG1MFJ4Sko2Sv7Elt9ZAN30SeMHcKsCvXY8M',
            'headers': {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "recipient":
                    { "id": userID },
                "message": {
                    "attachment": {
                        "type": "template", "payload":
                        {
                            "template_type": "generic",
                            "elements": array

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

    addTimeslot: function (userID, array, callback) {
        var buttons = [];

        array.forEach(item => {
            console.log(item);
            button = {
                "type": "postback",
                "title": JSON.stringify(item),
                "payload": "DEVELOPER_DEFINED_PAYLOAD"
            };
            console.log(JSON.stringify(buttons));
        });
        buttons.push(button);
        if (array.length == buttons.length) {
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