const fbService = require('../External_API/facebook_service')
const external_api = require('../External_API/external_api')


const waitFor = (ms) => new Promise(r => setTimeout(r, ms));

module.exports = {
    self_certify: async function (userId) {
        console.log('____________When customer click "Need for volunteers" button. __________');
        await waitFor(1000);
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

    },

    certify_yes: async function (userId) {
        console.log('____________sent that input name in be_volunteer. ___________');
        let responseText = "Please seek such deliveries only when it is an emergency. The people who help you are volunteers. All deliveries will be contactless. Be polite to the volunteers. ";
        
        fbService.sendTextMessage(userId, responseText);
        console.log(res);
        let replytext = "Please enter your name.";
        let replies = [
            {
                "content_type": "text",
                "title": "Start Over",
                "payload": "start_over"
            },
            {
                "content_type": "text",
                "title": "Previous ",
                "payload": "need_volunteers"
            },
            {
                "content_type": "text",
                "title": "Cancel ",
                "payload": "cancel"
            }
        ];

        fbService.sendQuickReply(userId, replytext, replies);
    }
}

