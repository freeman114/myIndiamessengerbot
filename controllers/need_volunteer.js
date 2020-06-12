const fbService = require('../External_API/facebook_service')
module.exports = {
    self_certify: function (userId) {
        console.log('____________When customer click "Need for volunteers" button. __________');

        let responseText = "Do you self-certify that you will be wearing masks to the shops and have been corona negative or have not shown any symptoms for the past 14 days ? ";
        let replies = [
            {
                "content_type": "text",
                "title": "Yes",
                "payload": "n_v_yes"
            },
            {
                "content_type": "text",
                "title": "No",
                "payload": "n_v_no"
            },
            {
                "content_type": "text",
                "title": "Start Over",
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
}

