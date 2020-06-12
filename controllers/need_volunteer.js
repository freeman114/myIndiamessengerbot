const fbService = require('../External_API/facebook_service')
const external_api = require('../External_API/external_api')


const waitFor = (ms) => new Promise(r => setTimeout(r, ms));

module.exports = {
    self_certify: async function (userId) {
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

    },

    //when customer click yes in Need for volunteers
    certify_yes: async function (userId) {
        console.log('____________sent that input name in be_volunteer. ___________');
        let responseText = "Please seek such deliveries only when it is an emergency. The people who help you are volunteers. All deliveries will be contactless. Be polite to the volunteers. ";

        fbService.sendTextMessage(userId, responseText);
        await waitFor(1000);
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
    },

    // when user enter name
    sendToWit_1: function (event) {
        try {
            let self = module.exports;
            console.log('__________received text message___________');
            var userId = event.sender.id;
            console.log(JSON.stringify(event));

            if (event.message.nlp.entities.intent) {
                var wit_confience = event.message.nlp.entities.intent.confidence;
                var intent = event.message.nlp.entities.intent[0].value;

                console.log(intent);
                switch (intent) {
                    case 'name':
                        if (event.message.nlp.entities.intent[0].confidence > 0.95) {
                            var value = event.message.nlp.entities.name[0].value;
                            console.log(value);
                            self.inputAddress(userId);
                        } else {
                            let responseText = 'Please enter correct data.';

                            fbService.sendTextMessage(userId, responseText);
                        }

                        break;
                    case 'greeting':
                        sendWelcomeMessage(userId);
                        break;

                    case 'address':
                        var value = event.message.nlp.entities.location[0].value;
                        console.log(value);
                        external_api.displayShop(value, function (array) {
                            if (array) {
                                userService.add_Shoplist(userId, array, function (updated) {
                                    if (updated) {
                                        fbService.showStore(userId, array, function (s_h) {
                                            if (s_h) {
                                                console.log("success");
                                                let responseText = "Click Booking schedule time button to book shop. ";
                                                let replies = [
                                                    {
                                                        "content_type": "text",
                                                        "title": "Start Over",
                                                        "payload": "start_over"
                                                    },
                                                    {
                                                        "content_type": "text",
                                                        "title": "Previous ",
                                                        "payload": "inputaddress"
                                                    },
                                                    {
                                                        "content_type": "text",
                                                        "title": "Cancel ",
                                                        "payload": "cancel"
                                                    }
                                                ];
                                                fbService.sendQuickReply(userId, responseText, replies);
                                            }

                                        });
                                    } else {
                                        console.log('error');
                                    }

                                });



                            }

                        });
                        break;

                    default:
                        let responseText = 'Please enter correct data.';

                        fbService.sendTextMessage(userId, responseText);
                        break;
                }
            } else {
                let responseText = 'sorry, more again.';

                fbService.sendTextMessage(userId, responseText);
                return;
            }
        }
        catch (error) {
            console.log(error);
        }
    }
}

