
const request = require('request');
const config = require('./config');
const fetch = require("node-fetch");

module.exports = {
    displayShop: async function (userId, value, callback) {
        apikey = config.GOOGLE_API_KEY;
        const url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + value + '&key=' + apikey;
        
        try {
            const response = await fetch(url);
            const json = await response.json();
            console.log(JSON.stringify(json));
            const lat = json.results[0].geometry.location.lat.toString();
            const lng = json.results[0].geometry.location.lng.toString();
            const address = lat + ', ' + lng;
            const url_address = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?type=store&rankby=distance&=&key=' + apikey + '&location=' + address;
            const response_list = await fetch(url_address);
            const res = await response_list.json();
            console.log(JSON.stringify(res.results));
            var result = res.results;
            console.log(result.length);
            var shopArray = [];

            for (i = 0; i < 10; i++) {
                if (result[i].photos) {
                    imageUrl = 'https://maps.googleapis.com/maps/api/place/photo?photoreference=' + result[i].photos[0].photo_reference + '&key=' + apikey + '&maxwidth=200'
                } else {
                    imageUrl = ' https://98faba2c.ngrok.io/webhook/public/images/unsupportedimage.png';
                }

                var name = i + '_' + result[i].name;
                var place_id = result[i].place_id;
                buttons = [];
                var Array = { address: value, name: name, place_id: place_id };
                var Arrays = JSON.stringify(Array);
                var button = { "type": "postback", "title": "Booking schedule time", "payload": Arrays };
                buttons.push(button);
                console.log(buttons);
                var option =
                {
                    "title": result[i].name, "image_url": imageUrl,
                    "default_action":
                    {
                        "type": "web_url",
                        "url": "https://petersfancybrownhats.com/view?item=103", "webview_height_ratio": "tall"
                    },
                    "buttons": buttons
                };
                shopArray.push(option);
                // console.log(JSON.stringify(shopArray));
                if (shopArray.length == 10) {
                    console.log(JSON.stringify(shopArray));
                    callback(shopArray);
                }
            }
        } catch (error) {
            console.log(error);
        }

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