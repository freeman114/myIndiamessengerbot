
var m_timeslot = "";
function set_timeslot(id){
    console.log('what is timeslot');
    console.log(id);
    m_timeslot = id;
}

function save_timeslot(){
    if (!m_timeslot){
        alert ('choose time in list.');
    }
    else {
        console.log(m_timeslot);
        
    }
    console.log("save");
}

function close_webview(){
    console.log("close");
}

