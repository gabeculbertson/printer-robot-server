var fs = require('fs');

var data = JSON.parse(fs.readFileSync("robot-intro.json", "utf8"));

console.log(data);
for(var i in data.passages){
	console.log(data.passages[i]);
}