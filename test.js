var objs = [ 
    { first_nom: 'Lazslo', last_nom: 'Jamf'     },
    { first_nom: 'Pig',    last_nom: 'Bodine'   },
    { first_nom: 'Pirate', last_nom: 'Arentice' }
];
for(var i=0; i<objs.length; i++){
objs[i]['distance'] = objs[i]['last_nom'];

}
function compare(a,b) {
if (a.distance < b.distance)
 return -1;
if (a.distance > b.distance)
return 1;
return 0;
}
objs.sort(compare);
console.log(JSON.stringify(objs)); 