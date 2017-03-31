var needle = require('needle');
var fs = require('fs');

var token = fs.readFileSync('token.txt');
var options = {
	headers: { 
		'Content-Type': 'application/json',
		'Authorization': 'Bearer ' + token
	}
}

var url = "https://language.googleapis.com/v1/documents:analyzeEntities";
var data = JSON.parse(fs.readFileSync("data.json", "utf8"));
data.document.content = fs.readFileSync("content.txt", "utf8");

module.exports = function(app, route){
	app.get(route, function(req, res){
		data.content = req.query.text;
		needle.post(url, data, options, function(err2, res2){
			if(err){
				console.log("error");
				console.log(err);
			}
			console.log("response");
			console.log(res.body);
			res.json(res.body);
		});
	});
}