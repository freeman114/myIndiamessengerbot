
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