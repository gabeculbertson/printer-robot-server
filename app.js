var express = require('express');
var app = express();
var http = require('http');
var fs = require('fs');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var pdf = require('html-pdf');
var needle = require('needle');
var multer = require('multer');

var exec = require('child_process').exec;
var cmd = 'lpr sample.pdf';

var options = { width: "58mm", height: "100mm" };

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.get('/', function(req, res){
	res.sendFile(__dirname + '/public/index.html');
});

app.get('/print', function(req, res){
	var html = ejs.render(fs.readFileSync('sample.html', 'utf8'), { text: fs.readFileSync('in.txt', 'utf8') });
	res.send(html);
});

app.post('/print', function(req, res){
	console.log(req.body.text);
	var html = ejs.render(fs.readFileSync('sample.html', 'utf8'), { text: req.body.text });
	pdf.create(html, options).toFile('./sample.pdf', function(err, res) {
		var data = {
            pdf: {
                file: __dirname + "/sample.pdf",
                content_type: "application/pdf"
            }
        }

        needle.post("raspberrypi/print_pdf", data, {
            multipart: true
        }, function(err,result) {
            console.log("result", result.body);
            res.send('start');
        });
	});
});

require('./libs/entity-route.js')(app, '/entities');

var httpServer = http.createServer(app);
httpServer.listen(80);

console.log('server started');