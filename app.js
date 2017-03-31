var express = require('express');
var app = express();
var http = require('http');
var fs = require('fs');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var pdf = require('html-pdf');
var needle = require('needle');
var multer = require('multer');

var getEntities = require('./libs/entity-request').getEntities;

var exec = require('child_process').exec;
var cmd = 'xelatex out.tex';

var options = { width: "48mm", height: "1000mm" };

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

// app.post('/print', function(req, res){
// 	console.log(req.body.text);
//     req.body.text = req.body.text.replace(/\n/, "<br>");
// 	var html = ejs.render(fs.readFileSync('sample.html', 'utf8'), { text: req.body.text });
// 	pdf.create(html, options).toFile('./sample.pdf', function(err, res) {
// 		var data = {
//             pdf: {
//                 file: __dirname + "/sample.pdf",
//                 content_type: "application/pdf"
//             }
//         }

//         console.log('pdf generated');

//         needle.post("raspberrypi/print_pdf", data, {
//             multipart: true
//         }, function(err,result) {
//             console.log("result", result.body);
//         });
// 	});
//     res.redirect('back');
// });

app.post('/print', function(req, res){
    console.log(req.body.text);
    req.body.text = req.body.text.replace(/\n/, "<br>");
    var html = ejs.render(fs.readFileSync('template.tex', 'utf8'), { text: req.body.text });
    fs.writeFileSync("out.tex", html);

    var start = new Date().getTime();

    exec(cmd, function(err, out, code){
        var data = {
            pdf: {
                file: __dirname + "/out.pdf",
                content_type: "application/pdf"
            }
        }

        console.log('pdf generated: ', new Date().getTime() - start);

        needle.post("raspberrypi/print_pdf", data, {
            multipart: true
        }, function(err,result) {
            console.log("result", result.body);
        });
    });
    res.redirect('back');
});

app.post('/print-text', function(req, res){
    console.log("got: " + req.body.text);
    needle.post('raspberrypi/print-text', { text: req.body.text });
});

app.post('/print-img', function(req, res){
    needle.post('localhost:8081/print', { text: req.body.text }, function(err, res){
        if(!res){
            return;
        }

        var file = res.body;
        console.log("response from phantom: " + file);

        var data = {
            myimage: {
                file: file.toString(),
                content_type: "application/pdf"
            }
        }

        needle.post("raspberrypi/print_img", data, {
            multipart: true
        }, function(err,result) {
            console.log("result", result.body);
        });
    });
});

require('./libs/entity-route.js')(app, '/entities');

var httpServer = http.createServer(app);
httpServer.listen(80);

var io = require('socket.io')(httpServer);
var timeout = null;
var currentEntities = {};

io.on('connection', function(client){
    io.sockets.emit('text-message', "Hello human. What do you want to write about today?");

    console.log('connected');
    client.on('event', function(data){ console.log("client event"); });
    client.on('disconnect', function(){ console.log("client disconnect"); });

    client.on('text-message', function(msg){
        console.log("got text message");
        io.sockets.emit('text-message', msg);

        getEntities(msg, function(entities){
            currentEntities = entities;
            io.sockets.emit("entities", entities);
        });

        if(timeout){
            clearTimeout(timeout);
        }
        timeout = setTimeout(function(){
            if(!currentEntities){
                return;
            }

            var people = [];
            var entity = null;
            for(var i = 0; i < currentEntities.entities.length; i++){
                if(currentEntities.entities[i].type == "PERSON"){
                    people.push(currentEntities.entities[i]);
                }
            }

            var questionText = "Tell me more about that";
            if(people.length > 0){
                var i = Math.floor(Math.random() * people.length);
                questionText = "Tell me more about " + people[i].name;
            } else if(currentEntities.entities.length > 0) {
                var i = Math.floor(Math.random() * currentEntities.entities.length);
                questionText = "Tell me more about " + currentEntities.entities[i].name;
            }

            io.sockets.emit('text-message', questionText);
        }, 3000);
    });
});

console.log('server started on 80');