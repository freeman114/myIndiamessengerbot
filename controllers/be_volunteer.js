const fbService = require('../External_API/facebook_service')
module.exports = {
    self_certify: function (userId) {
        console.log('____________when customer click "Be a volunteer" button.____________');

        let responseText = "Do you self-certify that you will be wearing masks to the shops and have been corona negative or have not shown any symptoms for the past 14 days ? ";
        let replies = [
            {
                "content_type": "text",
                "title": "Yes",
                "payload": "be_v_yes"
            },
            {
                "content_type": "text",
                "title": "No",
                "payload": "be_v_no"
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