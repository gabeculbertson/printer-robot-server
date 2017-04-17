// Run some jQuery on a html fragment
var jsdom = require("jsdom");
var fs = require("fs");
var glob = require("glob");
var path = require("path");

function getText(window, pid){
	return window.$("tw-passagedata[pid='" + pid + "']").text();
}

function getName(window, pid){
	return window.$("tw-passagedata[pid='" + pid + "']").attr('name');
}

function getPids(window){
	var pids = [];
	var passages = window.$("tw-passagedata").each(function(){
		var pid = this.getAttribute("pid");
		if(pid){
			pids.push(pid);
		}
	});
	return pids;
}

function getLines(text){
	var lines = [];
	var split = text.split("\n");
	for(var i in split){
		if(split[i] != ""){
			lines.push(split[i]);
		}
	}
	return lines;
}

function getPassage(window, pid){
	var choices = [];
	var text = getText(window, pid);
	re = /\[\[(.*?)\]\]/g;
    // var match = re.exec(text);
    // console.log(match[1]);
    do {
    	m = re.exec(text);
	    if (m) {
	        var split = m[1].split('->');
	        if(split.length == 1){
	        	choices.push({ text: "", name: split[0] });
	        } else {
	        	choices.push({ text: split[0], name: split[1] });
	        }

	        // console.log(m[1], choices[choices.length - 1]);
	    }
	} while (m);

	// re = /\[\[(.*?)\]\]/g;
	text = text.replace(re, "");
	// console.log(text);

	return {
		pid: pid,
		text: getLines(text),
		choices: choices
	};
}

function convertFile(file){
	var basename = path.basename(file, '.html');
	jsdom.env(
		fs.readFileSync(file, 'utf8'),
		["http://code.jquery.com/jquery.js"],
		function (err, window) {
			var pids = getPids(window);
			var nameMap = {};
			var story = {};
			for(var i in pids){
				nameMap[getName(window, pids[i])] = pids[i];
				story[pids[i]] = getPassage(window, pids[i]);
			}

			for(var i in story){
				for(var j in story[i].choices){
					story[i].choices[j].pid = nameMap[story[i].choices[j].name];
				}
			}

			for(var i in story){
				console.log(story[i]);
			}
			fs.writeFileSync('./stories/' + basename + '.json', JSON.stringify(story));
		}
	);
}

glob("./twine/*.html", null, function (er, files) {
	for(var i in files){
		convertFile(files[i]);
		// var basename = path.basename(files[i], '.html');
		// console.log(basename);
	}
});