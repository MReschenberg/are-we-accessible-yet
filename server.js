/* jshint -W097 */
/* jshint esversion: 6 */
/* jshint node: true */

"use strict";

const express = require('express');
const GenerateStats = require('./modules-local/generate-stats');
var   schedule = require('node-schedule');
const config = {
  products: ['Core', 'External Software Affecting Firefox',
             'Firefox', 'Firefox Build System', 'Firefox for iOS', 'Firefox for Android',
             'DevTools', 'GeckoView', 'NSPR', 'NSS', 'WebExtensions', 'Toolkit', 'Remote Protocol'],
  exclude: ['ca cert'], // components to exclude, can be partial strings
  types: ['defect'],
  versions: [
    {number: 69, mergedate: '2019-05-20', betadate: '2019-07-08', releasedate: '2019-09-03'},
    {number: 70, mergedate: '2019-07-08', betadate: '2019-09-02', releasedate: '2019-10-22'},
    {number: 71, mergedate: '2019-09-02', betadate: '2019-10-21', releasedate: '2019-12-03'}
  ]
};
var   data = {stats: false, message: 'not ready, please refetch'};
var   nightly = config.versions[2].number;

// Method to periodically run to generate stats

function update() {
  var myStats = new GenerateStats(config);

  myStats.then(stats => {
    console.log(stats.report);
    data = { message: 'ok', nextUpdate: j.nextInvocation(), lastUpdate: new Date(), stats: stats};
  });
}

// update at midnight
var rule = new schedule.RecurrenceRule();
rule.hour = 14;
rule.minute = 0;

var j = schedule.scheduleJob(rule, update);

// get first set of data
update();

var app = express();

app.use(express.static('public'));

app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/counts", function(request, response) {
  response.sendFile(__dirname + '/views/counts.html');
});

app.get("/summary", function(request, response) {
  response.sendFile(__dirname + '/views/summary.html');
});

app.get("/text", function(request, response) {
  var msg;

  if (data.message === 'ok') {
    msg = `I'm afraid we aren't triaged yet.
          There are ${data.stats.versions[nightly].untriaged.count} untriaged bugs in nightly.`;
  } else {
    msg = "I'm still collecting data, please try again later.";
  }
  
  response.send(msg);
});

app.get("/data", function (request, response) {
  response.send(data);
});

// listen for requests :)
var listener = app.listen(process.env.PORT || 8080, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
