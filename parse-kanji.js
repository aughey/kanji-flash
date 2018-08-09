'use strict';

var parse = require('csv-parse')
var fs = require('fs');
parse(fs.readFileSync("kanji2.csv"), {
  quote: '',
  relax_column_count: true,
  delimiter: '\t'
}, function(err, records) {
  if (err) {
    console.log(err);
    return;
  }
  // This gets the whole shabang at once.
  // Transform it
  // Remove the header
  records.shift();
  // write it out in a compress format and transform in app
  var seen = {}

  var transformed = []
  records.forEach((r) => {
    // 13, 19, 22
    var key = r[10];
    if(seen[key]) {
      return;
    } else {
      seen[key] = true;
    }
    transformed.push( [key,r[9],r[0]] )
  })
  console.log(JSON.stringify(transformed))
})
