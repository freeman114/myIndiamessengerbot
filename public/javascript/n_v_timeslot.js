
var m_timeslot = "";


function set_timeslot(id) {
    // console.log('what is timeslot');
    document.getElementsByClassName("okbutton")[0].disabled = false;
    m_timeslot = id;
    console.log(id);
    $("#needvol").text('timeslot: ' + id);
}



async function display_needvol(ids) {
    MessengerExtensions.requestCloseBrowser(function success() {
        // webview closed
      }, function error(err) {
        // an error occurred
      });
    // if (!m_timeslot) {
    //     alert('choose time in list.');
    // }
    // else {

    //     $.ajax({
    //         url: '/timeslot?text=' + m_timeslot + '&ids=' + ids,
    //         method: 'GET',
    //         success: function (res) {
    //             console.log(res);
              
    //             $('#myqrcode').prop('src', res.from);
    //             $('#download').prop('href', res.from);
                
    //             document.getElementById(m_timeslot).style.display = 'none';
    //         },
    //         error: function (error) {
    //             console.log('some error in fetching the intents');
    //         },
    //     });
    // }
    // console.log("save");
}

function close_webview() {
    console.log("close");
    window.close();



}

// (function (d, s, id) {
//     var js, fjs = d.getElementsByTagName(s)[0];
//     if (d.getElementById(id)) { return; }
//     js = d.createElement(s);
//     js.id = id;
//     js.src = "//connect.facebook.net/en_US/messenger.Extensions.js";
//     fjs.parentNode.insertBefore(js, fjs);
// }(document, 'script', 'Messenger'));

