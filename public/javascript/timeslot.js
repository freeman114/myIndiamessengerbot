
var m_timeslot = "";
function set_timeslot(id) {
    console.log('what is timeslot');
    console.log(id);
    m_timeslot = id;
}

function save_timeslot() {
    if (!m_timeslot) {
        alert('choose time in list.');
    }
    else {
        console.log(m_timeslot);
        $.ajax({
            url: '/webview',
            method: 'POST',
            data: {
                text: m_timeslot
            },
            contentType: "application/json; charset=utf-8",
            dataType: "json",
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

