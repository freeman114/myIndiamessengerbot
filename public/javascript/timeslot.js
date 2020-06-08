function set_timeslot(){
    console.log('what is timeslot');
    alert();
}

function alert() { 
    var doc; 
    var result = confirm("Press a button!"); 
    if (result == true) { 
        doc = "OK was pressed."; 
    } else { 
        doc = "Cancel was pressed."; 
    } 
    document.getElementById("9:00 ~ 9:15 AM").innerHTML = doc; 
} 