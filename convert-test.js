var fs = require('fs');
var pdf = require('html-pdf');
var html = fs.readFileSync('./public/sample.html', 'utf8');
var options = { width: "58mm", height: "100mm" };
 
pdf.create(html, options).toFile('./sample.pdf', function(err, res) {
	if (err) return console.log(err);
	console.log(res); // { filename: '/app/businesscard.pdf' } 
});