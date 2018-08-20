'use strict';

var csvfile = `C:/Users/John Aughey/Downloads/Kanji Working Notes - kanji2.csv`
var utf8 = require('utf8')
var parse = require('csv-parse')
var fs = require('fs');
parse(fs.readFileSync(csvfile), {
  quote: '"',
  relax_column_count: true,
  delimiter: ','
}, function(err, records) {
  if (err) {
    console.log(err);
    return;
  }

  // Make several passes
  // Filter out things that we don't have components for
  records = records.map(parseRecord).filter((r) => r.components.length !== 0);

  // First, fill our words object with the definitions
  var words = {}

  var error = false;

  records.forEach((r) => {
    if(words[r.def]) {
      console.error("There is already a definition entry for " + r.def)
      console.error(r);
      console.error(words[r.def])
      error = true;
    }
    words[r.def] = r;

    r.alias.forEach((a) => {
      if(words[a]) {
        console.error("There is already an alias defined")
        console.error(r);
        error = true
      }
      words[a] = r;
    })
//    console.log(r)
  })

  const okprimitives = "wind,human legs,drop,stick,animal legs,horns,by one's side,swords,drops,cliff,magic wand,bound up,oven-fire,hood,house,graveyard,umbrella,road,walking legs,flower,meeting,flood,butcher"
  var extra_id = 3000;
  splitcomma(okprimitives).forEach((p) => {
    if(words[p]) {
      console.error("Error: already found a word for ok privitive " + p);
      error = true
    }
    words[p] = {
      kanji: p,
      def: p,
      frame: extra_id,
      components: []
    }
    records.push(words[p])
    extra_id+=1;
  })



  var mapping = {}
  // Now test the linkages
  records.forEach((r) => {
    if(r.components[0] === '*') {
      mapping[r.frame] = ""
      return
    }
    r.components.forEach((c) => {
      // Get the word
      var cword = words[c];
      if(!cword) {
        console.error("Warning: no word for " + c);
        error = true;
      }
    })

  })

  if(error) {
    return;
  }
  // Output Graphviz
  console.log("digraph G {")
  records.forEach((r) => {
    console.log(r.frame + " [label=\"" + r.kanji + "\"]")
  })
  // Create the links
  records.forEach((r) => {
    r.components.forEach((c) => {
      if(c === '*') {
        return;
      }
      var cword = words[c];
      console.log(cword.frame + " -> " + r.frame);
    });
  })
  console.log("}")

})

function splitcomma(s) {
  return s.split(',').map((a) => a.trim()).filter((a) => a!=='').map((a) => a.toLowerCase())
}

function parseRecord(r) {
  var components = splitcomma(r[14])
  var kanji = r[10]
//   var { StringDecoder } = require('string_decoder')
//   var decoder = new StringDecoder('utf8');
// console.log(decoder.write(kanji))


  return {
    frame: r[0],
    def: r[9].toLowerCase(),
    kanji: kanji,
    components: components,
    alias: splitcomma(r[15])
  }
}
