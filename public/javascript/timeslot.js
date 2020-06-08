function set_timeslot(){
    console.log('what is timeslot');
    confirm();
}

function alert() { 
    var doc; 
    var result = confirm("Press a button!"); 
    if (result == true) { 
        doc = "OK was pressed."; 
    } else { 
        doc = "Cancel was pressed."; 
    } 
    document.getElementById("g").innerHTML = doc; 
} 