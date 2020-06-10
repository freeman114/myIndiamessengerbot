
var m_timeslot = "";
function set_timeslot(id) {
    console.log('what is timeslot');
    console.log(id);
    m_timeslot = id;
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
                var b64Response = btoa(res);
                
                console.log(b64Response);
                // create an image
                var outputImg = document.createElement('img');
                outputImg.src = res.from;

                // append it to your page
                $('#myqrcode').prop('src', res.from);
                $('#download').prop('href', res.from);
                // document.getElementById("myimg").appendChild(outputImg);

                // console.log(res.from);
                // // var img = JSON.stringify(res.from);
                // var outputImg = document.createElement('img');
                // outputImg.src = 'data:image/png;base64,' + res.from;

                // // append it to your page
                // document.body.appendChild(outputImg);
            },
            error: function (error) {
                console.log('some error in fetching the intents');
            },
        });
        // $.ajax({
        //     url: '/webview',
        //     method: 'POST',
        //     data: {
        //         text: m_timeslot
        //     },
        //     contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        //     success: function (res) {
        //         alert('success');
        //     },
        //     error: function (error) {
        //         console.log('some error in fetching the intents');
        //     },
        // });
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

