var fs = require('fs');
var printerTextBuilder = require('./printer-text-builder').handle;
var needle = require('needle');

module.exports = function (client) {
	var story = JSON.parse(fs.readFileSync('./stories/RobotIntro.json', 'utf8'));
    var storyPassage = 1;
    var storyLine = 0;
    var choiceHandlers = {};
    var delay = 1000;
    var context = { totalDailyWords: 500 };
    var writtenWords = 0;

    var emitMessage = null;

    var writing = false;

    context.write = function(){
        writtenWords = 0;
        writing = true;
    }

    function addChoice(key, targetPid){
        choiceHandlers[key] = function(){
            storyPassage = targetPid;
            storyLine = 0;
            emitMessage();
        };
    }

    var backchannelling = [
        "*mhmm*",
        "*yeah*",
        "*ok*",
        "*got it*",
        "*yep*"
    ];
    function getBackchannel(){
        var i = Math.floor(Math.random() * backchannelling.length);
        return backchannelling[i];
    }

    emitMessage = function(){
        choiceHandlers = {};
        var text = printerTextBuilder(context, story[storyPassage].text[storyLine]);
        client.emit('text-message', '[' + text + ']');
        needle.post('localhost/print-img', { text: '[' + text + ']' });
        storyLine++;
        var choices = [];
        if(storyLine < story[storyPassage].text.length){
            choices.push({ key: '1', text: getBackchannel() });
            choiceHandlers['1'] = function(){
                emitMessage();
            };
        } else{
            if(story[storyPassage].choices.length == -1){

            } else {
                for(var i = 0; i < story[storyPassage].choices.length; i++){
                    var choiceText = story[storyPassage].choices[i].text;
                    if(choiceText == ""){
                        choiceText = getBackchannel();
                    }

                    choices.push({ key: i + 1, text: choiceText });
                    addChoice(i + 1, story[storyPassage].choices[i].pid);
                }
            }
        }

        if(writing){
            setTimeout(function(){
                client.emit('mode', { type: 'write' });
            }, delay);
        } else {
            setTimeout(function(){
                client.emit('mode', { type: 'choice', choices: choices });
            }, delay);
        }
    }

    setTimeout(emitMessage, 2000);
    // emitMessage();

    client.on('key', function(key){
        if(key in choiceHandlers){
            choiceHandlers[key]();
        }
    });

    client.on('delay', function(msg){
        console.log("delay set to " + msg);
        delay = parseInt(msg);
    });

    return {
    	addWords: function(count){
    		writtenWords += count;
    		console.log("words written: " + writtenWords);

    		if(writtenWords >= context.totalDailyWords){
    			writing = false;
    			setTimeout(function(){
    				choiceHandlers['1']();
    			}, 1000);
    		}
    	}
    };
}