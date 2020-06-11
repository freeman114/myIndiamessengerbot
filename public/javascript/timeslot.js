
var m_timeslot = "";
function set_timeslot(id) {
    console.log('what is timeslot');
    m_timeslot = id;
    console.log(id);
}

async function save_timeslot(ids) {
    if (!m_timeslot) {
        alert('choose time in list.');
    }
    else {

        $.ajax({
            url: '/timeslot?text=' + m_timeslot + '&ids=' + ids,
            method: 'GET',
            success: function (res) {
                // var b64Response = btoa(res);

                // console.log(b64Response);
                // var outputImg = document.createElement('img');
                // outputImg.src = res.from;
                $('#myqrcode').prop('src', res);
                $('#download').prop('href', res);
                
                document.getElementById(m_timeslot).style.display = 'none';
            },
            error: function (error) {
                console.log('some error in fetching the intents');
            },
        });
    }
    console.log("save");
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

