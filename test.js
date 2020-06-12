const express = require('express');
const app = express();
var schedule = require('node-schedule');

const PORT = process.env.PORT || 5000;

var futureDate = new Date(new Date().getTime() + 5* 1000); // This is 24 hours from *now*
console.log(futureDate);

// var j = schedule.scheduleJob(futureDate, function(){
//   console.log('Do your work here.');
//   var futureDate = new Date(new Date().getTime() + 5* 1000);
// });

app.listen(PORT);
console.log('Listening on :' + PORT + '...');
var schedule = require('node-schedule');

var j = schedule.scheduleJob('37 12 * * *', function(){
  console.log('The answer to life, the universe, and everything!');
});