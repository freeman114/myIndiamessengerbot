
var m_timeslot = "";

// function closewebview(s, id) {
//     var js, fjs = document.getElementsByTagName('div')[0];
//     if (document.getElementById(id)) { return; }
//     js = document.createElement('div'); 
//     js.id = 'webview';
//     js.src = "//connect.facebook.net/en_US/messenger.Extensions.js";
//     fjs.parentNode.insertBefore(js, fjs);
// }

(function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) { return; }
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.com/en_US/messenger.Extensions.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, "script", "Messenger"));

window.extAsyncInit = function () {
    // the Messenger Extensions JS SDK is done loading
    //close the webview
    MessengerExtensions.requestCloseBrowser(function success() {

    }, function error(err) {

    });

};

function set_timeslot(id) {
    // console.log('what is timeslot');
    document.getElementsByClassName("okbutton")[0].disabled = false;
    m_timeslot = id;
    console.log(id);
    $("#needvol").text('timeslot: ' + id);
}



async function save_timeslot(ids) {
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

