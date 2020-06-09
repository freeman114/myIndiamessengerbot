
var m_timeslot = "";
function set_timeslot(id) {
    console.log('what is timeslot');
    console.log(id);
    m_timeslot = id;
}

async function save_timeslot() {
    if (!m_timeslot) {
        alert('choose time in list.');
    }
    else {
        $.ajax({
            url: '/webview',
            method: 'POST',
            data: {
                text: m_timeslot,
            },
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            success: function (res) {
                alert('success');
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
}

