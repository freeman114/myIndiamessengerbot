const fbService = require('./External_API/facebook_service')
module.exports = {
    self_certify: function (userId) {
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



        // fbService.sendQuickReply(userId, responseText, replies);

    }
}

