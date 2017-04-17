// var needle = require('needle');
var fs = require('fs');

// Your Google Cloud Platform project ID
const projectId = 'kinetic-highway-127613';

// [START language_quickstart]
// Imports the Google Cloud client library
var language = require('@google-cloud/language')({
  projectId: projectId,
  keyFilename: "key.json"
});

// var token = fs.readFileSync('token.txt');
// var options = {
// 	headers: { 
// 		'Content-Type': 'application/json',
// 		'Authorization': 'Bearer ' + token
// 	}
// }

// var url = "https://language.googleapis.com/v1/documents:analyzeEntities";
var data = JSON.parse(fs.readFileSync("data.json", "utf8"));
data.document.content = fs.readFileSync("content.txt", "utf8");

module.exports.getEntities = function(text, callback){
	data.document.content = text;
	console.log("entity post data:" + data.document.content);
	console.log(data);

	language.detectEntities(text, function(err, entities) {
		if(err){
			console.log("error");
			console.log(err);
		}
		// console.log("response");
		console.log(entities);
		callback(entities);
	});
	// needle.post(url, data, options, function(err2, res2){
	// 	if(err2){
	// 		console.log("error");
	// 		console.log(err2);
	// 	}
	// 	// console.log("response");
	// 	console.log(res2.body);
	// 	callback(res2.body);
	// });
}