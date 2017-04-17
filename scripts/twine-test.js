var fs = require('fs');

var twineToJSON = require("twine_to_json");
twineToJSON({
   in: "robot intro.html",
   out: "robot-intro.json",
   ignoreComments: false,
   renderMarkdown: true,
   writeToFile: true,
   prettyPrint: false,
   ignorePassages: [],
   transformPassages: [],
   customTags: [],
   linkFormat: null,
   callback: function(err, story) { /* optional */ }
}).then(function(story) {
    for(var i in story.passages){
        // console.log(data.passages[i]);
        var find = '<p>|</p>';
        var re = new RegExp(find, 'g');
        story.passages[i].text = story.passages[i].text.replace(re, '');

        re = /links\[\'(.*?)\'\]/g;
        var match = re.exec(story.passages[i].text);
        console.log(match[1]);
        for(var m in match){
            console.log(match[m]);
        }
    }
    // console.log(story);
    fs.writeFileSync("robot-intro.json", JSON.stringify(story));
}).catch(function(err) {
    // ... 
});