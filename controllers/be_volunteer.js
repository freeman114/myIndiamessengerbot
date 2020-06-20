const fbService = require('../External_API/facebook_service')

const userService = require('../models/user');
const external_api = require('../External_API/external_api')
const appmodule = require('../app');
const waitFor = (ms) => new Promise(r => setTimeout(r, ms));

module.exports = {
    self_certify: function (userId) {
        console.log('#############when customer click "Be a volunteer" button.############');

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

    },

    certify_yes: async function (userId) {
        console.log('%%%%%%%%%%%%% sent that input name in be_volunteer. %%%%%%%%%%%%%%%%');
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

    certify_no: function (userID) {
        console.log('%%%%%%%%%%%%% when customer answer "no". %%%%%%%%%%%%%%%%');


        let replytext = "For health reasons, we can't allow you.";
        let replies = [
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

        fbService.sendQuickReply(userID, replytext, replies);
    },

    sendToWit_2: function (event) {
        try {
            let self = module.exports;
            console.log('%%%%%%%%%%%%%received text message%%%%%%%%%%%%%');
            var userId = event.sender.id;
            console.log(JSON.stringify(event));
            var wit_confience = event.message.nlp.intents[0].confidence;
            console.log(wit_confience);
            if (wit_confience > 0.95) {
                var intent = event.message.nlp.intents[0].name;
                console.log(intent);
                switch (intent) {
                    case 'name':
                        // if (event.message.nlp.entities.intent[0].confidence > 0.95) {
                            self.input_phonenumber(userId);
                        // } else {
                        //     let responseText = 'Please enter correct data.';

                        //     fbService.sendTextMessage(userId, responseText);
                        // }

                        break;
                    case 'greeting':
                        self.sendWelcomeMessage(userId);
                        break;
                    case 'phone_number':
                        var phone_number = event.message.text;
                        userService.b_v_phonenumber(userId, phone_number, (updated) => {
                            if (updated) {
                                self.inputAddress(userId);

                            }


                        });

                        break;

                    case 'address':
                        var origin_add = event.message.text;
                        console.log(origin_add);

                        fbService.orderlist_template(userId, origin_add, () => {
                            self.quickreply_list(userId);
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
    },

    sendWelcomeMessage: async function (userId) {
        console.log("%%%%%%%%%%%%%%% We received welcomemessage! %%%%%%%%%%%%%%%%%%");
        let responseText = "Welcome to Localize. Here you can book your slots for shopping at your nearest shop, Requires delivery of goods or Become a volunteer. What would you like to choose? ";
        // await appmodule.setSessionAndUser(userId);
        let replies = [
            {
                "content_type": "text",
                "title": "Self-service",
                "payload": "self_service"
            },
            {
                "content_type": "text",
                "title": "Need for volunteers ",
                "payload": "need_volunteers"
            },
            {
                "content_type": "text",
                "title": "Be a volunteer ",
                "payload": "be_volunteer"
            },
            {
                "content_type": "text",
                "title": " Cancel",
                "payload": "cancel"
            }
        ];

        fbService.sendQuickReply(userId, responseText, replies);
    },

    quickreply_list: function (userId) {
        let responseText = "Please click 'All list' button to check order list. ";
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

        fbService.sendQuickReply(userId, responseText, replies);

    },

    inputAddress: function (userId) {
        console.log('%%%%%%%%%%%%%% we sent message that input location.%%%%%%%%%%%%%%%');

        let responseText = "Please enter your location. ";
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



        fbService.sendQuickReply(userId, responseText, replies);
    },

    input_phonenumber: function (userID) {
        console.log('%%%%%%%%%%%%%% we sent message that input phonenumber.%%%%%%%%%%%%%%%');

        let responseText = "Please enter your phonenumber. ";
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



        fbService.sendQuickReply(userID, responseText, replies);
    }

}



