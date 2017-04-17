var express = require('express');
var app = express();
var http = require('http');
var fs = require('fs');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var pdf = require('html-pdf');
var needle = require('needle');
var multer = require('multer');

var eliza = require('./libs/eliza');
var StoryPlayer = require('./libs/story-player.js');

var getEntities = require('./libs/entity-request').getEntities;

var exec = require('child_process').exec;
var cmd = 'xelatex out.tex';

var raspberryAddress = "http://192.168.1.65";

var options = { width: "48mm", height: "1000mm" };

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

var goToSleepTimeout = null;
function wakeUp(){
    if(goToSleepTimeout){
        clearTimeout(goToSleepTimeout);
    }
    needle.get(raspberryAddress + '/robot/listen');
    goToSleepTimeout = setTimeout(function(){
        needle.get(raspberryAddress + '/robot/sleep');
    }, 60000);
}

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

//         needle.post(raspberryAddress + "/print_pdf", data, {
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

        needle.post(raspberryAddress + "/print_pdf", data, {
            multipart: true
        }, function(err,result) {
            console.log("result", result.body);
        });
    });
    res.redirect('back');
});

app.post('/print-text', function(req, res){
    console.log("got: " + req.body.text);
    needle.post(raspberryAddress + '/print-text', { text: req.body.text });
});

app.post('/print-img', function(req, out_res){
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

        needle.post(raspberryAddress + "/print_img", data, {
            multipart: true
        }, function(err,result) {
            if(result){
                console.log("result", result.body);
            }
        });
        out_res.write("done");
    });
});

require('./libs/entity-route.js')(app, '/entities');

var httpServer = http.createServer(app);
httpServer.listen(80);

var io = require('socket.io')(httpServer);
var timeout = null;
var currentEntities = {};
var lastLine = "";

var monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

io.on('connection', function(client){
    // io.sockets.emit('text-message', "Hello human. What do you want to write about today?");
    var storyPlayer = null;
    client.on('begin-story', function(){
        storyPlayer = new StoryPlayer(client);
    });

    console.log('connected');
    client.on('event', function(data){ console.log("client event"); });
    client.on('disconnect', function(){ console.log("client disconnect"); });

    client.on('keypress', function(){
        wakeUp();
    });

    client.on('text-message', function(msg){
        lastLine = msg;

        if(storyPlayer){
            var split = msg.split(" ");
            var words = 0;
            for(var i in split){
                if(split[i] != ""){
                    words++;
                }
            }
            storyPlayer.addWords(words);
        }

        console.log("got text message");
        io.sockets.emit('text-message', msg);

        getEntities(msg, function(entities){
            currentEntities = entities;
            io.sockets.emit("entities", entities);
        });

        wakeUp();

        if(timeout){
            clearTimeout(timeout);
        }
        timeout = setTimeout(function(){
            if(!currentEntities){
                return;
            }

            // var people = [];
            // var entity = null;
            // for(var i = 0; i < currentEntities.length; i++){
            //     if(currentEntities[i].type == "PERSON"){
            //         people.push(currentEntities[i]);
            //     }
            // }

            // var questionText = "Tell me more about that";
            // if(people.length > 0){
            //     var i = Math.floor(Math.random() * people.length);
            //     questionText = "Tell me more about " + people[i].name;
            // } else if(currentEntities.length > 0) {
            //     var i = Math.floor(Math.random() * currentEntities.length);
            //     questionText = "Tell me more about " + currentEntities[i].name;
            // }

            // io.sockets.emit('text-message', questionText);
            // needle.post('localhost/print-img', { text: "<span style='font-size: 15mm'>" + questionText + "</span>" });
            
            // var resp = eliza.getResponse(lastLine);
            // io.sockets.emit('text-message', resp);
            // needle.post('localhost/print-img', { text: resp });
        }, 30000);
    });

    var d = new Date();
    var dString = monthNames[d.getMonth()] + " " + d.getDay() + ", " + d.getFullYear();
    var initialText = '<span id="date-container">' + dString + '</span><br><hr style="width:100%">';
    client.emit('text-message', initialText);
    needle.post('localhost/print-img', { text: initialText });
});

console.log('server started on 80');